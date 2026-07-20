-- IPO Pool — member self-service (PAN-based, no password)
-- ----------------------------------------------------------------------------
-- Members identify themselves by PAN number (lightweight; there is no member
-- password). Because members are ANONYMOUS to Supabase, every member action is
-- exposed as a SECURITY DEFINER function granted to the `anon` role. The base
-- tables keep their admin-only write RLS from 001_schema.sql — anon can ONLY
-- call these three functions, never touch tables directly.
--
-- Guardrails baked into the functions:
--   * a member can only ever act on PANs that belong to their own member row
--     (derived from the PAN they logged in with);
--   * members create/adjust APPLICATIONS only — allotment status/shares/gain,
--     pools and settlements are never written here (admin-only);
--   * PANs are returned masked for display.
-- ----------------------------------------------------------------------------

-- Mask a PAN for display: keep first 3 + last 1 (ABCDE1234F -> ABCxxxxxxF)
CREATE OR REPLACE FUNCTION mask_pan(p text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN p IS NULL OR length(p) < 5 THEN p
    ELSE left(p, 3) || repeat('x', length(p) - 4) || right(p, 1)
  END;
$$;

-- member_login(pan): resolve a PAN to its owning member + that member's active
-- PANs (family). Returns NULL when the PAN is unknown/inactive.
CREATE OR REPLACE FUNCTION member_login(p_pan text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_member  members%ROWTYPE;
  v_pan     pan_accounts%ROWTYPE;
  v_pans    jsonb;
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

  SELECT * INTO v_member FROM members WHERE id = v_pan.member_id;

  SELECT coalesce(jsonb_agg(
           jsonb_build_object(
             'id',         pa.id,
             'holder',     pa.holder_name,
             'relation',   pa.relation,
             'pan_masked', mask_pan(pa.pan)
           ) ORDER BY pa.holder_name), '[]'::jsonb)
    INTO v_pans
    FROM pan_accounts pa
    WHERE pa.member_id = v_member.id AND pa.status = 'Active';

  RETURN jsonb_build_object(
    'member_id', v_member.id,
    'name',      v_member.name,
    'pans',      v_pans
  );
END;
$$;

-- get_apply_ipo(ipo): minimal IPO fields needed to render the apply form, so the
-- deep link can load the IPO without granting anon any table reads.
CREATE OR REPLACE FUNCTION get_apply_ipo(p_ipo uuid)
RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'id',        i.id,
    'name',      i.name,
    'short',     coalesce(i.short_name, split_part(i.name, ' ', 1)),
    'type',      i.type,
    'status',    i.status,
    'band_low',  i.band_low,
    'band_high', i.band_high,
    'lot_size',  i.lot_size,
    'lot_value', i.lot_value,
    'open_date',  i.open_date,
    'close_date', i.close_date,
    'list_date',  i.list_date
  )
  FROM ipos i WHERE i.id = p_ipo;
$$;

-- submit_applications(login_pan, ipo, rows): file the member's applications.
-- rows = jsonb array of { pan_id, category, lots }. Every pan_id must belong to
-- the login PAN's member, or the whole call is rejected.
CREATE OR REPLACE FUNCTION submit_applications(p_login_pan text, p_ipo uuid, p_rows jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_member_id uuid;
  v_type      text;
  r           jsonb;
  v_pan_id    uuid;
  v_cat       text;
  v_lots      int;
  v_app_id    uuid;
  v_count     int := 0;
BEGIN
  -- resolve acting member from the login PAN
  SELECT pa.member_id INTO v_member_id FROM pan_accounts pa
    WHERE upper(pa.pan) = upper(btrim(coalesce(p_login_pan, ''))) AND pa.status = 'Active'
    LIMIT 1;
  IF v_member_id IS NULL THEN
    RAISE EXCEPTION 'PAN not recognised';
  END IF;

  SELECT type INTO v_type FROM ipos WHERE id = p_ipo;
  IF v_type IS NULL THEN
    RAISE EXCEPTION 'IPO not found';
  END IF;

  FOR r IN SELECT * FROM jsonb_array_elements(coalesce(p_rows, '[]'::jsonb))
  LOOP
    v_pan_id := (r->>'pan_id')::uuid;
    v_lots   := greatest(1, coalesce((r->>'lots')::int, 1));

    -- ownership: the PAN must belong to the acting member
    PERFORM 1 FROM pan_accounts
      WHERE id = v_pan_id AND member_id = v_member_id AND status = 'Active';
    IF NOT FOUND THEN
      RAISE EXCEPTION 'PAN does not belong to you';
    END IF;

    -- category must be valid for the board (SME IPOs force SME)
    v_cat := coalesce(r->>'category', 'Retail');
    IF v_type = 'SME' THEN
      v_cat := 'SME';
    ELSIF v_cat NOT IN ('Retail', 'sHNI', 'bHNI') THEN
      v_cat := 'Retail';
    END IF;

    INSERT INTO applications (ipo_id, pan_id, category, lots)
      VALUES (p_ipo, v_pan_id, v_cat, v_lots)
      ON CONFLICT (ipo_id, pan_id)
      DO UPDATE SET category = EXCLUDED.category, lots = EXCLUDED.lots
      RETURNING id INTO v_app_id;

    -- keep a pending allotment; never reset one the admin already marked
    INSERT INTO allotments (application_id, status, shares, gain)
      VALUES (v_app_id, 'pending', 0, 0)
      ON CONFLICT (application_id) DO NOTHING;

    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'count', v_count);
END;
$$;

-- ── Grants: anon (and authenticated) may EXECUTE these; base tables stay locked ──
REVOKE ALL ON FUNCTION member_login(text)                      FROM public;
REVOKE ALL ON FUNCTION get_apply_ipo(uuid)                     FROM public;
REVOKE ALL ON FUNCTION submit_applications(text, uuid, jsonb)  FROM public;

GRANT EXECUTE ON FUNCTION member_login(text)                     TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_apply_ipo(uuid)                    TO anon, authenticated;
GRANT EXECUTE ON FUNCTION submit_applications(text, uuid, jsonb) TO anon, authenticated;
