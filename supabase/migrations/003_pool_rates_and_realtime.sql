-- IPO Pool — capture tax/brokerage on the pool at finalize time, and finish
-- enabling realtime so every device stays in sync.

-- ── Rates captured when a pool is finalized ───────────────────────────────────
-- Settlement amounts are computed from these rates at finalize time. Storing
-- them on the pool means the ledger shows the same numbers on every device,
-- regardless of each user's local STCG/brokerage settings.
ALTER TABLE profit_pools ADD COLUMN IF NOT EXISTS stcg_rate NUMERIC;
ALTER TABLE profit_pools ADD COLUMN IF NOT EXISTS brokerage NUMERIC;

-- ── Realtime for the remaining tables ─────────────────────────────────────────
-- 001 already published allotments, settlements, ipos. Add the rest so that
-- member/PAN/application/pool changes also push to open sessions.
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE members;      EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE pan_accounts; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE applications; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE profit_pools; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
