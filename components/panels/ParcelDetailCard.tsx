'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParcelStore } from '@/lib/stores/parcel-store';
import { useProjectStore } from '@/lib/stores/project-store';
import { useUIStore } from '@/lib/stores/ui-store';
import { useCompStore } from '@/lib/stores/comp-store';
import { scoreParcel } from '@/lib/geospatial/suitability';
import { formatCurrency, formatAcreage, getCenter } from '@/lib/geospatial/utils';
import { fetchCompsNearPoint, calculateCompAnalytics } from '@/lib/queries/comps';
import { addNote, fetchNotes, addSiteToProject } from '@/lib/queries/projects';
import type { ScoredParcel, SuitabilityBreakdown } from '@/types/parcel';
import type { Note } from '@/types/project';

/** Score breakdown category label and key mapping */
interface BreakdownItem {
  key: keyof SuitabilityBreakdown;
  label: string;
  maxScore: number;
}

const BREAKDOWN_ITEMS: BreakdownItem[] = [
  { key: 'acreage_score', label: 'Acreage', maxScore: 25 },
  { key: 'zoning_score', label: 'Zoning', maxScore: 25 },
  { key: 'highway_proximity_score', label: 'Highway', maxScore: 15 },
  { key: 'rail_access_score', label: 'Rail', maxScore: 10 },
  { key: 'flood_zone_score', label: 'Flood', maxScore: 15 },
  { key: 'infrastructure_score', label: 'Infrastructure', maxScore: 10 },
];

/**
 * Get the color class for a suitability score.
 */
function getScoreColor(score: number): string {
  if (score < 30) return 'text-red-500';
  if (score <= 60) return 'text-yellow-500';
  return 'text-green-500';
}

/**
 * Get the stroke color for the circular progress ring.
 */
function getScoreStrokeColor(score: number): string {
  if (score < 30) return '#ef4444';
  if (score <= 60) return '#eab308';
  return '#22c55e';
}

/**
 * Get the bar color class for a breakdown bar.
 */
function getBarColor(score: number, maxScore: number): string {
  const pct = maxScore > 0 ? score / maxScore : 0;
  if (pct < 0.3) return 'bg-red-500';
  if (pct <= 0.6) return 'bg-yellow-500';
  return 'bg-green-500';
}

/**
 * Flood zone badge color.
 */
function getFloodBadgeClass(zone: string | null): string {
  if (!zone) return 'bg-gray-100 text-gray-600';
  const upper = zone.toUpperCase();
  if (['A', 'AE', 'AH', 'AO', 'V', 'VE'].includes(upper)) return 'bg-red-100 text-red-700';
  if (upper === 'X') return 'bg-green-100 text-green-700';
  return 'bg-yellow-100 text-yellow-700';
}

/**
 * Two-column info row component.
 */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900 font-medium">{value}</dd>
    </>
  );
}

/**
 * Collapsible section for the detail card.
 */
function DetailSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-100">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-700"
      >
        {title}
        <svg
          className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  );
}

/**
 * ParcelDetailCard - Comprehensive parcel information card for the right panel.
 *
 * Displays parcel header, suitability score with breakdown, property information,
 * ownership, valuation, transactions, environmental data, location, notes, actions,
 * and AI analysis sections. Uses the selected parcel from the parcel store.
 */
