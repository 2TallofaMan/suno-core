'use client';

import { useState, useCallback } from 'react';
import { useGenerationStore } from '@/store/generationStore';
import { useChatStore } from '@/store/chatStore';
import { generateMusic } from '@/lib/replicate';
import { optimizePrompt, generateLyrics, chat } from '@/lib/mistral';
import { GENERATION_CONFIG, SIMILARITY_PRESETS, DEFAULT_WEIGHTS } from '@/lib/reference/analyzer';

// Mock for now - replace with actual audio playback
const Howler = { stopAll: () => {} };

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('pop');
  const [mood, setMood] = useState('happy');
  const [duration, setDuration] = useState(30);
  const [bpm, setBpm] = useState(120);
  const [key, setKey] = useState('C Major');
  const [weirdness, setWeirdness] = useState(0.5);
  const [similarity, setSimilarity] = useState(0.75);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { startGeneration, completeGeneration, failGeneration } = useGenerationStore();
  const { addMessage, setLoading } = useChatStore();

  const styles = ['pop', 'rock', 'hip-hop', 'electronic', 'jazz', 'classical', 'lofi', 'R&B'];
  const moods = ['happy', 'sad', 'chill', 'energetic', 'epic', 'romantic', 'dark', 'upbeat'];
  const keys = ['C Major', 'C Minor', 'D Major', 'D Minor', 'E Major', 'E Minor', 'F Major', 'F Minor', 'G Major', 'G Minor', 'A Major', 'A Minor', 'B Major', 'B Minor'];

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    
    try {
      // Step 1: Optimize prompt with Mistral
      const optimizedPrompt = await optimizePrompt(prompt);
      startGeneration({
        prompt: optimizedPrompt,
        style,
        mood,
        duration,
        bpm,
        key,
        weirdness,
      });

      // Step 2: Generate with Replicate
      const audioUrl = await generateMusic({
        prompt: optimizedPrompt,
        duration,
        model: 'medium',
      });

      // Step 3: Create track
      const track = {
        id: `track_${Date.now()}`,
        name: `Track ${new Date().toLocaleTimeString()}`,
        audioUrl,
        duration,
        prompt: optimizedPrompt,
        generationSettings: {
          prompt: optimizedPrompt,
          style,
          mood,
          duration,
          bpm,
          key,
          weirdness,
        },
        createdAt: new Date().toISOString(),
      };

      completeGeneration(track);
    } catch (err: any) {
      setError(err.message || 'Generation failed');
      failGeneration(err.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, style, mood, duration, bpm, key, weirdness, startGeneration, completeGeneration, failGeneration]);

  const handleChat = useCallback(async (message: string) => {
    if (!message.trim()) return;

    addMessage({
      id: `msg_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    });

    setLoading(true);
    try {
      const response = await chat([
        {
          role: 'user',
          content: message,
        },
      ], 'Suno Core music production assistant');

      addMessage({
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      setError(err.message || 'Chat error');
    } finally {
      setLoading(false);
    }
  }, [addMessage, setLoading]);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Suno Core
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Personal AI Music Generation
          </p>
        </header>

        {/* Generation Form */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold mb-4">Create Music</h2>
          
          {/* Prompt Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the music you want to create..."
              className="input min-h-[100px]"
            />
          </div>

          {/* Controls Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="input"
              >
                {styles.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Mood</label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="input"
              >
                {moods.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Duration (s)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min={10}
                max={GENERATION_CONFIG.maxDuration}
                className="input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">BPM</label>
              <input
                type="number"
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                min={60}
                max={200}
                className="input"
              />
            </div>
          </div>

          {/* More Controls */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Key</label>
              <select
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="input"
              >
                {keys.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Creativity: {Math.round(weirdness * 100)}%
              </label>
              <input
                type="range"
                value={weirdness}
                onChange={(e) => setWeirdness(Number(e.target.value))}
                min={0}
                max={1}
                step={0.01}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Reference Similarity
              </label>
              <select
                value={similarity}
                onChange={(e) => setSimilarity(Number(e.target.value))}
                className="input"
              >
                {Object.entries(SIMILARITY_PRESETS).map(([key, preset]) => (
                  <option key={key} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="btn btn-primary w-full py-3 text-lg"
          >
            {isGenerating ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                Generating...
              </>
            ) : (
              'Generate Music'
            )}
          </button>

          {error && (
            <p className="mt-4 text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>

        {/* Chat Section */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Creative Assistant</h2>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 min-h-[200px] max-h-[400px] overflow-y-auto mb-4">
            {/* Chat messages would go here */}
            <p className="text-gray-500 dark:text-gray-400">
              Chat with your AI assistant for creative help
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ask me about your music..."
              className="flex-1 input"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  // handleChat would be called here
                }
              }}
            />
            <button className="btn btn-primary px-6">Send</button>
          </div>
        </div>
      </div>
    </main>
  );
}
