// Audio feature extraction (simplified for now)
// In production, use a proper audio analysis library or API

export interface AudioFeatures {
  bpm: number;
  key: string;
  duration: number;
  genre?: string;
  mood?: string;
  instruments?: string[];
}

// Mock audio feature extraction
// Replace with actual audio analysis when integrating with a library
// or using Mistral embeddings + LLM for analysis

export async function extractAudioFeatures(file: File): Promise<AudioFeatures> {
  // This is a placeholder
  // Real implementation would use:
  // - Web Audio API for BPM detection
  // - Mistral embeddings for semantic analysis
  // - Or a dedicated audio analysis library
  
  // For now, return mock data
  return {
    bpm: 120,
    key: 'C Major',
    duration: 30,
    genre: 'unknown',
    mood: 'neutral',
    instruments: [],
  };
}

// Generate prompt from reference track with similarity control
export interface ReferenceSettings {
  similarity: number; // 0.25 to 1.0
  weight: {
    bpm: number;
    key: number;
    genre: number;
    mood: number;
    instruments: number;
  };
}

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
  weirdness?: number;
}

export function generatePromptFromReference(
  referenceFeatures: AudioFeatures,
  similarity: number,
  userPrompt: string = ''
): { prompt: string; settings: GenerationRequest } {
  const constraints: string[] = [];
  const settings: Partial<GenerationRequest> = {};

  // BPM matching
  if (similarity >= 0.7) {
    constraints.push(`BPM: exactly ${referenceFeatures.bpm}`);
    settings.bpm = referenceFeatures.bpm;
  } else if (similarity >= 0.5) {
    constraints.push(`BPM: around ${referenceFeatures.bpm}`);
    settings.bpm = referenceFeatures.bpm;
  }

  // Key matching
  if (similarity >= 0.7) {
    constraints.push(`Key: ${referenceFeatures.key}`);
    settings.key = referenceFeatures.key;
  }

  // Genre matching
  if (similarity >= 0.6) {
    constraints.push(`Genre: ${referenceFeatures.genre || 'similar style'}`);
    settings.style = referenceFeatures.genre;
  }

  // Mood matching
  if (similarity >= 0.6) {
    constraints.push(`Mood: ${referenceFeatures.mood || 'similar mood'}`);
    settings.mood = referenceFeatures.mood;
  }

  // Instruments matching
  if (similarity >= 0.6 && referenceFeatures.instruments?.length) {
    constraints.push(`Instruments: ${referenceFeatures.instruments.join(', ')}`);
    settings.instruments = referenceFeatures.instruments;
  }

  // Creativity level (inverse of similarity)
  const weirdness = 1 - similarity;
  settings.weirdness = weirdness;

  // Build final prompt
  const basePrompt = userPrompt || 'Create a track';
  const fullPrompt = constraints.length
    ? `${basePrompt} with ${constraints.join(', ')}`
    : basePrompt;

  return {
    prompt: fullPrompt,
    settings: settings as GenerationRequest,
  };
}

// Similarity presets
export const SIMILARITY_PRESETS = {
  creative: { value: 0.25, label: 'Very Creative (25%)' },
  balanced: { value: 0.5, label: 'Balanced (50%)' },
  similar: { value: 0.75, label: 'Strong Match (75%)' },
  exact: { value: 1.0, label: 'Exact Style (100%)' },
};

// Default weights for reference matching
export const DEFAULT_WEIGHTS = {
  bpm: 0.15,
  key: 0.10,
  genre: 0.20,
  mood: 0.15,
  instruments: 0.15,
};
