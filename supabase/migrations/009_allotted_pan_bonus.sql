-- 009 — Capture the allotted-PAN bonus rate on the pool, same pattern as
-- migration 003's stcg_rate/brokerage.
--
-- A pool that has already been finalized must keep paying out at the bonus
-- rate that was in effect then, even if the admin changes the Settings
-- value afterwards -- otherwise every device would silently reprice a
-- finalized ledger differently depending on whatever the local setting
-- happens to be at the moment it's viewed.
--
-- NULL means "not captured yet" (a pool finalized before this migration, or
-- before a bonus rate was ever set) and the app falls back to the local
-- Settings value, exactly like stcg_rate/brokerage already do.

ALTER TABLE profit_pools ADD COLUMN IF NOT EXISTS bonus_rate NUMERIC;
