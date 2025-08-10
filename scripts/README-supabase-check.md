How to verify Supabase without changing your UI:

1) Run the health check
   - Open this script in v0 and execute:
     - scripts/supabase-health-check.mjs
   - It prints:
     - Environment variable presence
     - Auth endpoint accessibility
     - Read access to key tables via REST
     - RLS public-read verification for menu_items
   - The script is read-only and does not change any data.

2) Apply the final schema (if your project is not yet provisioned)
   - Copy the SQL file scripts/final-supabase-setup-v3.sql
   - Open Supabase SQL Editor and run it once (safe to re-run).

Notes
- No visual or functional changes were made to your Next.js app.
- Your existing lib/supabase.ts remains compatible with this schema.
