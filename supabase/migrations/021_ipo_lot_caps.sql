-- Per-IPO lot caps for the SME profit split (see PoolMath.smeShares).
-- The cap is the number of lots a category's applicants commit; profit from a
-- category's allotment is shared by min(PAN lots, that category's cap). Retail
-- and sHNI are uniform, so the admin sets their lot level per SME IPO; bHNI is
-- never capped. NULL = derive from what that category's applicants applied.
ALTER TABLE ipos ADD COLUMN IF NOT EXISTS retail_lots INTEGER;
ALTER TABLE ipos ADD COLUMN IF NOT EXISTS shni_lots   INTEGER;
