-- 010 — Pool-wide "who applied" view for the member portal.
--
-- Every existing member-facing RPC (migration 004) is scoped to the caller's
-- own family. This one is deliberately NOT scoped: once a member logs in via
-- the apply link, they can see every PAN's application + allotment result
-- for that one IPO, across every family in the pool -- category, status,
-- shares, sell price, gain. That's the whole point (pool-wide transparency),
-- not a leak.
--
-- Still gated: the caller must present a real, active login PAN (same check
-- my_ipo_applications uses) so a random UUID guess can't pull this without
-- actually being a pool member. PANs of OTHER applicants are masked, same as
-- everywhere else members see PANs that aren't their own.

CREATE OR REPLACE FUNCTION ipo_applicants(p_login_pan text, p_ipo uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_member_id uuid;
  v_result    jsonb;
BEGIN
  SELECT pa.member_id INTO v_member_id
    FROM pan_accounts pa
    WHERE upper(pa.pan) = upper(btrim(coalesce(p_login_pan, ''))) AND pa.status = 'Active'
    LIMIT 1;
  IF v_member_id IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'pan_id',      a.pan_id,
           'holder',      pa.holder_name,
           'pan_masked',  mask_pan(pa.pan),
           'member_name', m.name,
           'category',    a.category,
           'lots',        a.lots,
           'status',      coalesce(al.status, 'pending'),
           'shares',      al.shares,
           'sell_price',  al.sell_price,
           'gain',        al.gain
         ) ORDER BY pa.holder_name), '[]'::jsonb)
    INTO v_result
    FROM applications a
    JOIN pan_accounts pa ON pa.id = a.pan_id
    JOIN members m       ON m.id = pa.member_id
    LEFT JOIN allotments al ON al.application_id = a.id
    WHERE a.ipo_id = p_ipo;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION ipo_applicants(text, uuid) FROM public;
GRANT EXECUTE ON FUNCTION ipo_applicants(text, uuid) TO anon, authenticated;
