import type { Map as MapboxMap } from 'mapbox-gl';

/** Basemap style configuration */
export interface BasemapStyle {
  id: string;
  name: string;
  url: string;
  thumbnail: string;
}

/** Layer category in the layer library */
export interface LayerCategory {
  id: string;
  name: string;
  layers: LayerConfig[];
}

/** Individual layer configuration */
export interface LayerConfig {
  id: string;
  name: string;
  icon: string;
  visible: boolean;
  source?: string;
  type: 'fill' | 'line' | 'circle' | 'symbol' | 'raster';
  paint?: Record<string, unknown>;
}

/** Map viewport state */
export interface ViewportState {
  latitude: number;
  longitude: number;
  zoom: number;
  bearing: number;
  pitch: number;
}

/** Measurement result */
export interface MeasurementResult {
  type: 'distance' | 'area';
  value: number;
  unit: string;
  geometry: GeoJSON.Geometry;
}

/** Map ref type */
export type MapRef = MapboxMap | null;
