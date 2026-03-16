import { create } from 'zustand';

type RightPanelContent = 'parcel' | 'comp' | 'project' | 'analytics' | null;

type ActiveTool =
  | 'select'
  | 'polygon-select'
  | 'draw-rectangle'
  | 'draw-circle'
  | 'draw-polygon'
  | 'draw-line'
  | 'draw-point'
  | 'measure-distance'
  | 'measure-area'
  | 'fit-bounds'
  | 'fullscreen'
  | 'upload'
  | 'reset-view'
  | 'delete'
  | null;

interface UIState {
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  rightPanelContent: RightPanelContent;
  activeTool: ActiveTool;
  searchQuery: string;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setRightPanelContent: (content: RightPanelContent) => void;
  openRightPanel: (content: RightPanelContent) => void;
  closeRightPanel: () => void;
  setActiveTool: (tool: ActiveTool) => void;
  setSearchQuery: (query: string) => void;
}

/**
 * Zustand store for managing application UI state including panels, tools, and search.
 */
export const useUIStore = create<UIState>((set) => ({
  leftPanelOpen: true,
  rightPanelOpen: false,
  rightPanelContent: null,
  activeTool: 'select',
  searchQuery: '',

  /**
   * Toggle the left sidebar panel open/closed.
   */
  toggleLeftPanel: () =>
    set((state) => ({ leftPanelOpen: !state.leftPanelOpen })),

  /**
   * Toggle the right detail panel open/closed.
   */
  toggleRightPanel: () =>
    set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),

  /**
   * Set the content type displayed in the right panel without changing its open state.
   * @param content - The content type to display, or null
   */
  setRightPanelContent: (content) => set({ rightPanelContent: content }),

  /**
   * Open the right panel and set its content in a single action.
   * @param content - The content type to display
   */
  openRightPanel: (content) =>
    set({ rightPanelOpen: true, rightPanelContent: content }),

  /**
   * Close the right panel and clear its content.
   */
  closeRightPanel: () =>
    set({ rightPanelOpen: false, rightPanelContent: null }),

  /**
   * Set the active map interaction tool.
   * @param tool - The tool to activate (e.g. 'select', 'draw-polygon'), or null
   */
  setActiveTool: (tool) => set({ activeTool: tool }),

  /**
   * Set the global search query string.
   * @param query - The search query text
   */
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
