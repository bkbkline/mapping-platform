import { create } from 'zustand';

interface LayerState {
  layers: Record<string, boolean>;
  toggleLayer: (id: string) => void;
  setLayerVisibility: (id: string, visible: boolean) => void;
  getVisibleLayers: () => string[];
}

const DEFAULT_LAYERS: Record<string, boolean> = {
  parcels: true,
  'parcel-labels': false,
  zoning: false,
  'flood-zones': false,
  'opportunity-zones': false,
  highways: false,
  'rail-lines': false,
  'industrial-parks': false,
  comps: true,
  infrastructure: false,
  'city-boundaries': false,
  'county-boundaries': false,
  'land-use': false,
  wetlands: false,
  terrain: false,
  'truck-routes': false,
  airports: false,
  'transmission-lines': false,
  substations: false,
  'water-service': false,
  'sewer-service': false,
  warehouses: false,
  'development-projects': false,
};

/**
 * Zustand store for managing map layer visibility state.
 */
export const useLayerStore = create<LayerState>((set, get) => ({
  layers: { ...DEFAULT_LAYERS },

  /**
   * Toggle the visibility of a layer by its ID.
   * @param id - The layer identifier to toggle
   */
  toggleLayer: (id) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [id]: !state.layers[id],
      },
    })),

  /**
   * Explicitly set the visibility of a layer.
   * @param id - The layer identifier
   * @param visible - Whether the layer should be visible
   */
  setLayerVisibility: (id, visible) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [id]: visible,
      },
    })),

  /**
   * Get an array of all currently visible layer IDs.
   * @returns Array of visible layer ID strings
   */
  getVisibleLayers: () => {
    const { layers } = get();
    return Object.entries(layers)
      .filter(([, visible]) => visible)
      .map(([id]) => id);
  },
}));
