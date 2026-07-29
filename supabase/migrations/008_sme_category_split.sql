-- 008 — Let SME applicants pick Retail/sHNI/bHNI, matching SEBI's current rule.
--
-- Since SEBI's ICDR amendment effective 1 Jul 2025, SME IPOs on BSE SME / NSE
-- Emerge split applicants into Individual (Retail) / S-HNI / B-HNI, the same
-- three-way structure Mainboard has always had — the old single "SME" bucket
-- reflects the pre-2025 rule, not current practice. The client now shows the
-- same category picker for both board types (with SME-specific lot-count
-- thresholds computed in db.js: Individual is a fixed 2 lots, NII/sHNI starts
-- at a fixed 3 lots, regardless of what that comes to in rupees).
--
-- submit_applications forced every SME application's category to 'SME'
-- regardless of what the client sent, which would have silently discarded the
-- client's Retail/sHNI/bHNI choice. This CREATE OR REPLACE drops that override
-- and validates against the same four-value set for both board types. 'SME'
-- stays a valid value (not removed from the allowlist) so existing rows and
-- any client still running the previous frontend keep working unchanged --
-- this only stops the RPC from forcing it.

CREATE OR REPLACE FUNCTION submit_applications(p_login_pan text, p_ipo uuid, p_rows jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_member_id   uuid;
  v_login_pan   uuid;
  v_is_head     boolean;
  v_type        text;
  v_status      text;
  v_close       date;
  v_finalized   boolean;
  r             jsonb;
  v_pan_id      uuid;
  v_cat         text;
  v_lots        int;
  v_app_id      uuid;
  v_count       int := 0;
BEGIN
  IF jsonb_array_length(coalesce(p_rows, '[]'::jsonb)) > 100 THEN
    RAISE EXCEPTION 'Too many applications in one request';
  END IF;

  -- resolve acting member + head/sub from the login PAN
  SELECT pa.member_id, pa.id, (lower(btrim(pa.relation)) = 'self')
    INTO v_member_id, v_login_pan, v_is_head
    FROM pan_accounts pa
    WHERE upper(pa.pan) = upper(btrim(coalesce(p_login_pan, ''))) AND pa.status = 'Active'
    LIMIT 1;
  IF v_member_id IS NULL THEN
    RAISE EXCEPTION 'PAN not recognised';
  END IF;

  SELECT i.type, i.status, i.close_date INTO v_type, v_status, v_close
    FROM ipos i WHERE i.id = p_ipo;
  IF v_type IS NULL THEN
    RAISE EXCEPTION 'IPO not found';
  END IF;

  -- Once results are being recorded, the application list is part of the money
  -- math and must not move under it.
  IF v_status IN ('Closed', 'Listed') THEN
    RAISE EXCEPTION 'Applications are closed for this IPO';
  END IF;

  IF v_close IS NOT NULL AND v_close < CURRENT_DATE THEN
    RAISE EXCEPTION 'Applications are closed for this IPO';
  END IF;

  -- Belt and braces: a pool means the admin has already finalized payouts.
  SELECT EXISTS (SELECT 1 FROM profit_pools pp WHERE pp.ipo_id = p_ipo) INTO v_finalized;
  IF v_finalized THEN
    RAISE EXCEPTION 'Applications are closed for this IPO';
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

    -- category: same four values valid for every board now. SME IPOs are no
    -- longer forced to 'SME' -- Retail/sHNI/bHNI apply to SME exactly as they
    -- do to Mainboard (the lot-count thresholds differ; see db.js catMinLots).
    v_cat := coalesce(r->>'category', 'Retail');
    IF v_cat NOT IN ('SME', 'Retail', 'sHNI', 'bHNI') THEN
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

GRANT EXECUTE ON FUNCTION submit_applications(text, uuid, jsonb) TO anon, authenticated;
