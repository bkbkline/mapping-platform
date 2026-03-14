import { create } from 'zustand';
import type { Parcel, ParcelFilters } from '@/types/parcel';

interface ParcelState {
  parcels: Parcel[];
  selectedParcel: Parcel | null;
  hoveredParcelId: string | null;
  filters: ParcelFilters;
  loading: boolean;
  setParcels: (parcels: Parcel[]) => void;
  setSelectedParcel: (parcel: Parcel | null) => void;
  setHoveredParcelId: (id: string | null) => void;
  setFilters: (filters: Partial<ParcelFilters>) => void;
  setLoading: (loading: boolean) => void;
  clearSelection: () => void;
}

/**
 * Zustand store for managing parcel data, selection, hover state, and filters.
 */
export const useParcelStore = create<ParcelState>((set) => ({
  parcels: [],
  selectedParcel: null,
  hoveredParcelId: null,
  filters: {},
  loading: false,

  /**
   * Replace the current viewport parcels array.
   * @param parcels - Array of parcel records to display
   */
  setParcels: (parcels) => set({ parcels }),

  /**
   * Set the currently selected parcel (shown in detail panel).
   * @param parcel - The parcel to select, or null to deselect
   */
  setSelectedParcel: (parcel) => set({ selectedParcel: parcel }),

  /**
   * Set the ID of the parcel currently being hovered on the map.
   * @param id - The hovered parcel ID, or null when not hovering
   */
  setHoveredParcelId: (id) => set({ hoveredParcelId: id }),

  /**
   * Merge partial filter criteria into the current filters.
   * @param filters - Partial filter values to merge
   */
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  /**
   * Set the loading state for parcel data fetches.
   * @param loading - Whether parcels are currently loading
   */
  setLoading: (loading) => set({ loading }),

  /**
   * Clear the selected parcel and hovered parcel state.
   */
  clearSelection: () =>
    set({ selectedParcel: null, hoveredParcelId: null }),
}));
