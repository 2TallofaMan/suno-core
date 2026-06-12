import { Mistral } from '@mistralai/mistralai';

// Initialize Mistral client
const mistral = new Mistral({
  apiKey: process.env.NEXT_PUBLIC_MISTRAL_API_KEY || '',
});

// Prompt optimization
export async function optimizePrompt(prompt: string): Promise<string> {
  const response = await mistral.chat.complete({
    model: 'mistral-small',
    messages: [
      {
        role: 'user' as const,
        content: `Optimize this music generation prompt for better results. Keep it under 200 characters. Original: "${prompt}"`,
      },
    ],
    temperature: 0.3,
  });
  
  // Handle both string and array responses
  const content = response.choices?.[0]?.message?.content;
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    return content.map(c => typeof c === 'string' ? c : (c as any).text || (c as any).content || '').join('');
  }
  return prompt;
}

// Reference track analysis
export interface ReferenceAnalysis {
  bpm: number;
  key: string;
  genre: string;
  mood: string;
  instruments: string[];
  vocalStyle?: string;
}

export async function analyzeReferenceTrack(audioFeatures: any): Promise<ReferenceAnalysis> {
  const response = await mistral.chat.complete({
    model: 'mistral-small',
    messages: [
      {
        role: 'system' as const,
        content: 'You are a music analysis expert. Analyze audio features and return JSON with: bpm, key, genre, mood, instruments array, vocalStyle (if applicable).',
      },
      {
        role: 'user' as const,
        content: `Analyze these audio features: ${JSON.stringify(audioFeatures)}`,
      },
    ],
    temperature: 0.2,
  });

  try {
    const content = getContent(response);
    // Try to parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return {
      bpm: 120,
      key: 'C Major',
      genre: 'unknown',
      mood: 'neutral',
      instruments: [],
    };
  } catch {
    return {
      bpm: 120,
      key: 'C Major',
      genre: 'unknown',
      mood: 'neutral',
      instruments: [],
    };
  }
}

// Helper to extract content from response
function getContent(response: any): string {
  const content = response.choices?.[0]?.message?.content;
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    return content.map(c => typeof c === 'string' ? c : (c as any).text || (c as any).content || '').join('');
  }
  return '';
}

// Lyrics generation
export async function generateLyrics(theme: string, genre: string, mood: string, structure: string = 'verse-chorus'): Promise<string> {
  const response = await mistral.chat.complete({
    model: 'mistral-small',
    messages: [
      {
        role: 'system' as const,
        content: 'You are a professional songwriter. Generate lyrics with proper structure and rhyme scheme.',
      },
      {
        role: 'user' as const,
        content: `Write lyrics for a ${genre} song about "${theme}" with a ${mood} mood. Structure: ${structure}.`,
      },
    ],
    temperature: 0.7,
  });

  return getContent(response);
}

// Mixing advice
export async function getMixingAdvice(tracks: {name: string, type: string}[], bpm: number, key: string): Promise<string> {
  const response = await mistral.chat.complete({
    model: 'mistral-small',
    messages: [
      {
        role: 'system' as const,
        content: 'You are an expert audio engineer. Provide specific mixing advice for the given tracks.',
      },
      {
        role: 'user' as const,
        content: `Tracks: ${JSON.stringify(tracks)}. BPM: ${bpm}. Key: ${key}. Provide mixing advice.`,
      },
    ],
    temperature: 0.3,
  });

  return getContent(response);
}

// Chat
export async function chat(messages: {role: string; content: string}[], context?: string): Promise<string> {
  const systemPrompt = `You are a creative music production assistant.${context ? ` Current context: ${context}` : ''}`;
  
  const response = await mistral.chat.complete({
    model: 'mistral-small',
    messages: [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map(m => ({ ...m, role: m.role as 'user' | 'assistant' | 'system' })),
    ],
    temperature: 0.7,
  });

  return getContent(response);
}

export { mistral };
