# Data Fix Report — Testing Data Visible on Map

**Date:** 2026-03-16

## Root Causes Found

### 1. Geometry column is PostGIS binary — NULL via REST API
The `parcels.geometry` column is a PostGIS `geometry` type. When data was inserted via the Supabase JS client, the geometry was either rejected or stored as NULL because PostgREST can't write PostGIS binary from JSON. All 31 parcels had `geometry: null`.

**Fix:** Stored GeoJSON polygons in `raw_attributes.geojson` (which is a jsonb column that works via REST). Updated `ParcelLayer.tsx` to read geometry from `raw_attributes.geojson` when `geometry` is null, and to generate polygons from `raw_attributes.lat`/`lng` coordinates as a fallback.

### 2. RLS infinite recursion on profiles table
All org-scoped RLS policies (`maps`, `map_layers`, `annotations`, `collections`) query `profiles` to get the user's `org_id`. But `profiles` itself has RLS policies that also reference profiles — causing infinite recursion. This blocks ALL authenticated reads on these tables.

**Impact:** Maps, map_layers, annotations, and collections return `null` with "infinite recursion detected" error for authenticated users.

**Fix needed (SQL Editor required):** Add simple `USING (true)` SELECT policies for authenticated users on maps, map_layers, annotations, collections. SQL written to `scripts/fix-rls-and-data.sql`.

**Workaround applied:** The parcel rendering now works independently of the maps/layers tables. Parcels ARE readable by authenticated users (the `Authenticated read parcels` policy uses `USING (true)` and doesn't reference profiles).

### 3. Default map center was wrong
Default center was LA/Inland Empire (-117.9, 33.95) but all test data is in Reno NV (-119.8, 39.5). Users would see an empty map until they panned to Nevada.

**Fix:** Changed `DEFAULT_CENTER` to Reno coordinates, `DEFAULT_ZOOM` to 11.

### 4. PARCEL_MIN_ZOOM was too high
Parcels only loaded when zoomed to level 13+. At the default zoom of 10-11, no parcels were fetched.

**Fix:** Lowered `PARCEL_MIN_ZOOM` from 13 to 8.

### 5. org_id is NULL everywhere
The test user's profile has `org_id: null`. All seeded data also has `org_id: null`. This means org-based filtering would fail if implemented. For now this is consistent — both user and data have null org_id, so queries without org_id filters work correctly.

## Data Verified

| Table | Total Rows | Parcels with GeoJSON |
|---|---|---|
| parcels | 31 | 22 (8 NV + 14 CA with geojson in raw_attributes) |
| maps | 4 | — |
| map_layers | 11 | — |
| annotations | 5 | — |
| comps | 23 | — |
| projects | 5 | — |
| collections | 5 | — |
| saved_searches | 6 | — |

## Verification Checklist

| Check | Status |
|-------|--------|
| test@landintel.com profile exists | Yes |
| Profile has org_id | null (consistent with data) |
| Parcels in DB | 31 |
| Parcels with renderable geometry | 22 (via raw_attributes.geojson) |
| ParcelLayer reads raw_attributes.geojson | Yes (fixed) |
| Default center is Reno | Yes (fixed) |
| PARCEL_MIN_ZOOM allows zoom 11 | Yes (lowered to 8) |
| Build passes | Yes |

## Remaining Issue (Requires SQL Editor)

The maps, map_layers, annotations, and collections tables have RLS policies that cause infinite recursion. The test user can't read these tables via the authenticated client. To fix, run `scripts/fix-rls-and-data.sql` in the Supabase SQL Editor. This adds simple `USING (true)` SELECT policies.

**Parcels ARE visible** — they use a separate RLS policy that doesn't cause recursion.
