'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { searchParcels } from '@/lib/queries/parcels';
import { useMapStore } from '@/lib/stores/map-store';
import { getCenter } from '@/lib/geospatial/utils';

export default function TopBar() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const router = useRouter();
  const flyTo = useMapStore((s) => s.flyTo);

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearching(true);
    try {
      const results = await searchParcels(trimmed, 1);
      if (results.length > 0 && results[0].geometry) {
        const [lng, lat] = getCenter(results[0].geometry);
        flyTo(lng, lat, 15);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 52,
        zIndex: 50,
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Left side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Logo */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: -0.5,
            flexShrink: 0,
          }}
        >
          LI
        </div>

        {/* Smart Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            width: 340,
            height: 36,
            border: '1px solid #e5e7eb',
            borderRadius: 9999,
            overflow: 'hidden',
            background: '#ffffff',
          }}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 10px',
              height: '100%',
              background: '#2563eb',
              color: '#ffffff',
              fontSize: 11,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              letterSpacing: 0.2,
            }}
          >
            Smart Search
          </span>
          <input
            type="text"
            placeholder="Search Owner Name, Address, Parcel ID"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={searching}
            style={{
              flex: 1,
              height: '100%',
              border: 'none',
              outline: 'none',
              fontSize: 12,
              padding: '0 8px',
              color: '#374151',
              background: 'transparent',
            }}
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 34,
              height: '100%',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              flexShrink: 0,
              padding: 0,
            }}
            title="Search"
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
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Preview Map */}
        <button
          style={{
            height: 32,
            padding: '0 14px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            background: '#ffffff',
            color: '#4b5563',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Preview Map
        </button>

        {/* Help */}
        <button
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: '1px solid #d1d5db',
            background: '#ffffff',
            color: '#6b7280',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
          title="Help"
        >
          ?
        </button>

        {/* Save */}
        <button
          style={{
            height: 32,
            padding: '0 16px',
            border: 'none',
            borderRadius: 6,
            background: '#2563eb',
            color: '#ffffff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Save
        </button>

        {/* Share */}
        <button
          style={{
            height: 32,
            padding: '0 14px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            background: '#ffffff',
            color: '#4b5563',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            whiteSpace: 'nowrap',
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          Share
        </button>

        {/* User Avatar */}
        <button
          onClick={handleSignOut}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: 'none',
            background: '#6366f1',
            color: '#ffffff',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
          title="Sign out"
        >
          TU
        </button>
      </div>
    </div>
  );
}
