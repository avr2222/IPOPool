-- 028 — Member PIN and sessions.
--
-- Until now a member logged in with their PAN alone, and every member RPC took
-- that PAN as its only credential. A PAN is not a secret (it is on cheques,
-- invoices, KYC copies), so anyone who knew a member's PAN could read their
-- profits and file applications in their name.
--
-- This migration adds:
--   * a 4-6 digit PIN per PAN, chosen by the member at their first login and
--     stored only as a bcrypt hash;
--   * a lockout: 5 wrong PINs lock that PAN's login for 15 minutes;
--   * session tokens: a successful login returns a random token (stored here
--     only as a SHA-256 hash) that the app keeps on the device, so the member
--     stays logged in for 90 days without the app ever storing the PIN;
--   * token-taking versions of the member RPCs (*_t) that resolve the token to
--     its PAN and then call the existing functions unchanged;
--   * admin_reset_member_pin, for a forgotten (or wrongly claimed) PIN.
--
-- The old PAN-only functions are NOT removed here, so an app version that
-- predates this migration keeps working. Run 029 to lock them once the new
-- app is live; until then the PIN is enforced by the app, not by the database.
--
-- Both tables have RLS enabled with no policies: nothing but these SECURITY
-- DEFINER functions can read or write them, not even a signed-in admin.

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS member_pins (
  pan_id          uuid PRIMARY KEY REFERENCES pan_accounts(id) ON DELETE CASCADE,
  pin_hash        text NOT NULL,
  failed_attempts integer NOT NULL DEFAULT 0,
  locked_until    timestamptz,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS member_sessions (
  token_hash  text PRIMARY KEY,
  pan_id      uuid NOT NULL REFERENCES pan_accounts(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS member_sessions_pan_idx ON member_sessions(pan_id);

ALTER TABLE member_pins     ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON member_pins, member_sessions FROM public, anon, authenticated;

-- Internal: mint a session for a PAN and return the raw token (shown once).
CREATE OR REPLACE FUNCTION _member_new_session(p_pan_id uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  v_token text := encode(gen_random_bytes(32), 'hex');
BEGIN
  DELETE FROM member_sessions WHERE pan_id = p_pan_id AND expires_at < now();
  INSERT INTO member_sessions (token_hash, pan_id, expires_at)
    VALUES (encode(digest(v_token, 'sha256'), 'hex'), p_pan_id, now() + interval '90 days');
  RETURN v_token;
END;
$$;

-- Internal: session token -> the PAN number it belongs to. Raises
-- MEMBER_SESSION_INVALID for an unknown/expired token or a PAN that is no
-- longer Active; the app treats that as "log in again". A session in use is
-- extended (at most one write a week) so an active member is never logged out.
CREATE OR REPLACE FUNCTION _member_session_pan(p_token text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  v_hash    text;
  v_pan     text;
  v_expires timestamptz;
BEGIN
  IF p_token IS NULL OR length(p_token) < 32 THEN
    RAISE EXCEPTION 'MEMBER_SESSION_INVALID';
  END IF;
  v_hash := encode(digest(p_token, 'sha256'), 'hex');
  SELECT pa.pan, s.expires_at INTO v_pan, v_expires
    FROM member_sessions s
    JOIN pan_accounts pa ON pa.id = s.pan_id AND pa.status = 'Active'
    WHERE s.token_hash = v_hash AND s.expires_at > now();
  IF v_pan IS NULL THEN
    RAISE EXCEPTION 'MEMBER_SESSION_INVALID';
  END IF;
  IF v_expires < now() + interval '83 days' THEN
    UPDATE member_sessions SET expires_at = now() + interval '90 days' WHERE token_hash = v_hash;
  END IF;
  RETURN v_pan;
END;
$$;

-- member_login_v2(pan, pin, new_pin) -> jsonb, or NULL for an unknown PAN.
--   { status: 'needs_pin_setup' }            no PIN yet and none supplied
--   { status: 'needs_pin' }                  PIN exists and none supplied
--   { status: 'wrong_pin', attempts_left }   counted toward the lockout
--   { status: 'locked', retry_seconds }      too many wrong PINs
--   { status: 'ok', token, ...member_login() fields }
-- Failures are returned, not raised, so the attempt counter is committed.
CREATE OR REPLACE FUNCTION member_login_v2(p_pan text, p_pin text DEFAULT NULL, p_new_pin text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  v_pan  pan_accounts%ROWTYPE;
  v_pin  member_pins%ROWTYPE;
  v_left integer;
BEGIN
  IF p_pan IS NULL OR btrim(p_pan) = '' THEN
    RETURN NULL;
  END IF;
  SELECT * INTO v_pan FROM pan_accounts
    WHERE upper(pan) = upper(btrim(p_pan)) AND status = 'Active'
    LIMIT 1;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_pin FROM member_pins WHERE pan_id = v_pan.id FOR UPDATE;

  IF NOT FOUND THEN
    IF p_new_pin IS NULL THEN
      RETURN jsonb_build_object('status', 'needs_pin_setup');
    END IF;
    IF p_new_pin !~ '^[0-9]{4,6}$' THEN
      RAISE EXCEPTION 'PIN must be 4 to 6 digits';
    END IF;
    INSERT INTO member_pins (pan_id, pin_hash) VALUES (v_pan.id, crypt(p_new_pin, gen_salt('bf', 10)))
      ON CONFLICT (pan_id) DO NOTHING;
    IF NOT FOUND THEN            -- someone set a PIN in the same instant
      RETURN jsonb_build_object('status', 'needs_pin');
    END IF;
    RETURN member_login(v_pan.pan) || jsonb_build_object('status', 'ok', 'token', _member_new_session(v_pan.id));
  END IF;

  IF v_pin.locked_until IS NOT NULL AND v_pin.locked_until > now() THEN
    RETURN jsonb_build_object('status', 'locked',
      'retry_seconds', ceil(extract(epoch FROM (v_pin.locked_until - now())))::int);
  END IF;
  IF p_pin IS NULL THEN
    RETURN jsonb_build_object('status', 'needs_pin');
  END IF;

  IF v_pin.pin_hash = crypt(p_pin, v_pin.pin_hash) THEN
    UPDATE member_pins SET failed_attempts = 0, locked_until = NULL WHERE pan_id = v_pan.id;
    RETURN member_login(v_pan.pan) || jsonb_build_object('status', 'ok', 'token', _member_new_session(v_pan.id));
  END IF;

  v_left := 5 - (v_pin.failed_attempts + 1);
  IF v_left <= 0 THEN
    UPDATE member_pins SET failed_attempts = 0, locked_until = now() + interval '15 minutes' WHERE pan_id = v_pan.id;
    RETURN jsonb_build_object('status', 'locked', 'retry_seconds', 900);
  END IF;
  UPDATE member_pins SET failed_attempts = failed_attempts + 1 WHERE pan_id = v_pan.id;
  RETURN jsonb_build_object('status', 'wrong_pin', 'attempts_left', v_left);
END;
$$;

-- Token-taking member RPCs: same results as the PAN-taking originals.
CREATE OR REPLACE FUNCTION member_summary_t(p_token text, p_idle_rate numeric DEFAULT 2.5)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN
  RETURN member_summary(_member_session_pan(p_token), p_idle_rate);
END;
$$;

CREATE OR REPLACE FUNCTION submit_applications_t(p_token text, p_ipo uuid, p_rows jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN
  RETURN submit_applications(_member_session_pan(p_token), p_ipo, p_rows);
END;
$$;

CREATE OR REPLACE FUNCTION my_ipo_applications_t(p_token text, p_ipo uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN
  RETURN my_ipo_applications(_member_session_pan(p_token), p_ipo);
END;
$$;

CREATE OR REPLACE FUNCTION ipo_applicants_t(p_token text, p_ipo uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN
  RETURN ipo_applicants(_member_session_pan(p_token), p_ipo);
END;
$$;

-- Log out: forget this device's session. Unknown tokens are a no-op.
CREATE OR REPLACE FUNCTION member_logout_t(p_token text)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public, extensions AS $$
  DELETE FROM member_sessions WHERE token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');
$$;

-- Admin: clear a PAN's PIN (and log its devices out). The member chooses a new
-- PIN at their next login.
CREATE OR REPLACE FUNCTION admin_reset_member_pin(p_pan_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN
  IF NOT is_pool_admin() THEN
    RAISE EXCEPTION 'Only the pool admin can reset a PIN';
  END IF;
  DELETE FROM member_sessions WHERE pan_id = p_pan_id;
  DELETE FROM member_pins     WHERE pan_id = p_pan_id;
END;
$$;

-- Grants. New functions are executable by everyone by default, so revoke first.
REVOKE ALL ON FUNCTION _member_new_session(uuid)                 FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION _member_session_pan(text)                 FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION member_login_v2(text, text, text)         FROM public;
REVOKE ALL ON FUNCTION member_summary_t(text, numeric)           FROM public;
REVOKE ALL ON FUNCTION submit_applications_t(text, uuid, jsonb)  FROM public;
REVOKE ALL ON FUNCTION my_ipo_applications_t(text, uuid)         FROM public;
REVOKE ALL ON FUNCTION ipo_applicants_t(text, uuid)              FROM public;
REVOKE ALL ON FUNCTION member_logout_t(text)                     FROM public;
REVOKE ALL ON FUNCTION admin_reset_member_pin(uuid)              FROM public, anon;

GRANT EXECUTE ON FUNCTION member_login_v2(text, text, text)        TO anon, authenticated;
GRANT EXECUTE ON FUNCTION member_summary_t(text, numeric)          TO anon, authenticated;
GRANT EXECUTE ON FUNCTION submit_applications_t(text, uuid, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION my_ipo_applications_t(text, uuid)        TO anon, authenticated;
GRANT EXECUTE ON FUNCTION ipo_applicants_t(text, uuid)             TO anon, authenticated;
GRANT EXECUTE ON FUNCTION member_logout_t(text)                    TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_reset_member_pin(uuid)             TO authenticated;
