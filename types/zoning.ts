/** Zoning district record */
export interface ZoningDistrict {
  id: string;
  name: string | null;
  code: string | null;
  jurisdiction: string | null;
  geom: GeoJSON.Polygon | null;
}

/** Flood zone record */
export interface FloodZone {
  id: string;
  fema_zone: string | null;
  geom: GeoJSON.Polygon | null;
}

/** Infrastructure asset record */
export interface InfrastructureAsset {
  id: string;
  type: string | null;
  name: string | null;
  geom: GeoJSON.Geometry | null;
}

/** Industrial park record */
export interface IndustrialPark {
  id: string;
  name: string | null;
  city: string | null;
  total_sf: number | null;
  geom: GeoJSON.Polygon | null;
}
