import { supabase } from '@/lib/supabase/client';
import type { Parcel, ParcelFilters, BBox } from '@/types/parcel';

/** Fetch parcels within a bounding box */
export async function fetchParcelsInViewport(bbox: BBox, limit = 5000): Promise<Parcel[]> {
  const { data, error } = await supabase
    .from('parcels')
    .select('*')
    .limit(limit);
  if (error) {
    console.error('Parcels viewport query failed:', error.message);
    return [];
  }
  return data ?? [];
}

/** Fetch a single parcel by ID */
export async function fetchParcelById(id: string): Promise<Parcel | null> {
  const { data, error } = await supabase
    .from('parcels')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    console.error('Error fetching parcel:', error);
    return null;
  }
  return data;
}

/** Search parcels by text query */
export async function searchParcels(query: string, limit = 50): Promise<Parcel[]> {
  const { data, error } = await supabase
    .from('parcels')
    .select('*')
    .or(`situs_address.ilike.%${query}%,apn.ilike.%${query}%,county.ilike.%${query}%,owner_name.ilike.%${query}%`)
    .limit(limit);
  if (error) {
    console.error('Error searching parcels:', error);
    return [];
  }
  return data ?? [];
}

/** Fetch filtered parcels */
export async function fetchFilteredParcels(filters: ParcelFilters, limit = 500): Promise<Parcel[]> {
  let query = supabase.from('parcels').select('*');

  if (filters.acreage_min !== undefined) query = query.gte('acreage', filters.acreage_min);
  if (filters.acreage_max !== undefined) query = query.lte('acreage', filters.acreage_max);
  if (filters.zoning_types?.length) query = query.in('zoning', filters.zoning_types);
  if (filters.county) query = query.eq('county', filters.county);
  if (filters.state_abbr) query = query.eq('state_abbr', filters.state_abbr);
  if (filters.assessed_value_min !== undefined) query = query.gte('assessed_value', filters.assessed_value_min);
  if (filters.assessed_value_max !== undefined) query = query.lte('assessed_value', filters.assessed_value_max);

  const { data, error } = await query.limit(limit);
  if (error) {
    console.error('Error fetching filtered parcels:', error);
    return [];
  }
  return data ?? [];
}
