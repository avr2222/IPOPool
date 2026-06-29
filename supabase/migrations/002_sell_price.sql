-- IPO Pool — add sell_price to allotments so per-row sell price persists
ALTER TABLE allotments ADD COLUMN IF NOT EXISTS sell_price NUMERIC;
