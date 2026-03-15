'use client';

import dynamic from 'next/dynamic';
import TopBar from '@/components/map/TopBar';
import SidebarPanel from '@/components/map/SidebarPanel';
import MapToolbarNew from '@/components/map/MapToolbarNew';
import RightPanel from '@/components/panels/RightPanel';
import { useUIStore } from '@/lib/stores/ui-store';

const MapContainer = dynamic(
  () => import('@/components/map/MapContainer').then((mod) => mod.MapContainer),
  { ssr: false }
);

export default function HomePage() {
  const rightPanelOpen = useUIStore((s) => s.rightPanelOpen);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Top Bar - fixed, z-50 */}
      <TopBar />

      {/* Map - full screen behind everything */}
      <div className="absolute inset-0" style={{ zIndex: 0, paddingTop: 52 }}>
        <div className="w-full h-full relative">
          <MapContainer />
        </div>
      </div>

      {/* Left Sidebar - floating, z-40 */}
      <SidebarPanel />

      {/* Map Toolbar - floating top-right, z-40 */}
      <MapToolbarNew />

      {/* Right Panel - parcel detail */}
      {rightPanelOpen && (
        <div className="absolute top-[52px] right-0 bottom-0 z-40">
          <RightPanel />
        </div>
      )}
    </div>
  );
}
