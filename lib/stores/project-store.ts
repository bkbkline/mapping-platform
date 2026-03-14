import { create } from 'zustand';
import type { Project } from '@/types/project';

interface ProjectState {
  projects: Project[];
  activeProject: Project | null;
  setProjects: (projects: Project[]) => void;
  setActiveProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
  removeProject: (id: string) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
}

/**
 * Zustand store for managing the user's projects and active project selection.
 */
export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  activeProject: null,

  /**
   * Replace the full list of projects.
   * @param projects - Array of project records
   */
  setProjects: (projects) => set({ projects }),

  /**
   * Set the currently active project.
   * @param project - The project to activate, or null to deselect
   */
  setActiveProject: (project) => set({ activeProject: project }),

  /**
   * Add a new project to the list.
   * @param project - The project record to add
   */
  addProject: (project) =>
    set((state) => ({
      projects: [...state.projects, project],
    })),

  /**
   * Remove a project by its ID. If the removed project is currently active, clears the active project.
   * @param id - The project ID to remove
   */
  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      activeProject: state.activeProject?.id === id ? null : state.activeProject,
    })),

  /**
   * Update a project by its ID with partial field updates. Also updates activeProject if it matches.
   * @param id - The project ID to update
   * @param updates - Partial project fields to merge
   */
  updateProject: (id, updates) =>
    set((state) => {
      const projects = state.projects.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      );
      const activeProject =
        state.activeProject?.id === id
          ? { ...state.activeProject, ...updates }
          : state.activeProject;
      return { projects, activeProject };
    }),
}));
