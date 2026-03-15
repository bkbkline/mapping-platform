# Test Account Credentials

## Login

| Field    | Value              |
|----------|--------------------|
| Email    | test@landintel.com |
| Password | LandIntel2024!     |
| URL      | https://project-tlho5.vercel.app/auth/login |

## Account Details

- **Role:** admin
- **Org ID:** none (data is not org-scoped)
- **User UUID:** created via `scripts/create-test-user.ts`
- **Email verified:** yes (auto-confirmed)

## Data Access

The test account has authenticated read access to all tables:
- `parcels` (15 rows) — Industrial parcels in the Inland Empire
- `comps` (15 rows) — Industrial land sales
- `industrial_parks` (5 rows)
- `zoning_districts` (5 rows)
- `flood_zones` (5 rows)
- `infrastructure_assets` (5 rows)
- `projects`, `notes`, `saved_searches`, `drawings` — user-created (starts empty)

## Service Role Key

The `SUPABASE_SERVICE_ROLE_KEY` environment variable is used by:
- `scripts/create-test-user.ts` — to create the auth user via admin API
- `lib/supabase/server.ts` — for server-side API routes (bypasses RLS)

It is loaded from `.env.local` (gitignored) and set as a Vercel environment variable for production.

## Recreating the Test Account

```bash
npx ts-node --esm --skip-project scripts/create-test-user.ts
```

The script is idempotent — safe to run multiple times.
