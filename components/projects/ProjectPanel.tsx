'use client';

import { useState, useCallback } from 'react';
import { useProjectStore } from '@/lib/stores/project-store';
import ProjectKanban from './ProjectKanban';
import ProjectTable from './ProjectTable';

type ViewMode = 'map' | 'table' | 'kanban';

/**
 * Project detail panel shown in the right panel.
 * Displays project metadata with editable name/description, site count,
 * view toggle (Map | Table | Kanban), and renders the corresponding sub-view.
 */
export default function ProjectPanel() {
  const activeProject = useProjectStore((s) => s.activeProject);
  const updateProject = useProjectStore((s) => s.updateProject);

  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [descValue, setDescValue] = useState('');

  const handleNameEdit = useCallback(() => {
    if (!activeProject) return;
    setNameValue(activeProject.name ?? '');
    setIsEditingName(true);
  }, [activeProject]);

  const handleNameSave = useCallback(() => {
    if (activeProject) {
      updateProject(activeProject.id, { name: nameValue });
    }
    setIsEditingName(false);
  }, [activeProject, nameValue, updateProject]);

  const handleDescEdit = useCallback(() => {
    if (!activeProject) return;
    setDescValue(activeProject.description ?? '');
    setIsEditingDesc(true);
  }, [activeProject]);

  const handleDescSave = useCallback(() => {
    if (activeProject) {
      updateProject(activeProject.id, { description: descValue });
    }
    setIsEditingDesc(false);
  }, [activeProject, descValue, updateProject]);

  if (!activeProject) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 p-6">
        <p>Select or create a project to get started.</p>
      </div>
    );
  }

  const siteCount = activeProject.sites?.length ?? 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        {/* Project Name */}
        {isEditingName ? (
          <div className="flex items-center gap-2">
            <input
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameSave();
                if (e.key === 'Escape') setIsEditingName(false);
              }}
              className="text-lg font-semibold border border-gray-300 rounded px-2 py-1 flex-1"
              autoFocus
            />
            <button
              onClick={handleNameSave}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Save
            </button>
          </div>
        ) : (
          <h2
            onClick={handleNameEdit}
            className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
            title="Click to edit"
          >
            {activeProject.name ?? 'Untitled Project'}
          </h2>
        )}

        {/* Description */}
        {isEditingDesc ? (
          <div className="mt-1 flex items-start gap-2">
            <textarea
              value={descValue}
              onChange={(e) => setDescValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsEditingDesc(false);
              }}
              className="text-sm border border-gray-300 rounded px-2 py-1 flex-1 resize-none"
              rows={2}
              autoFocus
            />
            <button
              onClick={handleDescSave}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Save
            </button>
          </div>
        ) : (
          <p
            onClick={handleDescEdit}
            className="text-sm text-gray-500 mt-1 cursor-pointer hover:text-blue-500"
            title="Click to edit"
          >
            {activeProject.description ?? 'No description. Click to add.'}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-400">
            {siteCount} site{siteCount !== 1 ? 's' : ''}
          </span>
          <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors">
            + Add Site
          </button>
        </div>

        {/* Timestamps */}
        <div className="flex gap-4 mt-2 text-xs text-gray-400">
          <span>Created: {new Date(activeProject.created_at).toLocaleDateString()}</span>
          <span>Updated: {new Date(activeProject.updated_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* View Toggle Tabs */}
      <div className="flex border-b border-gray-200">
        {(
          [
            ['map', 'Map'],
            ['table', 'Table'],
            ['kanban', 'Kanban'],
          ] as const
        ).map(([mode, label]) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`flex-1 text-sm py-2 font-medium transition-colors ${
              viewMode === mode
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* View Content */}
      <div className="flex-1 overflow-auto p-4">
        {viewMode === 'kanban' && <ProjectKanban />}
        {viewMode === 'table' && <ProjectTable />}
        {viewMode === 'map' && (
          <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
            Map view is displayed on the main map canvas.
            <br />
            Project sites are highlighted on the map.
          </div>
        )}
      </div>
    </div>
  );
}
