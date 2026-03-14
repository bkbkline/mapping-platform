import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

interface GeocodingFeature {
  id: string;
  place_name: string;
  center: [number, number];
  place_type: string[];
}

interface GeocodingResponse {
  features: GeocodingFeature[];
}

interface ParcelResult {
  id: string;
  address: string | null;
  apn: string | null;
  city: string | null;
  owner_name: string | null;
}

interface SearchResult {
  type: 'parcel' | 'geocode';
  id: string;
  label: string;
  sublabel: string | null;
  center: [number, number] | null;
}

/**
 * GET /api/search?q=<query>
 *
 * Unified search endpoint that queries both the parcels database and the
 * Mapbox Geocoding API. Returns combined results sorted by source type.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ results: [] });
  }

  const trimmed = query.trim();

  // Run parcel search and geocoding in parallel
  const [parcelResults, geocodeResults] = await Promise.all([
    searchParcels(trimmed),
    searchGeocode(trimmed),
  ]);

  const results: SearchResult[] = [
    ...parcelResults,
    ...geocodeResults,
  ];

  return NextResponse.json({ results });
}

/** Search parcels by address, APN, city, or owner name. */
async function searchParcels(query: string): Promise<SearchResult[]> {
  const { data, error } = await supabaseAdmin
    .from('parcels')
    .select('id, address, apn, city, owner_name')
    .or(
      `address.ilike.%${query}%,apn.ilike.%${query}%,city.ilike.%${query}%,owner_name.ilike.%${query}%`
    )
    .limit(20);

  if (error || !data) return [];

  return (data as ParcelResult[]).map((parcel) => ({
    type: 'parcel' as const,
    id: parcel.id,
    label: parcel.address ?? parcel.apn ?? 'Unknown Parcel',
    sublabel: [parcel.city, parcel.owner_name].filter(Boolean).join(' - '),
    center: null,
  }));
}

/** Search Mapbox Geocoding API for address/place results. */
async function searchGeocode(query: string): Promise<SearchResult[]> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return [];

  try {
    const url = new URL(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`
    );
    url.searchParams.set('access_token', token);
    url.searchParams.set('limit', '5');
    url.searchParams.set('country', 'us');
    url.searchParams.set('types', 'address,place,locality,neighborhood');

    const response = await fetch(url.toString());
    if (!response.ok) return [];

    const data = (await response.json()) as GeocodingResponse;

    return data.features.map((feature) => ({
      type: 'geocode' as const,
      id: feature.id,
      label: feature.place_name,
      sublabel: feature.place_type.join(', '),
      center: feature.center,
    }));
  } catch {
    return [];
  }
}
