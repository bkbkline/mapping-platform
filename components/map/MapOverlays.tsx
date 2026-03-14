'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import type { Map as MapboxMap } from 'mapbox-gl';
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
 * - Current cursor coordinates (bottom-right)
 * - Zoom level indicator (bottom-right, above coordinates)
 * - Mapbox NavigationControl (zoom in/out + compass)
 * - Mapbox ScaleControl (distance scale bar)
 *
 * @param props.map - The active Mapbox GL Map instance
 */
export function MapOverlays({ map }: MapOverlaysProps) {
  const [cursor, setCursor] = useState<CursorPosition | null>(null);
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

  return (
    <>
      {/* Zoom level indicator */}
      <div className="absolute bottom-12 right-2 z-10 bg-gray-900/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded font-mono">
        Zoom: {zoom.toFixed(1)}
      </div>

      {/* Cursor coordinate display */}
      {cursor && (
        <div className="absolute bottom-6 right-2 z-10 bg-gray-900/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded font-mono">
          {cursor.lat.toFixed(6)}, {cursor.lng.toFixed(6)}
        </div>
      )}
    </>
  );
}
