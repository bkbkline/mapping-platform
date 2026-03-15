'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  MAPBOX_TOKEN,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  BASEMAPS,
  PARCEL_MIN_ZOOM,
} from '@/lib/mapbox/config';
import { useMapStore } from '@/lib/stores/map-store';
import { useParcelStore } from '@/lib/stores/parcel-store';
import { useUIStore } from '@/lib/stores/ui-store';
import { mapBoundsToBBox, formatAcreage } from '@/lib/geospatial/utils';
import { fetchParcelsInViewport, fetchParcelById } from '@/lib/queries/parcels';
import { ParcelLayer } from './ParcelLayer';
import { DrawingTools } from './DrawingTools';
import { BasemapSwitcher } from './BasemapSwitcher';
import { MapToolbar } from './MapToolbar';
import { MapOverlays } from './MapOverlays';

/** Debounce delay for URL state updates (ms) */
const URL_UPDATE_DELAY = 500;

/** Debounce delay for viewport parcel fetching (ms) */
const FETCH_DELAY = 300;

/**
 * Parse initial map state from URL search parameters.
 * Falls back to default center/zoom when params are missing or invalid.
 */
function parseURLState(): { center: [number, number]; zoom: number } {
  if (typeof window === 'undefined') {
    return { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM };
  }

  const params = new URLSearchParams(window.location.search);
  const lat = parseFloat(params.get('lat') ?? '');
  const lng = parseFloat(params.get('lng') ?? '');
  const zoom = parseFloat(params.get('zoom') ?? '');

  return {
    center: [
      Number.isFinite(lng) ? lng : DEFAULT_CENTER[0],
      Number.isFinite(lat) ? lat : DEFAULT_CENTER[1],
    ],
    zoom: Number.isFinite(zoom) ? zoom : DEFAULT_ZOOM,
  };
}

/**
 * MapContainer is the primary map component for the industrial land mapping platform.
 * It initializes the Mapbox GL map, manages viewport-driven parcel loading,
 * handles parcel click/hover interactions, and persists viewport state to the URL.
 *
 * @returns The full-viewport map with floating toolbars, basemap switcher, and overlays.
 */
