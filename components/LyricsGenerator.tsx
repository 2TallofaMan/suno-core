'use client';

import { useState, useCallback } from 'react';
import { generateLyrics } from '../lib/mistral';

export default function LyricsGenerator({
  onLyricsGenerated,
}: {
  onLyricsGenerated: (lyrics: string) => void;
}) {
  const [theme, setTheme] = useState('');
  const [genre, setGenre] = useState('pop');
  const [mood, setMood] = useState('happy');
  const [structure, setStructure] = useState('verse-chorus');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const genres = ['pop', 'rock', 'hip-hop', 'R&B', 'country', 'jazz', 'blues', 'electronic'];
  const moods = ['happy', 'sad', 'angry', 'romantic', 'chill', 'epic', 'dark', 'upbeat'];
  const structures = [
    'verse-chorus',
    'verse-chorus-verse-chorus',
    'verse-prechorus-chorus',
    'full-song',
  ];

  const handleGenerate = useCallback(async () => {
    if (!theme.trim()) {
      setError('Please enter a theme');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const lyrics = await generateLyrics(theme, genre, mood, structure);
      onLyricsGenerated(lyrics);
    } catch (err: any) {
      setError(err.message || 'Lyrics generation failed');
    } finally {
      setIsGenerating(false);
    }
  }, [theme, genre, mood, structure, onLyricsGenerated]);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
      <h3 className="font-semibold mb-3">Generate Lyrics</h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-2">Theme</label>
          <input
            type="text"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="Love, heartbreak, party..."
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Genre</label>
          <select value={genre} onChange={(e) => setGenre(e.target.value)} className="input">
            {genres.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Mood</label>
          <select value={mood} onChange={(e) => setMood(e.target.value)} className="input">
            {moods.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Structure</label>
          <select value={structure} onChange={(e) => setStructure(e.target.value)} className="input">
            {structures.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={isGenerating || !theme.trim()}
        className="btn btn-primary w-full"
      >
        {isGenerating ? (
          <>
            <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></span>
            Generating...
          </>
        ) : (
          'Generate Lyrics'
        )}
      </button>

      {error && (
        <p className="mt-2 text-red-600 dark:text-red-400 text-sm">{error}</p>
      )}
    </div>
  );
}
