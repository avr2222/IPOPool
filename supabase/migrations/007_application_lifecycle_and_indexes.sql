-- 007 — Close applications once an IPO is past taking them, normalise PANs,
--       and add the missing lookup indexes.
--
-- Idempotent: CREATE OR REPLACE for the function, IF NOT EXISTS for the
-- indexes, and the PAN normalisation only rewrites rows that are not already
-- upper-case.

-- ── 1. Lifecycle gate on submit_applications ─────────────────────────────────
--
-- The apply link is a plain URL a member can re-open at any time. The function
-- validated PAN ownership and category but never checked where the IPO was in
-- its life, and its upsert does
--     ON CONFLICT (ipo_id, pan_id) DO UPDATE SET category = EXCLUDED.category
-- while the matching allotment insert does DO NOTHING. So re-opening an old
-- link after listing moved an already-allotted application into a different
-- category while its shares and gain survived untouched -- which moves that
-- gain into a different category's pool, changes perPan in two categories, and
-- silently invalidates a settlement ledger that may already have been paid out.
-- The admin got no warning.
--
-- Applications are now refused once the IPO has closed, listed, or been
-- finalized into a pool. p_rows is also capped: it is attacker-controlled input
-- to a SECURITY DEFINER function and had no bound at all.

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

GRANT EXECUTE ON FUNCTION submit_applications(text, uuid, jsonb) TO anon, authenticated;

-- ── 2. PAN uniqueness matches how PANs are looked up ─────────────────────────
--
-- UNIQUE (pan) is case-sensitive, but every RPC resolves a login with
-- upper(pa.pan) = upper(btrim(...)) ... LIMIT 1. So 'abcde1234f' and
-- 'ABCDE1234F' could both exist as separate PANs and a member login would
-- match an arbitrary one of them.

-- Order matters: fold the case-duplicates FIRST. Upper-casing them first would
-- collide with the existing case-sensitive UNIQUE (pan) before the duplicates
-- have been removed.
DO $$
DECLARE
  dup RECORD;
BEGIN
  FOR dup IN
    SELECT upper(btrim(pan)) AS up,
           (array_agg(id ORDER BY created_at, id))[1] AS keep_id,
           array_agg(id) AS ids
      FROM pan_accounts
     GROUP BY upper(btrim(pan))
    HAVING count(*) > 1
  LOOP
    -- Move the duplicate's applications onto the surviving PAN, except where
    -- the survivor already applied to that IPO (the composite unique would
    -- reject it, and it is the same PAN applying twice anyway).
    UPDATE applications a SET pan_id = dup.keep_id
      WHERE a.pan_id = ANY(dup.ids) AND a.pan_id <> dup.keep_id
        AND NOT EXISTS (SELECT 1 FROM applications b
                         WHERE b.ipo_id = a.ipo_id AND b.pan_id = dup.keep_id);
    -- Anything left is a genuine duplicate application; its allotments cascade.
    DELETE FROM applications WHERE pan_id = ANY(dup.ids) AND pan_id <> dup.keep_id;
    DELETE FROM pan_accounts WHERE id = ANY(dup.ids) AND id <> dup.keep_id;
  END LOOP;
END $$;

UPDATE pan_accounts SET pan = upper(btrim(pan)) WHERE pan <> upper(btrim(pan));

CREATE UNIQUE INDEX IF NOT EXISTS pan_accounts_pan_upper_key
  ON pan_accounts (upper(pan));

-- ── 3. Indexes for the lookups the app actually does ─────────────────────────
--
-- applications' composite unique leads with ipo_id, so it does not serve a
-- lookup by pan_id; the others had no index beyond their primary key.
CREATE INDEX IF NOT EXISTS pan_accounts_member_id_idx ON pan_accounts (member_id);
CREATE INDEX IF NOT EXISTS applications_pan_id_idx    ON applications (pan_id);
CREATE INDEX IF NOT EXISTS settlements_member_id_idx  ON settlements (member_id);
