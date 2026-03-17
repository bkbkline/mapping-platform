'use client';

import { useMapStore } from '@/lib/stores/map-store';

/**
 * MultiSelectBar - Floating bottom bar shown during multi-parcel selection.
 *
 * Displays the count of selected parcels, total acreage, and provides
 * Clear and Done actions. Positioned as a centered pill at the bottom of
 * the map viewport.
 */
export default function MultiSelectBar() {
  const multiSelectActive = useMapStore((s) => s.multiSelectActive);
  const selectedParcels = useMapStore((s) => s.selectedParcels);
  const clearSelectedParcels = useMapStore((s) => s.clearSelectedParcels);
  const toggleMultiSelect = useMapStore((s) => s.toggleMultiSelect);

  if (!multiSelectActive || selectedParcels.length === 0) return null;

  const totalAcres = selectedParcels.reduce((sum, p) => sum + (p.acreage ?? 0), 0);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '10px 20px',
        background: '#1e2230',
        borderRadius: 9999,
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.35)',
        fontFamily: 'Inter, sans-serif',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: '#e5e7eb',
        }}
      >
        {selectedParcels.length} parcel{selectedParcels.length !== 1 ? 's' : ''} selected
        {' '}&mdash;{' '}
        {totalAcres.toFixed(2)} acres
      </span>

      <button
        onClick={clearSelectedParcels}
        style={{
          height: 28,
          padding: '0 12px',
          borderRadius: 6,
          border: '1px solid #4b5563',
          background: 'transparent',
          color: '#9ca3af',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 150ms ease',
        }}
      >
        Clear
      </button>

      <button
        onClick={toggleMultiSelect}
        style={{
          height: 28,
          padding: '0 14px',
          borderRadius: 6,
          border: 'none',
          background: '#2563eb',
          color: '#ffffff',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 150ms ease',
        }}
      >
        Done
      </button>
    </div>
  );
}
