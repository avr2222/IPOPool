-- 013 — Defer principal/profit recognition in member_summary's `cashflows`
-- instead of topping an immediate release up with a separate interest leg.
--
-- An earlier version of this (never released to end users, caught in
-- testing before the JS side shipped) modeled idle capital by adding a
-- SEPARATE interest leg on top of principal that was still recognized
-- immediately at listing. That can only ever push a solved XIRR rate UP,
-- never down -- adding a same-signed positive leg to an already-fixed set
-- of outflows requires a HIGHER discount rate to balance, not a lower one.
--
-- The actual fix: don't recognize principal (or profit) as "returned" at
-- its own natural date at all. Instead, defer each PAN's principal/profit
-- contributions to that SAME PAN's own next application (its next `block`
-- date), or to today if there isn't one -- growing at `p_idle_rate` for the
-- wait. This is what genuinely stretches an isolated 8-day IPO cycle's
-- effective holding period into however long the money actually sat idle,
-- which is what dilutes an absurd annualized rate back to something
-- plausible. When p_idle_rate = 0 this collapses to exactly the original
-- immediate-recognition behaviour (migration 012) -- deferring the DATE
-- alone, even with zero growth, would still change the solved rate, so
-- p_idle_rate = 0 has to skip deferral entirely, not just apply 1.0 growth.
--
-- Also switches the profit source from `pf`'s family-level/divided-by-pans
-- approximation to `settlement_pans` (true per-PAN pool_share+bonus_amount,
-- written by the same finalizePayouts() call that computes panAmounts/
-- panBonuses client-side) -- both more accurate for a sub-member's own
-- share, and required to get real per-PAN granularity for the checkpoint
-- search. `pf`/total_profit itself is UNCHANGED -- this only affects the
-- cashflows array.
--
-- No recursive CTE needed: "this PAN's next block after date X" is a plain
-- correlated MIN() subquery, and the checkpoint amounts are a plain
-- GROUP BY sum.

-- CREATE OR REPLACE does NOT retire the old single-argument signature --
-- Postgres treats a changed parameter LIST (even just adding one with a
-- DEFAULT) as a distinct overload, so without this the old member_summary
-- (text) and the new member_summary(text, numeric) would both exist,
-- ambiguous for any caller that doesn't pass both arguments.
DROP FUNCTION IF EXISTS member_summary(text);

CREATE OR REPLACE FUNCTION member_summary(p_login_pan text, p_idle_rate numeric DEFAULT 2.5)
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
  -- that did not apply to a pool contributes nothing. Unchanged by this migration.
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
  -- XIRR: each PAN's own blocks (real, immediate legs) ------------------
  pan_blocks AS (
    SELECT a.pan_id,
           CASE WHEN i.close_date IS NOT NULL THEN i.close_date ELSE i.open_date END AS block_date,
           (i.lot_value * coalesce(a.lots, 1))::numeric AS block_amt
    FROM applications a
    JOIN my_pans mp ON mp.id = a.pan_id
    JOIN ipos i ON i.id = a.ipo_id
    WHERE i.lot_value IS NOT NULL AND coalesce(i.close_date, i.open_date) IS NOT NULL
  ),
  -- each PAN's own contributions (principal + profit) -- money that
  -- BECOMES AVAILABLE on some date but isn't yet a recognized leg.
  principal_contrib AS (
    SELECT a.pan_id,
           CASE
             WHEN coalesce(i.list_date, i.allot_date) IS NOT NULL AND coalesce(i.list_date, i.allot_date) <= CURRENT_DATE
               THEN coalesce(i.list_date, i.allot_date)
             ELSE CURRENT_DATE
           END AS avail_date,
           (i.lot_value * coalesce(a.lots, 1))::numeric AS amount
    FROM applications a
    JOIN my_pans mp ON mp.id = a.pan_id
    JOIN ipos i ON i.id = a.ipo_id
    WHERE i.lot_value IS NOT NULL AND coalesce(i.close_date, i.open_date) IS NOT NULL
  ),
  -- True per-PAN profit share (settlement_pans, not pf's family/divided
  -- approximation) -- same PoolMath-derived numbers panAmounts/panBonuses
  -- already give client-side, so this can't drift from what's shown
  -- elsewhere, and gives real per-PAN granularity for the checkpoint search.
  profit_contrib AS (
    SELECT sp.pan_id,
           CASE WHEN s.status = 'Paid' THEN coalesce(s.paid_date, CURRENT_DATE) ELSE CURRENT_DATE END AS avail_date,
           (sp.pool_share + sp.bonus_amount)::numeric AS amount
    FROM settlement_pans sp
    JOIN pan_accounts pa ON pa.id = sp.pan_id
    JOIN settlements s ON s.pool_id = sp.pool_id AND s.category = sp.category AND s.member_id = pa.member_id
    WHERE sp.pan_id IN (SELECT id FROM my_pans)
  ),
  all_contrib AS (
    SELECT pan_id, avail_date, amount FROM principal_contrib
    UNION ALL
    SELECT pan_id, avail_date, amount FROM profit_contrib
  ),
  -- Checkpoint = this contribution's own PAN's next block strictly after
  -- its avail_date, or today if there isn't one -- UNLESS p_idle_rate <= 0,
  -- in which case there's no deferral at all (checkpoint = avail_date
  -- itself), mirroring the JS idleRate === 0 branch exactly.
  contrib_checkpoints AS (
    SELECT c.pan_id, c.avail_date, c.amount,
           CASE WHEN p_idle_rate <= 0 THEN c.avail_date
             ELSE coalesce(
               (SELECT MIN(pb.block_date) FROM pan_blocks pb WHERE pb.pan_id = c.pan_id AND pb.block_date > c.avail_date),
               CURRENT_DATE
             )
           END AS checkpoint_date
    FROM all_contrib c
  ),
  grown_contrib AS (
    SELECT pan_id, checkpoint_date,
           amount * CASE
             WHEN p_idle_rate <= 0 OR checkpoint_date <= avail_date THEN 1
             ELSE (1 + p_idle_rate / 100.0 * (checkpoint_date - avail_date) / 365.0)
           END AS grown_amount
    FROM contrib_checkpoints
  ),
  checkpoint_legs AS (
    SELECT checkpoint_date AS leg_date, round(SUM(grown_amount), 2) AS leg_amount
    FROM grown_contrib
    GROUP BY pan_id, checkpoint_date
  ),
  block_legs AS (
    SELECT block_date AS leg_date, -block_amt AS leg_amount FROM pan_blocks
  ),
  all_legs AS (
    SELECT leg_date, leg_amount FROM block_legs
    UNION ALL
    SELECT leg_date, leg_amount FROM checkpoint_legs
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
