import { create } from 'zustand';
import { GenerationRequest, GenerationJob, Track } from '@/types';

interface GenerationState {
  // Current generation
  currentJob: GenerationJob | null;
  isGenerating: boolean;
  progress: number;
  error: string | null;
  
  // Queue
  queue: GenerationRequest[];
  
  // History
  tracks: Track[];
  
  // Actions
  startGeneration: (request: GenerationRequest) => void;
  updateProgress: (progress: number) => void;
  completeGeneration: (track: Track) => void;
  failGeneration: (error: string) => void;
  cancelGeneration: () => void;
  addToQueue: (request: GenerationRequest) => void;
  clearQueue: () => void;
  addTrack: (track: Track) => void;
  removeTrack: (id: string) => void;
}

export const useGenerationStore = create<GenerationState>((set) => ({
  currentJob: null,
  isGenerating: false,
  progress: 0,
  error: null,
  queue: [],
  tracks: [],

  startGeneration: (request) => set((state) => ({
    currentJob: {
      id: `job_${Date.now()}`,
      prompt: request,
      status: 'processing',
      progress: 0,
      createdAt: new Date().toISOString(),
    },
    isGenerating: true,
    error: null,
    progress: 0,
  })),

  updateProgress: (progress) => set({ progress }),

  completeGeneration: (track) => set((state) => ({
    isGenerating: false,
    currentJob: null,
    tracks: [...state.tracks, track],
    queue: state.queue.slice(1), // Remove first from queue
  })),

  failGeneration: (error) => set({
    isGenerating: false,
    currentJob: null,
    error,
  }),

  cancelGeneration: () => set({
    isGenerating: false,
    currentJob: null,
    error: 'Cancelled',
  }),

  addToQueue: (request) => set((state) => ({
    queue: [...state.queue, request],
  })),

  clearQueue: () => set({ queue: [] }),

  addTrack: (track) => set((state) => ({
    tracks: [...state.tracks, track],
  })),

  removeTrack: (id) => set((state) => ({
    tracks: state.tracks.filter((t) => t.id !== id),
  })),
}));
