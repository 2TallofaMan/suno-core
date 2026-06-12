'use client';

import { useParams } from 'next/navigation';
import { useProjectsStore } from '../../../store/projectsStore';
import { useState, useEffect, useRef, useCallback } from 'react';
import { separateStems, generateVocals } from '../../../lib/replicate';
import VocalGenerator from '../../../components/VocalGenerator';
import AudioTrimmer from '../../../components/AudioTrimmer';
import { triggerDownload, formatDuration } from '../../../lib/audioUtils';

export default function EditPage() {
  const params = useParams();
  const trackId = params.id as string;
  const { projects, currentProjectId, updateProject } = useProjectsStore();
  const [track, setTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [stems, setStems] = useState<{
    vocals: string;
    drums: string;
    bass: string;
    other: string;
  } | null>(null);
  const [isSeparating, setIsSeparating] = useState(false);
  const [showTrimmer, setShowTrimmer] = useState(false);
  const [currentVariation, setCurrentVariation] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentProject = projects.find((p: any) => p.id === currentProjectId);
  const trackData = currentProject?.tracks.find((t: any) => t.id === trackId);

  useEffect(() => {
    if (trackData) {
      setTrack(trackData);
      // If track has multiple variations, use the first one as default
      if (trackData.audioUrls && trackData.audioUrls.length > 0) {
        setCurrentVariation(trackData.currentVariation || 0);
      }
    }
  }, [trackData]);

  // Get current audio URL (supports both single URL and multiple variations)
  const getCurrentAudioUrl = (): string => {
    if (track?.audioUrls && track.audioUrls.length > 0) {
      return track.audioUrls[currentVariation] || track.audioUrls[0];
    }
    return track?.audioUrl || '';
  };

  // Get all variations
  const getVariations = (): string[] => {
    if (track?.audioUrls && track.audioUrls.length > 0) {
      return track.audioUrls;
    }
    if (track?.audioUrl) {
      return [track.audioUrl];
    }
    return [];
  };

  const handleSeparateStems = async () => {
    const audioUrl = getCurrentAudioUrl();
    if (!audioUrl) return;
    
    setIsSeparating(true);
    try {
      const result = await separateStems(audioUrl);
      setStems(result);
    } catch (err: any) {
      console.error('Stem separation failed:', err);
    } finally {
      setIsSeparating(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.volume = volume;
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleVariationChange = (index: number) => {
    setCurrentVariation(index);
    setIsPlaying(false);
    // Update track in store if needed
    if (track) {
      const updatedTrack = { ...track, currentVariation: index };
      updateProject(currentProjectId!, {
        tracks: currentProject?.tracks.map(t => t.id === trackId ? updatedTrack : t) || []
      });
      setTrack(updatedTrack);
    }
  };

  const handleTrimComplete = (trimmedUrl: string, startTime: number, endTime: number) => {
    if (!track) return;
    
    // Create a new variation with the trimmed audio
    const variations = getVariations();
    const newVariations = [...variations, trimmedUrl];
    
    const updatedTrack = {
      ...track,
      audioUrls: newVariations,
      currentVariation: newVariations.length - 1,
      duration: endTime - startTime,
    };
    
    updateProject(currentProjectId!, {
      tracks: currentProject?.tracks.map((t: any) => t.id === trackId ? updatedTrack : t) || []
    });
    
    setTrack(updatedTrack);
    setCurrentVariation(newVariations.length - 1);
    setShowTrimmer(false);
  };

  if (!track) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
        <p className="text-center text-gray-600 dark:text-gray-400">
          Track not found
        </p>
      </main>
    );
  }

  const variations = getVariations();
  
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Edit Track
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {track.name}
          </p>
        </header>

        {/* Variations Selector */}
        {variations.length > 1 && (
          <div className="card mb-8">
            <h2 className="text-xl font-semibold mb-4">Variations ({variations.length})</h2>
            <div className="flex flex-wrap gap-2">
              {variations.map((url, index) => (
                <button
                  key={index}
                  onClick={() => handleVariationChange(index)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    currentVariation === index
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Variation {index + 1}
                  {track.lyrics && index === 0 && ' (Original with Lyrics)'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Audio Player */}
        <div className="card mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Audio Player</h2>
            <button
              onClick={() => setShowTrimmer(true)}
              className="btn btn-secondary px-4 py-2 text-sm"
            >
              Trim Audio
            </button>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={handlePlayPause}
              className="w-12 h-12 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            <audio
              ref={audioRef}
              src={getCurrentAudioUrl()}
              onEnded={() => setIsPlaying(false)}
              className="flex-1"
            />
          </div>
          {variations.length > 1 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Playing variation {currentVariation + 1} of {variations.length}
            </p>
          )}
          <div className="flex items-center gap-4">
            <span className="text-sm">Volume:</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1"
            />
          </div>
        </div>

        {/* Lyrics Display */}
        {track.lyrics && (
          <div className="card mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Lyrics</h2>
              <button
                onClick={() => triggerDownload(`${track.name}-lyrics.txt`, 'data:text/plain;charset=utf-8,${encodeURIComponent(track.lyrics)}')}
                className="btn btn-secondary px-4 py-2 text-sm"
              >
                Download Lyrics
              </button>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 whitespeace-pre-wrap">
              <p className="text-gray-900 dark:text-gray-100">{track.lyrics}</p>
            </div>
          </div>
        )}

        {/* Track Info */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold mb-4">Track Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Duration</label>
              <p>{track.duration} seconds</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Created</label>
              <p>{new Date(track.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Style</label>
              <p>{track.generationSettings?.style || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mood</label>
              <p>{track.generationSettings?.mood || 'N/A'}</p>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Prompt</label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {track.prompt}
              </p>
            </div>
          </div>
        </div>

        {/* Vocal Generation */}
        <div className="card mb-8">
          <VocalGenerator
            trackId={trackId}
            audioUrl={getCurrentAudioUrl()}
            onVocalsGenerated={(vocalUrl: string) => {
              // Create a new track with vocals or update existing
              alert(`Vocals generated: ${vocalUrl}`);
            }}
          />
        </div>

        {/* Stem Separation */}
        <div className="card mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Stem Separation</h2>
            <button
              onClick={() => triggerDownload(getCurrentAudioUrl(), `${track.name}-var${currentVariation + 1}.mp3`)}
              className="btn btn-secondary px-4"
            >
              Download Current
            </button>
          </div>
          <div className="flex gap-2 mb-4">
            <button
              onClick={handleSeparateStems}
              disabled={isSeparating || !getCurrentAudioUrl()}
              className="btn btn-secondary flex-1"
            >
              {isSeparating ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></span>
                  Separating...
                </>
              ) : (
                'Separate into Stems'
              )}
            </button>
            <button
              onClick={() => setShowTrimmer(true)}
              className="btn btn-secondary flex-1"
            >
              Trim Audio
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Separate the current variation into Vocals, Drums, Bass, and Other stems
          </p>

          {stems && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stems).map(([key, url]) => (
                <div key={key} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-medium capitalize mb-2">{key}</h3>
                  <audio src={url} controls className="w-full" />
                  <button
                    onClick={() => triggerDownload(url, `${track.name}_${key}.mp3`)}
                    className="btn btn-secondary px-3 py-1 text-sm mt-2"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Audio Trimmer Modal */}
        {showTrimmer && (
          <AudioTrimmer
            audioUrl={getCurrentAudioUrl()}
            onTrimComplete={handleTrimComplete}
            onCancel={() => setShowTrimmer(false)}
          />
        )}
      </div>
    </main>
  );
}
