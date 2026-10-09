-- Row-Level Security for application_contributors (migration 022 created the
-- table but omitted its policies, so inserts were blocked). Mirror every other
-- table: anyone signed in can read; only pool admins can write.
ALTER TABLE application_contributors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_application_contributors"  ON application_contributors;
DROP POLICY IF EXISTS "admin_application_contributors" ON application_contributors;

CREATE POLICY "read_application_contributors"  ON application_contributors
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "admin_application_contributors" ON application_contributors
  FOR ALL    TO authenticated USING (is_pool_admin()) WITH CHECK (is_pool_admin());
