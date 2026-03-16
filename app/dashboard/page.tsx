'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ── Nav items ────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  active?: boolean;
  iconPath: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Map',
    href: '/',
    iconPath:
      'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
  },
  {
    label: 'Dashboard',
    href: '/dashboard',
    active: true,
    iconPath:
      'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1',
  },
  {
    label: 'Maps',
    href: '/',
    iconPath:
      'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
  },
  {
    label: 'Settings',
    href: '/settings',
    iconPath:
      'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
  },
];

// ── Placeholder activity ─────────────────────────────────────────────────────

const PLACEHOLDER_ACTIVITY = [
  { id: '1', text: 'Parcel APN-2024-001 added to watchlist', time: '2 hours ago' },
  { id: '2', text: 'Layer "Flood Zones" toggled on', time: '4 hours ago' },
  { id: '3', text: 'New map "IE Logistics Corridor" created', time: '1 day ago' },
  { id: '4', text: 'Exported parcel report for APN-2023-445', time: '2 days ago' },
  { id: '5', text: 'Updated zoning overlay data source', time: '3 days ago' },
];

// ── Stat icons ───────────────────────────────────────────────────────────────

const STAT_ICONS = {
  maps: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
  parcels:
    'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  layers:
    'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
  storage:
    'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4',
};

// ── Main Component ───────────────────────────────────────────────────────────

interface MapRecord {
  id: string;
  title: string | null;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mapsCount, setMapsCount] = useState(0);
  const [parcelsCount, setParcelsCount] = useState(0);
  const [layersCount, setLayersCount] = useState(0);
  const [storageUsed, setStorageUsed] = useState('0 MB');
  const [recentMaps, setRecentMaps] = useState<MapRecord[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [mapsRes, parcelsRes, layersRes] = await Promise.all([
          supabase.from('maps').select('id', { count: 'exact', head: true }),
          supabase.from('parcels').select('id', { count: 'exact', head: true }),
          supabase.from('map_layers').select('id', { count: 'exact', head: true }),
        ]);

        setMapsCount(mapsRes.count ?? 0);
        setParcelsCount(parcelsRes.count ?? 0);
        setLayersCount(layersRes.count ?? 0);
        setStorageUsed('12.4 MB'); // placeholder — storage calc requires admin API

        const { data: maps } = await supabase
          .from('maps')
          .select('id, title, created_at')
          .order('created_at', { ascending: false })
          .limit(6);

        if (maps) {
          setRecentMaps(maps as MapRecord[]);
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const stats = [
    { label: 'Total Maps', value: mapsCount, icon: STAT_ICONS.maps },
    { label: 'Total Parcels', value: parcelsCount, icon: STAT_ICONS.parcels },
    { label: 'Total Layers', value: layersCount, icon: STAT_ICONS.layers },
    { label: 'Storage Used', value: storageUsed, icon: STAT_ICONS.storage },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f1117' }}>
      {/* ── Left Nav ─────────────────────────────────────────────────────── */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: 240,
          background: '#0d1117',
          borderRight: '1px solid #1e2430',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Inter, sans-serif',
          zIndex: 50,
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: '20px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderBottom: '1px solid #1e2430',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0f1117',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            MM
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#ffffff' }}>
            Majestic Maps
          </span>
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, padding: '12px 8px' }}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: item.active ? 600 : 400,
                color: item.active ? '#ffffff' : '#9ca3af',
                background: item.active ? '#1e2430' : 'transparent',
                borderLeft: item.active ? '3px solid #f59e0b' : '3px solid transparent',
                textDecoration: 'none',
                marginBottom: 2,
                transition: 'background 150ms ease',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke={item.active ? '#f59e0b' : '#6b7280'}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={item.iconPath} />
              </svg>
              {item.label}
            </Link>
          ))}
        </div>

        {/* User section at bottom */}
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid #1e2430',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#6366f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            TU
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: '#ffffff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Test User
            </div>
            <button
              onClick={handleSignOut}
              style={{
                fontSize: 11,
                color: '#6b7280',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main
        style={{
          marginLeft: 240,
          flex: 1,
          padding: '32px 40px',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#ffffff', margin: 0 }}>
            {getGreeting()}, Test
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>{formatDate()}</p>
        </div>

        {/* Stats Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            marginBottom: 32,
          }}
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              style={{
                background: '#1e2430',
                borderRadius: 12,
                border: '1px solid #2a3040',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'rgba(245, 158, 11, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={stat.icon} />
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{stat.label}</p>
                  <p style={{ fontSize: 24, fontWeight: 700, color: '#ffffff', margin: 0 }}>
                    {loading
                      ? '...'
                      : typeof stat.value === 'number'
                        ? stat.value.toLocaleString()
                        : stat.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Maps */}
        <div style={{ marginBottom: 32 }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: '#ffffff',
              marginBottom: 16,
            }}
          >
            Recent Maps
          </h2>
          {recentMaps.length === 0 && !loading ? (
            <div
              style={{
                background: '#1e2430',
                borderRadius: 12,
                border: '1px solid #2a3040',
                padding: '40px 20px',
                textAlign: 'center',
                color: '#6b7280',
                fontSize: 14,
              }}
            >
              No maps found. Create your first map to get started.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 16,
              }}
            >
              {recentMaps.map((map) => (
                <Link
                  key={map.id}
                  href="/"
                  style={{
                    background: '#1e2430',
                    borderRadius: 12,
                    border: '1px solid #2a3040',
                    padding: '20px',
                    textDecoration: 'none',
                    transition: 'border-color 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#f59e0b';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#2a3040';
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: 'rgba(245, 158, 11, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d={STAT_ICONS.maps} />
                    </svg>
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#ffffff',
                      marginBottom: 4,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {map.title ?? 'Untitled Map'}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    Created {new Date(map.created_at).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: '#ffffff',
              marginBottom: 16,
            }}
          >
            Recent Activity
          </h2>
          <div
            style={{
              background: '#1e2430',
              borderRadius: 12,
              border: '1px solid #2a3040',
              overflow: 'hidden',
            }}
          >
            {PLACEHOLDER_ACTIVITY.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 20px',
                  borderBottom:
                    idx < PLACEHOLDER_ACTIVITY.length - 1 ? '1px solid #2a3040' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#f59e0b',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 13, color: '#d1d5db' }}>{item.text}</span>
                </div>
                <span style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap', marginLeft: 16 }}>
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
