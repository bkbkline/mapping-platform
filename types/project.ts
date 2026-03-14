/** Pipeline status values */
export type PipelineStatus = 'New Lead' | 'Screening' | 'High Potential' | 'Active Pursuit' | 'Under Contract' | 'Passed';

/** Priority levels */
export type Priority = 'Low' | 'Medium' | 'High';

/** Project record */
export interface Project {
  id: string;
  user_id: string;
  name: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  sites?: ProjectSite[];
}

/** Project site (parcel linked to a project) */
export interface ProjectSite {
  id: string;
  project_id: string;
  parcel_id: string;
  status: PipelineStatus;
  priority: Priority;
  notes: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  parcel?: import('./parcel').Parcel;
}

/** Note on a parcel */
export interface Note {
  id: string;
  user_id: string;
  parcel_id: string;
  content: string | null;
  created_at: string;
}

/** Saved search record */
export interface SavedSearch {
  id: string;
  user_id: string;
  name: string | null;
  filters: import('./parcel').ParcelFilters;
  created_at: string;
}

/** Drawing record */
export interface Drawing {
  id: string;
  user_id: string;
  name: string | null;
  geom: GeoJSON.Geometry | null;
  properties: Record<string, unknown>;
  created_at: string;
}

/** Imported dataset record */
export interface ImportedDataset {
  id: string;
  user_id: string;
  name: string | null;
  file_type: string | null;
  row_count: number | null;
  geom_type: string | null;
  created_at: string;
}
