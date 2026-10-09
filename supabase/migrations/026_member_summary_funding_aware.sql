-- 026 — Make member_summary funding-aware for the internal group pooling
-- feature (migrations 022–025).
--
-- Internal group pooling splits a funded application's POOL SHARE among the
-- PANs that funded it (the allotted-PAN BONUS still stays with the holder).
-- The client already writes funding-aware rows:
--   * settlements      — one row per (member, category), amount already split
--                        to the funders (so the family-head totals here, which
--                        read settlements by member_id, were already correct);
--   * settlement_pans  — now one row per RECEIVING PAN per category, holding
--                        the pool share that PAN actually gets (its own slice
--                        as a funder of any application it backed, its own
--                        application included) plus the bonus it keeps as
--                        holder. (Redefined in buildFinalizePayload — summed
--                        per member it reconciles with settlements.)
--
-- Two things in member_summary still assumed the pre-funding world:
--   1. The SUB-MEMBER profit path divided the member's category settlement by
--      the PAN count — an approximation that never knew about funding and, for
--      a member who only BACKED another PAN (no application of their own),
--      showed nothing at all. Now read settlement_pans for the login PAN, so a
--      sub-member sees their true per-PAN funding-aware share, backing included.
--   2. per_ipo (which drives the IPO list and settle status) was built from
--      applications only, so an IPO a member only BACKED never appeared. Now
--      also include IPOs the member's PANs received a settlement_pans row for.
--
-- The head per-PAN breakdown, total_bonus and the XIRR `cashflows` already read
-- settlement_pans, so they became funding-aware automatically once that table
-- was redefined — no change needed to those parts here. (Principal/capital legs
-- in cashflows are still attributed to the applying PAN; splitting backed
-- capital across funders server-side is left for a follow-up — the headline
-- profit figures are what this migration makes correct.)
--
-- ipos_applied now counts only IPOs the member actually APPLIED to (distinct
-- over their own applications), so a backed-only IPO appearing in the list does
-- not inflate the "IPOs applied" stat.

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
  -- Profit per IPO.
  --   Head: the family's full settlement amounts (already funding-aware).
  --   Sub-member: their login PAN's own funding-aware share from settlement_pans
  --   (true per-PAN pool_share + bonus, backing included), with paid/pending
  --   taken from the member's settlement status for that category.
  pf AS (
    SELECT ipo_id,
           sum(share)          AS profit,
           sum(paid_share)     AS paid,
           sum(pending_share)  AS pending,
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
             (sp.pool_share + sp.bonus_amount) AS share,
             CASE WHEN s.status = 'Paid'    THEN (sp.pool_share + sp.bonus_amount) ELSE 0 END AS paid_share,
             CASE WHEN s.status = 'Pending' THEN (sp.pool_share + sp.bonus_amount) ELSE 0 END AS pending_share,
             (s.status = 'Paid')    AS is_paid,
             (s.status = 'Pending') AS is_pending
      FROM settlement_pans sp
      JOIN pan_accounts pa ON pa.id = sp.pan_id
      JOIN profit_pools pp ON pp.id = sp.pool_id
      JOIN settlements s   ON s.pool_id = sp.pool_id AND s.category = sp.category AND s.member_id = pa.member_id
      WHERE NOT v_is_head AND sp.pan_id = v_login_pan
    ) q
    GROUP BY ipo_id
  ),
  -- Every IPO the member is involved in: applied to (my_apps) OR only backed
  -- (a settlement_pans row for one of their PANs). Counts come from the
  -- application rows; a backed-only IPO contributes a zero-count placeholder so
  -- it still appears in the list.
  per_ipo AS (
    SELECT ipo_id,
           sum(is_app)   AS applied,
           sum(is_allot) AS allotted,
           CASE
             WHEN bool_or(st = 'allotted')     THEN 'allotted'
             WHEN bool_or(st = 'not_allotted') THEN 'not_allotted'
             WHEN bool_or(is_app > 0)          THEN 'pending'
             ELSE '-' END                      AS allot_state
    FROM (
      SELECT ma.ipo_id,
             1 AS is_app,
             CASE WHEN ma.allot_status = 'allotted' THEN 1 ELSE 0 END AS is_allot,
             ma.allot_status AS st
      FROM my_apps ma
      UNION ALL
      SELECT pp.ipo_id, 0 AS is_app, 0 AS is_allot, NULL AS st
      FROM settlement_pans sp
      JOIN profit_pools pp ON pp.id = sp.pool_id
      WHERE sp.pan_id IN (SELECT id FROM my_pans)
    ) u
    GROUP BY ipo_id
  ),
  bonus AS (
    SELECT coalesce(sum(sp.bonus_amount), 0) AS total_bonus
    FROM settlement_pans sp
    WHERE sp.pan_id IN (SELECT id FROM my_pans)
  ),
  pan_blocks AS (
    SELECT a.pan_id,
           CASE WHEN i.close_date IS NOT NULL THEN i.close_date ELSE i.open_date END AS block_date,
           (i.lot_value * coalesce(a.lots, 1))::numeric AS block_amt
    FROM applications a
    JOIN my_pans mp ON mp.id = a.pan_id
    JOIN ipos i ON i.id = a.ipo_id
    WHERE i.lot_value IS NOT NULL AND coalesce(i.close_date, i.open_date) IS NOT NULL
  ),
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
  -- Per-PAN profit share for the cashflow checkpoints: settlement_pans is now
  -- funding-aware, so this reflects what each PAN actually received.
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
    'ipos_applied',   (SELECT count(DISTINCT ipo_id) FROM my_apps),
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
