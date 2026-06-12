// Generation types
export interface GenerationRequest {
  prompt: string;
  style?: string;
  mood?: string;
  duration?: number;
  bpm?: number;
  key?: string;
  instruments?: string[];
  voiceGender?: 'male' | 'female' | 'mixed' | 'none';
  vocalStyle?: string;
  weirdness?: number; // 0-1
  modelVersion?: string;
}

export interface GenerationResponse {
  id: string;
  audioUrl: string;
  duration: number;
  prompt: string;
  createdAt: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
}

// Track types
export interface Track {
  id: string;
  name: string;
  audioUrl: string;
  audioUrls?: string[]; // For multiple variations
  currentVariation?: number; // Index of current variation being played
  duration: number;
  prompt: string;
  lyrics?: string; // Generated lyrics for the track
  generationSettings: GenerationRequest;
  createdAt: string;
  stems?: {
    vocals?: string;
    drums?: string;
    bass?: string;
    other?: string;
  };
}

// Project types
export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  tracks: Track[];
}

// Reference track types
export interface ReferenceAnalysis {
  bpm: number;
  key: string;
  genre: string;
  mood: string;
  instruments: string[];
  vocalStyle?: string;
}

export interface ReferenceSettings {
  file: File;
  similarity: number; // 0.25-1.0
  weight: {
    bpm: number;
    key: number;
    genre: number;
    mood: number;
    instruments: number;
  };
}

// Chat types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Generation job
export interface GenerationJob {
  id: string;
  prompt: GenerationRequest;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  resultUrl?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}
