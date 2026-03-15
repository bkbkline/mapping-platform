'use client';

import { useState } from 'react';
import { useMapStore } from '@/lib/stores/map-store';
import { useLayerStore } from '@/lib/stores/layer-store';

// ── Layer metadata mapping ──────────────────────────────────────────────────
const LAYER_META: Record<string, { name: string; desc: string; color: string }> = {
  parcels: { name: 'Parcels', desc: 'Property boundaries', color: '#c4a882' },
  'parcel-labels': { name: 'Parcel Labels', desc: 'APN text labels', color: '#c4a882' },
  zoning: { name: 'Zoning', desc: 'Zoning districts', color: '#c4a882' },
  'flood-zones': { name: 'Flood Zones', desc: 'FEMA flood areas', color: '#86efac' },
  comps: { name: 'Sales Comps', desc: 'Recent transactions', color: '#f472b6' },
  'industrial-parks': { name: 'Industrial Parks', desc: 'Industrial areas', color: '#f472b6' },
  highways: { name: 'Highways', desc: 'Major highways', color: '#fb923c' },
  'rail-lines': { name: 'Rail Lines', desc: 'Railroad lines', color: '#fb923c' },
  'transmission-lines': { name: 'Power Lines', desc: 'Transmission lines', color: '#93c5fd' },
  'opportunity-zones': { name: 'Opportunity Zones', desc: 'Federal OZ areas', color: '#c4a882' },
  infrastructure: { name: 'Infrastructure', desc: 'Utilities & services', color: '#93c5fd' },
  'city-boundaries': { name: 'City Boundaries', desc: 'Municipal limits', color: '#c4a882' },
  'county-boundaries': { name: 'County Boundaries', desc: 'County borders', color: '#c4a882' },
  'land-use': { name: 'Land Use', desc: 'Land use designations', color: '#c4a882' },
  wetlands: { name: 'Wetlands', desc: 'Wetland areas', color: '#86efac' },
  terrain: { name: 'Terrain', desc: 'Elevation & terrain', color: '#86efac' },
  'truck-routes': { name: 'Truck Routes', desc: 'Designated truck routes', color: '#fb923c' },
  airports: { name: 'Airports', desc: 'Airport locations', color: '#fb923c' },
  substations: { name: 'Substations', desc: 'Power substations', color: '#93c5fd' },
  'water-service': { name: 'Water Service', desc: 'Water service areas', color: '#93c5fd' },
  'sewer-service': { name: 'Sewer Service', desc: 'Sewer service areas', color: '#93c5fd' },
  warehouses: { name: 'Warehouses', desc: 'Warehouse locations', color: '#f472b6' },
  'development-projects': { name: 'Development Projects', desc: 'Active developments', color: '#f472b6' },
};

// ── Basemap options ─────────────────────────────────────────────────────────
const BASEMAPS = [
  { id: 'satellite', label: 'Satellite', url: 'mapbox://styles/mapbox/satellite-streets-v12', swatch: '#1a3a4a' },
  { id: 'streets', label: 'Streets', url: 'mapbox://styles/mapbox/streets-v12', swatch: '#d4d4d8' },
  { id: 'light', label: 'Light', url: 'mapbox://styles/mapbox/light-v11', swatch: '#f0f0f0' },
  { id: 'dark', label: 'Dark', url: 'mapbox://styles/mapbox/dark-v11', swatch: '#3f3f46' },
  { id: 'terrain', label: 'Terrain', url: 'mapbox://styles/mapbox/outdoors-v12', swatch: '#6da87e' },
];

// ── Section definitions ─────────────────────────────────────────────────────
type SectionId = 'basemap' | 'overlays' | 'my-items' | 'gallery' | 'add-items';

interface SectionDef {
  id: SectionId;
  label: string;
  icon: React.ReactNode;
}

function icon18(d: string) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const SECTIONS: SectionDef[] = [
  {
    id: 'basemap',
    label: 'Basemap',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="6" rx="1" />
        <rect x="3" y="12" width="18" height="3" rx="1" />
        <rect x="3" y="18" width="18" height="3" rx="1" />
      </svg>
    ),
  },
  {
    id: 'overlays',
    label: 'Overlays',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="12" r="6" />
        <circle cx="15" cy="12" r="6" />
      </svg>
    ),
  },
  {
    id: 'my-items',
    label: 'My Items',
    icon: icon18('M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z'),
  },
  {
    id: 'gallery',
    label: 'Image Gallery',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    ),
  },
  {
    id: 'add-items',
    label: 'Add Items',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
];

