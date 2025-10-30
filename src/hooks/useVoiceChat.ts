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
 * OpenAI Realtime API voice chat hook
 * - Ultra-low latency (300-600ms)
 * - Native audio streaming (no STT/TTS intermediary)
 * - Best-in-class voice quality
 * - Natural interruption handling
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
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioWorkletRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const currentAiTextRef = useRef('');
  
  const { toast } = useToast();

  // Check browser support
  useEffect(() => {
    const supported = 
      'WebSocket' in window &&
      'AudioContext' in window &&
      'mediaDevices' in navigator;
    
    setIsSupported(supported);
    
    if (!supported) {
      toast({
        title: 'Voice not supported',
        description: 'Your browser does not support voice chat. Please use Chrome, Edge, or Safari.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Convert Float32Array to Int16Array (PCM16)
  const floatTo16BitPCM = (float32Array: Float32Array): Int16Array => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array;
  };

  // Convert base64 to AudioBuffer for playback
  const base64ToAudioBuffer = async (base64: string): Promise<AudioBuffer | null> => {
    try {
      if (!audioContextRef.current) return null;
      
      // Decode base64
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Convert Int16 PCM to Float32 for Web Audio API
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / (int16Array[i] < 0 ? 0x8000 : 0x7fff);
      }
      
      // Create AudioBuffer (24kHz mono - OpenAI output format)
      const audioBuffer = audioContextRef.current.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);
      
      return audioBuffer;
    } catch (error) {
      console.error('Error converting audio:', error);
      return null;
    }
  };

  // Play audio buffer
  const playAudioBuffer = useCallback(async (audioBuffer: AudioBuffer) => {
    if (!audioContextRef.current) return;
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    
    source.onended = () => {
      // Play next in queue or update state
      if (playbackQueueRef.current.length > 0) {
        const nextBuffer = playbackQueueRef.current.shift();
        if (nextBuffer) {
          playAudioBuffer(nextBuffer);
        }
      } else {
        isPlayingRef.current = false;
        if (voiceState === 'speaking') {
          setVoiceState('listening');
        }
      }
    };
    
    source.start(0);
    isPlayingRef.current = true;
    setVoiceState('speaking');
  }, [voiceState]);

  // Start audio capture
  const startAudioCapture = useCallback(async () => {
    try {
      // Create audio context
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      
      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1,
        }
      });
      
      audioStreamRef.current = stream;
      
      // Create audio source
      const source = audioContextRef.current.createMediaStreamSource(stream);
      audioWorkletRef.current = source;
      
      // Create script processor to capture audio chunks
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      
      processor.onaudioprocess = (e) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = floatTo16BitPCM(inputData);
        
        // Convert to base64 and send to server
        const uint8Array = new Uint8Array(pcm16.buffer);
        const base64 = btoa(String.fromCharCode(...uint8Array));
        
        wsRef.current.send(JSON.stringify({
          type: 'audio_input',
          audio: base64,
        }));
      };
      
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      
      console.log('✅ Audio capture started');
      
    } catch (error) {
      console.error('Failed to start audio capture:', error);
      throw error;
    }
  }, []);

  // Stop audio capture
  const stopAudioCapture = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    if (audioWorkletRef.current) {
      audioWorkletRef.current.disconnect();
      audioWorkletRef.current = null;
    }
    
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    playbackQueueRef.current = [];
    isPlayingRef.current = false;
    
    console.log('🛑 Audio capture stopped');
  }, []);

  // Start voice chat session
  const startVoiceChat = useCallback(async () => {
    if (!isSupported) {
      toast({
        title: 'Not supported',
        description: 'Voice chat requires a modern browser with WebSocket support',
        variant: 'destructive',
      });
      return;
    }

    try {
      setVoiceState('connecting');

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Start audio capture
      await startAudioCapture();

      // Connect to WebSocket - correct format for Supabase edge functions
      const wsUrl = `wss://rnvtbtefsskbwaadedef.supabase.co/functions/v1/voice-chat`;
      
      console.log('🔌 Connecting to WebSocket:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        console.log('📡 Sending init message with conversationId:', conversationId);
        
        // Send initialization message
        ws.send(JSON.stringify({
          type: 'init',
          conversationId,
          token: session.access_token,
        }));
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          
          console.log('📨 Received:', data.type);

                switch (data.type) {
                  case 'ready':
                    setVoiceState('listening');
                    toast({
                      title: 'Voice activated',
                      description: 'Start speaking naturally. I\'m listening...',
                    });
                    break;

                  case 'speech_started':
                    setVoiceState('listening');
                    setUserTranscript('');
                    currentAiTextRef.current = '';
                    break;

                  case 'speech_stopped':
                    setVoiceState('processing');
                    break;

                  case 'user_transcript':
                    setUserTranscript(data.text);
                    onTranscript?.(data.text, 'user');
                    break;

                  case 'ai_transcript_delta':
                    currentAiTextRef.current += data.text;
                    setAiTranscript(currentAiTextRef.current);
                    break;

                  case 'audio_response': {
                    // Queue audio for playback
                    const audioBuffer = await base64ToAudioBuffer(data.audio);
                    if (audioBuffer) {
                      if (!isPlayingRef.current) {
                        playAudioBuffer(audioBuffer);
                      } else {
                        playbackQueueRef.current.push(audioBuffer);
                      }
                    }
                    break;
                  }

                  case 'response_complete': {
                    // Add to message history
                    if (userTranscript && currentAiTextRef.current) {
                      const newMessages: Message[] = [
                        { role: 'user', content: userTranscript, timestamp: new Date() },
                        { role: 'assistant', content: currentAiTextRef.current, timestamp: new Date() },
                      ];
                      
                      setMessages(prev => [...prev, ...newMessages]);
                      onTranscript?.(currentAiTextRef.current, 'assistant');
                    }
                    
                    // Reset transcripts
                    setTimeout(() => {
                      setUserTranscript('');
                      setAiTranscript('');
                    }, 2000);
                    break;
                  }

                  case 'error':
                    console.error('❌ Server error:', data.error);
                    setVoiceState('error');
                    onError?.(new Error(data.error));
                    toast({
                      title: 'Voice error',
                      description: data.error,
                      variant: 'destructive',
                    });
                    break;
                }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setVoiceState('error');
        onError?.(new Error('WebSocket connection failed'));
        toast({
          title: 'Connection error',
          description: 'Failed to connect to voice service',
          variant: 'destructive',
        });
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket closed');
        if (voiceState !== 'idle') {
          setVoiceState('idle');
        }
      };

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
  }, [isSupported, conversationId, toast, onError, onTranscript, startAudioCapture, playAudioBuffer, userTranscript, voiceState]);

  // Stop voice chat
  const stopVoiceChat = useCallback(() => {
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Stop audio
    stopAudioCapture();

    setVoiceState('idle');
    setUserTranscript('');
    setAiTranscript('');
    currentAiTextRef.current = '';
    
    toast({
      title: 'Voice chat ended',
      description: 'Your conversation has been saved.',
    });
  }, [toast, stopAudioCapture]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      stopAudioCapture();
    };
  }, [stopAudioCapture]);

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
