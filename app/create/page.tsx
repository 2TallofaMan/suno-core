'use client';

import { useState, useCallback } from 'react';
import { useGenerationStore } from '../../store/generationStore';
import { useProjectsStore } from '../../store/projectsStore';
import { generateMusic } from '../../lib/replicate';
import { optimizePrompt, generateLyrics } from '../../lib/mistral';
import { SIMILARITY_PRESETS } from '../../lib/reference/analyzer';
import { GENERATION_CONFIG } from '../../lib/constants';
import ReferenceUpload from '../../components/ReferenceUpload';
import LyricsGenerator from '../../components/LyricsGenerator';
import { generateTrackName } from '../../lib/audioUtils';
import { useRouter } from 'next/navigation';

export default function CreatePage() {
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
  const [referencePrompt, setReferencePrompt] = useState('');
  const [variationCount, setVariationCount] = useState(3);
  const [generatedLyrics, setGeneratedLyrics] = useState('');
  const [showLyricsGenerator, setShowLyricsGenerator] = useState(false);

  const { startGeneration, completeGeneration, failGeneration } = useGenerationStore();
  const { currentProjectId, addTrackToCurrentProject } = useProjectsStore();
  const router = useRouter();

  const styles = ['pop', 'rock', 'hip-hop', 'electronic', 'jazz', 'classical', 'lofi', 'R&B'];
  const moods = ['happy', 'sad', 'chill', 'energetic', 'epic', 'romantic', 'dark', 'upbeat'];
  const keys = ['C Major', 'C Minor', 'D Major', 'D Minor', 'E Major', 'E Minor', 'F Major', 'F Minor', 'G Major', 'G Minor', 'A Major', 'A Minor', 'B Major', 'B Minor'];

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() && !referencePrompt) {
      setError('Please enter a prompt or upload a reference track');
      return;
    }

    setIsGenerating(true);
    setError(null);
    
    try {
      const finalPrompt = referencePrompt || prompt;
      
      // Step 1: Optimize prompt with Mistral
      const optimizedPrompt = await optimizePrompt(finalPrompt);
      
      // Step 2: Generate multiple variations
      const variations = [];
      for (let i = 0; i < variationCount; i++) {
        const variationPrompt = i === 0 
          ? optimizedPrompt 
          : `${optimizedPrompt} - variation ${i + 1}`;
        
        const audioUrl = await generateMusic({
          prompt: variationPrompt,
          duration,
          model: 'medium',
        });
        
        variations.push(audioUrl);
      }

      // Step 3: Create track with all variations
      const track = {
        id: `track_${Date.now()}`,
        name: generatedLyrics ? generatedLyrics.substring(0, 50) : generateTrackName(style),
        audioUrl: variations[0] || '', // Required field - use first variation as default
        audioUrls: variations,
        currentVariation: 0,
        duration,
        prompt: optimizedPrompt,
        lyrics: generatedLyrics || '',
        generationSettings: {
          prompt: optimizedPrompt,
          style,
          mood,
          duration,
          bpm,
          key,
          weirdness,
          variations: variationCount,
        },
        createdAt: new Date().toISOString(),
      };

      completeGeneration(track);
      
      // Save to current project
      if (currentProjectId) {
        addTrackToCurrentProject(track);
      }
      
      // Redirect to library
      router.push('/library');
      
      setReferencePrompt('');
      setPrompt('');
      setGeneratedLyrics('');
    } catch (err: any) {
      setError(err.message || 'Generation failed');
      failGeneration(err.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  }, [
    prompt, referencePrompt, style, mood, duration, bpm, key, weirdness, 
    variationCount, generatedLyrics, startGeneration, completeGeneration, 
    failGeneration, currentProjectId, addTrackToCurrentProject, router
  ]);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create Music
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Generate professional tracks with AI
          </p>
        </header>

        {/* Generation Form */}
        <div className="card mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Generation Settings</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLyricsGenerator(!showLyricsGenerator)}
                className="btn btn-secondary px-4 py-2 text-sm"
              >
                {showLyricsGenerator ? 'Hide' : 'Generate'} Lyrics
              </button>
            </div>
          </div>
          
          {/* Lyrics Generator */}
          {showLyricsGenerator && (
            <div className="mb-6">
              <LyricsGenerator
                onLyricsGenerated={(lyrics: string) => {
                  setGeneratedLyrics(lyrics);
                  setPrompt(lyrics);
                }}
              />
            </div>
          )}

          {/* Reference Track Upload */}
          <ReferenceUpload
            onReferenceLoaded={(prompt: string, settings: any) => {
              setReferencePrompt(prompt);
              if (settings.bpm) setBpm(settings.bpm);
              if (settings.key) setKey(settings.key);
              if (settings.style) setStyle(settings.style);
              if (settings.mood) setMood(settings.mood);
            }}
          />
          
          {/* Generated Lyrics Display */}
          {generatedLyrics && (
            <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <h3 className="font-medium mb-2">Generated Lyrics:</h3>
              <p className="text-sm whitespace-pre-wrap">{generatedLyrics}</p>
            </div>
          )}

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
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Tip: Be specific about genre, mood, instruments, and style
            </p>
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
                onChange={(e) => setDuration(Math.min(120, Math.max(10, Number(e.target.value))))}
                min={10}
                max={GENERATION_CONFIG.maxDuration}
                className="input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Variations</label>
              <input
                type="number"
                value={variationCount}
                onChange={(e) => setVariationCount(Math.min(5, Math.max(1, Number(e.target.value))))}
                min={1}
                max={GENERATION_CONFIG.maxVariations}
                className="input"
              />
            </div>
          </div>

          {/* More Controls */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">BPM</label>
              <input
                type="number"
                value={bpm}
                onChange={(e) => setBpm(Math.min(200, Math.max(60, Number(e.target.value))))}
                min={60}
                max={200}
                className="input"
              />
            </div>
            
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
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Reference Similarity
            </label>
            <select
              value={similarity}
              onChange={(e) => setSimilarity(Number(e.target.value))}
              className="input"
            >
              {Object.entries(SIMILARITY_PRESETS).map(([key, preset]: [string, any]) => (
                <option key={key} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              How closely to match the reference track style (25%=very creative, 100%=exact copy)
            </p>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || (!prompt.trim() && !referencePrompt)}
            className="btn btn-primary w-full py-3 text-lg"
          >
            {isGenerating ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                Generating {variationCount} variations...
              </>
            ) : (
              `Generate ${variationCount} Variations`
            )}
          </button>

          {error && (
            <p className="mt-4 text-red-600 dark:text-red-400">{error}</p>
          )}
          
          {/* Estimate */}
          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm">
            <p className="text-gray-600 dark:text-gray-400">
              Estimated time: {(duration * variationCount / 10).toFixed(0)} - {(duration * variationCount / 5).toFixed(0)} seconds<br />
              Estimated cost: ${(0.02 * variationCount).toFixed(2)} (Replicate MusicGen Medium)
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
