'use client';

import { useState, useCallback, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { useUIStore } from '@/lib/stores/ui-store';
import { useLayerStore } from '@/lib/stores/layer-store';
import { useParcelStore } from '@/lib/stores/parcel-store';
import { useMapStore } from '@/lib/stores/map-store';
import { useProjectStore } from '@/lib/stores/project-store';
import { searchParcels } from '@/lib/queries/parcels';
import { fetchSavedSearches } from '@/lib/queries/projects';
import { getCenter } from '@/lib/geospatial/utils';
import type { Parcel } from '@/types/parcel';
import type { SavedSearch } from '@/types/project';
import type { ParcelFilters } from '@/types/parcel';

/** Layer definition for the layer library */
interface LayerItem {
  id: string;
  icon: string;
  label: string;
}

/** Layer category definition */
interface LayerCategoryDef {
  id: string;
  name: string;
  layers: LayerItem[];
}

const LAYER_CATEGORIES: LayerCategoryDef[] = [
  {
    id: 'base-land',
    name: 'Base Land',
    layers: [
      { id: 'parcels', icon: '\u{1F4CD}', label: 'Parcels' },
      { id: 'parcel-labels', icon: '\u{1F3F7}\uFE0F', label: 'Parcel Labels' },
      { id: 'city-boundaries', icon: '\u{1F3D9}\uFE0F', label: 'City Boundaries' },
      { id: 'county-boundaries', icon: '\u{1F5FA}\uFE0F', label: 'County Boundaries' },
      { id: 'zoning', icon: '\u{1F3D7}\uFE0F', label: 'Zoning' },
      { id: 'land-use', icon: '\u{1F33F}', label: 'Land Use' },
      { id: 'opportunity-zones', icon: '\u2B50', label: 'Opportunity Zones' },
    ],
  },
  {
    id: 'environmental',
    name: 'Environmental',
    layers: [
      { id: 'flood-zones', icon: '\u{1F30A}', label: 'FEMA Flood Zones' },
      { id: 'wetlands', icon: '\u{1F33E}', label: 'Wetlands' },
      { id: 'terrain', icon: '\u26F0\uFE0F', label: 'Terrain Shading' },
    ],
  },
  {
    id: 'transportation',
    name: 'Transportation',
    layers: [
      { id: 'highways', icon: '\u{1F6E3}\uFE0F', label: 'Highways' },
      { id: 'truck-routes', icon: '\u{1F69A}', label: 'Truck Routes' },
      { id: 'rail-lines', icon: '\u{1F682}', label: 'Rail Lines' },
      { id: 'airports', icon: '\u2708\uFE0F', label: 'Airports' },
    ],
  },
  {
    id: 'infrastructure',
    name: 'Infrastructure',
    layers: [
      { id: 'transmission-lines', icon: '\u26A1', label: 'Transmission Lines' },
      { id: 'substations', icon: '\u{1F50C}', label: 'Substations' },
      { id: 'water-service', icon: '\u{1F4A7}', label: 'Water Service' },
      { id: 'sewer-service', icon: '\u{1F6B0}', label: 'Sewer Service' },
    ],
  },
  {
    id: 'market-intelligence',
    name: 'Market Intelligence',
    layers: [
      { id: 'industrial-parks', icon: '\u{1F3ED}', label: 'Industrial Parks' },
      { id: 'warehouses', icon: '\u{1F4E6}', label: 'Warehouses' },
      { id: 'comps', icon: '\u{1F4B0}', label: 'Comps' },
      { id: 'development-projects', icon: '\u{1F477}', label: 'Development Projects' },
    ],
  },
];

/**
 * Collapsible section wrapper with a chevron toggle header.
 */
function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-700">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
      >
        <span>{title}</span>
        <svg
          className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}

/**
 * Toggle switch component for layer visibility.
 */
function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
        checked ? 'bg-blue-500' : 'bg-gray-600'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

/**
 * LeftPanel - The left sidebar panel for the mapping platform.
 *
 * Contains search bar, saved searches, active filters, layer library,
 * and projects sections. 320px wide, full height, dark theme.
 */
