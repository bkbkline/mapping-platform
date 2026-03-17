'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import type { Map as MapboxMap } from 'mapbox-gl';
import * as turf from '@turf/turf';
import { useMapStore } from '@/lib/stores/map-store';

interface MapOverlaysProps {
  /** The active Mapbox GL map instance */
  map: MapboxMap;
}

/** Cursor coordinates for display */
interface CursorPosition {
  lat: number;
  lng: number;
}

/**
 * MapOverlays renders floating UI elements over the map surface:
 * - Current cursor coordinates (bottom-left, above attribution)
 * - Zoom level indicator (bottom-right, above coordinates)
 * - 3D Terrain toggle (bottom-right, near zoom controls)
 * - Fit Bounds control (bottom-right, near 3D toggle)
 * - Mapbox NavigationControl (zoom in/out + compass)
 * - Mapbox ScaleControl (distance scale bar)
 *
 * @param props.map - The active Mapbox GL Map instance
 */
export function MapOverlays({ map }: MapOverlaysProps) {
  const [cursor, setCursor] = useState<CursorPosition | null>(null);
  const [terrain3d, setTerrain3d] = useState(false);
  const zoom = useMapStore((s) => s.viewport.zoom);

  const navControlRef = useRef<mapboxgl.NavigationControl | null>(null);
  const scaleControlRef = useRef<mapboxgl.ScaleControl | null>(null);

  // Add Mapbox native controls
  useEffect(() => {
    const nav = new mapboxgl.NavigationControl({ showCompass: true });
    const scale = new mapboxgl.ScaleControl({ maxWidth: 150, unit: 'imperial' });

    map.addControl(nav, 'top-right');
    map.addControl(scale, 'bottom-right');

    navControlRef.current = nav;
    scaleControlRef.current = scale;

    return () => {
      try {
        if (navControlRef.current) map.removeControl(navControlRef.current);
        if (scaleControlRef.current) map.removeControl(scaleControlRef.current);
      } catch {
        // Map may already be removed during cleanup
      }
      navControlRef.current = null;
      scaleControlRef.current = null;
    };
  }, [map]);

  // Track mouse position for coordinate display
  const handleMouseMove = useCallback((e: mapboxgl.MapMouseEvent) => {
    setCursor({
      lat: e.lngLat.lat,
      lng: e.lngLat.lng,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setCursor(null);
  }, []);

  useEffect(() => {
    map.on('mousemove', handleMouseMove);
    map.on('mouseout', handleMouseLeave);

    return () => {
      map.off('mousemove', handleMouseMove);
      map.off('mouseout', handleMouseLeave);
    };
  }, [map, handleMouseMove, handleMouseLeave]);

  // ── 3D Terrain toggle handler ──────────────────────────────────────────────
  const handleToggle3D = useCallback(() => {
    if (!terrain3d) {
      // Activate 3D terrain
      if (!map.getSource('mapbox-dem')) {
        map.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14,
        });
      }
      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
      map.easeTo({ pitch: 60, duration: 1000 });
      setTerrain3d(true);
    } else {
      // Deactivate 3D terrain
      map.setTerrain(null);
      map.easeTo({ pitch: 0, duration: 1000 });
      setTerrain3d(false);
    }
  }, [map, terrain3d]);

  // ── Fit Bounds handler ─────────────────────────────────────────────────────
  const handleFitBounds = useCallback(() => {
    // Attempt to get drawn features from the map's draw source
    const drawSource = map.getSource('mapbox-gl-draw-cold') as mapboxgl.GeoJSONSource | undefined;
    if (drawSource) {
      // Use internal _data if available; otherwise fall back to default
      try {
        const data = (drawSource as unknown as { _data?: GeoJSON.GeoJSON })._data;
        if (
          data &&
          typeof data === 'object' &&
          'type' in data &&
          ((data.type === 'FeatureCollection' && (data as GeoJSON.FeatureCollection).features.length > 0) ||
            data.type === 'Feature')
        ) {
          const bbox = turf.bbox(data) as [number, number, number, number];
          map.fitBounds(
            [
              [bbox[0], bbox[1]],
              [bbox[2], bbox[3]],
            ],
            { padding: 60, duration: 1000 }
          );
          return;
        }
      } catch {
        // Fall through to default
      }
    }

    // Default: fly to the default center from the store
    const { viewport } = useMapStore.getState();
    map.flyTo({
      center: [viewport.longitude, viewport.latitude],
      zoom: viewport.zoom,
      duration: 1000,
    });
  }, [map]);

  return (
    <>
      {/* Coordinate display — bottom-left, above Mapbox attribution */}
      {cursor && (
        <div
          style={{
            position: 'absolute',
            bottom: 28,
            left: 8,
            zIndex: 10,
            background: 'rgba(30, 36, 48, 0.75)',
            backdropFilter: 'blur(4px)',
            color: '#ffffff',
            fontSize: 12,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            padding: '3px 8px',
            borderRadius: 9999,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          {cursor.lat.toFixed(4)}, {cursor.lng.toFixed(4)}
        </div>
      )}

      {/* Zoom level indicator */}
      <div className="absolute bottom-12 right-2 z-10 bg-gray-900/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded font-mono">
        Zoom: {zoom.toFixed(1)}
      </div>

      {/* 3D Terrain toggle button */}
      <button
        onClick={handleToggle3D}
        title={terrain3d ? 'Switch to 2D' : 'Switch to 3D'}
        style={{
          position: 'absolute',
          bottom: 100,
          right: 8,
          zIndex: 10,
          background: '#1e2430',
          color: '#ffffff',
          border: 'none',
          borderRadius: 6,
          padding: '4px 10px',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          lineHeight: '20px',
          letterSpacing: 0.5,
        }}
      >
        {terrain3d ? '2D' : '3D'}
      </button>

      {/* Fit Bounds / Expand control */}
      <button
        onClick={handleFitBounds}
        title="Fit to bounds"
        style={{
          position: 'absolute',
          bottom: 68,
          right: 8,
          zIndex: 10,
          background: '#1e2430',
          color: '#ffffff',
          border: 'none',
          borderRadius: 6,
          width: 28,
          height: 28,
          padding: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Expand/maximize icon */}
          <polyline points="15 3 21 3 21 9" />
          <polyline points="9 21 3 21 3 15" />
          <line x1="21" y1="3" x2="14" y2="10" />
          <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
      </button>
    </>
  );
}
