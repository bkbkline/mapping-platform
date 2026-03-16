import { create } from 'zustand';
import type { MapRef, ViewportState } from '@/types/map';
import type { BBox } from '@/types/parcel';

interface MapState {
  mapRef: MapRef;
  viewport: ViewportState;
  activeBasemap: string;
  activeMapId: string | null;
  setMapRef: (ref: MapRef) => void;
  setViewport: (viewport: Partial<ViewportState>) => void;
  setActiveBasemap: (basemap: string) => void;
  setActiveMapId: (id: string | null) => void;
  flyTo: (lng: number, lat: number, zoom?: number) => void;
  fitBounds: (bbox: BBox) => void;
}

/**
 * Zustand store for managing the Mapbox map instance, viewport state, and basemap selection.
 */
export const useMapStore = create<MapState>((set, get) => ({
  mapRef: null,

  viewport: {
    longitude: -117.9,
    latitude: 33.95,
    zoom: 10,
    bearing: 0,
    pitch: 0,
  },

  activeBasemap: 'streets',

  activeMapId: null,

  /**
   * Store the Mapbox map instance reference.
   * @param ref - The Mapbox Map instance or null
   */
  setMapRef: (ref) => set({ mapRef: ref }),

  /**
   * Update viewport state with a partial update.
   * @param viewport - Partial viewport properties to merge
   */
  setViewport: (viewport) =>
    set((state) => ({
      viewport: { ...state.viewport, ...viewport },
    })),

  /**
   * Set the active basemap style identifier.
   * @param basemap - The basemap style ID (e.g. 'streets', 'satellite')
   */
  setActiveBasemap: (basemap) => set({ activeBasemap: basemap }),

  /**
   * Set the active map ID for multi-map support.
   * @param id - The map ID to set as active, or null
   */
  setActiveMapId: (id) => set({ activeMapId: id }),

  /**
   * Animate the map camera to fly to a specific location.
   * @param lng - Longitude of the target location
   * @param lat - Latitude of the target location
   * @param zoom - Optional zoom level (defaults to current zoom)
   */
  flyTo: (lng, lat, zoom) => {
    const { mapRef, viewport } = get();
    if (mapRef) {
      mapRef.flyTo({
        center: [lng, lat],
        zoom: zoom ?? viewport.zoom,
      });
    }
  },

  /**
   * Fit the map view to a bounding box.
   * @param bbox - Bounding box as [west, south, east, north]
   */
  fitBounds: (bbox) => {
    const { mapRef } = get();
    if (mapRef) {
      mapRef.fitBounds(
        [
          [bbox[0], bbox[1]],
          [bbox[2], bbox[3]],
        ],
        { padding: 40 }
      );
    }
  },
}));
