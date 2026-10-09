-- Internal group pooling: a single PAN's application can be funded by several
-- members, so the PAN's POOL SHARE (not its allotted-PAN bonus) is divided
-- among its contributors. Set per IPO application. The PAN holder is always a
-- contributor. funding_mode NULL = no internal pooling (holder keeps it all).
ALTER TABLE applications ADD COLUMN IF NOT EXISTS funding_mode TEXT
  CHECK (funding_mode IN ('equal', 'amount'));

CREATE TABLE IF NOT EXISTS application_contributors (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  member_id      UUID NOT NULL REFERENCES members(id)      ON DELETE CASCADE,
  amount         NUMERIC,                 -- capital put in (used in 'amount' mode); NULL/0 → no pool slice
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (application_id, member_id)
);

-- Keep the in-app realtime sync (migration 003) covering the new table.
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE application_contributors; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
