-- 006 — Backfill ipos.lot_value.
--
-- lot_value (price of one lot = lot_size × band_high) has been NULL on every
-- IPO ever created: addIpo accepted the field but the create form never sent
-- it, and updateIpo had no branch for it, so there was no way to repair it
-- from the UI either. Downstream, allotment.invest reads lot_value, so the
-- dashboard reported a total investment of ₹0 and 0% ROI, and the IPO page
-- showed a blank "Lot value" and "Profit / lot".
--
-- The app now derives lot_value in the db layer on both create and edit. This
-- fills in the rows that predate that fix.
--
-- Idempotent: only touches rows where lot_value is still missing, so
-- re-running it cannot overwrite a value an admin has since corrected by hand.

UPDATE ipos
   SET lot_value = ROUND(lot_size::NUMERIC * band_high)
 WHERE lot_value IS NULL
   AND lot_size  IS NOT NULL AND lot_size  > 0
   AND band_high IS NOT NULL AND band_high > 0;
