'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import * as turf from '@turf/turf';
import { useUIStore } from '@/lib/stores/ui-store';
import { saveDrawing } from '@/lib/queries/projects';

/** Measurement result to display in the floating panel */
interface MeasurementDisplay {
  type: 'distance' | 'area';
  value: number;
  formattedValue: string;
  position: [number, number];
}

interface DrawingToolsProps {
  /** The active Mapbox GL map instance */
  map: MapboxMap;
}

/**
 * Format a distance measurement for display.
 * Shows feet for short distances, miles for longer ones.
 */
function formatDistance(miles: number): string {
  if (miles < 0.1) {
    return `${(miles * 5280).toFixed(0)} ft`;
  }
  return `${miles.toFixed(2)} mi`;
}

/**
 * Format an area measurement for display.
 * Shows square feet for small areas, acres for larger ones.
 */
function formatArea(acres: number): string {
  if (acres < 1) {
    return `${(acres * 43560).toFixed(0)} SF`;
  }
  return `${acres.toFixed(2)} AC`;
}

/**
 * Get the center coordinates of a GeoJSON geometry for positioning
 * the measurement display panel.
 */
function getGeometryCenter(geometry: GeoJSON.Geometry): [number, number] {
  const center = turf.center(turf.feature(geometry));
  return center.geometry.coordinates as [number, number];
}

/**
 * DrawingTools integrates Mapbox Draw for polygon, line, and point drawing,
 * as well as distance and area measurement using Turf.js calculations.
 * Drawings can be persisted to Supabase.
 *
 * @param props.map - The active Mapbox GL Map instance
 */
