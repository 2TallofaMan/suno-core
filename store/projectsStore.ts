import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project, Track } from '../types';

interface ProjectsState {
  projects: Project[];
  currentProjectId: string | null;
  
  // Actions
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setCurrentProject: (id: string | null) => void;
  addTrackToProject: (projectId: string, track: Track) => void;
  removeTrackFromProject: (projectId: string, trackId: string) => void;
  addTrackToCurrentProject: (track: Track) => void;
}

export const useProjectsStore = create<ProjectsState>()(
  persist(
    (set) => ({
      projects: [],
      currentProjectId: null,

      addProject: (project) => set((state) => ({
        projects: [...state.projects, project],
        currentProjectId: project.id,
      })),

      updateProject: (id, updates) => set((state) => ({
        projects: state.projects.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
      })),

      deleteProject: (id) => set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
      })),

      setCurrentProject: (id) => set({ currentProjectId: id }),

      addTrackToProject: (projectId, track) => set((state) => ({
        projects: state.projects.map((p) =>
          p.id === projectId ? { ...p, tracks: [...p.tracks, track] } : p
        ),
      })),

      removeTrackFromProject: (projectId, trackId) => set((state) => ({
        projects: state.projects.map((p) =>
          p.id === projectId
            ? { ...p, tracks: p.tracks.filter((t) => t.id !== trackId) }
            : p
        ),
      })),

      addTrackToCurrentProject: (track: Track) => set((state) => {
        if (!state.currentProjectId) return state;
        return {
          projects: state.projects.map((p) =>
            p.id === state.currentProjectId
              ? { ...p, tracks: [...p.tracks, track] }
              : p
          ),
        };
      }),
    }),
    {
      name: 'suno-projects-storage',
    }
  )
);
