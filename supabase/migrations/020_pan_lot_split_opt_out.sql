-- Per-PAN opt-out of SME lot-based profit pooling.
-- Default FALSE = the PAN participates in lot-based pooling (opted IN), which is
-- the common case; only a few PANs opt out and always take the plain equal
-- share of their own category. Only consulted for SME IPOs.
ALTER TABLE pan_accounts ADD COLUMN IF NOT EXISTS lot_split_opt_out BOOLEAN NOT NULL DEFAULT FALSE;
