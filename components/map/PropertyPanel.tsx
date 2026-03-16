'use client';

import { useState } from 'react';
import { useParcelStore } from '@/lib/stores/parcel-store';

type Tab = 'overview' | 'files' | 'notes';

export default function PropertyPanel() {
  const { selectedParcel, clearSelection } = useParcelStore();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [noteText, setNoteText] = useState('');

  if (!selectedParcel) return null;

  const acreage = selectedParcel.acreage;
  const sqft = acreage != null ? Math.round(acreage * 43560) : null;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'files', label: 'Files' },
    { id: 'notes', label: 'Notes' },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        right: 0,
        top: 52,
        bottom: 0,
        width: 360,
        zIndex: 40,
        background: '#151820',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px 0 16px rgba(0, 0, 0, 0.3)',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 16px 12px',
          borderBottom: '1px solid #2a2d3a',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                fontSize: 16,
                fontWeight: 700,
                margin: '0 0 4px',
                color: '#ffffff',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {selectedParcel.situs_address ?? 'Unknown Property'}
            </h2>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
              {[selectedParcel.county, selectedParcel.state_abbr]
                .filter(Boolean)
                .join(', ') || 'Unknown Location'}
            </p>
            {selectedParcel.apn && (
              <span
                style={{
                  display: 'inline-block',
                  marginTop: 6,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 500,
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#93c5fd',
                  borderRadius: 9999,
                }}
              >
                APN: {selectedParcel.apn}
              </span>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={clearSelection}
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 6,
              color: '#9ca3af',
              cursor: 'pointer',
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #2a2d3a',
          padding: '0 16px',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '10px 0',
              fontSize: 13,
              fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? '#3b82f6' : '#9ca3af',
              background: 'transparent',
              border: 'none',
              borderBottom:
                activeTab === tab.id
                  ? '2px solid #3b82f6'
                  : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Stats grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
              }}
            >
              <StatCard label="Acreage" value={acreage != null ? acreage.toFixed(2) : 'N/A'} />
              <StatCard label="Sq Ft" value={sqft != null ? sqft.toLocaleString() : 'N/A'} />
              <StatCard label="Zoning" value={selectedParcel.zoning ?? 'N/A'} />
              <StatCard
                label="Status"
                value={
                  (selectedParcel.raw_attributes?.status as string) ?? 'Active'
                }
              />
            </div>

            {/* Detail rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              <DetailRow label="Owner" value={selectedParcel.owner_name ?? 'N/A'} />
              <DetailRow label="Land Use" value={selectedParcel.land_use_code ?? 'N/A'} />
              <DetailRow
                label="Zoning Desc"
                value={selectedParcel.zoning_description ?? 'N/A'}
              />
              <DetailRow
                label="Assessed Value"
                value={
                  selectedParcel.assessed_value != null
                    ? `$${selectedParcel.assessed_value.toLocaleString()}`
                    : 'N/A'
                }
              />
              <DetailRow
                label="Address"
                value={selectedParcel.situs_address ?? 'N/A'}
              />
              <DetailRow label="County" value={selectedParcel.county ?? 'N/A'} />
              <DetailRow label="State" value={selectedParcel.state_abbr ?? 'N/A'} />
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              paddingTop: 40,
              gap: 16,
            }}
          >
            {/* File icon */}
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4b5563"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
              No files attached
            </p>
            <button
              onClick={() => console.log('[PropertyPanel] Attach file placeholder')}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid #3b82f6',
                borderRadius: 6,
                background: 'transparent',
                color: '#3b82f6',
                cursor: 'pointer',
              }}
            >
              + Attach File
            </button>
          </div>
        )}

        {activeTab === 'notes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note about this property..."
              rows={4}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 13,
                color: '#d1d5db',
                background: '#1e2230',
                border: '1px solid #2a2d3a',
                borderRadius: 6,
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'Inter, sans-serif',
              }}
            />
            <button
              onClick={() => {
                if (noteText.trim()) {
                  console.log('[PropertyPanel] Save note placeholder:', noteText);
                  setNoteText('');
                }
              }}
              disabled={!noteText.trim()}
              style={{
                alignSelf: 'flex-start',
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                borderRadius: 6,
                background: noteText.trim() ? '#3b82f6' : '#374151',
                color: noteText.trim() ? '#ffffff' : '#6b7280',
                cursor: noteText.trim() ? 'pointer' : 'default',
              }}
            >
              Save Note
            </button>

            <div
              style={{
                marginTop: 8,
                padding: 16,
                textAlign: 'center',
                fontSize: 13,
                color: '#6b7280',
              }}
            >
              No notes yet
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: '12px 10px',
        background: '#1e2230',
        borderRadius: 8,
        border: '1px solid #2a2d3a',
      }}
    >
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: '#e5e7eb',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '6px 0',
        borderBottom: '1px solid #1e2230',
      }}
    >
      <span style={{ fontSize: 12, color: '#6b7280' }}>{label}</span>
      <span
        style={{
          fontSize: 12,
          color: '#d1d5db',
          fontWeight: 500,
          maxWidth: '60%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textAlign: 'right',
        }}
      >
        {value}
      </span>
    </div>
  );
}
