'use client';

import { useUIStore } from '@/lib/stores/ui-store';
import ParcelDetailCard from '@/components/panels/ParcelDetailCard';
import CompDetailCard from '@/components/panels/CompDetailCard';

/**
 * Placeholder for the ProjectPanel component.
 * Displays project details and site pipeline when rightPanelContent is 'project'.
 */
function ProjectPanel() {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Project Details</h3>
      <p className="text-sm text-gray-500">Select a project from the left panel to view details.</p>
    </div>
  );
}

/**
 * Placeholder for the AnalyticsPanel component.
 * Displays analytics dashboards and comp summaries when rightPanelContent is 'analytics'.
 */
function AnalyticsPanel() {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
      <p className="text-sm text-gray-500">Analytics and market data will appear here.</p>
    </div>
  );
}

/** Map panel content type to display label */
const CONTENT_LABELS: Record<string, string> = {
  parcel: 'Parcel Details',
  comp: 'Comparable Sale',
  project: 'Project',
  analytics: 'Analytics',
};

/**
 * RightPanel - Sliding right sidebar panel for the mapping platform.
 *
 * Dynamically renders content based on the rightPanelContent value in the UI store.
 * Supports parcel details, comp details, project info, and analytics views.
 * 380px wide with a slide-in animation from the right.
 */
export default function RightPanel() {
  const { rightPanelOpen, rightPanelContent, closeRightPanel } = useUIStore();

  const renderContent = () => {
    switch (rightPanelContent) {
      case 'parcel':
        return <ParcelDetailCard />;
      case 'comp':
        return <CompDetailCard />;
      case 'project':
        return <ProjectPanel />;
      case 'analytics':
        return <AnalyticsPanel />;
      default:
        return null;
    }
  };

  return (
    <aside
      className={`fixed right-0 top-0 z-40 flex h-full w-[380px] flex-col bg-white border-l border-gray-200 shadow-xl transition-transform duration-300 ease-in-out ${
        rightPanelOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">
          {rightPanelContent ? CONTENT_LABELS[rightPanelContent] ?? '' : ''}
        </h2>
        <button
          type="button"
          onClick={closeRightPanel}
          className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          aria-label="Close panel"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">{renderContent()}</div>
    </aside>
  );
}
