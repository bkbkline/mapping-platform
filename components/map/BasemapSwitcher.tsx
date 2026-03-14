'use client';

import { useState, useCallback } from 'react';
import { useMapStore } from '@/lib/stores/map-store';
import { BASEMAPS } from '@/lib/mapbox/config';
import type { BasemapStyle } from '@/types/map';

/**
 * BasemapSwitcher renders a floating panel in the bottom-left of the map
 * that allows users to switch between basemap styles (Streets, Satellite,
 * Hybrid, Light). It shows the current basemap as a compact thumbnail and
 * expands on click to reveal all options.
 *
 * After switching styles, the map emits a 'style.load' event which triggers
 * layer re-initialization in ParcelLayer and other layer components.
 */
export function BasemapSwitcher() {
  const [expanded, setExpanded] = useState(false);
  const mapRef = useMapStore((s) => s.mapRef);
  const activeBasemap = useMapStore((s) => s.activeBasemap);
  const setActiveBasemap = useMapStore((s) => s.setActiveBasemap);

  const currentBasemap = BASEMAPS.find((b) => b.id === activeBasemap) ?? BASEMAPS[0];

  /**
   * Switch the map to a new basemap style. Sources and layers will be
   * re-added by their respective components via the style.load event.
   */
  const handleSelect = useCallback(
    (basemap: BasemapStyle) => {
      if (!mapRef) return;
      if (basemap.id === activeBasemap) {
        setExpanded(false);
        return;
      }

      mapRef.setStyle(basemap.url);
      setActiveBasemap(basemap.id);
      setExpanded(false);
    },
    [mapRef, activeBasemap, setActiveBasemap]
  );

  return (
    <div className="absolute bottom-4 left-4 z-10">
      {expanded ? (
        <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg p-2 shadow-xl">
          <div className="grid grid-cols-2 gap-2">
            {BASEMAPS.map((basemap) => (
              <button
                key={basemap.id}
                onClick={() => handleSelect(basemap)}
                className={`
                  relative w-[72px] h-[72px] rounded-md overflow-hidden border-2 transition-all
                  ${
                    basemap.id === activeBasemap
                      ? 'border-blue-500 ring-1 ring-blue-500'
                      : 'border-transparent hover:border-gray-500'
                  }
                `}
                title={basemap.name}
              >
                {/* Thumbnail image with fallback background */}
                <div
                  className="absolute inset-0 bg-gray-700 bg-cover bg-center"
                  style={{ backgroundImage: `url(${basemap.thumbnail})` }}
                />
                {/* Label overlay */}
                <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1 py-0.5">
                  <span className="text-[10px] text-white font-medium">
                    {basemap.name}
                  </span>
                </div>
                {/* Active indicator */}
                {basemap.id === activeBasemap && (
                  <div className="absolute top-1 right-1 w-3 h-3 bg-blue-500 rounded-full border border-white" />
                )}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          className="relative w-[72px] h-[72px] rounded-lg overflow-hidden border-2 border-gray-600 hover:border-gray-400 shadow-xl transition-all group"
          title={`Basemap: ${currentBasemap.name}`}
        >
          <div
            className="absolute inset-0 bg-gray-700 bg-cover bg-center"
            style={{ backgroundImage: `url(${currentBasemap.thumbnail})` }}
          />
          <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1 py-0.5">
            <span className="text-[10px] text-white font-medium">
              {currentBasemap.name}
            </span>
          </div>
          {/* Expand indicator */}
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </div>
        </button>
      )}
    </div>
  );
}
