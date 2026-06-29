-- IPO Pool — Supabase schema v2
-- Run: supabase db push  (or paste into Supabase SQL editor)

-- ── Members (admin-managed pool participants) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT UNIQUE,
  phone       TEXT,
  avatar_hue  INTEGER NOT NULL DEFAULT 200,
  is_admin    BOOLEAN NOT NULL DEFAULT FALSE,
  auth_uid    UUID UNIQUE,        -- set when the member gets a login
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PAN accounts ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pan_accounts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  pan         TEXT NOT NULL,
  holder_name TEXT NOT NULL,
  relation    TEXT NOT NULL DEFAULT 'Self',   -- free text: Self | Spouse | Father | Mother | Son | Daughter | Brother | Sister | Friend | etc.
  bank        TEXT,
  status      TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Inactive')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (pan)
);

-- ── IPOs ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ipos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  short_name     TEXT,
  type           TEXT NOT NULL CHECK (type IN ('SME','Mainboard')),
  sector         TEXT,
  status         TEXT NOT NULL DEFAULT 'Upcoming'
                   CHECK (status IN ('Upcoming','Open','Closed','Listed')),
  band_low       NUMERIC,
  band_high      NUMERIC,
  lot_size       INTEGER,
  lot_value      NUMERIC,          -- price of 1 lot (band_high × lot_size)
  open_date      DATE,
  close_date     DATE,
  allot_date     DATE,
  list_date      DATE,
  list_price     NUMERIC,
  list_gain_pct  NUMERIC,          -- (list_price - band_high) / band_high × 100
  subscription   NUMERIC,          -- overall subscription times
  hue            INTEGER DEFAULT 220,
  logo           TEXT,             -- URL or emoji
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Applications (one per PAN per IPO, with category) ────────────────────────
CREATE TABLE IF NOT EXISTS applications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ipo_id     UUID NOT NULL REFERENCES ipos(id) ON DELETE CASCADE,
  pan_id     UUID NOT NULL REFERENCES pan_accounts(id) ON DELETE CASCADE,
  category   TEXT NOT NULL CHECK (category IN ('SME','Retail','sHNI','bHNI')),
  lots       INTEGER NOT NULL DEFAULT 1,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (ipo_id, pan_id)
);

-- ── Allotments (result of each application) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS allotments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE UNIQUE,
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','allotted','not_allotted')),
  shares         INTEGER NOT NULL DEFAULT 0,
  gain           NUMERIC NOT NULL DEFAULT 0,   -- listing-day profit (net of sell price)
  checked_at     TIMESTAMPTZ DEFAULT NOW(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Profit pools (one per IPO, tracks distribution status) ───────────────────
CREATE TABLE IF NOT EXISTS profit_pools (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ipo_id     UUID NOT NULL REFERENCES ipos(id) ON DELETE CASCADE UNIQUE,
  status     TEXT NOT NULL DEFAULT 'Distributing'
               CHECK (status IN ('Distributing','Settled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Settlements (per member per pool per category) ────────────────────────────
CREATE TABLE IF NOT EXISTS settlements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id    UUID NOT NULL REFERENCES profit_pools(id) ON DELETE CASCADE,
  member_id  UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  category   TEXT NOT NULL CHECK (category IN ('SME','Retail','sHNI','bHNI')),
  pans       INTEGER NOT NULL DEFAULT 1,
  amount     NUMERIC NOT NULL DEFAULT 0,
  status     TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Paid')),
  paid_date  DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (pool_id, member_id, category)
);

-- ── Realtime publications ─────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE allotments;
ALTER PUBLICATION supabase_realtime ADD TABLE settlements;
ALTER PUBLICATION supabase_realtime ADD TABLE ipos;

-- ── Row-level security ────────────────────────────────────────────────────────
ALTER TABLE members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pan_accounts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ipos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE allotments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE profit_pools  ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements   ENABLE ROW LEVEL SECURITY;

-- Helper: returns true if the current auth user is an admin member
CREATE OR REPLACE FUNCTION is_pool_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM members
    WHERE auth_uid = auth.uid() AND is_admin = TRUE
  );
$$;

-- All authenticated users can read everything (single private pool)
CREATE POLICY "read_members"      ON members      FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "read_pans"         ON pan_accounts FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "read_ipos"         ON ipos         FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "read_applications" ON applications FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "read_allotments"   ON allotments   FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "read_pools"        ON profit_pools FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "read_settlements"  ON settlements  FOR SELECT TO authenticated USING (TRUE);

-- Only admin can write
CREATE POLICY "admin_members"      ON members      FOR ALL TO authenticated USING (is_pool_admin()) WITH CHECK (is_pool_admin());
CREATE POLICY "admin_pans"         ON pan_accounts FOR ALL TO authenticated USING (is_pool_admin()) WITH CHECK (is_pool_admin());
CREATE POLICY "admin_ipos"         ON ipos         FOR ALL TO authenticated USING (is_pool_admin()) WITH CHECK (is_pool_admin());
CREATE POLICY "admin_applications" ON applications FOR ALL TO authenticated USING (is_pool_admin()) WITH CHECK (is_pool_admin());
CREATE POLICY "admin_allotments"   ON allotments   FOR ALL TO authenticated USING (is_pool_admin()) WITH CHECK (is_pool_admin());
CREATE POLICY "admin_pools"        ON profit_pools FOR ALL TO authenticated USING (is_pool_admin()) WITH CHECK (is_pool_admin());
CREATE POLICY "admin_settlements"  ON settlements  FOR ALL TO authenticated USING (is_pool_admin()) WITH CHECK (is_pool_admin());
