/** Geographic bounding box [west, south, east, north] */
export type BBox = [number, number, number, number];

/** Parcel record from Supabase */
export interface Parcel {
  id: string;
  org_id: string | null;
  apn: string | null;
  county: string | null;
  state_abbr: string | null;
  situs_address: string | null;
  owner_name: string | null;
  owner_mailing_address: string | null;
  acreage: number | null;
  assessed_value: number | null;
  land_use_code: string | null;
  zoning: string | null;
  zoning_description: string | null;
  legal_description: string | null;
  geometry: GeoJSON.Polygon | null;
  raw_attributes: Record<string, unknown>;
  data_source: string | null;
  data_date: string | null;
  created_at: string;
  updated_at: string;
}

/** Parcel with computed suitability score */
export interface ScoredParcel extends Parcel {
  suitability_score: number;
  score_breakdown: SuitabilityBreakdown;
}

/** Industrial suitability score breakdown */
export interface SuitabilityBreakdown {
  acreage_score: number;
  zoning_score: number;
  highway_proximity_score: number;
  rail_access_score: number;
  flood_zone_score: number;
  infrastructure_score: number;
}

/** Parcel filter criteria */
export interface ParcelFilters {
  acreage_min?: number;
  acreage_max?: number;
  zoning_types?: string[];
  county?: string;
  state_abbr?: string;
  assessed_value_min?: number;
  assessed_value_max?: number;
  search_query?: string;
}

/** GeoJSON Feature wrapping a Parcel */
export interface ParcelFeature extends GeoJSON.Feature<GeoJSON.Polygon> {
  properties: Omit<Parcel, 'geometry'>;
}
