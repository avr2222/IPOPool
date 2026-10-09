-- Internal group pooling: a funder is now identified by the PAN they
-- contributed, and the payout routes to the member who owns that PAN. This
-- lets a member bring several PANs (each its own contributor row) and lets the
-- admin pick funders by PAN-holder name. member_id still records the owning
-- member so settlements route without a join.
ALTER TABLE application_contributors ADD COLUMN IF NOT EXISTS pan_id UUID REFERENCES pan_accounts(id) ON DELETE CASCADE;

-- Old uniqueness (one row per member per application) blocked two PANs of the
-- same member. Make it one row per PAN per application instead.
ALTER TABLE application_contributors DROP CONSTRAINT IF EXISTS application_contributors_application_id_member_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS application_contributors_app_pan_uniq
  ON application_contributors (application_id, pan_id) WHERE pan_id IS NOT NULL;
