/* ============================================================
   IPO Pool — Supabase client
   Fill in your project details from:
   Supabase Dashboard → Settings → API
   ============================================================ */
(function () {
  const SUPABASE_URL      = 'https://qsihyfliofsfpyakohif.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_p67NVGxn_Nh0P1_7YaWYDQ_YIhqav1H';

  // The CDN exposes the library as window.supabase
  window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
})();
