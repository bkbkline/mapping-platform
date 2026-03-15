/** Pipeline status values */
export type PipelineStatus = 'New Lead' | 'Screening' | 'High Potential' | 'Active Pursuit' | 'Under Contract' | 'Passed';

/** Priority levels */
export type Priority = 'Low' | 'Medium' | 'High';

/** Project record (matches actual DB schema) */
export interface Project {
  id: string;
  org_id: string | null;
  created_by: string;
  name: string | null;
  description: string | null;
  status: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  sites?: ProjectSite[];
}

/** Project site (parcel linked to a project) */
export interface ProjectSite {
  id: string;
  project_id: string;
  parcel_id: string;
  name: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  parcel?: import('./parcel').Parcel;
}

/** Note on a project */
export interface Note {
  id: string;
  project_id: string;
  created_by: string;
  content: string | null;
  created_at: string;
  updated_at: string;
}

/** Saved search record */
export interface SavedSearch {
  id: string;
  created_by: string;
  name: string | null;
  filters: import('./parcel').ParcelFilters;
  created_at: string;
}

/** Drawing record */
export interface Drawing {
  id: string;
  map_id: string | null;
  created_by: string;
  geometry: GeoJSON.Geometry | null;
  properties: Record<string, unknown>;
  created_at: string;
}

/** Imported dataset record */
export interface ImportedDataset {
  id: string;
  org_id: string | null;
  created_by: string;
  name: string | null;
  source_file: string | null;
  layer_type: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}
