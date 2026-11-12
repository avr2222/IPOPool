-- 027 — Admin-entered market holidays.
--
-- The IPO date helper (open / allotment / listing from the close date) knows
-- weekends, fixed-date holidays and the exchange list for the years built
-- into the app. Festival holidays move every year and the exchange only
-- publishes next year's list in December, so the admin can add dates in
-- Settings. Stored as text, one YYYY-MM-DD per line, on the single
-- pool_settings row (019) so every device uses the same list.
--
-- NULL means "not set": the app falls back to that device's local copy.

ALTER TABLE pool_settings ADD COLUMN IF NOT EXISTS market_holidays text;
