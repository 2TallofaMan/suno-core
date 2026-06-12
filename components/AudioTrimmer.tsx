'use client';

import { useState, useRef, useEffect } from 'react';
import { trimAudio, formatDuration, getAudioDuration } from '../lib/audioUtils';
import { recordGeneration } from '../lib/usageTracker';

interface AudioTrimmerProps {
  audioUrl: string;
  onTrimComplete: (trimmedUrl: string, startTime: number, endTime: number) => void;
  onCancel: () => void;
}

export default function AudioTrimmer({ audioUrl, onTrimComplete, onCancel }: AudioTrimmerProps) {
  const [duration, setDuration] = useState(30);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(30);
  const [isTrimming, setIsTrimming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const waveformRef = useRef<HTMLCanvasElement>(null);
  
  // Load audio duration on mount
  useEffect(() => {
    const loadDuration = async () => {
      try {
        const dur = await getAudioDuration(audioUrl);
        setDuration(dur);
        setEndTime(dur);
      } catch (err) {
        setError('Failed to load audio duration');
      }
    };
    loadDuration();
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [audioUrl]);
  
  // Update audio playback position
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      if (audio.currentTime >= endTime) {
        audio.pause();
        audio.currentTime = startTime;
        setIsPlaying(false);
      }
    };
    
    audio.addEventListener('timeupdate', updateTime);
    return () => audio.removeEventListener('timeupdate', updateTime);
  }, [startTime, endTime]);
  
  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
    } else {
      audio.currentTime = startTime;
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };
  
  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(e.target.value), endTime - 0.1);
    setStartTime(value);
    if (audioRef.current && isPlaying) {
      audioRef.current.currentTime = value;
    }
  };
  
  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(e.target.value), startTime + 0.1);
    setEndTime(value);
  };
  
  const handleTrim = async () => {
    if (startTime >= endTime) {
      setError('Start time must be before end time');
      return;
    }
    
    setIsTrimming(true);
    setError(null);
    
    try {
      const trimmedUrl = await trimAudio(audioUrl, startTime, endTime);
      
      // Track the trim operation
      recordGeneration('trim', {
        model: 'client-side',
        duration: Math.round((endTime - startTime) * 10) / 10,
        prompt: `Trim: ${startTime}s to ${endTime}s`,
      });
      
      onTrimComplete(trimmedUrl, startTime, endTime);
    } catch (err: any) {
      setError(err.message || 'Trimming failed');
    } finally {
      setIsTrimming(false);
    }
  };
  
  const handlePreviewStart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = startTime;
    audio.play();
    setIsPlaying(true);
  };
  
  const handlePreviewEnd = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = endTime;
    audio.play();
    setIsPlaying(true);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Trim Audio</h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            Close
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
            {error}
          </div>
        )}
        
        {/* Waveform preview (simplified) */}
        <div className="mb-6">
          <div className="bg-gray-100 dark:bg-gray-700 rounded h-20 relative overflow-hidden">
            <canvas
              ref={waveformRef}
              className="w-full h-full"
              style={{ background: 'linear-gradient(to right, #3b82f6, #8b5cf6)' }}
            />
            {/* Selection overlay */}
            <div
              className="absolute top-0 h-full border-l-2 border-r-2 border-white"
              style={{
                left: `${(startTime / duration) * 100}%`,
                right: `${((duration - endTime) / duration) * 100}%`,
                background: 'rgba(255, 255, 255, 0.2)'
              }}
            />
          </div>
          
          <audio
            ref={audioRef}
            src={audioUrl}
            className="w-full mt-2"
            onEnded={() => setIsPlaying(false)}
          />
        </div>
        
        {/* Time controls */}
        <div className="space-y-6">
          <div>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Start: {formatDuration(startTime)}</span>
              <span>End: {formatDuration(endTime)}</span>
              <span>Duration: {formatDuration(endTime - startTime)}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Start Time</label>
                <input
                  type="range"
                  min={0}
                  max={endTime}
                  step={0.1}
                  value={startTime}
                  onChange={handleStartChange}
                  className="w-full"
                />
                <div className="flex gap-2 mt-1">
                  <button onClick={handlePreviewStart} className="btn btn-secondary px-3 py-1 text-xs">
                    Preview Start
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">End Time</label>
                <input
                  type="range"
                  min={startTime}
                  max={duration}
                  step={0.1}
                  value={endTime}
                  onChange={handleEndChange}
                  className="w-full"
                />
                <div className="flex gap-2 mt-1">
                  <button onClick={handlePreviewEnd} className="btn btn-secondary px-3 py-1 text-xs">
                    Preview End
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Playback controls */}
          <div className="flex justify-center gap-4">
            <button onClick={handlePlayPause} className="btn btn-secondary px-6">
              {isPlaying ? 'Pause' : 'Play Selection'}
            </button>
          </div>
          
          {/* Trim button */}
          <div className="flex gap-2">
            <button
              onClick={handleTrim}
              disabled={isTrimming || startTime >= endTime}
              className="flex-1 btn btn-primary"
            >
              {isTrimming ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></span>
                  Trimming...
                </>
              ) : (
                'Trim Audio'
              )}
            </button>
            <button onClick={onCancel} className="btn btn-secondary px-6">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
