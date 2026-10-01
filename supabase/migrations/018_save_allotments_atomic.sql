-- 018 — Save an IPO's allotment edits all-or-nothing.
--
-- The admin's "Save changes" used to send one UPDATE per row from the
-- browser, one after another. A dropped connection part-way through (common
-- on mobile) left some rows saved and the rest not, with the money math
-- quietly running on the half-saved set. This function applies the whole
-- batch inside one transaction: any failure rolls every row back.
--
-- Semantics match the old client loop exactly:
--   * category is written to the application only when it changed;
--   * sell_price is written only when the row carries one (null = keep);
--   * each affected IPO that ends up with at least one allotted PAN gets its
--     profit_pools row created / set back to 'Distributing'.
--
-- p_rows: jsonb array of
--   { id, app_id, category, status, shares, gain, sell_price }

CREATE OR REPLACE FUNCTION save_allotment_changes(p_rows jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r        jsonb;
  v_ipo    uuid;
  v_ipos   uuid[] := '{}';
  v_count  int := 0;
BEGIN
  IF NOT is_pool_admin() THEN
    RAISE EXCEPTION 'Only a pool admin can save allotments';
  END IF;
  IF jsonb_array_length(coalesce(p_rows, '[]'::jsonb)) > 5000 THEN
    RAISE EXCEPTION 'Too many rows in one save';
  END IF;

  FOR r IN SELECT * FROM jsonb_array_elements(coalesce(p_rows, '[]'::jsonb))
  LOOP
    SELECT ap.ipo_id INTO v_ipo
      FROM allotments al JOIN applications ap ON ap.id = al.application_id
      WHERE al.id = (r->>'id')::uuid;
    IF v_ipo IS NULL THEN
      RAISE EXCEPTION 'Allotment % not found', r->>'id';
    END IF;

    IF r->>'category' IS NOT NULL THEN
      UPDATE applications ap SET category = r->>'category'
        FROM allotments al
        WHERE al.id = (r->>'id')::uuid AND ap.id = al.application_id
          AND ap.category IS DISTINCT FROM r->>'category';
    END IF;

    UPDATE allotments SET
      status     = r->>'status',
      shares     = coalesce((r->>'shares')::int, 0),
      gain       = coalesce((r->>'gain')::numeric, 0),
      sell_price = CASE WHEN r->>'sell_price' IS NOT NULL
                        THEN (r->>'sell_price')::numeric ELSE sell_price END,
      checked_at = now()
      WHERE id = (r->>'id')::uuid;

    IF NOT (v_ipo = ANY (v_ipos)) THEN v_ipos := v_ipos || v_ipo; END IF;
    v_count := v_count + 1;
  END LOOP;

  -- Only an IPO with something allotted has anything to distribute; an
  -- all-"not allotted" IPO must not get an empty 'Distributing' pool.
  INSERT INTO profit_pools (ipo_id, status)
    SELECT DISTINCT ap.ipo_id, 'Distributing'
      FROM applications ap JOIN allotments al ON al.application_id = ap.id
      WHERE ap.ipo_id = ANY (v_ipos) AND al.status = 'allotted'
    ON CONFLICT (ipo_id) DO UPDATE SET status = 'Distributing';

  RETURN jsonb_build_object('ok', true, 'count', v_count);
END;
$$;

REVOKE ALL ON FUNCTION save_allotment_changes(jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION save_allotment_changes(jsonb) TO authenticated;
