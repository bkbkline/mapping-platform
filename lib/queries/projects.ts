import { supabase } from '@/lib/supabase/client';
import type { Project, ProjectSite, Note, SavedSearch, Drawing } from '@/types/project';
import type { PipelineStatus, Priority } from '@/types/project';

/** Fetch all projects for the current user */
export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*, sites:project_sites(*, parcel:parcels(*))')
    .order('updated_at', { ascending: false });
  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
  return data ?? [];
}

/** Create a new project */
export async function createProject(name: string, description: string): Promise<Project | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('projects')
    .insert({ name, description, user_id: user.id })
    .select()
    .single();
  if (error) {
    console.error('Error creating project:', error);
    return null;
  }
  return data;
}

/** Add a parcel to a project */
export async function addSiteToProject(
  projectId: string,
  parcelId: string,
  status: PipelineStatus = 'New Lead',
  priority: Priority = 'Medium'
): Promise<ProjectSite | null> {
  const { data, error } = await supabase
    .from('project_sites')
    .insert({ project_id: projectId, parcel_id: parcelId, status, priority })
    .select()
    .single();
  if (error) {
    console.error('Error adding site:', error);
    return null;
  }
  return data;
}

/** Update a project site status */
export async function updateSiteStatus(siteId: string, status: PipelineStatus): Promise<boolean> {
  const { error } = await supabase
    .from('project_sites')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', siteId);
  return !error;
}

/** Update a project site priority */
export async function updateSitePriority(siteId: string, priority: Priority): Promise<boolean> {
  const { error } = await supabase
    .from('project_sites')
    .update({ priority, updated_at: new Date().toISOString() })
    .eq('id', siteId);
  return !error;
}

/** Add a note to a parcel */
export async function addNote(parcelId: string, content: string): Promise<Note | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('notes')
    .insert({ parcel_id: parcelId, content, user_id: user.id })
    .select()
    .single();
  if (error) {
    console.error('Error adding note:', error);
    return null;
  }
  return data;
}

/** Fetch notes for a parcel */
export async function fetchNotes(parcelId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('parcel_id', parcelId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching notes:', error);
    return [];
  }
  return data ?? [];
}

/** Save a search */
export async function saveSearch(name: string, filters: Record<string, unknown>): Promise<SavedSearch | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('saved_searches')
    .insert({ name, filters, user_id: user.id })
    .select()
    .single();
  if (error) {
    console.error('Error saving search:', error);
    return null;
  }
  return data;
}

/** Fetch saved searches */
export async function fetchSavedSearches(): Promise<SavedSearch[]> {
  const { data, error } = await supabase
    .from('saved_searches')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching saved searches:', error);
    return [];
  }
  return data ?? [];
}

/** Save a drawing */
export async function saveDrawing(name: string, geom: GeoJSON.Geometry, properties: Record<string, unknown> = {}): Promise<Drawing | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('drawings')
    .insert({ name, geom: geom as unknown as string, properties, user_id: user.id })
    .select()
    .single();
  if (error) {
    console.error('Error saving drawing:', error);
    return null;
  }
  return data;
}

/** Fetch drawings */
export async function fetchDrawings(): Promise<Drawing[]> {
  const { data, error } = await supabase
    .from('drawings')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching drawings:', error);
    return [];
  }
  return data ?? [];
}
