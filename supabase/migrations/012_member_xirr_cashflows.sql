-- 012 — Add a `cashflows` array to member_summary so the Member Portal can
-- compute its own XIRR (annualised, money-weighted return) client-side,
-- using the exact same Newton-Raphson solver (window.xirr, src/db.js) the
-- Dashboard's leaderboards already use. No solver in SQL -- this function
-- just hands back the raw dated { date, amount } legs.
--
-- Two kinds of leg, both scoped by the same my_pans/my_apps rules already
-- used for total_profit (family head sees every family PAN, a sub-member
-- sees only their own PAN):
--
--  1. Principal legs, one out/in pair per application, regardless of
--     allotment outcome (a not-allotted ASBA application still blocks the
--     money for a few days): -lot_value*lots at the IPO's close (fallback
--     open) date, and the same amount back at par at list/allot date once
--     that's passed, else today (mark-to-date -- still blocked, no
--     gain/loss assumed). Deliberately independent of whether the pool has
--     been finalized, since ASBA release doesn't wait on the admin.
--  2. Profit legs, one per settlement row this member/PAN is entitled to --
--     reuses the exact same head/sub-member UNION ALL `pf` already uses for
--     total_profit (so the amount can never drift from what a member
--     already sees), just listed per-row instead of summed, dated at
--     paid_date once Paid else today (mark-to-date). Deliberately only from
--     ACTUAL settlement rows -- member_summary has never shown a member a
--     live/unfinalized pool preview, and the new cashflows keep that scope
--     so a member's own XIRR can't show them a number the admin could still
--     change.

