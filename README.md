# Majestic Maps — Industrial Land Intelligence Platform

A production-grade industrial land intelligence platform built for developers, investors, and acquisitions teams analyzing industrial land, logistics sites, zoning, parcels, comps, and infrastructure through a fast, map-centric interface.

**Live:** [https://project-tlho5.vercel.app](https://project-tlho5.vercel.app)

## Test Account

Log in immediately with the demo account — no signup required:

| Field    | Value              |
|----------|--------------------|
| Email    | `test@landintel.com` |
| Password | `LandIntel2024!`     |
| URL      | [https://project-tlho5.vercel.app/auth/login](https://project-tlho5.vercel.app/auth/login) |

The test account has admin access to all seeded data (15 parcels, 15 comps, zoning districts, flood zones, industrial parks, infrastructure assets). See `CREDENTIALS.md` for full details.

## Features

### Map Engine
- Full-viewport Mapbox GL JS map with smooth pan/zoom/rotate
- Parcel rendering with hover tooltips (APN, acreage, zoning)
- Click-to-select parcels with detail panel
- 4 basemap styles: Streets, Satellite, Hybrid, Light
- Drawing tools: polygon, line, point
- Measurement tools: distance and area
- URL state persistence for shareable map views
- Navigation and scale controls

### Parcel Intelligence
- Detailed parcel cards with APN, address, county, acreage, zoning, land use
- Ownership and mailing address information
- Assessed value display
- Transaction history (last sale price/date)
- Environmental data (flood zone, opportunity zone)
- Industrial suitability scoring (0-100) with per-category breakdown
- AI-powered parcel analysis (development potential, zoning interpretation)
- Parcel notes with save/edit

### Layer Library
- 22 toggleable map layers organized in 5 categories
- **Base Land:** Parcels, Labels, City/County Boundaries, Zoning, Land Use, Opportunity Zones
- **Environmental:** FEMA Flood Zones, Wetlands, Terrain Shading
- **Transportation:** Highways, Truck Routes, Rail Lines, Airports
- **Infrastructure:** Transmission Lines, Substations, Water/Sewer Service
- **Market Intelligence:** Industrial Parks, Warehouses, Comps, Development Projects

### Sales Comp Analytics
- Comps within configurable radius (1-25 miles)
- Median and average price per acre
- Price range analysis
- Individual comp detail cards

### Opportunity Pipeline
- Project management with site tracking
- Pipeline statuses: New Lead → Screening → High Potential → Active Pursuit → Under Contract → Passed
- Three views: Map, Table (sortable), Kanban (drag-and-drop)
- Priority levels, tags, and notes per site

### Search & Filters
- Global search: address, APN, county, owner name
- Mapbox geocoding integration
- Parcel filters: acreage range, zoning type, county, assessed value range
- Saved searches

### Data Import & Export
- CSV import with lat/lon detection
- GeoJSON import with validation
- CSV export for parcels and project sites
- GeoJSON export for drawings
- Map screenshot export (PNG)

### Authentication
- Supabase Auth with email/password
- Magic link sign-in
- Protected routes with middleware
- Session persistence

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| State Management | Zustand (6 domain stores) |
| Maps | Mapbox GL JS + Mapbox Draw |
| Backend / Auth / DB | Supabase (PostgreSQL + PostGIS) |
| Deployment | Vercel |
| Source Control | GitHub |

## Project Structure

```
mapping-platform/
├── app/
│   ├── api/
│   │   ├── parcels/route.ts     # Parcel queries (viewport, search, by ID)
│   │   ├── comps/route.ts       # Sales comp queries
│   │   └── search/route.ts      # Unified search (parcels + geocoding)
│   ├── auth/
│   │   ├── login/page.tsx       # Login / signup page
│   │   └── callback/route.ts    # Magic link callback handler
│   ├── dashboard/page.tsx       # Dashboard overview
│   ├── projects/page.tsx        # Projects listing
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Main map view (hero)
│   └── globals.css              # Global styles
├── components/
│   ├── map/
│   │   ├── MapContainer.tsx     # Mapbox GL initialization & viewport management
│   │   ├── ParcelLayer.tsx      # Parcel GeoJSON source & layers
│   │   ├── DrawingTools.tsx     # Mapbox Draw integration
│   │   ├── BasemapSwitcher.tsx  # Basemap selection UI
│   │   ├── MapToolbar.tsx       # Drawing/measurement tool buttons
│   │   └── MapOverlays.tsx      # Coordinate display, scale, navigation
│   ├── panels/
│   │   ├── LeftPanel.tsx        # Search, filters, layer library, projects
│   │   ├── RightPanel.tsx       # Dynamic detail panel container
│   │   ├── ParcelDetailCard.tsx # Full parcel info, suitability, actions
│   │   ├── CompDetailCard.tsx   # Comp detail + analytics
│   │   └── FilterPanel.tsx      # Advanced filter controls
│   ├── projects/
│   │   ├── ProjectKanban.tsx    # Kanban board (drag-and-drop)
│   │   ├── ProjectTable.tsx     # Sortable data table
│   │   └── ProjectPanel.tsx     # Project detail with view toggle
│   ├── analytics/
│   │   ├── CompAnalyticsCard.tsx    # Comp summary statistics
│   │   ├── SuitabilityScore.tsx     # Circular score display
│   │   └── AIAnalysis.tsx           # AI parcel analysis sections
│   ├── layers/
│   │   └── LayerLibrary.tsx     # Collapsible layer category toggles
│   ├── import/
│   │   └── ImportModal.tsx      # File import (CSV, GeoJSON)
│   └── ui/
│       ├── Badge.tsx            # Status/label badges
│       ├── Modal.tsx            # Reusable modal dialog
│       └── Toggle.tsx           # Toggle switch component
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser Supabase client (singleton)
│   │   ├── server.ts            # Server-side admin client (bypasses RLS)
│   │   └── middleware.ts        # Server component auth helper
│   ├── mapbox/
│   │   └── config.ts            # Basemaps, colors, tokens, defaults
│   ├── geospatial/
│   │   ├── utils.ts             # Area, distance, formatting, GeoJSON helpers
│   │   └── suitability.ts       # Industrial suitability scoring engine
│   ├── queries/
│   │   ├── parcels.ts           # Parcel CRUD + viewport + search queries
│   │   ├── comps.ts             # Comp queries + analytics calculation
│   │   └── projects.ts          # Project, site, note, drawing, search CRUD
│   ├── stores/
│   │   ├── map-store.ts         # Map ref, viewport, basemap, flyTo
│   │   ├── layer-store.ts       # Layer visibility toggles
│   │   ├── parcel-store.ts      # Parcels, selection, hover, filters
│   │   ├── project-store.ts     # Projects, active project
│   │   ├── comp-store.ts        # Comps, selection, analytics, radius
│   │   └── ui-store.ts          # Panel state, active tool, search
│   └── import-export/
│       ├── csv-import.ts        # CSV parsing with lat/lon detection
│       ├── geojson-import.ts    # GeoJSON validation and parsing
│       └── export.ts            # CSV, GeoJSON, PNG export utilities
├── types/
│   ├── parcel.ts                # Parcel, ParcelFilters, ScoredParcel, BBox
│   ├── comps.ts                 # Comp, CompFilters, CompAnalytics
│   ├── project.ts               # Project, ProjectSite, Note, Drawing, etc.
│   ├── map.ts                   # BasemapStyle, LayerConfig, ViewportState
│   └── zoning.ts                # ZoningDistrict, FloodZone, InfrastructureAsset
├── db/
│   └── schema.sql               # Full database schema reference
├── scripts/
│   ├── seed-parcels.ts          # Parcel seed data reference
│   └── seed-comps.ts            # Comp seed data reference
├── middleware.ts                 # Auth middleware (protects routes)
├── .env.local                   # Environment variables (gitignored)
├── .env.example                 # Environment variable template
├── vercel.json                  # Vercel deployment config
└── tailwind.config.ts           # Tailwind configuration
```

## Local Development

### Prerequisites
- Node.js 18+
- npm
- A Supabase project with PostGIS enabled
- A Mapbox access token

### Setup

```bash
# Clone the repository
git clone https://github.com/bkbkline/mapping-platform.git
cd mapping-platform

# Install dependencies
npm install

# Copy environment template and fill in your values
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox GL access token |

## Supabase Setup

### 1. Enable PostGIS
In your Supabase dashboard, go to **Database > Extensions** and enable `postgis`.

### 2. Run Schema Migration
Execute the SQL in `db/schema.sql` via the Supabase SQL Editor. This creates:
- `parcels` — Industrial parcel records with geometry
- `comps` — Sales comparable transactions
- `zoning_districts` — Zoning boundary polygons
- `flood_zones` — FEMA flood zone polygons
- `industrial_parks` — Industrial park boundaries
- `infrastructure_assets` — Infrastructure point/line features
- `projects` — User project containers
- `project_sites` — Parcels linked to projects with pipeline status
- `notes` — Parcel notes
- `saved_searches` — Persisted filter configurations
- `drawings` — User-drawn map features
- `imported_datasets` — Imported file metadata

Plus spatial indexes (GiST), Row Level Security policies, and RPC functions for viewport-based spatial queries.

### 3. Seed Data
Seed realistic Inland Empire industrial parcels using the patterns in `scripts/seed-parcels.ts`.

## Mapbox Integration

1. Create a Mapbox account at [mapbox.com](https://www.mapbox.com)
2. Generate an access token with the following scopes: `styles:read`, `fonts:read`, `datasets:read`
3. Set `NEXT_PUBLIC_MAPBOX_TOKEN` in `.env.local`

## Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXT_PUBLIC_MAPBOX_TOKEN

# Deploy to production
vercel --prod
```

## Architecture

### Data Flow
```
User Interaction → Zustand Store → Supabase Query → PostGIS → Response → Map/Panel Update
```

### State Management (Zustand)
- **map-store** — Map instance ref, viewport state, basemap, flyTo/fitBounds actions
- **layer-store** — 22 layer visibility toggles
- **parcel-store** — Viewport parcels, selected parcel, hover state, filters
- **project-store** — Projects list, active project
- **comp-store** — Comps, analytics, radius, filters
- **ui-store** — Panel open/close, active tool, search query

### Spatial Query Pattern
All parcel/comp queries use viewport bounding boxes — never full dataset loads:
```sql
SELECT * FROM parcels
WHERE geom && ST_MakeEnvelope($west, $south, $east, $north, 4326)
LIMIT 5000;
```

### Component Architecture
```
App (page.tsx)
├── LeftPanel
│   ├── SearchBar → searchParcels()
│   ├── LayerLibrary → layer-store toggles
│   └── ProjectList → project-store
├── MapContainer
│   ├── ParcelLayer → parcel-store.parcels → GeoJSON source
│   ├── DrawingTools → MapboxDraw
│   ├── BasemapSwitcher → map-store.activeBasemap
│   ├── MapToolbar → ui-store.activeTool
│   └── MapOverlays → NavigationControl, ScaleControl
└── RightPanel (dynamic)
    ├── ParcelDetailCard → SuitabilityScore, Notes, Actions
    ├── CompDetailCard → CompAnalyticsCard
    └── ProjectPanel → Kanban | Table | Map view
```

## License

Private — Majestic Realty Co.
