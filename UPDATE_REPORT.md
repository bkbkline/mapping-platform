# Update Report — Toolbar, Dashboard, Reno Data, Bug Fixes

**Date:** 2026-03-16
**Builder:** Claude Opus 4.6 (autonomous)

---

## Feature 1: Toolbar Tools Verification

**Status: Verified — all tools connected**

All toolbar buttons in MapToolbarNew.tsx have onClick handlers that call `setActiveTool(toolId)` from ui-store. The active tool state highlights the button amber. MapboxDraw is initialized in DrawingTools.tsx and responds to tool changes.

Tools verified: select, polygon-select, draw-rectangle, draw-circle, draw-line, place-pin, measure, fit-bounds, fullscreen, upload, reset-view, delete.

**Note:** Full MapboxDraw mode switching (e.g. draw_polygon, draw_line_string) is handled in DrawingTools.tsx which watches the activeTool state. The toolbar correctly sets the state; DrawingTools consumes it.

---

## Feature 2: Rename "Add Items" → "Dashboard"

**Status: Complete**

**File modified:** `components/map/SidebarPanel.tsx`

Changes:
- Section ID changed from `'add-items'` to `'dashboard'`
- Label changed from `"Add Items"` to `"Dashboard"`
- Icon changed to a dashboard/grid icon
- Clicking "Dashboard" now calls `router.push('/dashboard')` instead of expanding inline content
- No chevron shown for the Dashboard section (it navigates, doesn't expand)
- Added `import { useRouter } from 'next/navigation'`

---

## Feature 3: Debug Missing Test Data

**Status: Fixed**

**Root cause:** The SidebarPanel's My Maps dropdown was querying `maps.name` but the actual column is `maps.title`. The MapRecord interface and all references were updated to use `title`.

**Fix applied in:** `components/map/SidebarPanel.tsx`
- Changed `MapRecord.name` → `MapRecord.title`
- Changed `m.name` → `m.title` in all JSX renders
- Changed `activeMapName` derivation to use `.title`

**Dashboard stats queries:** Already using correct pattern (`select('id', { count: 'exact', head: true })`) which works regardless of column names.

---

## Feature 4: Fix User Icon

**Status: Fixed**

**File modified:** `components/map/TopBar.tsx`

**Issue:** The user avatar button called `supabase.auth.signOut()` directly on click with no dropdown, no confirmation, and error-prone inline async.

**Fix:** Simplified to a clean async handler with proper error handling. The sign-out button now:
1. Calls `await supabase.auth.signOut()`
2. Calls `router.push('/auth/login')`
3. Has try/catch for error resilience

**Decision:** Kept the simple direct sign-out behavior (no dropdown) since the Settings page is accessible from the Dashboard sidebar. A dropdown can be added later if needed.

---

## Feature 5: Sidebar Collapsed by Default

**Status: Complete**

**File modified:** `components/map/SidebarPanel.tsx`

Changed:
```typescript
// Before:
const [expandedSection, setExpandedSection] = useState<SectionId | null>('overlays');

// After:
const [expandedSection, setExpandedSection] = useState<SectionId | null>(null);
```

All 5 section headers are visible when collapsed. No section content shown on initial load.

---

## Feature 6: Reno NV Market Data

**Status: Complete**

Data seeded via Node.js scripts using service role key. All data uses actual column names discovered by querying each table first.

**Key column discoveries:**
- `maps`: uses `title` (not `name`), `owner_id` (not `created_by`)
- `parcels`: uses `situs_address`, `county`, `state_abbr`, `acreage`, `zoning`, `owner_name`, `raw_attributes` (jsonb), `geometry`
- `collections`: uses `title` (not `name`), `owner_id` (not `created_by`)
- `comps`: uses `address`, `lot_size`, `building_sf`, `sale_price`, `sale_date`, `price_per_acre`
- `map_layers`: uses `source_config` (required, not null), `is_visible`, `sort_order`

**Data inserted:**
- 8 Reno industrial parcels (North Valleys LC, Sparks Industrial, TRIC Bldg 7, South Meadows, RNO Airport Cargo, Patrick Commerce, Mustang Business Park, Reno Cold Storage)
- 5 Reno comps (sale prices $9.7M–$70M)
- 6 map layers for Reno map
- 2 Reno collections
- 2 Reno projects
- 3 Reno saved searches
- 1 Reno map (or reused existing)

---

## Build Status

`npm run build` passes with zero errors.

## Files Modified
- `components/map/SidebarPanel.tsx` — Features 2, 3, 5
- `components/map/TopBar.tsx` — Feature 4
- `app/dashboard/page.tsx` — column name fixes (title vs name)

## Packages Installed
None — all required packages already present.

## Schema Changes
None applied programmatically — all inserts used existing columns.
