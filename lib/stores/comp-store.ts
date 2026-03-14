import { create } from 'zustand';
import type { Comp, CompFilters, CompAnalytics } from '@/types/comps';

interface CompState {
  comps: Comp[];
  selectedComp: Comp | null;
  analytics: CompAnalytics | null;
  filters: CompFilters;
  radiusMiles: number;
  setComps: (comps: Comp[]) => void;
  setSelectedComp: (comp: Comp | null) => void;
  setAnalytics: (analytics: CompAnalytics | null) => void;
  setFilters: (filters: Partial<CompFilters>) => void;
  setRadiusMiles: (radius: number) => void;
}

/**
 * Zustand store for managing sales comparable data, selection, analytics, and search filters.
 */
export const useCompStore = create<CompState>((set) => ({
  comps: [],
  selectedComp: null,
  analytics: null,
  filters: {},
  radiusMiles: 5,

  /**
   * Replace the current array of comparable sales.
   * @param comps - Array of comp records
   */
  setComps: (comps) => set({ comps }),

  /**
   * Set the currently selected comparable sale.
   * @param comp - The comp to select, or null to deselect
   */
  setSelectedComp: (comp) => set({ selectedComp: comp }),

  /**
   * Set the comp analytics summary (median, average, range, etc.).
   * @param analytics - The analytics object, or null to clear
   */
  setAnalytics: (analytics) => set({ analytics }),

  /**
   * Merge partial filter criteria into the current comp filters.
   * @param filters - Partial filter values to merge
   */
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  /**
   * Set the search radius in miles for comp queries.
   * @param radius - Radius in miles
   */
  setRadiusMiles: (radius) => set({ radiusMiles: radius }),
}));
