'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMapStore } from '@/lib/stores/map-store';
import { useLayerStore } from '@/lib/stores/layer-store';
import { useUIStore } from '@/lib/stores/ui-store';
import { supabase } from '@/lib/supabase/client';
import { INDUSTRIAL_ITEMS, type ItemGeometry } from '@/lib/map/itemSets';
import MapNotesPanel from '@/components/map/MapNotesPanel';

/** Map record from Supabase */
interface MapRecord {
  id: string;
  title: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

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
type SectionId = 'basemap' | 'overlays' | 'my-items' | 'gallery' | 'dashboard';

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
    label: 'Add Items',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
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
  const [expandedSection, setExpandedSection] = useState<SectionId | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mapsOpen, setMapsOpen] = useState(false);
  const [maps, setMaps] = useState<MapRecord[]>([]);
  const [mapsLoading, setMapsLoading] = useState(false);

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const { mapRef, activeBasemap, setActiveBasemap, activeMapId, setActiveMapId } = useMapStore();
  const { layers, toggleLayer } = useLayerStore();

  // Fetch maps when dropdown is opened
  useEffect(() => {
    if (!mapsOpen) return;
    setMapsLoading(true);
    (async () => {
      try {
        const { data } = await supabase.from('maps').select('*');
        setMaps((data as MapRecord[]) ?? []);
      } catch {
        // ignore fetch errors
      } finally {
        setMapsLoading(false);
      }
    })();
  }, [mapsOpen]);

  const activeMapName = maps.find((m) => m.id === activeMapId)?.title ?? null;
  const displayTitle = activeMapName ?? 'Production Map';

  // Focus the title input when editing starts
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  const handleTitleClick = () => {
    setTitleDraft(displayTitle);
    setEditingTitle(true);
  };

  const handleTitleSave = async () => {
    setEditingTitle(false);
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === displayTitle) return;

    if (activeMapId) {
      // Update in Supabase and local state
      await supabase.from('maps').update({ title: trimmed }).eq('id', activeMapId);
      setMaps((prev) =>
        prev.map((m) => (m.id === activeMapId ? { ...m, title: trimmed } : m))
      );
    }
  };

  const toggleSection = (id: SectionId) => {
    if (id === 'dashboard') {
      router.push('/dashboard');
      return;
    }
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
        width: collapsed ? 48 : 240,
        zIndex: 40,
        overflowY: collapsed ? 'hidden' : 'auto',
        overflowX: 'hidden',
        background: '#ffffff',
        boxShadow: '2px 0 8px rgba(0,0,0,0.06)',
        transition: 'width 200ms ease',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Sidebar Header */}
      {!collapsed && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            borderBottom: '1px solid #e5e7eb',
            background: '#ffffff',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
            {editingTitle ? (
              <input
                ref={titleInputRef}
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSave();
                  if (e.key === 'Escape') setEditingTitle(false);
                }}
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#111827',
                  border: '1px solid #2563eb',
                  borderRadius: 4,
                  padding: '1px 4px',
                  outline: 'none',
                  width: '100%',
                  fontFamily: 'inherit',
                  background: '#ffffff',
                }}
              />
            ) : (
              <span
                onClick={handleTitleClick}
                title="Click to rename"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#111827',
                  cursor: 'text',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {displayTitle}
              </span>
            )}
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
      )}

      {/* My Maps Section */}
      {!collapsed && (
        <div style={{ borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
          <button
            onClick={() => setMapsOpen(!mapsOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              padding: '8px 12px',
              border: 'none',
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
            <span style={{ flex: 1, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#374151' }}>
              {activeMapName ?? 'Select Map'}
            </span>
            <Chevron expanded={mapsOpen} />
          </button>

          {mapsOpen && (
            <div style={{ padding: '0 0 4px' }}>
              {mapsLoading ? (
                <div style={{ padding: '8px 12px', fontSize: 12, color: '#9ca3af' }}>
                  Loading maps...
                </div>
              ) : maps.length === 0 ? (
                <div style={{ padding: '8px 12px', fontSize: 12, color: '#9ca3af' }}>
                  No maps found
                </div>
              ) : (
                maps.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      setActiveMapId(m.id);
                      setMapsOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 12px 6px 36px',
                      fontSize: 12,
                      color: m.id === activeMapId ? '#2563eb' : '#374151',
                      fontWeight: m.id === activeMapId ? 600 : 400,
                      cursor: 'pointer',
                      background: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = '#f9fafb';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: m.id === activeMapId ? '#2563eb' : 'transparent',
                        border: m.id === activeMapId ? 'none' : '1px solid #d1d5db',
                        flexShrink: 0,
                      }}
                    />
                    {m.title ?? 'Untitled Map'}
                  </div>
                ))
              )}

              {/* + New Map */}
              <div
                onClick={() => console.log('[SidebarPanel] New Map placeholder')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px 6px 36px',
                  fontSize: 12,
                  color: '#2563eb',
                  fontWeight: 500,
                  cursor: 'pointer',
                  marginTop: 2,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#eff6ff';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                + New Map
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collapsed: show only section icons */}
      {collapsed ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: 8 }}>
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => {
                setCollapsed(false);
                setExpandedSection(section.id);
              }}
              style={{
                width: 48,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: 0,
              }}
              title={section.label}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              {section.icon}
            </button>
          ))}
        </div>
      ) : (
        /* Expanded: Accordion sections */
        <div style={{ flex: 1, overflowY: 'auto' }}>
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
                    {/* Dashboard navigates away; no expandable content */}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Notes Panel */}
      {!collapsed && <MapNotesPanel />}

      {/* Collapse/Expand toggle button at bottom */}
      <button
        onClick={() => setCollapsed((prev) => !prev)}
        style={{
          width: '100%',
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          borderTop: '1px solid #e5e7eb',
          background: '#f9fafb',
          cursor: 'pointer',
          padding: 0,
          flexShrink: 0,
        }}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = '#f3f4f6';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = '#f9fafb';
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6b7280"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transition: 'transform 200ms ease',
            transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
          }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
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

// ── Add Items Content (was Gallery) ──────────────────────────────────────────
function GalleryContent() {
  const { setActiveTool } = useUIStore();

  const geometryToTool = (geometry: ItemGeometry) => {
    switch (geometry) {
      case 'point':
        return 'draw-point' as const;
      case 'line':
        return 'draw-line' as const;
      case 'polygon':
        return 'draw-polygon' as const;
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 6,
        padding: '10px 12px',
      }}
    >
      {INDUSTRIAL_ITEMS.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTool(geometryToTool(item.geometry))}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 4px',
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            background: '#ffffff',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
          title={item.name}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#f9fafb';
            (e.currentTarget as HTMLElement).style.borderColor = '#d1d5db';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#ffffff';
            (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb';
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: item.color,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 10,
              color: '#374151',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {item.name}
          </span>
        </button>
      ))}
    </div>
  );
}

