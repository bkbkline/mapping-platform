'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { searchParcels } from '@/lib/queries/parcels';
import { useMapStore } from '@/lib/stores/map-store';
import { getCenter } from '@/lib/geospatial/utils';

interface SearchResult {
  type: 'parcel' | 'geocoded';
  label: string;
  sublabel: string;
  lng: number;
  lat: number;
  zoom: number;
}

export default function TopBar() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const flyTo = useMapStore((s) => s.flyTo);

  /** Run both parcel + geocoding searches */
  const executeSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    setSearching(true);
    try {
      const [parcelResults, geocodeResponse] = await Promise.allSettled([
        searchParcels(trimmed, 5),
        fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&country=US&types=address,place&limit=5`
        ).then((r) => r.json()),
      ]);

      const merged: SearchResult[] = [];

      // Parcel results
      if (parcelResults.status === 'fulfilled') {
        for (const p of parcelResults.value) {
          if (p.geometry) {
            const [lng, lat] = getCenter(p.geometry);
            merged.push({
              type: 'parcel',
              label: p.situs_address || p.apn || 'Unknown Parcel',
              sublabel: p.county || '',
              lng,
              lat,
              zoom: 16,
            });
          }
        }
      }

      // Geocoded results
      if (geocodeResponse.status === 'fulfilled' && geocodeResponse.value?.features) {
        for (const f of geocodeResponse.value.features) {
          merged.push({
            type: 'geocoded',
            label: f.place_name || f.text || '',
            sublabel: 'Geocoded',
            lng: f.center[0],
            lat: f.center[1],
            zoom: f.place_type?.includes('address') ? 17 : 13,
          });
        }
      }

      setResults(merged);
      setShowDropdown(merged.length > 0);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  }, []);

  /** Debounce input changes */
  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      executeSearch(value);
    }, 300);
  };

  /** Select a result */
  const handleSelect = (r: SearchResult) => {
    flyTo(r.lng, r.lat, r.zoom);
    setShowDropdown(false);
    setQuery(r.label);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (results.length > 0) {
        handleSelect(results[0]);
      }
    }
    if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  /** Close dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /** Cleanup debounce on unmount */
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

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
        <div style={{ position: 'relative' }}>
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
              ref={inputRef}
              type="text"
              placeholder="Search Owner Name, Address, Parcel ID"
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
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
              onClick={() => executeSearch(query)}
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

          {/* Search Results Dropdown */}
          {showDropdown && results.length > 0 && (
            <div
              ref={dropdownRef}
              style={{
                position: 'absolute',
                top: 40,
                left: 0,
                width: 340,
                maxHeight: 320,
                overflowY: 'auto',
                background: '#ffffff',
                borderRadius: 10,
                boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
                zIndex: 50,
                border: '1px solid #e5e7eb',
              }}
            >
              {results.map((r, i) => (
                <button
                  key={`${r.type}-${i}`}
                  onClick={() => handleSelect(r)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '10px 12px',
                    border: 'none',
                    borderBottom: i < results.length - 1 ? '1px solid #f3f4f6' : 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: 13,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f9fafb'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 500,
                        color: '#1f2937',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {r.label}
                    </div>
                    {r.sublabel && (
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>
                        {r.sublabel}
                      </div>
                    )}
                  </div>
                  {r.type === 'geocoded' && (
                    <span
                      style={{
                        marginLeft: 8,
                        padding: '2px 6px',
                        background: '#eff6ff',
                        color: '#2563eb',
                        fontSize: 10,
                        fontWeight: 600,
                        borderRadius: 4,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      Geocoded
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
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
