-- =============================================================================
-- Majestic Maps - Full Database Schema
-- Industrial Land Mapping Platform
-- =============================================================================
-- This file is for documentation/reference purposes.
-- The actual schema is managed via Supabase migrations.
-- =============================================================================

-- Enable PostGIS extension for geospatial support
CREATE EXTENSION IF NOT EXISTS postgis;

-- =============================================================================
-- PARCELS
-- =============================================================================

CREATE TABLE IF NOT EXISTS parcels (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apn           TEXT,
  address       TEXT,
  city          TEXT,
  county        TEXT,
  jurisdiction  TEXT,
  acreage       NUMERIC,
  zoning        TEXT,
  land_use      TEXT,
  owner_name    TEXT,
  mailing_address TEXT,
  assessed_land_value       NUMERIC,
  assessed_improvement_value NUMERIC,
  last_sale_price  NUMERIC,
  last_sale_date   DATE,
  flood_zone       TEXT,
  opportunity_zone BOOLEAN DEFAULT FALSE,
  geom          GEOMETRY(Polygon, 4326),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parcels_geom ON parcels USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_parcels_apn ON parcels (apn);
CREATE INDEX IF NOT EXISTS idx_parcels_city ON parcels (city);
CREATE INDEX IF NOT EXISTS idx_parcels_zoning ON parcels (zoning);
CREATE INDEX IF NOT EXISTS idx_parcels_acreage ON parcels (acreage);
CREATE INDEX IF NOT EXISTS idx_parcels_jurisdiction ON parcels (jurisdiction);

ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parcels are viewable by all authenticated users"
  ON parcels FOR SELECT
  TO authenticated
  USING (true);

-- =============================================================================
-- COMPS (Sales Comparables)
-- =============================================================================

CREATE TABLE IF NOT EXISTS comps (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address       TEXT,
  sale_price    NUMERIC,
  sale_date     DATE,
  lot_size      NUMERIC,
  building_sf   NUMERIC,
  price_per_acre NUMERIC,
  buyer         TEXT,
  seller        TEXT,
  geom          GEOMETRY(Point, 4326),
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comps_geom ON comps USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_comps_sale_date ON comps (sale_date);
CREATE INDEX IF NOT EXISTS idx_comps_price_per_acre ON comps (price_per_acre);

ALTER TABLE comps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comps are viewable by all authenticated users"
  ON comps FOR SELECT
  TO authenticated
  USING (true);

-- =============================================================================
-- PROJECTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name          TEXT,
  description   TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects (user_id);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================================================
-- PROJECT SITES (parcels linked to projects)
-- =============================================================================

CREATE TABLE IF NOT EXISTS project_sites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  parcel_id     UUID REFERENCES parcels(id) ON DELETE CASCADE NOT NULL,
  status        TEXT DEFAULT 'New Lead' CHECK (
    status IN ('New Lead', 'Screening', 'High Potential', 'Active Pursuit', 'Under Contract', 'Passed')
  ),
  priority      TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
  notes         TEXT,
  tags          TEXT[] DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_sites_project_id ON project_sites (project_id);
CREATE INDEX IF NOT EXISTS idx_project_sites_parcel_id ON project_sites (parcel_id);

ALTER TABLE project_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sites in their projects"
  ON project_sites FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = project_sites.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert sites in their projects"
  ON project_sites FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = project_sites.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update sites in their projects"
  ON project_sites FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = project_sites.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete sites in their projects"
  ON project_sites FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = project_sites.project_id AND projects.user_id = auth.uid()
    )
  );

-- =============================================================================
-- NOTES
-- =============================================================================

CREATE TABLE IF NOT EXISTS notes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  parcel_id     UUID REFERENCES parcels(id) ON DELETE CASCADE NOT NULL,
  content       TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes (user_id);
CREATE INDEX IF NOT EXISTS idx_notes_parcel_id ON notes (parcel_id);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notes"
  ON notes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes"
  ON notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON notes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================================================
-- SAVED SEARCHES
-- =============================================================================

CREATE TABLE IF NOT EXISTS saved_searches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name          TEXT,
  filters       JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches (user_id);

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved searches"
  ON saved_searches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved searches"
  ON saved_searches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved searches"
  ON saved_searches FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================================================
-- DRAWINGS (user-created geometries)
-- =============================================================================

CREATE TABLE IF NOT EXISTS drawings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name          TEXT,
  geom          GEOMETRY(Geometry, 4326),
  properties    JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drawings_user_id ON drawings (user_id);
CREATE INDEX IF NOT EXISTS idx_drawings_geom ON drawings USING GIST (geom);

ALTER TABLE drawings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own drawings"
  ON drawings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own drawings"
  ON drawings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drawings"
  ON drawings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drawings"
  ON drawings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================================================
-- IMPORTED DATASETS
-- =============================================================================

CREATE TABLE IF NOT EXISTS imported_datasets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  name          TEXT,
  file_type     TEXT,
  row_count     INTEGER,
  geom_type     TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_imported_datasets_user_id ON imported_datasets (user_id);

ALTER TABLE imported_datasets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own imported datasets"
  ON imported_datasets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own imported datasets"
  ON imported_datasets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own imported datasets"
  ON imported_datasets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_parcels_updated_at
  BEFORE UPDATE ON parcels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_project_sites_updated_at
  BEFORE UPDATE ON project_sites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
