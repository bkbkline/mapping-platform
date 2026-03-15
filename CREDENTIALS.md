# Credentials & Environment Variables

## Required Environment Variables

Set these in `.env.local` for local development and in the Vercel dashboard for production.

| Variable | Format | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` | Supabase project URL (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` JWT | Supabase anonymous key (public, used in browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` JWT | Supabase service role key (server-only, bypasses RLS) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | `pk.eyJ...` | Mapbox GL access token (public) |

### Optional

| Variable | Format | Description |
|---|---|---|
| `SUPABASE_PROJECT_ID` | `heibinbob...` | Supabase project ref (not used in code, for tooling only) |

### Where to set

- **Local:** `.env.local` (gitignored, never committed)
- **Production:** Vercel dashboard → Settings → Environment Variables
- **`.env.example`:** template with empty values (committed, safe)

## Test Account

| Field    | Value              |
|----------|--------------------|
| Email    | `test@landintel.com` |
| Password | `LandIntel2024!` |
| Login URL | https://project-tlho5.vercel.app/auth/login |

- **Role:** admin
- **Org ID:** none (data is not org-scoped)
- **Email verified:** yes (auto-confirmed on creation)

### Recreating the test account

```bash
npx ts-node --esm --skip-project scripts/create-test-user.ts
```

The script is idempotent — safe to run multiple times.

## Service Role Key Usage

The `SUPABASE_SERVICE_ROLE_KEY` is used by:
- `lib/supabase/server.ts` — server-side API routes (bypasses RLS)
- `scripts/create-test-user.ts` — creating auth users via admin API
- `app/api/parcels/route.ts`, `app/api/comps/route.ts`, `app/api/search/route.ts` — server-side data queries

## Production Deployment

- **Supabase project:** `heibinbobtezbzhfcybc`
- **Vercel project:** `mapping` (ID: `prj_dySaPnzxgXO9455p86yjJWDoOpOC`)
- **GitHub:** `bkbkline/mapping-platform`
- **Live URL:** https://project-tlho5.vercel.app
