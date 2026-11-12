-- 029 — Lock the PAN-only member functions.
--
-- RUN THIS ONLY AFTER the app version with the member PIN (migration 028) is
-- live and members have picked it up. From then on the old functions, which
-- accept a bare PAN as the credential, are no longer needed by the app; this
-- stops anyone calling them directly to get around the PIN.
--
-- The token-taking functions from 028 keep working: they are SECURITY DEFINER
-- and call these as the owner. A member still on an old cached copy of the app
-- will see an error until they reload; a member logged in from before 028
-- (no PIN yet) is sent back to the login screen and sets a PIN.
--
-- Safe to run more than once. Functions that don't exist are skipped.

DO $$
DECLARE
  f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'member_login(text)',
    'member_summary(text)',
    'member_summary(text, numeric)',
    'submit_applications(text, uuid, jsonb)',
    'my_ipo_applications(text, uuid)',
    'ipo_applicants(text, uuid)'
  ] LOOP
    IF to_regprocedure('public.' || f) IS NOT NULL THEN
      EXECUTE 'REVOKE ALL ON FUNCTION public.' || f || ' FROM public, anon, authenticated';
    END IF;
  END LOOP;
END;
$$;
