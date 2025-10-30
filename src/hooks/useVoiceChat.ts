import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';

export type VoiceState = 'idle' | 'connecting' | 'listening' | 'speaking' | 'processing' | 'error';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface UseVoiceChatOptions {
  conversationId: string;
  onTranscript?: (text: string, role: 'user' | 'assistant') => void;
  onError?: (error: Error) => void;
}

/**
 * Custom hook for managing voice chat using Gemini Live API
 * Real-time audio streaming approach with WebSockets
 */
export const useVoiceChat = ({
  conversationId,
  onTranscript,
  onError,
}: UseVoiceChatOptions) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [userTranscript, setUserTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  
  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  
  const { toast } = useToast();

  // Check browser support
  useEffect(() => {
    const supported = 
      'WebSocket' in window &&
      'AudioContext' in window &&
      navigator.mediaDevices?.getUserMedia !== undefined;
    
    setIsSupported(supported);
    
    if (!supported) {
      toast({
        title: 'Voice not supported',
        description: 'Your browser does not support voice chat. Please use a modern browser.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Play audio response from Gemini
  const playAudioChunk = useCallback((audioData: string) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    }

    const context = audioContextRef.current;
    
    // Decode base64 audio data
    const binaryString = atob(audioData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Convert to Float32Array (PCM16)
    const pcmData = new Int16Array(bytes.buffer);
    const float32Data = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      float32Data[i] = pcmData[i] / 32768.0;
    }
    
    // Add to queue
    audioQueueRef.current.push(float32Data);
    
    // Start playback if not already playing
    if (!isPlayingRef.current) {
      playAudioQueue();
    }
  }, []);

  // Play queued audio
  const playAudioQueue = useCallback(async () => {
    if (!audioContextRef.current || audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setVoiceState('listening');
      return;
    }

    isPlayingRef.current = true;
    setVoiceState('speaking');

    const context = audioContextRef.current;
    const audioData = audioQueueRef.current.shift()!;
    
    // Create audio buffer
    const audioBuffer = context.createBuffer(1, audioData.length, context.sampleRate);
    audioBuffer.getChannelData(0).set(audioData);
    
    // Create buffer source
    const source = context.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(context.destination);
    
    // Schedule next chunk when this one ends
    source.onended = () => {
      playAudioQueue();
    };
    
    source.start();
  }, []);

  // Send audio to server
  const sendAudioData = useCallback((audioData: Float32Array) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    // Convert Float32 to Int16 PCM
    const pcmData = new Int16Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      const s = Math.max(-1, Math.min(1, audioData[i]));
      pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    // Convert to base64
    const bytes = new Uint8Array(pcmData.buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Audio = btoa(binary);

    // Send to server
    wsRef.current.send(JSON.stringify({
      type: 'audio_input',
      audio: base64Audio,
      mimeType: 'audio/pcm'
    }));
  }, []);

  // Initialize audio capture
  const startAudioCapture = useCallback(async () => {
    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      mediaStreamRef.current = stream;

      // Create audio context for processing
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      }
      const audioContext = audioContextRef.current;

      // Create audio source from microphone
      const source = audioContext.createMediaStreamSource(stream);
      
      // Create script processor for audio data
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (voiceState === 'listening') {
          const inputData = e.inputBuffer.getChannelData(0);
          sendAudioData(inputData);
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      console.log('Audio capture started');
    } catch (error) {
      console.error('Failed to start audio capture:', error);
      throw error;
    }
  }, [sendAudioData, voiceState]);

  // Stop audio capture
  const stopAudioCapture = useCallback(() => {
    // Stop microphone
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // Disconnect processor
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    console.log('Audio capture stopped');
  }, []);

  // Initialize WebSocket connection
  const connectWebSocket = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const wsUrl = `${import.meta.env.VITE_SUPABASE_URL.replace('http', 'ws')}/functions/v1/voice-chat`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        
        // Send initialization message
        ws.send(JSON.stringify({
          type: 'init',
          conversationId,
          token: session.access_token,
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          switch (message.type) {
            case 'ready':
              console.log('Voice chat ready');
              setVoiceState('listening');
              startAudioCapture();
              break;

            case 'audio_response':
              // Play audio response from Gemini
              playAudioChunk(message.audio);
              break;

            case 'turn_complete':
              // AI finished speaking, resume listening
              setVoiceState('listening');
              setAiTranscript('');
              break;

            case 'transcript_user':
              // Update user transcript
              setUserTranscript(message.text);
              onTranscript?.(message.text, 'user');
              break;

            case 'transcript_assistant':
              // Update assistant transcript
              setAiTranscript(message.text);
              onTranscript?.(message.text, 'assistant');
              
              // Add to message history
              setMessages(prev => [
                ...prev,
                { role: 'assistant', content: message.text, timestamp: new Date() },
              ]);
              break;

            case 'error':
              console.error('Server error:', message.error);
              setVoiceState('error');
              onError?.(new Error(message.error));
              toast({
                title: 'Voice error',
                description: message.error,
                variant: 'destructive',
              });
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setVoiceState('error');
        onError?.(new Error('Connection error'));
        toast({
          title: 'Connection error',
          description: 'Failed to connect to voice service',
          variant: 'destructive',
        });
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        stopAudioCapture();
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      throw error;
    }
  }, [conversationId, onTranscript, onError, toast, startAudioCapture, stopAudioCapture, playAudioChunk]);

  // Start voice chat session
  const startVoiceChat = useCallback(async () => {
    if (!isSupported) {
      toast({
        title: 'Not supported',
        description: 'Voice chat requires a modern browser with WebSocket and AudioContext support',
        variant: 'destructive',
      });
      return;
    }

    try {
      setVoiceState('connecting');
      await connectWebSocket();

      toast({
        title: 'Voice activated',
        description: 'Connected to Gemini Live API. Start speaking...',
      });

    } catch (error) {
      console.error('Failed to start voice chat:', error);
      setVoiceState('error');
      onError?.(error as Error);
      toast({
        title: 'Failed to start',
        description: error instanceof Error ? error.message : 'Could not start voice chat',
        variant: 'destructive',
      });
    }
  }, [isSupported, toast, onError, connectWebSocket]);

  // Stop voice chat
  const stopVoiceChat = useCallback(() => {
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Stop audio
    stopAudioCapture();

    // Clear audio queue
    audioQueueRef.current = [];
    isPlayingRef.current = false;

    setVoiceState('idle');
    setUserTranscript('');
    setAiTranscript('');
    
    toast({
      title: 'Voice chat ended',
      description: 'Your conversation has been saved.',
    });
  }, [toast, stopAudioCapture]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVoiceChat();
      
      // Clean up audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [stopVoiceChat]);

  return {
    voiceState,
    messages,
    userTranscript,
    aiTranscript,
    isSupported,
    startVoiceChat,
    stopVoiceChat,
  };
};
