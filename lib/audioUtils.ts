// Audio utilities for the app

/**
 * Format duration in seconds to MM:SS
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Generate a unique track name
 */
export function generateTrackName(style: string = 'track'): string {
  const names = [
    'Melody', 'Beat', 'Song', 'Track', 'Vibe', 'Groove',
    'Tune', 'Riff', 'Banger', 'Anthem', 'Jam', 'Harmony'
  ];
  const adjectives = [
    'New', 'Fresh', 'Chill', 'Hot', 'Cool', 'Smooth', 'Epic',
    'Sweet', 'Dope', 'Fire', 'Sick', 'Cold', 'Warm'
  ];
  
  const randomName = names[Math.floor(Math.random() * names.length)];
  const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
  
  return `${randomAdj} ${randomName} ${style}`;
}

/**
 * Create a download link for audio
 */
export function createDownloadLink(audioUrl: string, fileName: string): HTMLAnchorElement {
  const link = document.createElement('a');
  link.href = audioUrl;
  link.download = fileName;
  return link;
}

/**
 * Trigger a download
 */
export function triggerDownload(audioUrl: string, fileName: string): void {
  const link = createDownloadLink(audioUrl, fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Get audio duration from URL (metadata)
 * Note: This is a placeholder - actual implementation would use audio metadata
 */
export async function getAudioDuration(url: string): Promise<number> {
  // For now, return a default or use the metadata from the generation
  // In production, you'd load the audio and check duration
  return new Promise((resolve) => {
    const audio = new Audio(url);
    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration);
    });
    audio.addEventListener('error', () => {
      resolve(30); // Default fallback
    });
  });
}

/**
 * Trim audio file using browser's MediaRecorder API
 * Note: This is a client-side implementation that works in modern browsers
 */
export async function trimAudio(audioUrl: string, startTime: number, endTime: number): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      // Fetch the audio file
      const response = await fetch(audioUrl);
      const audioBlob = await response.blob();
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Decode the audio data
      const audioBuffer = await audioContext.decodeAudioData(await audioBlob.arrayBuffer());
      
      // Calculate trim parameters
      const sampleRate = audioBuffer.sampleRate;
      const startSample = Math.floor(startTime * sampleRate);
      const endSample = Math.floor(endTime * sampleRate);
      const durationSamples = endSample - startSample;
      
      // Create a new buffer for the trimmed audio
      const trimmedBuffer = audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        durationSamples,
        sampleRate
      );
      
      // Copy the data for each channel
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        const trimmedChannelData = trimmedBuffer.getChannelData(channel);
        for (let i = 0; i < durationSamples; i++) {
          trimmedChannelData[i] = channelData[startSample + i];
        }
      }
      
      // Encode the trimmed buffer to WAV
      const trimmedBlob = await encodeAudioBuffer(trimmedBuffer);
      
      // Create a URL for the trimmed audio
      const trimmedUrl = URL.createObjectURL(trimmedBlob);
      resolve(trimmedUrl);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Helper function to encode AudioBuffer to WAV blob
 */
function encodeAudioBuffer(buffer: AudioBuffer): Promise<Blob> {
  return new Promise((resolve) => {
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const bytesPerSample = 2;
    const blockAlign = numberOfChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = buffer.length * numberOfChannels * bytesPerSample;
    
    const bufferLength = 44 + dataSize;
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);
    
    // Write WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bytesPerSample * 8, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Write PCM data
    const offset = 44;
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < buffer.length; i++) {
        const sample = Math.max(-1, Math.min(1, channelData[i]));
        const intSample = sample < 0 ? sample * 32768 : sample * 32767;
        view.setInt16(offset + i * bytesPerSample * numberOfChannels + channel * bytesPerSample, intSample, true);
      }
    }
    
    resolve(new Blob([arrayBuffer], { type: 'audio/wav' }));
  });
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
