/**
 * Audio Processing Utilities for Gemini Live API
 * Handles encoding/decoding and playback queue management
 */

/**
 * Convert Float32Array (microphone input) to base64-encoded Int16 PCM
 * Gemini Live API requires PCM16 format
 */
export function encodeAudioForAPI(float32Array: Float32Array): string {
  // Convert Float32 (-1.0 to 1.0) to Int16 (-32768 to 32767)
  const int16Array = new Int16Array(float32Array.length);
  
  for (let i = 0; i < float32Array.length; i++) {
    // Clamp to [-1, 1] range and scale to Int16
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  // Convert Int16Array to Uint8Array (little-endian)
  const uint8Array = new Uint8Array(int16Array.buffer);
  
  // Convert to base64 in chunks to avoid stack overflow
  let binary = '';
  const chunkSize = 0x8000; // 32KB chunks
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
}

/**
 * Decode base64-encoded Int16 PCM to Float32Array for playback
 */
export function decodeAudioFromAPI(base64Audio: string): Int16Array {
  // Decode base64 to binary string
  const binaryString = atob(base64Audio);
  
  // Convert to Uint8Array
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Convert Uint8Array to Int16Array (little-endian)
  const int16Array = new Int16Array(bytes.buffer);
  
  return int16Array;
}

/**
 * Convert Int16 PCM to AudioBuffer for Web Audio API playback
 */
export function createAudioBuffer(
  int16Data: Int16Array,
  audioContext: AudioContext,
  sampleRate: number = 16000
): AudioBuffer {
  // Create audio buffer
  const audioBuffer = audioContext.createBuffer(1, int16Data.length, sampleRate);
  const channelData = audioBuffer.getChannelData(0);
  
  // Convert Int16 to Float32
  for (let i = 0; i < int16Data.length; i++) {
    channelData[i] = int16Data[i] / (int16Data[i] < 0 ? 0x8000 : 0x7FFF);
  }
  
  return audioBuffer;
}

/**
 * Audio Queue for sequential playback
 * Prevents overlapping audio chunks and ensures smooth transitions
 */
export class AudioQueue {
  private queue: Uint8Array[] = [];
  private isPlaying = false;
  private audioContext: AudioContext;
  private currentSource: AudioBufferSourceNode | null = null;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  /**
   * Add audio chunk to queue and play if not already playing
   */
  async addToQueue(audioData: Uint8Array | string): Promise<void> {
    let bytes: Uint8Array;
    
    if (typeof audioData === 'string') {
      // Decode base64 string
      const int16Data = decodeAudioFromAPI(audioData);
      bytes = new Uint8Array(int16Data.buffer);
    } else {
      bytes = audioData;
    }
    
    this.queue.push(bytes);
    
    if (!this.isPlaying) {
      await this.playNext();
    }
  }

  /**
   * Play next audio chunk in queue
   */
  private async playNext(): Promise<void> {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const audioData = this.queue.shift()!;

    try {
      // Convert bytes to Int16Array
      const int16Data = new Int16Array(audioData.buffer);
      
      // Create audio buffer
      const audioBuffer = createAudioBuffer(int16Data, this.audioContext, 16000);
      
      // Create source node
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      
      this.currentSource = source;
      
      // Play next chunk when this one ends
      source.onended = () => {
        this.currentSource = null;
        this.playNext();
      };
      
      source.start(0);
      
    } catch (error) {
      console.error('Error playing audio chunk:', error);
      // Continue with next chunk even if current fails
      this.playNext();
    }
  }

  /**
   * Clear all queued audio (for interruptions)
   */
  clear(): void {
    this.queue = [];
    
    // Stop current playback
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (error) {
        // Ignore errors if already stopped
      }
      this.currentSource = null;
    }
    
    this.isPlaying = false;
  }

  /**
   * Check if audio is currently playing
   */
  get playing(): boolean {
    return this.isPlaying;
  }

  /**
   * Get number of queued chunks
   */
  get queueLength(): number {
    return this.queue.length;
  }
}
