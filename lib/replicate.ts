import Replicate from 'replicate';
import { recordGeneration } from './usageTracker';

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.NEXT_PUBLIC_REPLICATE_API_KEY || '',
});

// Music generation models
const MUSIC_MODELS = {
  small: 'lucataco/musicgen:7a7013352711406551048240a7507407832404156224f1d58936139127a1079c',
  medium: 'lucataco/musicgen:7a7013352711406551048240a7507407832404156224f1d58936139127a1079c',
};

// Vocal generation model
const VOCAL_MODEL = 'm-CoVexy/musicgen-rvc:main';

// Stem separation model
const DEMUCS_MODEL = 'metademucs/demucs:latest';

export interface MusicGenerationOptions {
  prompt: string;
  duration?: number;
  model?: 'small' | 'medium';
}

// Generate music
export async function generateMusic(options: MusicGenerationOptions): Promise<string> {
  const model = MUSIC_MODELS[options.model || 'medium'];
  const duration = options.duration || 30;

  const input = {
    prompt: options.prompt,
    duration: duration,
  };

  const prediction = await replicate.predictions.create({
    version: model,
    input,
  });

  // Poll for completion
  let result = await replicate.predictions.get(prediction.id);
  while (result.status !== 'succeeded' && result.status !== 'failed') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    result = await replicate.predictions.get(prediction.id);
  }

  if (result.status === 'failed') {
    const errorMsg = (result as any).error ? String((result as any).error) : 'Generation failed';
    throw new Error(errorMsg);
  }

  // Track usage
  const output = result.output?.[0] as string;
  recordGeneration('music', {
    model: options.model || 'medium',
    duration: options.duration || 30,
    prompt: options.prompt,
  });

  return output;
}

// Generate vocals
export async function generateVocals(audioUrl: string, lyrics: string, style: string = 'pop'): Promise<string> {
  const input = {
    audio: audioUrl,
    lyrics: lyrics,
    style: style,
  };

  const prediction = await replicate.predictions.create({
    version: VOCAL_MODEL,
    input,
  });

  let result = await replicate.predictions.get(prediction.id);
  while (result.status !== 'succeeded' && result.status !== 'failed') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    result = await replicate.predictions.get(prediction.id);
  }

  if (result.status === 'failed') {
    const errorMsg = (result as any).error ? String((result as any).error) : 'Vocal generation failed';
    throw new Error(errorMsg);
  }

  // Track usage
  const output = result.output?.[0] as string;
  recordGeneration('vocals', {
    model: VOCAL_MODEL,
    duration: 0, // Vocals don't have duration in the same way
    prompt: `Vocals: ${lyrics.substring(0, 100)}...`,
  });

  return output;
}

// Separate stems
export async function separateStems(audioUrl: string): Promise<{
  vocals: string;
  drums: string;
  bass: string;
  other: string;
}> {
  const input = {
    audio: audioUrl,
  };

  const prediction = await replicate.predictions.create({
    version: DEMUCS_MODEL,
    input,
  });

  let result = await replicate.predictions.get(prediction.id);
  while (result.status !== 'succeeded' && result.status !== 'failed') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    result = await replicate.predictions.get(prediction.id);
  }

  if (result.status === 'failed') {
    const errorMsg = (result as any).error ? String((result as any).error) : 'Stem separation failed';
    throw new Error(errorMsg);
  }

  // Track usage
  recordGeneration('stems', {
    model: DEMUCS_MODEL,
    duration: 0,
    prompt: 'Stem separation',
  });

  // Demucs returns separate audio files
  return {
    vocals: result.output?.[0] as string,
    drums: result.output?.[1] as string,
    bass: result.output?.[2] as string,
    other: result.output?.[3] as string,
  };
}

export { replicate };