CREATE OR REPLACE FUNCTION member_summary(p_login_pan text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_member_id    uuid;
  v_login_pan    uuid;
  v_login_holder text;
  v_is_head      boolean;
  v_name         text;
  v_result       jsonb;
BEGIN
  SELECT pa.member_id, pa.id, pa.holder_name, (lower(btrim(pa.relation)) = 'self')
    INTO v_member_id, v_login_pan, v_login_holder, v_is_head
    FROM pan_accounts pa
    WHERE upper(pa.pan) = upper(btrim(coalesce(p_login_pan, ''))) AND pa.status = 'Active'
    LIMIT 1;
  IF v_member_id IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT name INTO v_name FROM members WHERE id = v_member_id;

  -- Scope: the family head (Self PAN) sees all family PANs + the family profit; a
  -- sub-member sees only their own PAN's applications and their OWN per-PAN share.
  WITH my_pans AS (
    SELECT id FROM pan_accounts
    WHERE (v_is_head AND member_id = v_member_id) OR (NOT v_is_head AND id = v_login_pan)
  ),
  my_apps AS (
    SELECT a.id AS app_id, a.ipo_id, al.status AS allot_status
    FROM applications a
    JOIN my_pans mp ON mp.id = a.pan_id
    LEFT JOIN allotments al ON al.application_id = a.id
  ),
  -- Profit per IPO. Head: the family's full settlement amounts. Sub-member: for
  -- each IPO+category THIS PAN applied to, the member's settlement for that
  -- category divided by the applied-PAN count (= this PAN's equal share). A PAN
  -- that did not apply to a pool contributes nothing.
  pf AS (
    SELECT ipo_id,
           sum(share)         AS profit,
           sum(paid_share)    AS paid,
           sum(pending_share) AS pending,
           bool_or(is_paid)    AS any_paid,
           bool_or(is_pending) AS any_pending
    FROM (
      SELECT pp.ipo_id,
             s.amount AS share,
             CASE WHEN s.status = 'Paid'    THEN s.amount ELSE 0 END AS paid_share,
             CASE WHEN s.status = 'Pending' THEN s.amount ELSE 0 END AS pending_share,
             (s.status = 'Paid')    AS is_paid,
             (s.status = 'Pending') AS is_pending
      FROM settlements s
      JOIN profit_pools pp ON pp.id = s.pool_id
      WHERE v_is_head AND s.member_id = v_member_id
      UNION ALL
      SELECT pp.ipo_id,
             round(s.amount::numeric / nullif(s.pans, 0)) AS share,
             CASE WHEN s.status = 'Paid'    THEN round(s.amount::numeric / nullif(s.pans, 0)) ELSE 0 END AS paid_share,
             CASE WHEN s.status = 'Pending' THEN round(s.amount::numeric / nullif(s.pans, 0)) ELSE 0 END AS pending_share,
             (s.status = 'Paid')    AS is_paid,
             (s.status = 'Pending') AS is_pending
      FROM applications a
      JOIN profit_pools pp ON pp.ipo_id = a.ipo_id
      JOIN settlements s   ON s.pool_id = pp.id AND s.member_id = v_member_id AND s.category = a.category
      WHERE NOT v_is_head AND a.pan_id = v_login_pan
    ) q
    GROUP BY ipo_id
  ),
  per_ipo AS (
    SELECT ma.ipo_id,
           count(*)                                          AS applied,
           count(*) FILTER (WHERE ma.allot_status = 'allotted') AS allotted,
           CASE
             WHEN bool_or(ma.allot_status = 'allotted')     THEN 'allotted'
             WHEN bool_or(ma.allot_status = 'not_allotted') THEN 'not_allotted'
             ELSE 'pending' END                             AS allot_state
    FROM my_apps ma
    GROUP BY ma.ipo_id
  ),
  -- Total bonus, scoped by my_pans -- exact for BOTH head and sub-member,
  -- since settlement_pans is already one row per PAN (no approximate /pans
  -- division needed, unlike pf above which predates this table).
  bonus AS (
    SELECT coalesce(sum(sp.bonus_amount), 0) AS total_bonus
    FROM settlement_pans sp
    WHERE sp.pan_id IN (SELECT id FROM my_pans)
  ),
  -- XIRR cash-flow legs -- see the header comment above for the model.
  principal_legs AS (
    SELECT
      CASE WHEN i.close_date IS NOT NULL THEN i.close_date ELSE i.open_date END AS leg_date,
      -(i.lot_value * coalesce(a.lots, 1))::numeric AS leg_amount
    FROM applications a
    JOIN my_pans mp ON mp.id = a.pan_id
    JOIN ipos i ON i.id = a.ipo_id
    WHERE i.lot_value IS NOT NULL AND coalesce(i.close_date, i.open_date) IS NOT NULL
    UNION ALL
    SELECT
      CASE
        WHEN coalesce(i.list_date, i.allot_date) IS NOT NULL AND coalesce(i.list_date, i.allot_date) <= CURRENT_DATE
          THEN coalesce(i.list_date, i.allot_date)
        ELSE CURRENT_DATE
      END AS leg_date,
      (i.lot_value * coalesce(a.lots, 1))::numeric AS leg_amount
    FROM applications a
    JOIN my_pans mp ON mp.id = a.pan_id
    JOIN ipos i ON i.id = a.ipo_id
    WHERE i.lot_value IS NOT NULL AND coalesce(i.close_date, i.open_date) IS NOT NULL
  ),
  profit_legs AS (
    SELECT
      CASE WHEN s.status = 'Paid' THEN coalesce(s.paid_date, CURRENT_DATE) ELSE CURRENT_DATE END AS leg_date,
      s.amount AS leg_amount
    FROM settlements s
    WHERE v_is_head AND s.member_id = v_member_id
    UNION ALL
    SELECT
      CASE WHEN s.status = 'Paid' THEN coalesce(s.paid_date, CURRENT_DATE) ELSE CURRENT_DATE END AS leg_date,
      round(s.amount::numeric / nullif(s.pans, 0)) AS leg_amount
    FROM applications a
    JOIN profit_pools pp ON pp.ipo_id = a.ipo_id
    JOIN settlements s   ON s.pool_id = pp.id AND s.member_id = v_member_id AND s.category = a.category
    WHERE NOT v_is_head AND a.pan_id = v_login_pan
  ),
  all_legs AS (
    SELECT leg_date, leg_amount FROM principal_legs
    UNION ALL
    SELECT leg_date, leg_amount FROM profit_legs
  )
  SELECT jsonb_build_object(
    'name',           v_name,
    'login_holder',   v_login_holder,
    'scope',          CASE WHEN v_is_head THEN 'family' ELSE 'pan' END,
    'is_head',        v_is_head,
    'pans_applied',   (SELECT count(*) FROM my_apps),
    'allotments',     (SELECT count(*) FROM my_apps WHERE allot_status = 'allotted'),
    'ipos_applied',   (SELECT count(*) FROM per_ipo),
    'paid_profit',    coalesce((SELECT sum(paid)    FROM pf), 0),
    'pending_profit', coalesce((SELECT sum(pending) FROM pf), 0),
    'total_profit',   coalesce((SELECT sum(profit)  FROM pf), 0),
    'total_bonus',    (SELECT total_bonus FROM bonus),
    'cashflows', coalesce((
      SELECT jsonb_agg(jsonb_build_object('date', leg_date, 'amount', leg_amount))
      FROM all_legs
      WHERE leg_date IS NOT NULL AND leg_amount IS NOT NULL AND leg_amount <> 0
    ), '[]'::jsonb),
    'ipos', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'ipo_id',     i.id,
        'name',       i.name,
        'short',      coalesce(i.short_name, split_part(i.name, ' ', 1)),
        'type',       i.type,
        'status',     i.status,
        'applied',    pi.applied,
        'allotted',   pi.allotted,
        'allot_state', pi.allot_state,
        'profit',     coalesce(ms.profit, 0),
        'settle_status', CASE
            WHEN ms.any_paid AND NOT coalesce(ms.any_pending, false) THEN 'paid'
            WHEN ms.any_paid AND ms.any_pending                      THEN 'partly'
            WHEN ms.any_pending                                      THEN 'pending'
            WHEN pi.allotted > 0                                     THEN 'awaiting'
            ELSE '-' END
      ) ORDER BY i.list_date DESC NULLS LAST, i.open_date DESC NULLS LAST)
      FROM per_ipo pi
      JOIN ipos i ON i.id = pi.ipo_id
      LEFT JOIN pf ms ON ms.ipo_id = pi.ipo_id
    ), '[]'::jsonb),
    'pans', CASE WHEN v_is_head THEN (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
               'pan_id',     pa.id,
               'holder',     pa.holder_name,
               'relation',   pa.relation,
               'pool_share', coalesce(t.pool_share, 0),
               'bonus',      coalesce(t.bonus, 0),
               'total',      coalesce(t.pool_share, 0) + coalesce(t.bonus, 0)
             ) ORDER BY (coalesce(t.pool_share, 0) + coalesce(t.bonus, 0)) DESC), '[]'::jsonb)
      FROM pan_accounts pa
      LEFT JOIN (
        SELECT sp.pan_id, sum(sp.pool_share) AS pool_share, sum(sp.bonus_amount) AS bonus
        FROM settlement_pans sp
        WHERE sp.pan_id IN (SELECT id FROM my_pans)
        GROUP BY sp.pan_id
      ) t ON t.pan_id = pa.id
      WHERE pa.member_id = v_member_id AND pa.status = 'Active'
    ) ELSE NULL END
  ) INTO v_result;

  RETURN v_result;
END;
$$;
