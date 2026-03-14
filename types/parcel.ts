/** Geographic bounding box [west, south, east, north] */
export type BBox = [number, number, number, number];

/** Parcel record from Supabase */
export interface Parcel {
  id: string;
  apn: string | null;
  address: string | null;
  city: string | null;
  county: string | null;
  jurisdiction: string | null;
  acreage: number | null;
  zoning: string | null;
  land_use: string | null;
  owner_name: string | null;
  mailing_address: string | null;
  assessed_land_value: number | null;
  assessed_improvement_value: number | null;
  last_sale_price: number | null;
  last_sale_date: string | null;
  flood_zone: string | null;
  opportunity_zone: boolean;
  geom: GeoJSON.Polygon | null;
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
  jurisdiction?: string;
  flood_zone?: string;
  opportunity_zone?: boolean;
  assessed_value_min?: number;
  assessed_value_max?: number;
  search_query?: string;
}

/** GeoJSON Feature wrapping a Parcel */
export interface ParcelFeature extends GeoJSON.Feature<GeoJSON.Polygon> {
  properties: Omit<Parcel, 'geom'>;
}
