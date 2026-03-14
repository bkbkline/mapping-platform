'use client';

import { useCallback } from 'react';
import { useUIStore } from '@/lib/stores/ui-store';

/** Tool definition for the toolbar */
interface ToolDef {
  id: 'select' | 'draw-polygon' | 'draw-line' | 'draw-point' | 'measure-distance' | 'measure-area' | 'delete';
  label: string;
  icon: React.ReactNode;
}

/** SVG icon components for each tool */
const SelectIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
    <path d="M13 13l6 6" />
  </svg>
);

const PolygonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3l12 3 3 12-9 3-9-6z" />
  </svg>
);

const LineIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="19" x2="19" y2="5" />
    <circle cx="5" cy="19" r="2" />
    <circle cx="19" cy="5" r="2" />
  </svg>
);

const PointIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
  </svg>
);

const MeasureDistanceIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12h20" />
    <path d="M6 8v8" />
    <path d="M18 8v8" />
    <path d="M12 10v4" />
  </svg>
);

const MeasureAreaIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="1" />
    <path d="M4 12h4" />
    <path d="M16 12h4" />
    <path d="M12 4v4" />
    <path d="M12 16v4" />
  </svg>
);

const DeleteIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

/** Tool definitions rendered in order */
const TOOLS: ToolDef[] = [
  { id: 'select', label: 'Select', icon: <SelectIcon /> },
  { id: 'draw-polygon', label: 'Draw Polygon', icon: <PolygonIcon /> },
  { id: 'draw-line', label: 'Draw Line', icon: <LineIcon /> },
  { id: 'draw-point', label: 'Draw Point', icon: <PointIcon /> },
  { id: 'measure-distance', label: 'Measure Distance', icon: <MeasureDistanceIcon /> },
  { id: 'measure-area', label: 'Measure Area', icon: <MeasureAreaIcon /> },
  { id: 'delete', label: 'Delete All Drawings', icon: <DeleteIcon /> },
];

/**
 * MapToolbar renders a floating vertical toolbar on the left side of the map
 * with buttons for selection, drawing, measurement, and deletion tools.
 * The active tool is highlighted, and clicking a tool updates the UI store.
 * The delete button clears all drawn features via a custom DOM event.
 */
export function MapToolbar() {
  const activeTool = useUIStore((s) => s.activeTool);
  const setActiveTool = useUIStore((s) => s.setActiveTool);

  const handleToolClick = useCallback(
    (toolId: ToolDef['id']) => {
      if (toolId === 'delete') {
        window.dispatchEvent(new CustomEvent('map:delete-drawings'));
        return;
      }

      // Toggle tool: if already active, go back to select
      if (activeTool === toolId) {
        setActiveTool('select');
      } else {
        setActiveTool(toolId);
      }
    },
    [activeTool, setActiveTool]
  );

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 bg-gray-900/90 backdrop-blur-sm rounded-lg p-1 shadow-xl">
      {TOOLS.map((tool) => {
        const isActive = activeTool === tool.id;
        const isDelete = tool.id === 'delete';

        return (
          <div key={tool.id} className="relative group">
            <button
              onClick={() => handleToolClick(tool.id)}
              className={`
                flex items-center justify-center w-9 h-9 rounded-md transition-all
                ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : isDelete
                      ? 'text-gray-300 hover:bg-red-600/80 hover:text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }
              `}
              title={tool.label}
              aria-label={tool.label}
            >
              {tool.icon}
            </button>
            {/* Tooltip */}
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg">
              {tool.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
