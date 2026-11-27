/* Accounts: fill these in to let people sign in and save their progressions to their own account.
   Both values are on your Supabase project's Settings → API page.
   The anon (public) key is meant to be in web pages: row-level security keeps each person's rows private.
   Never put the service_role key here. */
window.FRETBOARD_CONFIG = {
  supabaseUrl: 'https://nygfigynuggczoeunxtd.supabase.co',      // e.g. 'https://abcdefghijkl.supabase.co'
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55Z2ZpZ3ludWdnY3pvZXVueHRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU3OTgyMTIsImV4cCI6MjExMTM3NDIxMn0.2NkgfGI_pHYe5lvP2pNVeQM4sN9PvsEhpN1P3xQ3_ew',  // the long "anon public" key
  google: false,        // true once Google sign-in is switched on in Supabase (Authentication → Providers)
};
