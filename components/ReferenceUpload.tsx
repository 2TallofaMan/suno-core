'use client';

import { useState, useCallback } from 'react';
import { generatePromptFromReference, SIMILARITY_PRESETS, DEFAULT_WEIGHTS } from '../lib/reference/analyzer';

export interface ReferenceSettings {
  similarity: number;
  weight: {
    bpm: number;
    key: number;
    genre: number;
    mood: number;
    instruments: number;
  };
}

interface ReferenceUploadProps {
  onReferenceLoaded: (prompt: string, settings: any) => void;
}

export default function ReferenceUpload({ onReferenceLoaded }: ReferenceUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [similarity, setSimilarity] = useState(0.75);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  const handleApplyReference = useCallback(() => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      // For now, using mock analysis
      // In production, this would use actual audio analysis
      const mockFeatures = {
        bpm: 120,
        key: 'C Major',
        duration: 30,
        genre: 'pop',
        mood: 'happy',
        instruments: ['piano', 'drums', 'bass'],
      };

      const { prompt, settings } = generatePromptFromReference(
        mockFeatures,
        similarity,
        ''
      );

      onReferenceLoaded(prompt, settings);
    } catch (err: any) {
      setError(err.message || 'Failed to process reference');
    } finally {
      setIsLoading(false);
    }
  }, [file, similarity, onReferenceLoaded]);

  const handleWeightChange = (key: keyof typeof weights, value: number) => {
    setWeights((prev: any) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
      <h3 className="font-semibold mb-3">Reference Track</h3>
      
      {/* File Upload */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Upload Reference (optional)
        </label>
        <div className="flex gap-2">
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="flex-1"
          />
          {file && (
            <button
              onClick={handleRemoveFile}
              className="btn btn-secondary px-4"
            >
              Remove
            </button>
          )}
        </div>
        {file && (
          <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
            {file.name} - {Math.round(file.size / 1024 / 1024)} MB
          </div>
        )}
      </div>

      {/* Similarity Slider */}
      {file && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Similarity: {similarity * 100}%
          </label>
          <input
            type="range"
            min={0.25}
            max={1}
            step={0.05}
            value={similarity}
            onChange={(e) => setSimilarity(Number(e.target.value))}
            className="w-full mb-2"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>25% (Creative)</span>
            <span>50% (Balanced)</span>
            <span>75% (Similar)</span>
            <span>100% (Exact)</span>
          </div>
        </div>
      )}

      {/* Apply Button */}
      {file && (
        <button
          onClick={handleApplyReference}
          disabled={isLoading}
          className="btn btn-secondary w-full"
        >
          {isLoading ? (
            <>
              <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></span>
              Processing...
            </>
          ) : (
            'Apply to Generation'
          )}
        </button>
      )}

      {error && (
        <p className="mt-2 text-red-600 dark:text-red-400 text-sm">{error}</p>
      )}
    </div>
  );
}
