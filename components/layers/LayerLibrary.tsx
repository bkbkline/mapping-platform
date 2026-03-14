'use client';

import { useState } from 'react';
import { useLayerStore } from '@/lib/stores/layer-store';
import Toggle from '@/components/ui/Toggle';

interface LayerItem {
  id: string;
  name: string;
  icon: string;
}

interface LayerCategoryConfig {
  id: string;
  name: string;
  icon: string;
  layers: LayerItem[];
}

const LAYER_CATEGORIES: LayerCategoryConfig[] = [
  {
    id: 'base-land',
    name: 'Base Land',
    icon: '\uD83D\uDDFA\uFE0F',
    layers: [
      { id: 'parcels', name: 'Parcels', icon: '\uD83D\uDDFA\uFE0F' },
      { id: 'parcel-labels', name: 'Parcel Labels', icon: '\uD83C\uDFF7\uFE0F' },
      { id: 'city-boundaries', name: 'City Boundaries', icon: '\uD83C\uDFD9\uFE0F' },
      { id: 'county-boundaries', name: 'County Boundaries', icon: '\uD83D\uDCCD' },
      { id: 'zoning', name: 'Zoning', icon: '\uD83D\uDD32' },
      { id: 'land-use', name: 'Land Use', icon: '\uD83C\uDFD7\uFE0F' },
      { id: 'opportunity-zones', name: 'Opportunity Zones', icon: '\u2B50' },
    ],
  },
  {
    id: 'environmental',
    name: 'Environmental',
    icon: '\uD83C\uDF3F',
    layers: [
      { id: 'flood-zones', name: 'FEMA Flood Zones', icon: '\uD83C\uDF0A' },
      { id: 'wetlands', name: 'Wetlands', icon: '\uD83C\uDF3F' },
      { id: 'terrain', name: 'Terrain Shading', icon: '\u26F0\uFE0F' },
    ],
  },
  {
    id: 'transportation',
    name: 'Transportation',
    icon: '\uD83D\uDEE3\uFE0F',
    layers: [
      { id: 'highways', name: 'Highways', icon: '\uD83D\uDEE3\uFE0F' },
      { id: 'truck-routes', name: 'Truck Routes', icon: '\uD83D\uDE9B' },
      { id: 'rail-lines', name: 'Rail Lines', icon: '\uD83D\uDE82' },
      { id: 'airports', name: 'Airports', icon: '\u2708\uFE0F' },
    ],
  },
  {
    id: 'infrastructure',
    name: 'Infrastructure',
    icon: '\u26A1',
    layers: [
      { id: 'transmission-lines', name: 'Transmission Lines', icon: '\u26A1' },
      { id: 'substations', name: 'Substations', icon: '\uD83D\uDD0C' },
      { id: 'water-service', name: 'Water Service', icon: '\uD83D\uDCA7' },
      { id: 'sewer-service', name: 'Sewer Service', icon: '\uD83D\uDEB0' },
    ],
  },
  {
    id: 'market-intelligence',
    name: 'Market Intelligence',
    icon: '\uD83D\uDCCA',
    layers: [
      { id: 'industrial-parks', name: 'Industrial Parks', icon: '\uD83C\uDFED' },
      { id: 'warehouses', name: 'Warehouses', icon: '\uD83C\uDFEA' },
      { id: 'comps', name: 'Comps', icon: '\uD83D\uDCCA' },
      { id: 'development-projects', name: 'Development Projects', icon: '\uD83C\uDFD7\uFE0F' },
    ],
  },
];

/**
 * Layer library component for the left panel.
 * Organized by collapsible categories, each containing toggleable map layers
 * with emoji icons and Toggle switches connected to the layer store.
 */
export default function LayerLibrary() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    'base-land': true,
    'market-intelligence': true,
  });
  const layers = useLayerStore((s) => s.layers);
  const setLayerVisibility = useLayerStore((s) => s.setLayerVisibility);

  const toggleCategory = (categoryId: string) => {
    setExpanded((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">
        Layers
      </h3>
      {LAYER_CATEGORIES.map((category) => (
        <div key={category.id}>
          {/* Category header */}
          <button
            onClick={() => toggleCategory(category.id)}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <span className="flex items-center gap-2">
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${
                expanded[category.id] ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Layer list */}
          {expanded[category.id] && (
            <div className="ml-3 pl-3 border-l border-gray-200 space-y-0.5">
              {category.layers.map((layer) => (
                <div
                  key={layer.id}
                  className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{layer.icon}</span>
                    <span className="text-sm text-gray-600">{layer.name}</span>
                  </div>
                  <Toggle
                    checked={layers[layer.id] ?? false}
                    onChange={(checked) => setLayerVisibility(layer.id, checked)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
