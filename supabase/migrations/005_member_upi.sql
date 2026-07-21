-- IPO Pool — add a UPI ID (VPA) to members so settlements can generate
-- upi://pay deep links + QR codes for the payee.
-- Run: supabase db push  (or paste into the Supabase SQL editor). Idempotent.

ALTER TABLE members ADD COLUMN IF NOT EXISTS upi_id TEXT;
