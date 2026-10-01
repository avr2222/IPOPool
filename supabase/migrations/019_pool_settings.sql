-- 019 — Keep the pool's tax & cost settings in the database.
--
-- STCG %, brokerage, the allotted-PAN bonus %, the idle-capital rate (and
-- any extra market holidays for IPO date auto-fill) used
-- to live in each browser's localStorage, so two admin devices could price
-- the same un-finalized IPO differently. One shared row now holds them;
-- finalizing a pool still snapshots the rates onto profit_pools as before.
--
-- A NULL column means "not set yet": the app then falls back to that
-- device's old local value, then to the built-in default, so nothing
-- changes until an admin saves Settings once.

CREATE TABLE IF NOT EXISTS pool_settings (
  id          integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  stcg_rate   numeric,
  brokerage   numeric,
  bonus_rate  numeric,
  idle_rate   numeric,
  -- Extra exchange holidays (any YYYY-MM-DD in the text) on top of the list
  -- built into the app, used to auto-fill IPO open/allotment/listing dates.
  market_holidays text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE pool_settings ADD COLUMN IF NOT EXISTS market_holidays text;
INSERT INTO pool_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE pool_settings ENABLE ROW LEVEL SECURITY;
-- Rates aren't sensitive, and the member portal (anon) needs the idle rate.
CREATE POLICY "read_pool_settings"  ON pool_settings FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "admin_pool_settings" ON pool_settings FOR ALL    TO authenticated USING (is_pool_admin()) WITH CHECK (is_pool_admin());
