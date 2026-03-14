'use client';

import { useState, useMemo, useCallback } from 'react';
import type { ProjectSite, PipelineStatus, Priority } from '@/types/project';
import { STATUS_COLORS } from '@/lib/mapbox/config';
import { useProjectStore } from '@/lib/stores/project-store';
import { useMapStore } from '@/lib/stores/map-store';
import { useParcelStore } from '@/lib/stores/parcel-store';

type SortField =
  | 'address'
  | 'city'
  | 'acreage'
  | 'zoning'
  | 'status'
  | 'priority'
  | 'tags'
  | 'updated_at';
type SortDirection = 'asc' | 'desc';

const PRIORITY_VARIANT: Record<Priority, string> = {
  Low: 'bg-gray-100 text-gray-700',
  Medium: 'bg-blue-100 text-blue-700',
  High: 'bg-red-100 text-red-700',
};

const PRIORITY_ORDER: Record<Priority, number> = {
  Low: 0,
  Medium: 1,
  High: 2,
};

interface BulkActionsBarProps {
  count: number;
  onChangeStatus: (status: PipelineStatus) => void;
  onChangePriority: (priority: Priority) => void;
  onRemove: () => void;
}

function BulkActionsBar({ count, onChangeStatus, onChangePriority, onRemove }: BulkActionsBarProps) {
  return (
    <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-md px-4 py-2 mb-3">
      <span className="text-sm font-medium text-blue-700">{count} selected</span>
      <select
        className="text-sm border border-gray-300 rounded px-2 py-1"
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) onChangeStatus(e.target.value as PipelineStatus);
          e.target.value = '';
        }}
      >
        <option value="" disabled>
          Change Status
        </option>
        <option value="New Lead">New Lead</option>
        <option value="Screening">Screening</option>
        <option value="High Potential">High Potential</option>
        <option value="Active Pursuit">Active Pursuit</option>
        <option value="Under Contract">Under Contract</option>
        <option value="Passed">Passed</option>
      </select>
      <select
        className="text-sm border border-gray-300 rounded px-2 py-1"
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) onChangePriority(e.target.value as Priority);
          e.target.value = '';
        }}
      >
        <option value="" disabled>
          Change Priority
        </option>
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>
      <button
        onClick={onRemove}
        className="text-sm text-red-600 hover:text-red-800 font-medium"
      >
        Remove
      </button>
    </div>
  );
}

/**
 * Sortable data table view of project sites.
 * Supports column sorting, row selection with map fly-to, multi-select, and bulk actions.
 */
export default function ProjectTable() {
  const activeProject = useProjectStore((s) => s.activeProject);
  const updateProject = useProjectStore((s) => s.updateProject);
  const flyTo = useMapStore((s) => s.flyTo);
  const setSelectedParcel = useParcelStore((s) => s.setSelectedParcel);

  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const sites = activeProject?.sites ?? [];

  const sortedSites = useMemo(() => {
    const sorted = [...sites];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'address':
          cmp = (a.parcel?.address ?? '').localeCompare(b.parcel?.address ?? '');
          break;
        case 'city':
          cmp = (a.parcel?.city ?? '').localeCompare(b.parcel?.city ?? '');
          break;
        case 'acreage':
          cmp = (a.parcel?.acreage ?? 0) - (b.parcel?.acreage ?? 0);
          break;
        case 'zoning':
          cmp = (a.parcel?.zoning ?? '').localeCompare(b.parcel?.zoning ?? '');
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'priority':
          cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
          break;
        case 'tags':
          cmp = a.tags.join(',').localeCompare(b.tags.join(','));
          break;
        case 'updated_at':
          cmp = a.updated_at.localeCompare(b.updated_at);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [sites, sortField, sortDir]);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDir('asc');
      }
    },
    [sortField]
  );

  const handleRowClick = useCallback(
    (site: ProjectSite) => {
      if (site.parcel) {
        setSelectedParcel(site.parcel);
        const geom = site.parcel.geom;
        if (geom) {
          const coords = geom.coordinates[0];
          const lngs = coords.map((c) => c[0]);
          const lats = coords.map((c) => c[1]);
          const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
          const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
          flyTo(centerLng, centerLat, 16);
        }
      }
    },
    [flyTo, setSelectedParcel]
  );

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === sites.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sites.map((s) => s.id)));
    }
  }, [selectedIds.size, sites]);

  const handleBulkStatus = useCallback(
    (status: PipelineStatus) => {
      if (!activeProject) return;
      const updatedSites = sites.map((s) =>
        selectedIds.has(s.id) ? { ...s, status } : s
      );
      updateProject(activeProject.id, { sites: updatedSites });
      setSelectedIds(new Set());
    },
    [activeProject, sites, selectedIds, updateProject]
  );

  const handleBulkPriority = useCallback(
    (priority: Priority) => {
      if (!activeProject) return;
      const updatedSites = sites.map((s) =>
        selectedIds.has(s.id) ? { ...s, priority } : s
      );
      updateProject(activeProject.id, { sites: updatedSites });
      setSelectedIds(new Set());
    },
    [activeProject, sites, selectedIds, updateProject]
  );

  const handleBulkRemove = useCallback(() => {
    if (!activeProject) return;
    const updatedSites = sites.filter((s) => !selectedIds.has(s.id));
    updateProject(activeProject.id, { sites: updatedSites });
    setSelectedIds(new Set());
  }, [activeProject, sites, selectedIds, updateProject]);

  const sortIcon = (field: SortField) => {
    if (sortField !== field) return ' \u2195';
    return sortDir === 'asc' ? ' \u2191' : ' \u2193';
  };

  if (!activeProject) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Select a project to view sites
      </div>
    );
  }

  return (
    <div>
      {selectedIds.size > 0 && (
        <BulkActionsBar
          count={selectedIds.size}
          onChangeStatus={handleBulkStatus}
          onChangePriority={handleBulkPriority}
          onRemove={handleBulkRemove}
        />
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2">
                <input
                  type="checkbox"
                  checked={selectedIds.size === sites.length && sites.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300"
                />
              </th>
              {(
                [
                  ['address', 'Address'],
                  ['city', 'City'],
                  ['acreage', 'Acreage'],
                  ['zoning', 'Zoning'],
                  ['status', 'Status'],
                  ['priority', 'Priority'],
                  ['tags', 'Tags'],
                  ['updated_at', 'Last Updated'],
                ] as const
              ).map(([field, label]) => (
                <th
                  key={field}
                  onClick={() => handleSort(field)}
                  className="px-3 py-2 text-left font-medium text-gray-600 cursor-pointer select-none hover:text-gray-900 whitespace-nowrap"
                >
                  {label}
                  {sortIcon(field)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {sortedSites.map((site) => {
              const statusColor = STATUS_COLORS[site.status] ?? '#6B7280';
              return (
                <tr
                  key={site.id}
                  onClick={() => handleRowClick(site)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td
                    className="px-3 py-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(site.id)}
                      onChange={() => toggleSelect(site.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">
                    {site.parcel?.address ?? '-'}
                  </td>
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                    {site.parcel?.city ?? '-'}
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {site.parcel?.acreage?.toFixed(1) ?? '-'}
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {site.parcel?.zoning ?? '-'}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: statusColor }}
                    >
                      {site.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_VARIANT[site.priority]}`}
                    >
                      {site.priority}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1 flex-wrap">
                      {site.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-gray-500 whitespace-nowrap text-xs">
                    {new Date(site.updated_at).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
            {sites.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-gray-400">
                  No sites in this project yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