export function MapContainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const hoverPopupRef = useRef<mapboxgl.Popup | null>(null);
  const hoveredFeatureIdRef = useRef<string | number | null>(null);
  const urlTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setMapRef = useMapStore((s) => s.setMapRef);
  const setViewport = useMapStore((s) => s.setViewport);
  const activeBasemap = useMapStore((s) => s.activeBasemap);

  const setParcels = useParcelStore((s) => s.setParcels);
  const setSelectedParcel = useParcelStore((s) => s.setSelectedParcel);
  const setHoveredParcelId = useParcelStore((s) => s.setHoveredParcelId);
  const setParcelLoading = useParcelStore((s) => s.setLoading);

  const openRightPanel = useUIStore((s) => s.openRightPanel);

  /**
   * Update the browser URL with current map viewport state without triggering
   * a full page reload.
   */
  const updateURL = useCallback((map: mapboxgl.Map) => {
    if (urlTimerRef.current) clearTimeout(urlTimerRef.current);
    urlTimerRef.current = setTimeout(() => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      const params = new URLSearchParams(window.location.search);
      params.set('lat', center.lat.toFixed(5));
      params.set('lng', center.lng.toFixed(5));
      params.set('zoom', zoom.toFixed(2));
      const newURL = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, '', newURL);
    }, URL_UPDATE_DELAY);
  }, []);

  /**
   * Fetch parcels within the current viewport bounds when the map is zoomed
   * in past the minimum parcel zoom threshold.
   */
  const loadViewportParcels = useCallback(
    (map: mapboxgl.Map) => {
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
      fetchTimerRef.current = setTimeout(async () => {
        const zoom = map.getZoom();
        if (zoom < PARCEL_MIN_ZOOM) {
          setParcels([]);
          return;
        }
        const bounds = map.getBounds();
        if (!bounds) return;
        const bbox = mapBoundsToBBox(bounds);
        setParcelLoading(true);
        try {
          const parcels = await fetchParcelsInViewport(bbox);
          setParcels(parcels);
        } catch (err) {
          console.error('Failed to fetch viewport parcels:', err);
        } finally {
          setParcelLoading(false);
        }
      }, FETCH_DELAY);
    },
    [setParcels, setParcelLoading]
  );

  /**
   * Handle a click on a parcel feature: load full data and open detail panel.
   */
  const handleParcelClick = useCallback(
    async (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      const feature = e.features?.[0];
      if (!feature || !feature.properties) return;

      const parcelId = feature.properties['id'] as string | undefined;
      if (!parcelId) return;

      const parcel = await fetchParcelById(parcelId);
      if (parcel) {
        setSelectedParcel(parcel);
        openRightPanel('parcel');
      }
    },
    [setSelectedParcel, openRightPanel]
  );

  /**
   * Handle hover over parcel features: show a tooltip popup and set feature-state.
   */
  const handleParcelMouseMove = useCallback(
    (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      const map = mapRef.current;
      if (!map) return;

      const feature = e.features?.[0];
      if (!feature || !feature.properties) return;

      map.getCanvas().style.cursor = 'pointer';

      // Clear previous hover state
      if (hoveredFeatureIdRef.current !== null) {
        map.setFeatureState(
          { source: 'parcels-source', id: hoveredFeatureIdRef.current },
          { hover: false }
        );
      }

      const featureId = feature.id;
      if (featureId !== undefined && featureId !== null) {
        hoveredFeatureIdRef.current = featureId;
        map.setFeatureState(
          { source: 'parcels-source', id: featureId },
          { hover: true }
        );
        setHoveredParcelId(String(featureId));
      }

      // Show hover popup
      const apn = feature.properties['apn'] ?? 'N/A';
      const acreage = feature.properties['acreage'];
      const zoning = feature.properties['zoning'] ?? 'N/A';
      const formattedAcreage = acreage != null ? formatAcreage(Number(acreage)) : 'N/A';

      if (!hoverPopupRef.current) {
        hoverPopupRef.current = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          className: 'parcel-hover-popup',
          maxWidth: '240px',
        });
      }

      hoverPopupRef.current
        .setLngLat(e.lngLat)
        .setHTML(
          `<div style="font-family: system-ui, sans-serif; font-size: 12px; line-height: 1.4;">
            <div style="font-weight: 600; margin-bottom: 2px;">APN: ${apn}</div>
            <div>Acreage: ${formattedAcreage}</div>
            <div>Zoning: ${zoning}</div>
          </div>`
        )
        .addTo(map);
    },
    [setHoveredParcelId]
  );

  /**
   * Handle mouse leaving the parcel layer: clear hover state and remove popup.
   */
  const handleParcelMouseLeave = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    map.getCanvas().style.cursor = '';

    if (hoveredFeatureIdRef.current !== null) {
      map.setFeatureState(
        { source: 'parcels-source', id: hoveredFeatureIdRef.current },
        { hover: false }
      );
      hoveredFeatureIdRef.current = null;
      setHoveredParcelId(null);
    }

    if (hoverPopupRef.current) {
      hoverPopupRef.current.remove();
    }
  }, [setHoveredParcelId]);

  // Initialize Mapbox map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const { center, zoom } = parseURLState();
    const basemapConfig = BASEMAPS.find((b) => b.id === activeBasemap) ?? BASEMAPS[0];

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: basemapConfig.url,
      center,
      zoom,
      attributionControl: false,
    });

    map.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      'bottom-right'
    );

    map.on('load', () => {
      mapRef.current = map;
      setMapRef(map);
      setMapReady(true);

      // Set initial viewport state
      const c = map.getCenter();
      setViewport({
        latitude: c.lat,
        longitude: c.lng,
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch(),
      });

      // Initial parcel load
      loadViewportParcels(map);
    });

    // Viewport change handlers
    map.on('moveend', () => {
      const c = map.getCenter();
      setViewport({
        latitude: c.lat,
        longitude: c.lng,
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch(),
      });
      updateURL(map);
      loadViewportParcels(map);
    });

    // Parcel interaction handlers
    map.on('click', 'parcels-fill', handleParcelClick);
    map.on('mousemove', 'parcels-fill', handleParcelMouseMove);
    map.on('mouseleave', 'parcels-fill', handleParcelMouseLeave);

    // Cleanup
    return () => {
      if (urlTimerRef.current) clearTimeout(urlTimerRef.current);
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
      if (hoverPopupRef.current) hoverPopupRef.current.remove();

      map.off('click', 'parcels-fill', handleParcelClick);
      map.off('mousemove', 'parcels-fill', handleParcelMouseMove);
      map.off('mouseleave', 'parcels-fill', handleParcelMouseLeave);

      setMapRef(null);
      mapRef.current = null;
      setMapReady(false);
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative flex-1 h-full w-full">
      <div ref={containerRef} className="absolute inset-0" />
      {mapReady && mapRef.current && (
        <>
          <ParcelLayer map={mapRef.current} />
          <DrawingTools map={mapRef.current} />
          <MapOverlays map={mapRef.current} />
        </>
      )}
      <BasemapSwitcher />
      <MapToolbar />
    </div>
  );
}
