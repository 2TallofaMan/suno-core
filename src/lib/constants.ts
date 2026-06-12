// App configuration
export const APP_CONFIG = {
  name: 'Suno Core',
  version: '1.0.0',
  description: 'Personal AI Music Generation Tool',
};

// API endpoints
export const API_CONFIG = {
  mistral: {
    baseUrl: 'https://api.mistral.ai/v1',
    models: {
      small: 'mistral-small',
      medium: 'mistral-medium',
      embeddings: 'mistral-embed',
    },
  },
  replicate: {
    baseUrl: 'https://api.replicate.com/v1',
    models: {
      musicgen: {
        small: 'lucataco/musicgen:7a7013352711406551048240a7507407832404156224f1d58936139127a1079c',
        medium: 'lucataco/musicgen:7a7013352711406551048240a7507407832404156224f1d58936139127a1079c',
      },
      rvc: 'm-CoVexy/musicgen-rvc:main',
      demucs: 'metademucs/demucs:latest',
    },
  },
};

// Generation settings
export const GENERATION_CONFIG = {
  maxDuration: 120, // seconds
  defaultDuration: 30,
  maxVariations: 5,
  defaultVariations: 3,
  
  // Similarity settings for reference tracks
  similarity: {
    min: 0.25,
    max: 1.0,
    default: 0.75,
    step: 0.05,
  },
  
  // Quality presets
  quality: {
    preview: { model: 'small', duration: 15 },
    standard: { model: 'medium', duration: 30 },
    high: { model: 'medium', duration: 60 },
  },
};

// Storage
export const STORAGE_CONFIG = {
  projectsDir: 'suno-projects',
  audioDir: 'audio',
  tempDir: 'temp',
};

// UI
export const UI_CONFIG = {
  themes: {
    dark: 'dark',
    light: 'light',
    system: 'system',
  },
  defaultTheme: 'dark',
};
