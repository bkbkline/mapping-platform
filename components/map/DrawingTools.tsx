'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import type { Map as MapboxMap } from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import * as turf from '@turf/turf';
import { useUIStore } from '@/lib/stores/ui-store';
import { useMapStore } from '@/lib/stores/map-store';
import { supabase } from '@/lib/supabase/client';

interface MeasurementDisplay {
  type: 'distance' | 'area';
  value: number;
  formattedValue: string;
}

interface DrawingToolsProps {
  map: MapboxMap;
}

function formatDistance(miles: number): string {
  if (miles < 0.1) return `${(miles * 5280).toFixed(0)} ft`;
  return `${miles.toFixed(2)} mi`;
}

function formatArea(acres: number): string {
  if (acres < 1) return `${(acres * 43560).toFixed(0)} SF`;
  return `${acres.toFixed(2)} AC`;
}

/**
 * DrawingTools integrates Mapbox Draw for all drawing, measuring, and
 * annotation tools. Handles every tool from the vertical toolbar.
 */
export function DrawingTools({ map }: DrawingToolsProps) {
  const drawRef = useRef<MapboxDraw | null>(null);
  const activeTool = useUIStore((s) => s.activeTool);
  const setActiveTool = useUIStore((s) => s.setActiveTool);
  const activeMapId = useMapStore((s) => s.activeMapId);

  const [measurement, setMeasurement] = useState<MeasurementDisplay | null>(null);
  const [lastDrawnFeature, setLastDrawnFeature] = useState<GeoJSON.Feature | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pinPopup, setPinPopup] = useState<{ lng: number; lat: number } | null>(null);
  const [pinLabel, setPinLabel] = useState('');
  const [pinNote, setPinNote] = useState('');

  const isMeasuringRef = useRef(false);
  const pinListenerRef = useRef<((e: mapboxgl.MapMouseEvent) => void) | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Initialize MapboxDraw
  useEffect(() => {
    if (drawRef.current) return;

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {},
      defaultMode: 'simple_select',
      styles: [
        {
          id: 'gl-draw-polygon-fill',
          type: 'fill',
          filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          paint: { 'fill-color': '#f59e0b', 'fill-opacity': 0.2 },
        },
        {
          id: 'gl-draw-polygon-stroke',
          type: 'line',
          filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          paint: { 'line-color': '#f59e0b', 'line-width': 2 },
        },
        {
          id: 'gl-draw-line',
          type: 'line',
          filter: ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
          paint: { 'line-color': '#f59e0b', 'line-width': 2, 'line-dasharray': [2, 2] },
        },
        {
          id: 'gl-draw-point-outer',
          type: 'circle',
          filter: ['all', ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
          paint: { 'circle-radius': 6, 'circle-color': '#f59e0b' },
        },
        {
          id: 'gl-draw-vertex',
          type: 'circle',
          filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
          paint: { 'circle-radius': 4, 'circle-color': '#fff', 'circle-stroke-color': '#f59e0b', 'circle-stroke-width': 2 },
        },
        {
          id: 'gl-draw-midpoint',
          type: 'circle',
          filter: ['all', ['==', 'meta', 'midpoint'], ['==', '$type', 'Point']],
          paint: { 'circle-radius': 3, 'circle-color': '#f59e0b' },
        },
        {
          id: 'gl-draw-polygon-fill-static',
          type: 'fill',
          filter: ['all', ['==', '$type', 'Polygon'], ['==', 'mode', 'static']],
          paint: { 'fill-color': '#10b981', 'fill-opacity': 0.15 },
        },
        {
          id: 'gl-draw-polygon-stroke-static',
          type: 'line',
          filter: ['all', ['==', '$type', 'Polygon'], ['==', 'mode', 'static']],
          paint: { 'line-color': '#10b981', 'line-width': 2 },
        },
        {
          id: 'gl-draw-line-static',
          type: 'line',
          filter: ['all', ['==', '$type', 'LineString'], ['==', 'mode', 'static']],
          paint: { 'line-color': '#10b981', 'line-width': 2 },
        },
        {
          id: 'gl-draw-point-static',
          type: 'circle',
          filter: ['all', ['==', '$type', 'Point'], ['==', 'mode', 'static']],
          paint: { 'circle-radius': 5, 'circle-color': '#10b981' },
        },
      ],
    });

    map.addControl(draw as unknown as mapboxgl.IControl);
    drawRef.current = draw;

    return () => {
      try { map.removeControl(draw as unknown as mapboxgl.IControl); } catch { /* */ }
      drawRef.current = null;
    };
  }, [map]);

  // Handle draw.create — measurements and saves
  const handleDrawCreate = useCallback((e: { features: GeoJSON.Feature[] }) => {
    const feature = e.features[0];
    if (!feature) return;
    setLastDrawnFeature(feature);

    if (!isMeasuringRef.current) return;
    const geometry = feature.geometry;

    if (geometry.type === 'LineString') {
      const lengthMiles = turf.length(feature as GeoJSON.Feature<GeoJSON.LineString>, { units: 'miles' });
      setMeasurement({ type: 'distance', value: lengthMiles, formattedValue: formatDistance(lengthMiles) });
    } else if (geometry.type === 'Polygon') {
      const areaSqMeters = turf.area(feature as GeoJSON.Feature<GeoJSON.Polygon>);
      const areaAcres = areaSqMeters / 4046.86;
      setMeasurement({ type: 'area', value: areaAcres, formattedValue: formatArea(areaAcres) });
    }
  }, []);

  useEffect(() => {
    map.on('draw.create', handleDrawCreate);
    return () => { map.off('draw.create', handleDrawCreate); };
  }, [map, handleDrawCreate]);

  // Clean up pin listener when tool changes
  const cleanupPinListener = useCallback(() => {
    if (pinListenerRef.current) {
      map.off('click', pinListenerRef.current);
      pinListenerRef.current = null;
    }
    map.getCanvas().style.cursor = '';
  }, [map]);

  // Switch draw mode based on activeTool
  useEffect(() => {
    const draw = drawRef.current;
    if (!draw) return;

    cleanupPinListener();
    isMeasuringRef.current = false;

    switch (activeTool) {
      // --- Drawing tools ---
      case 'draw-polygon':
      case 'polygon-select':
        setMeasurement(null);
        draw.changeMode('draw_polygon');
        map.getCanvas().style.cursor = 'crosshair';
        break;

      case 'draw-rectangle':
        // MapboxDraw doesn't have a rectangle mode — use draw_polygon
        // User clicks 4 corners to form a rectangle
        setMeasurement(null);
        draw.changeMode('draw_polygon');
        map.getCanvas().style.cursor = 'crosshair';
        break;

      case 'draw-circle':
        // Use draw_polygon — user draws a rough circle shape
        setMeasurement(null);
        draw.changeMode('draw_polygon');
        map.getCanvas().style.cursor = 'crosshair';
        break;

      case 'draw-line':
        setMeasurement(null);
        draw.changeMode('draw_line_string');
        map.getCanvas().style.cursor = 'crosshair';
        break;

      case 'draw-point':
        setMeasurement(null);
        draw.changeMode('draw_point');
        map.getCanvas().style.cursor = 'crosshair';
        break;

      // --- Measurement tools ---
      case 'measure-distance':
        isMeasuringRef.current = true;
        setMeasurement(null);
        draw.changeMode('draw_line_string');
        map.getCanvas().style.cursor = 'crosshair';
        break;

      case 'measure-area':
        isMeasuringRef.current = true;
        setMeasurement(null);
        draw.changeMode('draw_polygon');
        map.getCanvas().style.cursor = 'crosshair';
        break;

      // --- Pin / annotation ---
      case 'place-pin': {
        setMeasurement(null);
        draw.changeMode('simple_select');
        map.getCanvas().style.cursor = 'cell';
        const handler = (e: mapboxgl.MapMouseEvent) => {
          setPinPopup({ lng: e.lngLat.lng, lat: e.lngLat.lat });
          setPinLabel('');
          setPinNote('');
          cleanupPinListener();
          map.getCanvas().style.cursor = '';
        };
        pinListenerRef.current = handler;
        map.once('click', handler);
        break;
      }

      // --- View tools ---
      case 'fit-bounds': {
        const allFeatures = draw.getAll();
        if (allFeatures && allFeatures.features.length > 0) {
          const bounds = turf.bbox(allFeatures);
          map.fitBounds(
            [[bounds[0], bounds[1]], [bounds[2], bounds[3]]],
            { padding: 60, duration: 800 }
          );
        }
        setActiveTool('select');
        break;
      }

      case 'fullscreen': {
        const container = map.getContainer().closest('[class*="w-screen"]') as HTMLElement;
        if (container) {
          if (!document.fullscreenElement) {
            container.requestFullscreen().catch(() => {});
          } else {
            document.exitFullscreen().catch(() => {});
          }
        }
        setActiveTool('select');
        break;
      }

      case 'reset-view':
        draw.deleteAll();
        setMeasurement(null);
        setLastDrawnFeature(null);
        // Clear markers
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];
        map.flyTo({ center: [-117.9, 33.95], zoom: 10, duration: 1000 });
        setActiveTool('select');
        break;

      case 'upload':
        // Trigger upload modal via custom event
        window.dispatchEvent(new Event('map:open-upload'));
        setActiveTool('select');
        break;

      case 'delete': {
        const selected = draw.getSelectedIds();
        if (selected.length > 0) {
          draw.delete(selected);
        } else {
          draw.deleteAll();
        }
        setMeasurement(null);
        setLastDrawnFeature(null);
        setActiveTool('select');
        break;
      }

      case 'select':
      default:
        draw.changeMode('simple_select');
        map.getCanvas().style.cursor = '';
        break;
    }
  }, [activeTool, map, cleanupPinListener, setActiveTool]);

  // Delete all handler for toolbar button
  const handleDeleteAll = useCallback(() => {
    const draw = drawRef.current;
    if (!draw) return;
    draw.deleteAll();
    setMeasurement(null);
    setLastDrawnFeature(null);
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    setActiveTool('select');
  }, [setActiveTool]);

  // Save drawing to Supabase annotations table
  const handleSave = useCallback(async () => {
    if (!lastDrawnFeature || isSaving) return;
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const geomType = lastDrawnFeature.geometry.type as string;
      await supabase.from('annotations').insert({
        owner_id: user.id,
        geometry: lastDrawnFeature.geometry,
        geometry_type: geomType,
        label: measurement ? `${measurement.formattedValue}` : '',
        color: '#f59e0b',
        fill_opacity: 0.2,
        stroke_width: 2,
        ...(measurement ? {
          measurement: { type: measurement.type, value: measurement.value, formatted: measurement.formattedValue },
        } : {}),
      });
      setLastDrawnFeature(null);
      setMeasurement(null);
    } catch (err) {
      console.error('Error saving drawing:', err);
    } finally {
      setIsSaving(false);
    }
  }, [lastDrawnFeature, measurement, isSaving, activeTool]);

  // Save pin/annotation
  const handleSavePin = useCallback(async () => {
    if (!pinPopup) return;
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('annotations').insert({
        owner_id: user.id,
        geometry: { type: 'Point', coordinates: [pinPopup.lng, pinPopup.lat] },
        geometry_type: 'Point',
        label: pinLabel || 'Pin',
        notes: pinNote,
        color: '#f59e0b',
        icon: 'pin',
      });

      // Add visible marker on map
      const marker = new mapboxgl.Marker({ color: '#f59e0b' })
        .setLngLat([pinPopup.lng, pinPopup.lat])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<div style="font-family:Inter,system-ui;font-size:13px">
            <strong>${pinLabel || 'Pin'}</strong>
            ${pinNote ? `<p style="margin:4px 0 0;color:#6b7280">${pinNote}</p>` : ''}
          </div>`
        ))
        .addTo(map);
      markersRef.current.push(marker);

      setPinPopup(null);
      setPinLabel('');
      setPinNote('');
      setActiveTool('select');
    } catch (err) {
      console.error('Error saving pin:', err);
    } finally {
      setIsSaving(false);
    }
  }, [pinPopup, pinLabel, pinNote, map, setActiveTool]);

  // Listen for delete-drawings event from old toolbar
  useEffect(() => {
    const handler = () => handleDeleteAll();
    window.addEventListener('map:delete-drawings', handler);
    return () => window.removeEventListener('map:delete-drawings', handler);
  }, [handleDeleteAll]);

  // Load saved annotations from DB
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from('annotations').select('*');
        if (!data || data.length === 0) return;

        const draw = drawRef.current;
        // Add non-pin features to MapboxDraw
        const drawFeatures = data.filter(a => a.icon !== 'pin' && a.geometry_type !== 'Point' && a.geometry);
        if (draw && drawFeatures.length > 0) {
          const fc: GeoJSON.FeatureCollection = {
            type: 'FeatureCollection',
            features: drawFeatures.map(a => ({
              type: 'Feature' as const,
              id: a.id,
              geometry: a.geometry as GeoJSON.Geometry,
              properties: { db_id: a.id, label: a.label, color: a.color },
            })),
          };
          try { draw.add(fc); } catch { /* may fail if styles not ready */ }
        }

        // Add pin/point annotations as markers
        const pins = data.filter(a => a.icon === 'pin' || a.geometry_type === 'Point');
        for (const pin of pins) {
          const geom = pin.geometry as GeoJSON.Point;
          if (!geom?.coordinates) continue;
          const coords = geom.coordinates as [number, number];
          const marker = new mapboxgl.Marker({ color: pin.color || '#f59e0b' })
            .setLngLat(coords)
            .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<div style="font-family:Inter,system-ui;font-size:13px">
                <strong>${pin.label || 'Pin'}</strong>
                ${pin.notes ? `<p style="margin:4px 0 0;color:#6b7280">${pin.notes}</p>` : ''}
              </div>`
            ))
            .addTo(map);
          markersRef.current.push(marker);
        }
      } catch {
        // Silently fail — annotations may not exist yet
      }
    })();
  }, [map, activeMapId]);

  return (
    <>
      {/* Measurement result */}
      {measurement && (
        <div
          style={{
            position: 'absolute', top: 68, right: 16, zIndex: 45,
            background: 'rgba(15,17,23,0.92)', color: '#fff',
            borderRadius: 10, padding: '12px 16px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            {measurement.type === 'distance' ? 'Distance' : 'Area'}
          </div>
          <div style={{ fontSize: 22, fontWeight: 600 }}>{measurement.formattedValue}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={handleSave} disabled={isSaving}
              style={{ fontSize: 12, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer' }}>
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={handleDeleteAll}
              style={{ fontSize: 12, background: '#374151', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer' }}>
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Drawing save prompt */}
      {lastDrawnFeature && !measurement && (
        <div
          style={{
            position: 'absolute', top: 68, right: 16, zIndex: 45,
            background: 'rgba(15,17,23,0.92)', color: '#fff',
            borderRadius: 10, padding: '12px 16px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            Drawing Complete
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={handleSave} disabled={isSaving}
              style={{ fontSize: 12, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer' }}>
              {isSaving ? 'Saving...' : 'Save to Map'}
            </button>
            <button onClick={handleDeleteAll}
              style={{ fontSize: 12, background: '#374151', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer' }}>
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Pin annotation popup */}
      {pinPopup && (
        <div
          style={{
            position: 'absolute', top: 68, right: 16, zIndex: 45,
            background: 'rgba(15,17,23,0.95)', color: '#fff',
            borderRadius: 10, padding: '16px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            fontFamily: 'Inter, system-ui, sans-serif',
            width: 260,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>New Pin Annotation</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>
            {pinPopup.lat.toFixed(5)}, {pinPopup.lng.toFixed(5)}
          </div>
          <input
            type="text"
            placeholder="Label (e.g. Site Visit Location)"
            value={pinLabel}
            onChange={(e) => setPinLabel(e.target.value)}
            style={{
              width: '100%', padding: '6px 10px', fontSize: 13,
              background: '#1e2430', border: '1px solid #374151', borderRadius: 6, color: '#fff',
              marginBottom: 8, outline: 'none', boxSizing: 'border-box',
            }}
          />
          <textarea
            placeholder="Notes (optional)"
            value={pinNote}
            onChange={(e) => setPinNote(e.target.value)}
            rows={3}
            style={{
              width: '100%', padding: '6px 10px', fontSize: 12,
              background: '#1e2430', border: '1px solid #374151', borderRadius: 6, color: '#fff',
              marginBottom: 10, outline: 'none', resize: 'vertical', boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleSavePin} disabled={isSaving}
              style={{ flex: 1, fontSize: 12, background: '#f59e0b', color: '#0f1117', fontWeight: 600, border: 'none', borderRadius: 6, padding: '7px 0', cursor: 'pointer' }}>
              {isSaving ? 'Saving...' : 'Save Pin'}
            </button>
            <button onClick={() => { setPinPopup(null); setActiveTool('select'); }}
              style={{ fontSize: 12, background: '#374151', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 12px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
