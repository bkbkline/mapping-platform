import * as turf from '@turf/turf';
import type { BBox } from '@/types/parcel';

/** Convert map bounds to a bounding box array */
export function mapBoundsToBBox(bounds: mapboxgl.LngLatBounds): BBox {
  return [
    bounds.getWest(),
    bounds.getSouth(),
    bounds.getEast(),
    bounds.getNorth(),
  ];
}

/** Calculate area of a polygon in acres */
export function calculateAreaAcres(geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon): number {
  const area = turf.area(turf.feature(geometry));
  return area / 4046.86; // sq meters to acres
}

/** Calculate distance between two points in miles */
export function calculateDistanceMiles(
  from: [number, number],
  to: [number, number]
): number {
  return turf.distance(turf.point(from), turf.point(to), { units: 'miles' });
}

/** Calculate the length of a line in miles */
export function calculateLineLengthMiles(geometry: GeoJSON.LineString): number {
  return turf.length(turf.feature(geometry), { units: 'miles' });
}

/** Format acreage for display */
export function formatAcreage(acres: number | null): string {
  if (acres === null) return 'N/A';
  return acres < 1 ? `${(acres * 43560).toFixed(0)} SF` : `${acres.toFixed(2)} AC`;
}

/** Format currency */
export function formatCurrency(value: number | null): string {
  if (value === null) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Format price per acre */
export function formatPricePerAcre(value: number | null): string {
  if (value === null) return 'N/A';
  return `${formatCurrency(value)}/AC`;
}

/** Convert GeoJSON features to a FeatureCollection */
export function toFeatureCollection(
  features: GeoJSON.Feature[]
): GeoJSON.FeatureCollection {
  return { type: 'FeatureCollection', features };
}

/** Get center point of a geometry */
export function getCenter(geometry: GeoJSON.Geometry): [number, number] {
  const center = turf.center(turf.feature(geometry));
  return center.geometry.coordinates as [number, number];
}

/** Check if a point is within a polygon */
export function pointInPolygon(
  point: [number, number],
  polygon: GeoJSON.Polygon
): boolean {
  return turf.booleanPointInPolygon(turf.point(point), turf.polygon(polygon.coordinates));
}

/** Buffer a geometry by a given radius in miles */
export function bufferMiles(
  geometry: GeoJSON.Geometry,
  radiusMiles: number
): GeoJSON.Feature<GeoJSON.Polygon> {
  return turf.buffer(turf.feature(geometry), radiusMiles, { units: 'miles' }) as GeoJSON.Feature<GeoJSON.Polygon>;
}
