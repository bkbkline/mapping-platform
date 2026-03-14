import { supabase } from '@/lib/supabase/client';
import type { Comp, CompFilters, CompAnalytics } from '@/types/comps';
import type { BBox } from '@/types/parcel';

/** Fetch comps within a bounding box */
export async function fetchCompsInViewport(bbox: BBox, limit = 2000): Promise<Comp[]> {
  const [west, south, east, north] = bbox;
  const { data, error } = await supabase.rpc('comps_in_viewport', {
    west, south, east, north, row_limit: limit,
  });
  if (error) {
    console.error('Error fetching comps:', error);
    return [];
  }
  return data ?? [];
}

/** Fetch comps within a radius (miles) of a point */
export async function fetchCompsNearPoint(
  lng: number,
  lat: number,
  radiusMiles: number = 5
): Promise<Comp[]> {
  const radiusMeters = radiusMiles * 1609.34;
  const { data, error } = await supabase.rpc('comps_near_point', {
    lng, lat, radius_meters: radiusMeters,
  });
  if (error) {
    console.error('Error fetching nearby comps:', error);
    return [];
  }
  return data ?? [];
}

/** Calculate comp analytics for a set of comps */
export function calculateCompAnalytics(comps: Comp[]): CompAnalytics {
  const withPpa = comps.filter(c => c.price_per_acre !== null);
  const ppas = withPpa.map(c => c.price_per_acre!).sort((a, b) => a - b);

  const median = ppas.length > 0
    ? ppas.length % 2 === 0
      ? (ppas[ppas.length / 2 - 1] + ppas[ppas.length / 2]) / 2
      : ppas[Math.floor(ppas.length / 2)]
    : 0;

  const average = ppas.length > 0
    ? ppas.reduce((sum, v) => sum + v, 0) / ppas.length
    : 0;

  return {
    total_count: comps.length,
    median_price_per_acre: median,
    average_price_per_acre: average,
    min_price_per_acre: ppas.length > 0 ? ppas[0] : 0,
    max_price_per_acre: ppas.length > 0 ? ppas[ppas.length - 1] : 0,
    comps,
  };
}

/** Fetch filtered comps */
export async function fetchFilteredComps(filters: CompFilters, limit = 500): Promise<Comp[]> {
  let query = supabase.from('comps').select('*');

  if (filters.sale_date_start) query = query.gte('sale_date', filters.sale_date_start);
  if (filters.sale_date_end) query = query.lte('sale_date', filters.sale_date_end);
  if (filters.price_min !== undefined) query = query.gte('sale_price', filters.price_min);
  if (filters.price_max !== undefined) query = query.lte('sale_price', filters.price_max);
  if (filters.price_per_acre_min !== undefined) query = query.gte('price_per_acre', filters.price_per_acre_min);
  if (filters.price_per_acre_max !== undefined) query = query.lte('price_per_acre', filters.price_per_acre_max);

  const { data, error } = await query.limit(limit);
  if (error) {
    console.error('Error fetching filtered comps:', error);
    return [];
  }
  return data ?? [];
}