// ── Chevron ──────────────────────────────────────────────────────────────────
function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#9ca3af"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transition: 'transform 150ms ease',
        transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
      }}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function SidebarPanel() {
  const [expandedSection, setExpandedSection] = useState<SectionId | null>('overlays');

  const { mapRef, activeBasemap, setActiveBasemap } = useMapStore();
  const { layers, toggleLayer } = useLayerStore();

  const toggleSection = (id: SectionId) => {
    setExpandedSection((prev) => (prev === id ? null : id));
  };

  const handleBasemapChange = (basemapId: string, url: string) => {
    mapRef?.setStyle(url);
    setActiveBasemap(basemapId);
  };

  // Current basemap label for chip
  const currentBasemapLabel = BASEMAPS.find((b) => b.id === activeBasemap)?.label ?? 'Streets';

  // All layer IDs
  const layerIds = Object.keys(layers);

  // Check if all layers are on
  const allLayersOn = layerIds.every((id) => layers[id]);

  const handleToggleAll = () => {
    const newValue = !allLayersOn;
    layerIds.forEach((id) => {
      if (layers[id] !== newValue) {
        toggleLayer(id);
      }
    });
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 52,
        left: 0,
        bottom: 0,
        width: 240,
        zIndex: 40,
        overflowY: 'auto',
        background: '#ffffff',
        boxShadow: '2px 0 8px rgba(0,0,0,0.06)',
      }}
    >
      {/* Sidebar Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          borderBottom: '1px solid #e5e7eb',
          background: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            <line x1="8" y1="2" x2="8" y2="18" />
            <line x1="16" y1="6" x2="16" y2="22" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Production Map</span>
        </div>
        <button
          style={{
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            borderRadius: 4,
            padding: 0,
          }}
          title="Map management"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
        </button>
      </div>

      {/* Accordion sections */}
      {SECTIONS.map((section) => {
        const isExpanded = expandedSection === section.id;

        return (
          <div key={section.id}>
            {/* Section header */}
            <button
              onClick={() => toggleSection(section.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                height: 40,
                padding: '0 12px',
                border: 'none',
                borderLeft: isExpanded ? '2px solid #2563eb' : '2px solid transparent',
                background: 'transparent',
                cursor: 'pointer',
                gap: 8,
                fontFamily: 'Inter, sans-serif',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              {section.icon}
              <span
                style={{
                  flex: 1,
                  textAlign: 'left',
                  fontSize: 13,
                  fontWeight: isExpanded ? 600 : 500,
                  color: isExpanded ? '#111827' : '#374151',
                }}
              >
                {section.label}
              </span>

              {/* Section-specific right elements */}
              {section.id === 'basemap' && (
                <span
                  style={{
                    fontSize: 11,
                    background: '#f3f4f6',
                    color: '#374151',
                    borderRadius: 9999,
                    padding: '2px 8px',
                    fontWeight: 500,
                    marginRight: 4,
                  }}
                >
                  {currentBasemapLabel}
                </span>
              )}

              {section.id === 'overlays' && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleAll();
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    color: allLayersOn ? '#2563eb' : '#6b7280',
                    fontWeight: 500,
                    marginRight: 4,
                    cursor: 'pointer',
                  }}
                >
                  All
                  <span
                    style={{
                      width: 28,
                      height: 16,
                      borderRadius: 9999,
                      background: allLayersOn ? '#2563eb' : '#d1d5db',
                      position: 'relative',
                      display: 'inline-block',
                      transition: 'background 150ms ease',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: 2,
                        left: allLayersOn ? 14 : 2,
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: '#ffffff',
                        transition: 'left 150ms ease',
                      }}
                    />
                  </span>
                </span>
              )}

              <Chevron expanded={isExpanded} />
            </button>

            {/* Section content */}
            {isExpanded && (
              <div>
                {section.id === 'basemap' && (
                  <BasemapContent
                    activeBasemap={activeBasemap}
                    onSelect={handleBasemapChange}
                  />
                )}
                {section.id === 'overlays' && (
                  <OverlaysContent
                    layers={layers}
                    onToggle={toggleLayer}
                  />
                )}
                {section.id === 'my-items' && <MyItemsContent />}
                {section.id === 'gallery' && <GalleryContent />}
                {section.id === 'add-items' && <AddItemsContent />}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Basemap Content ─────────────────────────────────────────────────────────
function BasemapContent({
  activeBasemap,
  onSelect,
}: {
  activeBasemap: string;
  onSelect: (id: string, url: string) => void;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
        padding: '10px 12px',
      }}
    >
      {BASEMAPS.map((bm) => (
        <button
          key={bm.id}
          onClick={() => onSelect(bm.id, bm.url)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            padding: 4,
            border: activeBasemap === bm.id ? '2px solid #2563eb' : '2px solid transparent',
            borderRadius: 6,
            background: 'transparent',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: 40,
              height: 30,
              borderRadius: 4,
              background: bm.swatch,
              border: '1px solid #e5e7eb',
            }}
          />
          <span style={{ fontSize: 11, color: '#374151', fontWeight: 500 }}>
            {bm.label}
          </span>
        </button>
      ))}
    </div>
  );
}

// ── Overlays Content ────────────────────────────────────────────────────────
function OverlaysContent({
  layers,
  onToggle,
}: {
  layers: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  const layerIds = Object.keys(layers);

  return (
    <div>
      {layerIds.map((id) => {
        const meta = LAYER_META[id] ?? {
          name: id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          desc: '',
          color: '#9ca3af',
        };
        const isOn = layers[id];

        return (
          <div
            key={id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 12px',
              borderBottom: '1px solid #f3f4f6',
              gap: 10,
              cursor: 'pointer',
            }}
            onClick={() => onToggle(id)}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#f9fafb';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            {/* Thumbnail */}
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 6,
                background: meta.color,
                flexShrink: 0,
                opacity: isOn ? 1 : 0.5,
              }}
            />

            {/* Name / desc */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#111827',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {meta.name}
              </div>
              {meta.desc && (
                <div
                  style={{
                    fontSize: 11,
                    color: '#6b7280',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {meta.desc}
                </div>
              )}
            </div>

            {/* Circular toggle */}
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                border: isOn ? '2px solid #2563eb' : '2px solid #d1d5db',
                background: isOn ? '#2563eb' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {isOn && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          </div>
        );
      })}

      {/* Add Layer row */}
      <div
        style={{
          padding: '10px 12px',
          fontSize: 13,
          color: '#2563eb',
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
        onClick={() => {
          /* placeholder */
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = '#eff6ff';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'transparent';
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        + Add Layer
      </div>
    </div>
  );
}

// ── My Items Content ────────────────────────────────────────────────────────
function MyItemsContent() {
  return (
    <div style={{ padding: '16px 12px' }}>
      <div style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginBottom: 12 }}>
        No saved items yet
      </div>
      <div
        style={{
          fontSize: 13,
          color: '#2563eb',
          fontWeight: 500,
          textAlign: 'center',
          cursor: 'pointer',
        }}
        onClick={() => {
          /* placeholder */
        }}
      >
        + New Collection
      </div>
    </div>
  );
}

// ── Gallery Content ─────────────────────────────────────────────────────────
function GalleryContent() {
  return (
    <div style={{ padding: '16px 12px' }}>
      <div style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
        No images uploaded yet
      </div>
    </div>
  );
}

// ── Add Items Content ───────────────────────────────────────────────────────
function AddItemsContent() {
  const actions: { label: string; icon: React.ReactNode }[] = [
    {
      label: 'Upload File',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 16 12 12 8 16" />
          <line x1="12" y1="12" x2="12" y2="21" />
          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
        </svg>
      ),
    },
    {
      label: 'Draw on Map',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          <path d="M2 2l7.586 7.586" />
          <circle cx="11" cy="11" r="2" />
        </svg>
      ),
    },
    {
      label: 'Add from URL',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      ),
    },
    {
      label: 'New Annotation',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      {actions.map((action) => (
        <div
          key={action.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 12px',
            fontSize: 13,
            color: '#374151',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#f9fafb';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
          }}
        >
          {action.icon}
          {action.label}
        </div>
      ))}
    </div>
  );
}