export default function ParcelDetailCard() {
  const { selectedParcel } = useParcelStore();
  const { projects } = useProjectStore();
  const { openRightPanel } = useUIStore();
  const { setComps, setAnalytics } = useCompStore();

  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [loadingComps, setLoadingComps] = useState(false);

  // Compute suitability score
  const scored: ScoredParcel | null = selectedParcel
    ? scoreParcel(selectedParcel)
    : null;

  // Fetch notes when parcel changes
  useEffect(() => {
    if (selectedParcel) {
      fetchNotes(selectedParcel.id).then(setNotes);
    }
  }, [selectedParcel]);

  const handleSaveNote = useCallback(async () => {
    if (!selectedParcel || !newNote.trim()) return;
    setSavingNote(true);
    try {
      const note = await addNote(selectedParcel.id, newNote.trim());
      if (note) {
        setNotes((prev) => [note, ...prev]);
        setNewNote('');
      }
    } finally {
      setSavingNote(false);
    }
  }, [selectedParcel, newNote]);

  const handleAddToProject = useCallback(
    async (projectId: string) => {
      if (!selectedParcel) return;
      await addSiteToProject(projectId, selectedParcel.id);
      setShowProjectDropdown(false);
    },
    [selectedParcel]
  );

  const handleViewComps = useCallback(async () => {
    if (!selectedParcel?.geom) return;
    setLoadingComps(true);
    try {
      const [lng, lat] = getCenter(selectedParcel.geom);
      const comps = await fetchCompsNearPoint(lng, lat);
      const analytics = calculateCompAnalytics(comps);
      setComps(comps);
      setAnalytics(analytics);
      openRightPanel('analytics');
    } finally {
      setLoadingComps(false);
    }
  }, [selectedParcel, setComps, setAnalytics, openRightPanel]);

  const handleExportCSV = useCallback(() => {
    if (!selectedParcel) return;
    const headers = [
      'APN', 'Address', 'City', 'County', 'Jurisdiction', 'Acreage',
      'Zoning', 'Land Use', 'Owner Name', 'Assessed Land Value',
      'Assessed Improvement Value', 'Last Sale Price', 'Last Sale Date',
      'Flood Zone', 'Opportunity Zone',
    ];
    const values = [
      selectedParcel.apn, selectedParcel.address, selectedParcel.city,
      selectedParcel.county, selectedParcel.jurisdiction,
      selectedParcel.acreage?.toString(), selectedParcel.zoning,
      selectedParcel.land_use, selectedParcel.owner_name,
      selectedParcel.assessed_land_value?.toString(),
      selectedParcel.assessed_improvement_value?.toString(),
      selectedParcel.last_sale_price?.toString(),
      selectedParcel.last_sale_date, selectedParcel.flood_zone,
      selectedParcel.opportunity_zone ? 'Yes' : 'No',
    ];
    const csv = [headers.join(','), values.map((v) => `"${v ?? ''}"`).join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parcel_${selectedParcel.apn ?? selectedParcel.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedParcel]);

  if (!selectedParcel || !scored) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-sm text-gray-400">Select a parcel on the map to view details.</p>
      </div>
    );
  }

  const totalAssessedValue =
    (selectedParcel.assessed_land_value ?? 0) +
    (selectedParcel.assessed_improvement_value ?? 0);

  const center = selectedParcel.geom ? getCenter(selectedParcel.geom) : null;

  // Circular progress ring values
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scored.suitability_score / 100) * circumference;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-gray-900">
          {selectedParcel.address ?? 'No Address'}
        </h3>
        <p className="text-sm text-gray-500">{selectedParcel.city ?? 'Unknown City'}</p>
        {selectedParcel.apn && (
          <span className="mt-1 inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            APN: {selectedParcel.apn}
          </span>
        )}
      </div>

      {/* Suitability Score */}
      <DetailSection title="Suitability Score">
        <div className="flex items-center gap-4">
          {/* Circular progress */}
          <div className="relative flex-shrink-0">
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={getScoreStrokeColor(scored.suitability_score)}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-xl font-bold ${getScoreColor(scored.suitability_score)}`}>
                {scored.suitability_score}
              </span>
            </div>
          </div>

          {/* Breakdown bars */}
          <div className="flex-1 space-y-1.5">
            {BREAKDOWN_ITEMS.map((item) => {
              const value = scored.score_breakdown[item.key];
              const pct = item.maxScore > 0 ? (value / item.maxScore) * 100 : 0;
              return (
                <div key={item.key} className="flex items-center gap-2">
                  <span className="w-20 text-xs text-gray-500">{item.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-200">
                    <div
                      className={`h-2 rounded-full ${getBarColor(value, item.maxScore)} transition-all duration-300`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs text-gray-500">
                    {value}/{item.maxScore}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </DetailSection>

      {/* Parcel Info */}
      <DetailSection title="Parcel Info">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
          <InfoRow label="APN" value={selectedParcel.apn ?? 'N/A'} />
          <InfoRow label="Address" value={selectedParcel.address ?? 'N/A'} />
          <InfoRow label="City" value={selectedParcel.city ?? 'N/A'} />
          <InfoRow label="County" value={selectedParcel.county ?? 'N/A'} />
          <InfoRow label="Jurisdiction" value={selectedParcel.jurisdiction ?? 'N/A'} />
          <InfoRow label="Acreage" value={formatAcreage(selectedParcel.acreage)} />
          <InfoRow label="Zoning" value={selectedParcel.zoning ?? 'N/A'} />
          <InfoRow label="Land Use" value={selectedParcel.land_use ?? 'N/A'} />
        </dl>
      </DetailSection>

      {/* Ownership */}
      <DetailSection title="Ownership">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
          <InfoRow label="Owner Name" value={selectedParcel.owner_name ?? 'N/A'} />
          <InfoRow label="Mailing Address" value={selectedParcel.mailing_address ?? 'N/A'} />
        </dl>
      </DetailSection>

      {/* Valuation */}
      <DetailSection title="Valuation">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
          <InfoRow
            label="Assessed Land Value"
            value={formatCurrency(selectedParcel.assessed_land_value)}
          />
          <InfoRow
            label="Assessed Improvement Value"
            value={formatCurrency(selectedParcel.assessed_improvement_value)}
          />
          <InfoRow
            label="Total Assessed Value"
            value={formatCurrency(totalAssessedValue || null)}
          />
        </dl>
      </DetailSection>

      {/* Transactions */}
      <DetailSection title="Transactions">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
          <InfoRow
            label="Last Sale Price"
            value={formatCurrency(selectedParcel.last_sale_price)}
          />
          <InfoRow
            label="Last Sale Date"
            value={selectedParcel.last_sale_date ?? 'N/A'}
          />
        </dl>
      </DetailSection>

      {/* Environmental */}
      <DetailSection title="Environmental">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
          <dt className="text-xs text-gray-500">Flood Zone</dt>
          <dd>
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getFloodBadgeClass(selectedParcel.flood_zone)}`}
            >
              {selectedParcel.flood_zone ?? 'Unknown'}
            </span>
          </dd>
          <dt className="text-xs text-gray-500">Opportunity Zone</dt>
          <dd>
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                selectedParcel.opportunity_zone
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {selectedParcel.opportunity_zone ? 'Yes' : 'No'}
            </span>
          </dd>
        </dl>
      </DetailSection>

      {/* Location */}
      <DetailSection title="Location">
        {center ? (
          <p className="text-sm text-gray-700 font-mono">
            {center[1].toFixed(6)}, {center[0].toFixed(6)}
          </p>
        ) : (
          <p className="text-sm text-gray-400">No geometry available</p>
        )}
      </DetailSection>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-4">
        <button
          type="button"
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Save Parcel
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProjectDropdown(!showProjectDropdown)}
            className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Add to Project
          </button>
          {showProjectDropdown && (
            <div className="absolute left-0 top-full z-10 mt-1 w-48 rounded-lg border border-gray-200 bg-white shadow-lg">
              {projects.length === 0 ? (
                <p className="px-3 py-2 text-xs text-gray-400">No projects available.</p>
              ) : (
                projects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => handleAddToProject(project.id)}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    {project.name ?? 'Untitled'}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
        >
          Export CSV
        </button>

        <button
          type="button"
          onClick={handleViewComps}
          disabled={loadingComps}
          className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          {loadingComps ? 'Loading...' : 'View Nearby Comps'}
        </button>
      </div>

      {/* Notes */}
      <DetailSection title="Notes">
        <div className="space-y-2">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note about this parcel..."
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
          <button
            type="button"
            onClick={handleSaveNote}
            disabled={savingNote || !newNote.trim()}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {savingNote ? 'Saving...' : 'Save Note'}
          </button>

          {notes.length > 0 && (
            <ul className="mt-2 space-y-2">
              {notes.map((note) => (
                <li
                  key={note.id}
                  className="rounded-lg bg-gray-50 p-2.5 text-sm text-gray-700"
                >
                  <p>{note.content}</p>
                  <span className="mt-1 block text-xs text-gray-400">
                    {new Date(note.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DetailSection>

      {/* AI Analysis */}
      <DetailSection title="AI Analysis" defaultOpen={false}>
        <div className="space-y-2">
          <AISection title="Development Potential">
            This parcel shows potential for industrial development based on its size,
            zoning classification, and proximity to transportation infrastructure.
            Further analysis recommended.
          </AISection>
          <AISection title="Zoning Interpretation">
            Current zoning allows for industrial and manufacturing uses. Conditional use
            permits may be required for certain building types. Check with local
            jurisdiction for specific requirements.
          </AISection>
          <AISection title="Comparable Sales">
            Recent comparable sales in the area suggest land values ranging from
            $200,000 to $500,000 per acre for similarly zoned parcels. Market trends
            indicate steady appreciation.
          </AISection>
          <AISection title="Infrastructure Access">
            The parcel has access to major utilities including water, sewer, and power.
            Proximity to highway infrastructure provides favorable logistics access.
            Rail access may require additional investment.
          </AISection>
        </div>
      </DetailSection>
    </div>
  );
}

/**
 * Expandable AI analysis section placeholder.
 */
function AISection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        {title}
        <svg
          className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-gray-200 px-3 py-2 text-xs text-gray-500 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}
