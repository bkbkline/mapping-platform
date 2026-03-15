'use client';

import { MapContainer } from '@/components/map/MapContainer';
import LeftPanel from '@/components/panels/LeftPanel';
import RightPanel from '@/components/panels/RightPanel';
import { useUIStore } from '@/lib/stores/ui-store';

/**
 * Main landing page serving as the primary map interface.
 * Renders the three-column layout: left panel, map, and right panel.
 */
export default function HomePage() {
  const leftPanelOpen = useUIStore((s) => s.leftPanelOpen);
  const rightPanelOpen = useUIStore((s) => s.rightPanelOpen);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {leftPanelOpen && <LeftPanel />}
      <main className="flex-1 relative h-full min-h-0">
        <MapContainer />
      </main>
      {rightPanelOpen && <RightPanel />}
    </div>
  );
}
