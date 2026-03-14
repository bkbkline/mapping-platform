/** Sales comparable record */
export interface Comp {
  id: string;
  address: string | null;
  sale_price: number | null;
  sale_date: string | null;
  lot_size: number | null;
  building_sf: number | null;
  price_per_acre: number | null;
  buyer: string | null;
  seller: string | null;
  geom: GeoJSON.Point | null;
  created_at: string;
}

/** Comp filter criteria */
export interface CompFilters {
  sale_date_start?: string;
  sale_date_end?: string;
  price_min?: number;
  price_max?: number;
  price_per_acre_min?: number;
  price_per_acre_max?: number;
}

/** Comp analytics summary for a location */
export interface CompAnalytics {
  total_count: number;
  median_price_per_acre: number;
  average_price_per_acre: number;
  min_price_per_acre: number;
  max_price_per_acre: number;
  comps: Comp[];
}