export function DrawingTools({ map }: DrawingToolsProps) {
  const drawRef = useRef<MapboxDraw | null>(null);
  const activeTool = useUIStore((s) => s.activeTool);
  const setActiveTool = useUIStore((s) => s.setActiveTool);

  const [measurement, setMeasurement] = useState<MeasurementDisplay | null>(null);
  const [lastDrawnFeature, setLastDrawnFeature] = useState<GeoJSON.Feature | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Track whether current draw session is a measurement
  const isMeasuringRef = useRef(false);

  // Initialize MapboxDraw
  useEffect(() => {
    if (drawRef.current) return;

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {},
      defaultMode: 'simple_select',
      styles: [
        // Polygon fill
        {
          id: 'gl-draw-polygon-fill',
          type: 'fill',
          filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          paint: {
            'fill-color': '#3B82F6',
            'fill-outline-color': '#3B82F6',
            'fill-opacity': 0.15,
          },
        },
        // Polygon stroke (active)
        {
          id: 'gl-draw-polygon-stroke-active',
          type: 'line',
          filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          paint: {
            'line-color': '#3B82F6',
            'line-dasharray': [0.2, 2],
            'line-width': 2,
          },
        },
        // Line (active)
        {
          id: 'gl-draw-line',
          type: 'line',
          filter: ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
          paint: {
            'line-color': '#3B82F6',
            'line-dasharray': [0.2, 2],
            'line-width': 2,
          },
        },
        // Point (active)
        {
          id: 'gl-draw-point',
          type: 'circle',
          filter: ['all', ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
          paint: {
            'circle-radius': 5,
            'circle-color': '#3B82F6',
          },
        },
        // Vertex points
        {
          id: 'gl-draw-polygon-and-line-vertex-active',
          type: 'circle',
          filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
          paint: {
            'circle-radius': 4,
            'circle-color': '#FFFFFF',
            'circle-stroke-color': '#3B82F6',
            'circle-stroke-width': 2,
          },
        },
        // Midpoint
        {
          id: 'gl-draw-polygon-midpoint',
          type: 'circle',
          filter: ['all', ['==', 'meta', 'midpoint'], ['==', '$type', 'Point']],
          paint: {
            'circle-radius': 3,
            'circle-color': '#3B82F6',
          },
        },
        // Static polygon fill
        {
          id: 'gl-draw-polygon-fill-static',
          type: 'fill',
          filter: ['all', ['==', '$type', 'Polygon'], ['==', 'mode', 'static']],
          paint: {
            'fill-color': '#10B981',
            'fill-outline-color': '#10B981',
            'fill-opacity': 0.15,
          },
        },
        // Static polygon outline
        {
          id: 'gl-draw-polygon-stroke-static',
          type: 'line',
          filter: ['all', ['==', '$type', 'Polygon'], ['==', 'mode', 'static']],
          paint: {
            'line-color': '#10B981',
            'line-width': 2,
          },
        },
        // Static line
        {
          id: 'gl-draw-line-static',
          type: 'line',
          filter: ['all', ['==', '$type', 'LineString'], ['==', 'mode', 'static']],
          paint: {
            'line-color': '#10B981',
            'line-width': 2,
          },
        },
        // Static point
        {
          id: 'gl-draw-point-static',
          type: 'circle',
          filter: ['all', ['==', '$type', 'Point'], ['==', 'mode', 'static']],
          paint: {
            'circle-radius': 5,
            'circle-color': '#10B981',
          },
        },
      ],
    });

    map.addControl(draw as unknown as mapboxgl.IControl);
    drawRef.current = draw;

    return () => {
      try {
        map.removeControl(draw as unknown as mapboxgl.IControl);
      } catch {
        // Map may already be removed during cleanup
      }
      drawRef.current = null;
    };
  }, [map]);

  /**
   * Handle draw.create events: calculate measurements for measuring tools,
   * or store the feature for potential save.
   */
  const handleDrawCreate = useCallback(
    (e: { features: GeoJSON.Feature[] }) => {
      const feature = e.features[0];
      if (!feature) return;

      setLastDrawnFeature(feature);

      if (!isMeasuringRef.current) return;

      const geometry = feature.geometry;

      if (geometry.type === 'LineString') {
        const lengthMiles = turf.length(feature as GeoJSON.Feature<GeoJSON.LineString>, {
          units: 'miles',
        });
        const center = getGeometryCenter(geometry);
        setMeasurement({
          type: 'distance',
          value: lengthMiles,
          formattedValue: formatDistance(lengthMiles),
          position: center,
        });
      } else if (geometry.type === 'Polygon') {
        const areaSqMeters = turf.area(feature as GeoJSON.Feature<GeoJSON.Polygon>);
        const areaAcres = areaSqMeters / 4046.86;
        const center = getGeometryCenter(geometry);
        setMeasurement({
          type: 'area',
          value: areaAcres,
          formattedValue: formatArea(areaAcres),
          position: center,
        });
      }
    },
    []
  );

  // Bind draw event handlers
  useEffect(() => {
    map.on('draw.create', handleDrawCreate);

    return () => {
      map.off('draw.create', handleDrawCreate);
    };
  }, [map, handleDrawCreate]);

  // Switch draw mode based on activeTool
  useEffect(() => {
    const draw = drawRef.current;
    if (!draw) return;

    switch (activeTool) {
      case 'draw-polygon':
        isMeasuringRef.current = false;
        setMeasurement(null);
        draw.changeMode('draw_polygon');
        break;
      case 'draw-line':
        isMeasuringRef.current = false;
        setMeasurement(null);
        draw.changeMode('draw_line_string');
        break;
      case 'draw-point':
        isMeasuringRef.current = false;
        setMeasurement(null);
        draw.changeMode('draw_point');
        break;
      case 'measure-distance':
        isMeasuringRef.current = true;
        setMeasurement(null);
        draw.changeMode('draw_line_string');
        break;
      case 'measure-area':
        isMeasuringRef.current = true;
        setMeasurement(null);
        draw.changeMode('draw_polygon');
        break;
      case 'select':
      default:
        isMeasuringRef.current = false;
        draw.changeMode('simple_select');
        break;
    }
  }, [activeTool]);

  /**
   * Delete all drawn features from the map and clear measurement display.
   */
  const handleDeleteAll = useCallback(() => {
    const draw = drawRef.current;
    if (!draw) return;
    draw.deleteAll();
    setMeasurement(null);
    setLastDrawnFeature(null);
    setActiveTool('select');
  }, [setActiveTool]);

  /**
   * Save the last drawn feature to Supabase.
   */
  const handleSave = useCallback(async () => {
    if (!lastDrawnFeature || isSaving) return;

    setIsSaving(true);
    try {
      const properties: Record<string, unknown> = {
        name: `Drawing ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      };

      if (measurement) {
        properties['measurement_type'] = measurement.type;
        properties['measurement_value'] = measurement.value;
        properties['measurement_formatted'] = measurement.formattedValue;
      }

      const result = await saveDrawing(lastDrawnFeature.geometry, properties);
      if (result) {
        setLastDrawnFeature(null);
      } else {
        console.error('Failed to save drawing');
      }
    } catch (err) {
      console.error('Error saving drawing:', err);
    } finally {
      setIsSaving(false);
    }
  }, [lastDrawnFeature, measurement, isSaving]);

  // Expose deleteAll for the MapToolbar delete button
  useEffect(() => {
    const handler = () => handleDeleteAll();
    window.addEventListener('map:delete-drawings', handler);
    return () => window.removeEventListener('map:delete-drawings', handler);
  }, [handleDeleteAll]);

  return (
    <>
      {/* Measurement result floating panel */}
      {measurement && (
        <div
          className="absolute z-10 bg-gray-900/90 text-white rounded-lg px-4 py-3 shadow-xl pointer-events-auto"
          style={{ top: 16, right: 16 }}
        >
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
            {measurement.type === 'distance' ? 'Distance' : 'Area'}
          </div>
          <div className="text-xl font-semibold">{measurement.formattedValue}</div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-3 py-1 rounded transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setMeasurement(null);
                handleDeleteAll();
              }}
              className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Save button for non-measurement drawings */}
      {lastDrawnFeature && !measurement && (
        <div
          className="absolute z-10 bg-gray-900/90 text-white rounded-lg px-4 py-3 shadow-xl pointer-events-auto"
          style={{ top: 16, right: 16 }}
        >
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
            Drawing Complete
          </div>
          <div className="flex gap-2 mt-1">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-3 py-1 rounded transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Drawing'}
            </button>
            <button
              onClick={handleDeleteAll}
              className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition-colors"
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </>
  );
}
