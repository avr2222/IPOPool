-- Internal group pooling: allow two more ways to weight a PAN's pool share
-- among its funders — by percentage and by PAN count. The share is split
-- proportionally to the stored amount in every case; funding_mode just records
-- the unit the admin entered ('amount' = ₹, 'percent' = %, 'pans' = PAN count).
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_funding_mode_check;
ALTER TABLE applications ADD CONSTRAINT applications_funding_mode_check
  CHECK (funding_mode IN ('equal', 'amount', 'percent', 'pans'));