export default function LeftPanel() {
  const { leftPanelOpen, searchQuery, setSearchQuery } = useUIStore();
  const { layers, toggleLayer } = useLayerStore();
  const { filters, setFilters, setSelectedParcel } = useParcelStore();
  const { flyTo } = useMapStore();
  const { openRightPanel } = useUIStore();
  const { projects, activeProject, setActiveProject } = useProjectStore();

  const [searchResults, setSearchResults] = useState<Parcel[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  // Load saved searches on mount
  useEffect(() => {
    fetchSavedSearches().then(setSavedSearches);
  }, []);

  const handleSearchChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    [setSearchQuery]
  );

  const handleSearchSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!searchQuery.trim()) return;
      setSearching(true);
      try {
        const results = await searchParcels(searchQuery.trim());
        setSearchResults(results);
        setShowResults(true);
      } finally {
        setSearching(false);
      }
    },
    [searchQuery]
  );

  const handleSelectResult = useCallback(
    (parcel: Parcel) => {
      setSelectedParcel(parcel);
      openRightPanel('parcel');
      setShowResults(false);
      if (parcel.geometry) {
        const [lng, lat] = getCenter(parcel.geometry);
        flyTo(lng, lat, 16);
      }
    },
    [setSelectedParcel, openRightPanel, flyTo]
  );

  const handleApplySavedSearch = useCallback(
    (search: SavedSearch) => {
      setFilters(search.filters as Partial<ParcelFilters>);
    },
    [setFilters]
  );

  const handleRemoveFilter = useCallback(
    (key: string) => {
      setFilters({ [key]: undefined } as Partial<ParcelFilters>);
    },
    [setFilters]
  );

  const handleClearAllFilters = useCallback(() => {
    setFilters({
      acreage_min: undefined,
      acreage_max: undefined,
      zoning_types: undefined,
      county: undefined,
      state_abbr: undefined,
      assessed_value_min: undefined,
      assessed_value_max: undefined,
      search_query: undefined,
    });
  }, [setFilters]);

  /** Build a display-friendly list of active filter chips */
  const activeFilterEntries: Array<{ key: string; label: string }> = [];
  if (filters.acreage_min !== undefined) {
    activeFilterEntries.push({ key: 'acreage_min', label: `Min ${filters.acreage_min} AC` });
  }
  if (filters.acreage_max !== undefined) {
    activeFilterEntries.push({ key: 'acreage_max', label: `Max ${filters.acreage_max} AC` });
  }
  if (filters.zoning_types?.length) {
    activeFilterEntries.push({ key: 'zoning_types', label: `Zoning: ${filters.zoning_types.join(', ')}` });
  }
  if (filters.county) {
    activeFilterEntries.push({ key: 'county', label: `County: ${filters.county}` });
  }
  if (filters.state_abbr) {
    activeFilterEntries.push({ key: 'state_abbr', label: `State: ${filters.state_abbr}` });
  }
  if (filters.assessed_value_min !== undefined) {
    activeFilterEntries.push({ key: 'assessed_value_min', label: `Min Value: $${filters.assessed_value_min.toLocaleString()}` });
  }
  if (filters.assessed_value_max !== undefined) {
    activeFilterEntries.push({ key: 'assessed_value_max', label: `Max Value: $${filters.assessed_value_max.toLocaleString()}` });
  }

  if (!leftPanelOpen) return null;

  return (
    <aside className="flex h-full w-80 flex-col bg-gray-900 text-white border-r border-gray-700 overflow-hidden">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-700 relative">
        <form onSubmit={handleSearchSubmit}>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search address, APN, county, owner..."
              className="w-full rounded-lg bg-gray-800 border border-gray-600 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </form>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute left-4 right-4 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg bg-gray-800 border border-gray-600 shadow-xl">
            {searchResults.map((parcel) => (
              <button
                key={parcel.id}
                type="button"
                onClick={() => handleSelectResult(parcel)}
                className="flex w-full flex-col px-3 py-2 text-left hover:bg-gray-700 border-b border-gray-700 last:border-b-0"
              >
                <span className="text-sm font-medium text-white truncate">
                  {parcel.situs_address ?? 'No Address'}
                </span>
                <span className="text-xs text-gray-400">
                  {parcel.county ?? 'Unknown County'} &middot; APN: {parcel.apn ?? 'N/A'}
                </span>
              </button>
            ))}
          </div>
        )}

        {showResults && searchResults.length === 0 && !searching && (
          <div className="absolute left-4 right-4 top-full z-50 mt-1 rounded-lg bg-gray-800 border border-gray-600 p-3 text-center text-sm text-gray-400">
            No results found
          </div>
        )}

        {searching && (
          <div className="absolute left-4 right-4 top-full z-50 mt-1 rounded-lg bg-gray-800 border border-gray-600 p-3 text-center text-sm text-gray-400">
            Searching...
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Saved Searches */}
        <CollapsibleSection title="Saved Searches">
          {savedSearches.length === 0 ? (
            <p className="text-xs text-gray-500">No saved searches yet.</p>
          ) : (
            <ul className="space-y-1">
              {savedSearches.map((search) => (
                <li key={search.id}>
                  <button
                    type="button"
                    onClick={() => handleApplySavedSearch(search)}
                    className="w-full rounded px-2 py-1.5 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                  >
                    {search.name ?? 'Untitled Search'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CollapsibleSection>

        {/* Active Filters */}
        <CollapsibleSection title="Active Filters" defaultOpen>
          {activeFilterEntries.length === 0 ? (
            <p className="text-xs text-gray-500">No active filters.</p>
          ) : (
            <div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {activeFilterEntries.map((entry) => (
                  <span
                    key={entry.key}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-900/50 border border-blue-700 px-2.5 py-0.5 text-xs text-blue-300"
                  >
                    {entry.label}
                    <button
                      type="button"
                      onClick={() => handleRemoveFilter(entry.key)}
                      className="ml-0.5 hover:text-white"
                      aria-label={`Remove ${entry.label} filter`}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Clear All
              </button>
            </div>
          )}
        </CollapsibleSection>

        {/* Layer Library */}
        {LAYER_CATEGORIES.map((category) => (
          <CollapsibleSection key={category.id} title={category.name}>
            <ul className="space-y-1">
              {category.layers.map((layer) => (
                <li
                  key={layer.id}
                  className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-gray-800"
                >
                  <span className="flex items-center gap-2 text-sm text-gray-300">
                    <span>{layer.icon}</span>
                    <span>{layer.label}</span>
                  </span>
                  <ToggleSwitch
                    checked={layers[layer.id] ?? false}
                    onChange={() => toggleLayer(layer.id)}
                  />
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        ))}

        {/* Projects */}
        <CollapsibleSection title="Projects">
          {projects.length === 0 ? (
            <p className="text-xs text-gray-500">No projects yet.</p>
          ) : (
            <ul className="space-y-1">
              {projects.map((project) => (
                <li key={project.id}>
                  <button
                    type="button"
                    onClick={() => setActiveProject(project)}
                    className={`w-full rounded px-2 py-1.5 text-left text-sm transition-colors ${
                      activeProject?.id === project.id
                        ? 'bg-blue-900/50 text-blue-300 border border-blue-700'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    {project.name ?? 'Untitled Project'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CollapsibleSection>
      </div>
    </aside>
  );
}
