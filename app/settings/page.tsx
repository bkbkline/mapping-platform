'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setEmail(user?.email ?? null);
      } catch (err) {
        console.error('Failed to load user:', err);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const NAV_ITEMS = [
    {
      label: 'Map',
      href: '/',
      iconPath:
        'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
    },
    {
      label: 'Dashboard',
      href: '/dashboard',
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
      active: true,
      iconPath:
        'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    },
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
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#ffffff',
            margin: 0,
            marginBottom: 8,
          }}
        >
          Settings
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 32 }}>
          Manage your account and preferences.
        </p>

        {/* Profile Section */}
        <div
          style={{
            background: '#1e2430',
            borderRadius: 12,
            border: '1px solid #2a3040',
            padding: '24px',
            maxWidth: 600,
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: '#ffffff',
              marginBottom: 20,
              margin: '0 0 20px 0',
            }}
          >
            Profile
          </h2>

          {/* Avatar + Name */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 24,
              paddingBottom: 24,
              borderBottom: '1px solid #2a3040',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: '#6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: 20,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              TU
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#ffffff' }}>
                Test User
              </div>
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                Team Member
              </div>
            </div>
          </div>

          {/* Email field */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 500,
                color: '#9ca3af',
                marginBottom: 6,
              }}
            >
              Email Address
            </label>
            <div
              style={{
                padding: '10px 14px',
                background: '#0f1117',
                borderRadius: 8,
                border: '1px solid #2a3040',
                fontSize: 14,
                color: '#d1d5db',
              }}
            >
              {loading ? 'Loading...' : email ?? 'No email found'}
            </div>
          </div>

          {/* Role field */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 500,
                color: '#9ca3af',
                marginBottom: 6,
              }}
            >
              Role
            </label>
            <div
              style={{
                padding: '10px 14px',
                background: '#0f1117',
                borderRadius: 8,
                border: '1px solid #2a3040',
                fontSize: 14,
                color: '#d1d5db',
              }}
            >
              Administrator
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
