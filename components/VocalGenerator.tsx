'use client';

import { useState, useCallback } from 'react';
import { generateVocals } from '../lib/replicate';

export default function VocalGenerator({
  trackId,
  audioUrl,
  onVocalsGenerated,
}: {
  trackId: string;
  audioUrl: string;
  onVocalsGenerated: (vocalUrl: string) => void;
}) {
  const [lyrics, setLyrics] = useState('');
  const [style, setStyle] = useState('pop');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vocalStyles = [
    'pop',
    'rap',
    'rock',
    'R&B',
    'jazz',
    'opera',
    'whisper',
  ];

  const handleGenerateVocals = useCallback(async () => {
    if (!lyrics.trim()) {
      setError('Please enter lyrics');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const vocalUrl = await generateVocals(audioUrl, lyrics, style);
      onVocalsGenerated(vocalUrl);
    } catch (err: any) {
      setError(err.message || 'Vocal generation failed');
    } finally {
      setIsGenerating(false);
    }
  }, [audioUrl, lyrics, style, onVocalsGenerated]);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
      <h3 className="font-semibold mb-3">Add Vocals</h3>

      {/* Lyrics Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Lyrics</label>
        <textarea
          value={lyrics}
          onChange={(e) => setLyrics(e.target.value)}
          placeholder="Enter lyrics..."
          className="input min-h-[100px]"
        />
      </div>

      {/* Style Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Vocal Style</label>
        <select
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          className="input"
        >
          {vocalStyles.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerateVocals}
        disabled={isGenerating || !lyrics.trim()}
        className="btn btn-primary w-full"
      >
        {isGenerating ? (
          <>
            <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></span>
            Generating Vocals...
          </>
        ) : (
          'Generate Vocals'
        )}
      </button>

      {error && (
        <p className="mt-2 text-red-600 dark:text-red-400 text-sm">{error}</p>
      )}
    </div>
  );
}
