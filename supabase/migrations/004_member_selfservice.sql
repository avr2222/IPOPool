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

-- member_summary(login_pan): the member's own stats — profit to date (= sum of
-- their settlement amounts, matching the admin ledger exactly), plus applied /
-- allotment counts and a per-IPO breakdown. Only the caller's own data.
CREATE OR REPLACE FUNCTION member_summary(p_login_pan text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_member_id uuid;
  v_name      text;
  v_result    jsonb;
BEGIN
  SELECT pa.member_id INTO v_member_id FROM pan_accounts pa
    WHERE upper(pa.pan) = upper(btrim(coalesce(p_login_pan, ''))) AND pa.status = 'Active'
    LIMIT 1;
  IF v_member_id IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT name INTO v_name FROM members WHERE id = v_member_id;

  WITH my_pans AS (
    SELECT id FROM pan_accounts WHERE member_id = v_member_id
  ),
  my_apps AS (
    SELECT a.id AS app_id, a.ipo_id, al.status AS allot_status
    FROM applications a
    JOIN my_pans mp ON mp.id = a.pan_id
    LEFT JOIN allotments al ON al.application_id = a.id
  ),
  my_settle AS (
    SELECT pp.ipo_id,
           sum(s.amount)                                   AS profit,
           sum(s.amount) FILTER (WHERE s.status = 'Paid')    AS paid,
           sum(s.amount) FILTER (WHERE s.status = 'Pending') AS pending,
           bool_or(s.status = 'Paid')    AS any_paid,
           bool_or(s.status = 'Pending') AS any_pending
    FROM settlements s
    JOIN profit_pools pp ON pp.id = s.pool_id
    WHERE s.member_id = v_member_id
    GROUP BY pp.ipo_id
  ),
  per_ipo AS (
    SELECT ma.ipo_id,
           count(*)                                          AS applied,
           count(*) FILTER (WHERE ma.allot_status = 'allotted') AS allotted
    FROM my_apps ma
    GROUP BY ma.ipo_id
  )
  SELECT jsonb_build_object(
    'name',           v_name,
    'pans_applied',   (SELECT count(*) FROM my_apps),
    'allotments',     (SELECT count(*) FROM my_apps WHERE allot_status = 'allotted'),
    'ipos_applied',   (SELECT count(*) FROM per_ipo),
    'paid_profit',    coalesce((SELECT sum(paid)    FROM my_settle), 0),
    'pending_profit', coalesce((SELECT sum(pending) FROM my_settle), 0),
    'total_profit',   coalesce((SELECT sum(profit)  FROM my_settle), 0),
    'ipos', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'ipo_id',   i.id,
        'name',     i.name,
        'short',    coalesce(i.short_name, split_part(i.name, ' ', 1)),
        'type',     i.type,
        'status',   i.status,
        'applied',  pi.applied,
        'allotted', pi.allotted,
        'profit',   coalesce(ms.profit, 0),
        'settle_status', CASE
            WHEN ms.any_paid AND NOT coalesce(ms.any_pending, false) THEN 'paid'
            WHEN ms.any_paid AND ms.any_pending                      THEN 'partly'
            WHEN ms.any_pending                                      THEN 'pending'
            WHEN pi.allotted > 0                                     THEN 'awaiting'
            ELSE '-' END
      ) ORDER BY i.list_date DESC NULLS LAST, i.open_date DESC NULLS LAST)
      FROM per_ipo pi
      JOIN ipos i ON i.id = pi.ipo_id
      LEFT JOIN my_settle ms ON ms.ipo_id = pi.ipo_id
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ── Grants: anon (and authenticated) may EXECUTE these; base tables stay locked ──
REVOKE ALL ON FUNCTION member_login(text)                      FROM public;
REVOKE ALL ON FUNCTION get_apply_ipo(uuid)                     FROM public;
REVOKE ALL ON FUNCTION submit_applications(text, uuid, jsonb)  FROM public;
REVOKE ALL ON FUNCTION member_summary(text)                    FROM public;

GRANT EXECUTE ON FUNCTION member_login(text)                     TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_apply_ipo(uuid)                    TO anon, authenticated;
GRANT EXECUTE ON FUNCTION submit_applications(text, uuid, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION member_summary(text)                   TO anon, authenticated;
