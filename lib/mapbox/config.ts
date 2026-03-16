import type { BasemapStyle } from '@/types/map';

/** Mapbox access token */
export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

/** Default map center (Reno NV industrial corridor) */
export const DEFAULT_CENTER: [number, number] = [-119.8138, 39.5296];

/** Default zoom level */
export const DEFAULT_ZOOM = 11;

/** Available basemap styles */
export const BASEMAPS: BasemapStyle[] = [
  {
    id: 'streets',
    name: 'Streets',
    url: 'mapbox://styles/mapbox/streets-v12',
    thumbnail: '/basemaps/streets.png',
  },
  {
    id: 'satellite',
    name: 'Satellite',
    url: 'mapbox://styles/mapbox/satellite-v9',
    thumbnail: '/basemaps/satellite.png',
  },
  {
    id: 'hybrid',
    name: 'Hybrid',
    url: 'mapbox://styles/mapbox/satellite-streets-v12',
    thumbnail: '/basemaps/hybrid.png',
  },
  {
    id: 'light',
    name: 'Light',
    url: 'mapbox://styles/mapbox/light-v11',
    thumbnail: '/basemaps/light.png',
  },
];

/** Minimum zoom level to load parcels */
export const PARCEL_MIN_ZOOM = 8;

/** Maximum features per viewport query */
export const MAX_VIEWPORT_FEATURES = 5000;

/** Zoning color map */
export const ZONING_COLORS: Record<string, string> = {
  'M-1': '#8B5CF6',
  'M-2': '#7C3AED',
  'M-3': '#6D28D9',
  'C-1': '#3B82F6',
  'C-2': '#2563EB',
  'C-3': '#1D4ED8',
  'I-1': '#F59E0B',
  'I-2': '#D97706',
  'I-3': '#B45309',
  'R-1': '#10B981',
  'R-2': '#059669',
  'R-3': '#047857',
  'MU': '#EC4899',
  'PD': '#8B5CF6',
  'OS': '#22C55E',
  'AG': '#84CC16',
};

/** Flood zone color map */
export const FLOOD_ZONE_COLORS: Record<string, string> = {
  'A': '#1E40AF',
  'AE': '#1E3A8A',
  'AH': '#1E3A8A',
  'AO': '#2563EB',
  'V': '#7C3AED',
  'VE': '#6D28D9',
  'X': '#D1D5DB',
  'X500': '#9CA3AF',
};

/** Pipeline status colors */
export const STATUS_COLORS: Record<string, string> = {
  'New Lead': '#6B7280',
  'Screening': '#3B82F6',
  'High Potential': '#F59E0B',
  'Active Pursuit': '#10B981',
  'Under Contract': '#8B5CF6',
  'Passed': '#EF4444',
};
