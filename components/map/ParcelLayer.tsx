'use client';

import { useEffect, useRef } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import { useParcelStore } from '@/lib/stores/parcel-store';
import { useLayerStore } from '@/lib/stores/layer-store';
import { ZONING_COLORS } from '@/lib/mapbox/config';
import type { Parcel, ParcelFeature } from '@/types/parcel';

/** Source and layer identifiers used on the map */
const SOURCE_ID = 'parcels-source';
const FILL_LAYER = 'parcels-fill';
const OUTLINE_LAYER = 'parcels-outline';
const LABELS_LAYER = 'parcels-labels';

/** Default fill color for parcels without a mapped zoning code */
const DEFAULT_FILL_COLOR = '#6B7280';

/** Selected parcel highlight color */
const SELECTED_FILL_COLOR = '#F59E0B';
const SELECTED_BORDER_COLOR = '#D97706';

interface ParcelLayerProps {
  /** The active Mapbox GL map instance */
  map: MapboxMap;
}

/**
 * Build a Mapbox data-driven color expression from the ZONING_COLORS config.
 * Falls back to a default gray when the zoning code is unrecognized.
 */
function buildZoningColorExpression(): mapboxgl.Expression {
  const stops: (string)[] = [];
  for (const [code, color] of Object.entries(ZONING_COLORS)) {
    stops.push(code, color);
  }
  return ['match', ['get', 'zoning'], ...stops, DEFAULT_FILL_COLOR];
}

/**
 * Convert an array of Parcel records into a GeoJSON FeatureCollection
 * suitable for the parcels map source.
 */
function parcelsToGeoJSON(parcels: Parcel[]): GeoJSON.FeatureCollection {
  const features: ParcelFeature[] = [];

  for (const parcel of parcels) {
    if (!parcel.geometry) continue;

    const { geometry, ...properties } = parcel;
    features.push({
      type: 'Feature',
      id: parcel.id,
      geometry,
      properties,
    } as ParcelFeature);
  }

  return { type: 'FeatureCollection', features };
}

/**
 * ParcelLayer manages the parcel GeoJSON source and map layers.
 * It renders parcel fill, outline, and label layers with data-driven
 * zoning colors, hover effects via feature-state, and selected-parcel
 * highlighting.
 *
 * @param props.map - The active Mapbox GL Map instance
 */
export function ParcelLayer({ map }: ParcelLayerProps) {
  const parcels = useParcelStore((s) => s.parcels);
  const selectedParcel = useParcelStore((s) => s.selectedParcel);
  const layers = useLayerStore((s) => s.layers);
  const initializedRef = useRef(false);

  // Add source and layers to map
  useEffect(() => {
    if (initializedRef.current) return;

    const addSourceAndLayers = () => {
      // Don't add if source already exists (e.g., from a style reload)
      if (map.getSource(SOURCE_ID)) return;

      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        promoteId: 'id',
      });

      // Fill layer with hover and selected state support
      map.addLayer({
        id: FILL_LAYER,
        type: 'fill',
        source: SOURCE_ID,
        paint: {
          'fill-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            SELECTED_FILL_COLOR,
            buildZoningColorExpression(),
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.55,
            ['boolean', ['feature-state', 'selected'], false],
            0.6,
            0.35,
          ],
        },
      });

      // Outline layer
      map.addLayer({
        id: OUTLINE_LAYER,
        type: 'line',
        source: SOURCE_ID,
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            SELECTED_BORDER_COLOR,
            '#374151',
          ],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            3,
            1,
          ],
          'line-opacity': 0.8,
        },
      });

      // Labels layer (APN text)
      map.addLayer({
        id: LABELS_LAYER,
        type: 'symbol',
        source: SOURCE_ID,
        layout: {
          'text-field': ['get', 'apn'],
          'text-size': 10,
          'text-allow-overlap': false,
          'text-ignore-placement': false,
          'text-max-width': 8,
          visibility: layers['parcel-labels'] ? 'visible' : 'none',
        },
        paint: {
          'text-color': '#1F2937',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 1.5,
        },
        minzoom: 15,
      });

      initializedRef.current = true;
    };

    // If map style is already loaded, add immediately
    if (map.isStyleLoaded()) {
      addSourceAndLayers();
    }

    // Re-add after style changes (basemap switch)
    const handleStyleLoad = () => {
      initializedRef.current = false;
      addSourceAndLayers();
      // Re-apply current data after style reload
      const source = map.getSource(SOURCE_ID);
      if (source && 'setData' in source) {
        const currentParcels = useParcelStore.getState().parcels;
        (source as mapboxgl.GeoJSONSource).setData(parcelsToGeoJSON(currentParcels));
      }
    };

    map.on('style.load', handleStyleLoad);

    return () => {
      map.off('style.load', handleStyleLoad);

      // Clean up layers and source
      if (map.getLayer(LABELS_LAYER)) map.removeLayer(LABELS_LAYER);
      if (map.getLayer(OUTLINE_LAYER)) map.removeLayer(OUTLINE_LAYER);
      if (map.getLayer(FILL_LAYER)) map.removeLayer(FILL_LAYER);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);

      initializedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // Update GeoJSON data when parcels change
  useEffect(() => {
    const source = map.getSource(SOURCE_ID);
    if (!source || !('setData' in source)) return;

    const geojson = parcelsToGeoJSON(parcels);
    (source as mapboxgl.GeoJSONSource).setData(geojson);
  }, [map, parcels]);

  // Update selected parcel feature-state
  useEffect(() => {
    if (!map.getSource(SOURCE_ID)) return;

    // Clear all selected states first
    for (const parcel of parcels) {
      map.setFeatureState(
        { source: SOURCE_ID, id: parcel.id },
        { selected: false }
      );
    }

    // Set selected state on the active parcel
    if (selectedParcel) {
      map.setFeatureState(
        { source: SOURCE_ID, id: selectedParcel.id },
        { selected: true }
      );
    }
  }, [map, parcels, selectedParcel]);

  // Toggle layer visibility based on layer store
  useEffect(() => {
    const parcelsVisible = layers['parcels'] ?? true;
    const labelsVisible = layers['parcel-labels'] ?? false;

    if (map.getLayer(FILL_LAYER)) {
      map.setLayoutProperty(FILL_LAYER, 'visibility', parcelsVisible ? 'visible' : 'none');
    }
    if (map.getLayer(OUTLINE_LAYER)) {
      map.setLayoutProperty(OUTLINE_LAYER, 'visibility', parcelsVisible ? 'visible' : 'none');
    }
    if (map.getLayer(LABELS_LAYER)) {
      map.setLayoutProperty(LABELS_LAYER, 'visibility', labelsVisible ? 'visible' : 'none');
    }
  }, [map, layers]);

  // This component only manages map layers; it renders nothing to the DOM.
  return null;
}
