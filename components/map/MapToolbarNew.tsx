'use client';

import { useUIStore } from '@/lib/stores/ui-store';
import { useLayerStore } from '@/lib/stores/layer-store';

type ActiveTool =
  | 'select'
  | 'draw-polygon'
  | 'draw-line'
  | 'draw-point'
  | 'measure-distance'
  | 'measure-area'
  | null;

interface ToolDef {
  id: ActiveTool;
  label: string;
  icon: React.ReactNode;
}

const TOOLS: ToolDef[] = [
  {
    id: 'draw-line',
    label: 'Draw',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19l7-7 3 3-7 7-3-3z" />
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        <path d="M2 2l7.586 7.586" />
        <circle cx="11" cy="11" r="2" />
      </svg>
    ),
  },
  {
    id: 'draw-polygon',
    label: 'Shape',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
      </svg>
    ),
  },
  {
    id: 'measure-distance',
    label: 'Measure',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12h5" />
        <path d="M17 12h5" />
        <path d="M7 4v16" />
        <path d="M17 4v16" />
        <path d="M7 12h10" />
      </svg>
    ),
  },
  {
    id: 'draw-point',
    label: 'Pin',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    id: null,
    label: 'Erase',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 20H7L2 15l9-9 9 9-5 5" />
        <path d="M6 11l4 4" />
      </svg>
    ),
  },
];

export default function MapToolbarNew() {
  const { activeTool, setActiveTool } = useUIStore();
  const { layers, toggleLayer } = useLayerStore();

  const parcelsOn = layers['parcels'] ?? false;

  return (
    <div
      style={{
        position: 'absolute',
        top: 68,
        right: 16,
        zIndex: 40,
      }}
    >
      {/* Row 1 - Tools bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}
      >
        {/* Tools label + chevron */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '0 10px',
            height: 32,
            fontSize: 13,
            fontWeight: 500,
            color: '#374151',
            cursor: 'default',
            whiteSpace: 'nowrap',
          }}
        >
          Tools
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {/* Divider */}
        <div
          style={{
            width: 1,
            height: 20,
            background: '#e5e7eb',
            flexShrink: 0,
          }}
        />

        {/* Tool buttons */}
        {TOOLS.map((tool, i) => {
          const isActive = activeTool === tool.id && tool.id !== null;
          return (
            <button
              key={tool.label + i}
              onClick={() => setActiveTool(tool.id)}
              title={tool.label}
              style={{
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: isActive ? '#eff6ff' : 'transparent',
                color: isActive ? '#2563eb' : '#6b7280',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {tool.icon}
            </button>
          );
        })}
      </div>

      {/* Row 2 - Parcels + Reports */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginTop: 6,
          justifyContent: 'flex-end',
        }}
      >
        {/* Parcels toggle */}
        <button
          onClick={() => toggleLayer('parcels')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            border: '1px solid #e5e7eb',
            background: '#ffffff',
            borderRadius: 9999,
            padding: '4px 12px',
            fontSize: 12,
            fontWeight: 500,
            color: parcelsOn ? '#2563eb' : '#6b7280',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Parcels: {parcelsOn ? 'On' : 'Off'}
        </button>

        {/* Reports */}
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            border: '1px solid #e5e7eb',
            background: '#ffffff',
            borderRadius: 9999,
            padding: '4px 12px',
            fontSize: 12,
            fontWeight: 500,
            color: '#6b7280',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
          onClick={() => {
            /* placeholder */
          }}
        >
          Reports
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
    </div>
  );
}
