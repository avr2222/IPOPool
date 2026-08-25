-- 014 — Once an IPO's application window has closed, a member can no longer
-- submit or edit their own application for it; only the admin can still make
-- changes.
--
-- Members never touch the `applications` table directly -- every member
-- write goes through this one SECURITY DEFINER RPC (RLS on `applications`
-- itself is already admin-only, see "admin_applications" in
-- 001_schema.sql:136, which is what lets the admin keep editing after
-- close with no change needed there). So the only place this needs
-- enforcing is here.
--
-- Guards on close_date specifically (not open_date -- applying early is
-- already allowed and this doesn't change that), and only when it's
-- actually set -- an IPO the admin hasn't dated yet shouldn't lock members
-- out by accident.

CREATE OR REPLACE FUNCTION submit_applications(p_login_pan text, p_ipo uuid, p_rows jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_member_id   uuid;
  v_login_pan   uuid;
  v_is_head     boolean;
  v_type        text;
  v_close_date  date;
  r             jsonb;
  v_pan_id      uuid;
  v_cat         text;
  v_lots        int;
  v_app_id      uuid;
  v_count       int := 0;
BEGIN
  -- resolve acting member + head/sub from the login PAN
  SELECT pa.member_id, pa.id, (lower(btrim(pa.relation)) = 'self')
    INTO v_member_id, v_login_pan, v_is_head
    FROM pan_accounts pa
    WHERE upper(pa.pan) = upper(btrim(coalesce(p_login_pan, ''))) AND pa.status = 'Active'
    LIMIT 1;
  IF v_member_id IS NULL THEN
    RAISE EXCEPTION 'PAN not recognised';
  END IF;

  SELECT type, close_date INTO v_type, v_close_date FROM ipos WHERE id = p_ipo;
  IF v_type IS NULL THEN
    RAISE EXCEPTION 'IPO not found';
  END IF;
  IF v_close_date IS NOT NULL AND CURRENT_DATE > v_close_date THEN
    RAISE EXCEPTION 'Applications for this IPO closed on %. Contact the admin if you need to make a change.', to_char(v_close_date, 'DD Mon YYYY');
  END IF;

  FOR r IN SELECT * FROM jsonb_array_elements(coalesce(p_rows, '[]'::jsonb))
  LOOP
    v_pan_id := (r->>'pan_id')::uuid;
    v_lots   := greatest(1, coalesce((r->>'lots')::int, 1));

    -- a sub-member (non-Self PAN) may act on their own PAN only
    IF NOT v_is_head AND v_pan_id <> v_login_pan THEN
      RAISE EXCEPTION 'You can only apply for your own PAN';
    END IF;

    -- ownership: the PAN must belong to the acting member's family
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
