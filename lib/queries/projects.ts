import { supabase } from '@/lib/supabase/client';
import type { Project, ProjectSite, Note, SavedSearch, Drawing } from '@/types/project';

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
    .insert({ name, description, created_by: user.id })
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
  parcelId: string
): Promise<ProjectSite | null> {
  const { data, error } = await supabase
    .from('project_sites')
    .insert({ project_id: projectId, parcel_id: parcelId })
    .select()
    .single();
  if (error) {
    console.error('Error adding site:', error);
    return null;
  }
  return data;
}

/** Update a project site metadata (status, priority stored in metadata JSON) */
export async function updateSiteStatus(siteId: string, status: string): Promise<boolean> {
  const { data: existing } = await supabase
    .from('project_sites')
    .select('metadata')
    .eq('id', siteId)
    .single();
  const metadata = { ...(existing?.metadata as Record<string, unknown> ?? {}), status };
  const { error } = await supabase
    .from('project_sites')
    .update({ metadata })
    .eq('id', siteId);
  return !error;
}

/** Update a project site priority */
export async function updateSitePriority(siteId: string, priority: string): Promise<boolean> {
  const { data: existing } = await supabase
    .from('project_sites')
    .select('metadata')
    .eq('id', siteId)
    .single();
  const metadata = { ...(existing?.metadata as Record<string, unknown> ?? {}), priority };
  const { error } = await supabase
    .from('project_sites')
    .update({ metadata })
    .eq('id', siteId);
  return !error;
}

/** Add a note to a project */
export async function addNote(projectId: string, content: string): Promise<Note | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('notes')
    .insert({ project_id: projectId, content, created_by: user.id })
    .select()
    .single();
  if (error) {
    console.error('Error adding note:', error);
    return null;
  }
  return data;
}

/** Fetch notes for a project */
export async function fetchNotes(projectId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('project_id', projectId)
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
    .insert({ name, filters, created_by: user.id })
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
export async function saveDrawing(geometry: GeoJSON.Geometry, properties: Record<string, unknown> = {}): Promise<Drawing | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('drawings')
    .insert({ geometry: geometry as unknown as string, properties, created_by: user.id })
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
