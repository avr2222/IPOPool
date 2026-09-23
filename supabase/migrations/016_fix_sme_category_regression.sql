-- 016 — Fix a regression 014 accidentally reintroduced: forcing every SME
-- application's category back to 'SME', discarding whatever Retail/sHNI/
-- bHNI the member actually picked.
--
-- Migration 008 explicitly fixed this exact bug ("submit_applications
-- forced every SME application's category to 'SME' regardless of what the
-- client sent, which would have silently discarded the client's Retail/
-- sHNI/bHNI choice"). Migration 014 (2026-08-25, "Lock member applications
-- once an IPO's window closes") did a CREATE OR REPLACE of the same
-- function to add the close-date lock, but was apparently written from an
-- older copy of the function that predated 008's fix -- it reintroduced
-- `IF v_type = 'SME' THEN v_cat := 'SME'; END IF;` verbatim, and in the
-- process also dropped 008's other safety checks: the 100-row request cap,
-- the 'Closed'/'Listed' ipos.status check, and blocking edits once a
-- profit_pools row exists (payouts finalized) -- the close_date check alone
-- doesn't cover an IPO finalized before its close_date, or one with no
-- close_date set at all. This CREATE OR REPLACE keeps 014's close-date
-- lock (the actual point of that migration) and restores everything 008
-- had.
--
-- This does NOT fix rows already written wrong while 014 was live
-- (2026-08-25 onward) -- the member's real category choice was discarded
-- server-side before it was ever stored, so it can't be recovered here.
-- Those need a manual correction per affected application via the admin's
-- IPO applicants modal (Admin Panel → IPO → the eye icon → edit the Cat
-- column for the affected rows → Save changes).

CREATE OR REPLACE FUNCTION submit_applications(p_login_pan text, p_ipo uuid, p_rows jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_member_id   uuid;
  v_login_pan   uuid;
  v_is_head     boolean;
  v_type        text;
  v_status      text;
  v_close_date  date;
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

  SELECT i.type, i.status, i.close_date INTO v_type, v_status, v_close_date FROM ipos i WHERE i.id = p_ipo;
  IF v_type IS NULL THEN
    RAISE EXCEPTION 'IPO not found';
  END IF;

  -- Once results are being recorded, the application list is part of the
  -- money math and must not move under it.
  IF v_status IN ('Closed', 'Listed') THEN
    RAISE EXCEPTION 'Applications are closed for this IPO';
  END IF;

  IF v_close_date IS NOT NULL AND CURRENT_DATE > v_close_date THEN
    RAISE EXCEPTION 'Applications for this IPO closed on %. Contact the admin if you need to make a change.', to_char(v_close_date, 'DD Mon YYYY');
  END IF;

  -- Belt and braces: a pool means the admin has already finalized payouts,
  -- possibly before close_date (or with no close_date set at all).
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

    -- category: same four values valid for every board. SME IPOs are NOT
    -- forced to 'SME' -- Retail/sHNI/bHNI apply to SME exactly as they do
    -- to Mainboard (the lot-count thresholds differ; see db.js catMinLots).
    -- 'SME' stays a valid value for legacy rows, just never forced onto a
    -- fresh submission.
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
