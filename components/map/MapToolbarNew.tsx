'use client';

import { useUIStore } from '@/lib/stores/ui-store';

type ToolId =
  | 'select'
  | 'polygon-select'
  | 'draw-rectangle'
  | 'draw-circle'
  | 'draw-line'
  | 'draw-point'
  | 'place-pin'
  | 'measure-distance'
  | 'fit-bounds'
  | 'fullscreen'
  | 'upload'
  | 'reset-view'
  | 'delete';

interface ToolDef {
  id: ToolId;
  label: string;
  icon: React.ReactNode;
}

const ICON_SIZE = 18;
const STROKE = 'currentColor';
const SW = 2;
const CAP = 'round' as const;
const JOIN = 'round' as const;

/** Tool groups separated by dividers */
const TOOL_GROUPS: ToolDef[][] = [
  // Group 1 - Selection
  [
    {
      id: 'select',
      label: 'Select',
      icon: (
        <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth={SW} strokeLinecap={CAP} strokeLinejoin={JOIN}>
          <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
          <path d="M13 13l6 6" />
        </svg>
      ),
    },
    {
      id: 'polygon-select',
      label: 'Polygon Select',
      icon: (
        <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth={SW} strokeLinecap={CAP} strokeLinejoin={JOIN}>
          <path d="M12 2l8 5v6l-8 5-8-5V7l8-5z" />
        </svg>
      ),
    },
  ],
  // Group 2 - Draw
  [
    {
      id: 'draw-rectangle',
      label: 'Rectangle',
      icon: (
        <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth={SW} strokeLinecap={CAP} strokeLinejoin={JOIN}>
          <rect x="3" y="5" width="18" height="14" rx="1" />
        </svg>
      ),
    },
    {
      id: 'draw-circle',
      label: 'Circle',
      icon: (
        <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth={SW} strokeLinecap={CAP} strokeLinejoin={JOIN}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      ),
    },
    {
      id: 'draw-line',
      label: 'Line',
      icon: (
        <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth={SW} strokeLinecap={CAP} strokeLinejoin={JOIN}>
          <line x1="5" y1="19" x2="19" y2="5" />
          <circle cx="5" cy="19" r="2" />
          <circle cx="19" cy="5" r="2" />
        </svg>
      ),
    },
  ],
  // Group 3 - Markers
  [
    {
      id: 'place-pin',
      label: 'Pin / Marker',
      icon: (
        <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth={SW} strokeLinecap={CAP} strokeLinejoin={JOIN}>
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ),
    },
    {
      id: 'measure-distance',
      label: 'Measure',
      icon: (
        <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth={SW} strokeLinecap={CAP} strokeLinejoin={JOIN}>
          <path d="M2 12h5" />
          <path d="M17 12h5" />
          <path d="M7 4v16" />
          <path d="M17 4v16" />
          <path d="M7 12h10" />
          <path d="M9 8v-1" />
          <path d="M12 8v-2" />
          <path d="M15 8v-1" />
        </svg>
      ),
    },
  ],
  // Group 4 - View
  [
    {
      id: 'fit-bounds',
      label: 'Fit Bounds',
      icon: (
        <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth={SW} strokeLinecap={CAP} strokeLinejoin={JOIN}>
          <circle cx="12" cy="12" r="3" />
          <line x1="12" y1="2" x2="12" y2="6" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="2" y1="12" x2="6" y2="12" />
          <line x1="18" y1="12" x2="22" y2="12" />
        </svg>
      ),
    },
    {
      id: 'fullscreen',
      label: 'Fullscreen',
      icon: (
        <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth={SW} strokeLinecap={CAP} strokeLinejoin={JOIN}>
          <polyline points="15 3 21 3 21 9" />
          <polyline points="9 21 3 21 3 15" />
          <line x1="21" y1="3" x2="14" y2="10" />
          <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
      ),
    },
  ],
  // Group 5 - Actions
  [
    {
      id: 'upload',
      label: 'Upload / Import',
      icon: (
        <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth={SW} strokeLinecap={CAP} strokeLinejoin={JOIN}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      ),
    },
    {
      id: 'reset-view',
      label: 'Reset View',
      icon: (
        <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth={SW} strokeLinecap={CAP} strokeLinejoin={JOIN}>
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
      ),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: (
        <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth={SW} strokeLinecap={CAP} strokeLinejoin={JOIN}>
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
      ),
    },
  ],
];

export default function MapToolbarNew() {
  const { activeTool, setActiveTool } = useUIStore();

  return (
    <div
      style={{
        position: 'absolute',
        left: 252,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
      }}
    >
      {TOOL_GROUPS.map((group, gi) => (
        <div key={gi}>
          {gi > 0 && (
            <div
              style={{
                height: 1,
                background: '#2d3748',
              }}
            />
          )}
          {group.map((tool) => {
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                title={tool.label}
                style={{
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  background: isActive ? '#f59e0b' : '#1e2430',
                  color: isActive ? '#0f1117' : '#94a3b8',
                  cursor: 'pointer',
                  padding: 0,
                  borderRadius: 0,
                }}
              >
                {tool.icon}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
