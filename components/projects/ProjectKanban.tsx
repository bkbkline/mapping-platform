'use client';

import { useState, useCallback } from 'react';
import type { ProjectSite, PipelineStatus } from '@/types/project';
import { STATUS_COLORS } from '@/lib/mapbox/config';
import { updateSiteStatus } from '@/lib/queries/projects';
import { useProjectStore } from '@/lib/stores/project-store';

const PIPELINE_COLUMNS: PipelineStatus[] = [
  'New Lead',
  'Screening',
  'High Potential',
  'Active Pursuit',
  'Under Contract',
  'Passed',
];

const PRIORITY_VARIANT: Record<string, string> = {
  Low: 'bg-gray-100 text-gray-700',
  Medium: 'bg-blue-100 text-blue-700',
  High: 'bg-red-100 text-red-700',
};

/**
 * Kanban board for project pipeline management.
 * Displays project sites organized by pipeline status with drag-and-drop support.
 */
export default function ProjectKanban() {
  const activeProject = useProjectStore((s) => s.activeProject);
  const updateProject = useProjectStore((s) => s.updateProject);
  const [draggedSiteId, setDraggedSiteId] = useState<string | null>(null);

  const sites = activeProject?.sites ?? [];

  const getSitesForStatus = useCallback(
    (status: PipelineStatus): ProjectSite[] =>
      sites.filter((s) => s.status === status),
    [sites]
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, siteId: string) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', siteId);
      setDraggedSiteId(siteId);
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>, targetStatus: PipelineStatus) => {
      e.preventDefault();
      const siteId = e.dataTransfer.getData('text/plain');
      setDraggedSiteId(null);

      if (!siteId || !activeProject) return;

      const site = sites.find((s) => s.id === siteId);
      if (!site || site.status === targetStatus) return;

      // Optimistic update
      const updatedSites = sites.map((s) =>
        s.id === siteId ? { ...s, status: targetStatus } : s
      );
      updateProject(activeProject.id, {
        sites: updatedSites,
      });

      // Persist
      const success = await updateSiteStatus(siteId, targetStatus);
      if (!success) {
        // Revert on failure
        updateProject(activeProject.id, { sites });
      }
    },
    [activeProject, sites, updateProject]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedSiteId(null);
  }, []);

  if (!activeProject) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Select a project to view the pipeline
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
      {PIPELINE_COLUMNS.map((status) => {
        const columnSites = getSitesForStatus(status);
        const color = STATUS_COLORS[status] ?? '#6B7280';

        return (
          <div
            key={status}
            className="flex-shrink-0 min-w-[280px] w-[280px] flex flex-col bg-white rounded-lg shadow-sm border border-gray-200"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
          >
            {/* Column header */}
            <div
              className="h-1.5 rounded-t-lg"
              style={{ backgroundColor: color }}
            />
            <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">{status}</h3>
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                {columnSites.length}
              </span>
            </div>

            {/* Card list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {columnSites.map((site) => (
                <div
                  key={site.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, site.id)}
                  onDragEnd={handleDragEnd}
                  className={`bg-gray-50 rounded-md p-3 shadow cursor-grab active:cursor-grabbing border border-gray-100 transition-opacity ${
                    draggedSiteId === site.id ? 'opacity-50' : 'opacity-100'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {site.parcel?.address ?? 'Unknown Address'}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    {site.parcel?.acreage != null && (
                      <span>{site.parcel.acreage.toFixed(1)} ac</span>
                    )}
                    {site.parcel?.zoning && (
                      <span className="bg-gray-200 px-1.5 py-0.5 rounded text-gray-600">
                        {site.parcel.zoning}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${PRIORITY_VARIANT[site.priority] ?? ''}`}
                    >
                      {site.priority}
                    </span>
                    {site.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {columnSites.length === 0 && (
                <div className="text-center text-xs text-gray-400 py-8">
                  Drop sites here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
