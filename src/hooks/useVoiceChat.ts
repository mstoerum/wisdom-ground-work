import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';
import { encodeAudioForAPI, AudioQueue } from '@/utils/audioProcessing';

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
 * Provides native bidirectional audio streaming
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
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  
  const { toast } = useToast();

  // Check browser support
  useEffect(() => {
    const supported = 
      'AudioContext' in window &&
      'navigator' in window &&
      'mediaDevices' in navigator;
    
    setIsSupported(supported);
    
    if (!supported) {
      toast({
        title: 'Voice not supported',
        description: 'Your browser does not support voice chat. Please use a modern browser.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Initialize WebSocket connection
  const connectWebSocket = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Get WebSocket URL
      const wsUrl = import.meta.env.VITE_SUPABASE_URL.replace('https://', 'wss://').replace('http://', 'ws://');
      const ws = new WebSocket(`${wsUrl}/functions/v1/voice-chat`);
      
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected to voice-chat');
        
        // Send initialization message
        ws.send(JSON.stringify({
          type: 'init',
          conversationId,
          token: session?.access_token || null,
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received from server:', data.type);

          switch (data.type) {
            case 'ready':
              console.log('Voice chat ready:', data.mode);
              setVoiceState('listening');
              toast({
                title: 'Voice activated',
                description: data.mode === 'live' 
                  ? 'Connected to Gemini Live API. Start speaking...'
                  : 'Voice mode active. Start speaking...',
              });
              break;

            case 'audio_response':
              // Received audio from Gemini
              if (audioQueueRef.current) {
                audioQueueRef.current.addToQueue(data.audio);
                setVoiceState('speaking');
              }
              break;

            case 'transcript_assistant':
              // AI transcript for display
              setAiTranscript(data.text);
              onTranscript?.(data.text, 'assistant');
              
              setMessages(prev => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg?.role === 'assistant') {
                  // Update existing assistant message
                  return [
                    ...prev.slice(0, -1),
                    { ...lastMsg, content: data.text }
                  ];
                } else {
                  // Add new assistant message
                  return [...prev, {
                    role: 'assistant',
                    content: data.text,
                    timestamp: new Date()
                  }];
                }
              });
              break;

            case 'turn_complete':
              // AI finished speaking
              setVoiceState('listening');
              setAiTranscript('');
              break;

            case 'error':
              console.error('Voice chat error:', data.error);
              setVoiceState('error');
              toast({
                title: 'Voice error',
                description: data.error,
                variant: 'destructive',
              });
              break;

            case 'gemini_disconnected':
              console.log('Gemini disconnected');
              setVoiceState('error');
              break;
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setVoiceState('error');
        onError?.(new Error('WebSocket connection error'));
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        setVoiceState('idle');
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setVoiceState('error');
      throw error;
    }
  }, [conversationId, onTranscript, onError, toast]);

  // Initialize audio capture
  const startAudioCapture = useCallback(async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      streamRef.current = stream;

      // Create audio context
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      // Create audio queue for playback
      audioQueueRef.current = new AudioQueue(audioContext);

      // Create source from microphone
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      // Create script processor for real-time audio processing
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        // Only send audio when listening (not when AI is speaking)
        if (voiceState === 'listening' && wsRef.current?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const base64Audio = encodeAudioForAPI(inputData);
          
          wsRef.current.send(JSON.stringify({
            type: 'audio_chunk',
            audio: base64Audio,
          }));
        }
      };

      // Connect audio pipeline
      source.connect(processor);
      processor.connect(audioContext.destination);

      console.log('Audio capture started');

    } catch (error) {
      console.error('Failed to start audio capture:', error);
      throw error;
    }
  }, [voiceState]);

  // Start voice chat session
  const startVoiceChat = useCallback(async () => {
    if (!isSupported) {
      toast({
        title: 'Not supported',
        description: 'Voice chat requires a modern browser with audio support',
        variant: 'destructive',
      });
      return;
    }

    try {
      setVoiceState('connecting');

      // Connect WebSocket first
      await connectWebSocket();

      // Start audio capture
      await startAudioCapture();

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
  }, [isSupported, toast, onError, connectWebSocket, startAudioCapture]);

  // Stop voice chat
  const stopVoiceChat = useCallback(() => {
    console.log('Stopping voice chat');

    // Stop WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Stop audio capture
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Clear audio queue
    if (audioQueueRef.current) {
      audioQueueRef.current.clear();
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setVoiceState('idle');
    setUserTranscript('');
    setAiTranscript('');
    
    toast({
      title: 'Voice chat ended',
      description: 'Your conversation has been saved.',
    });
  }, [toast]);

  // Handle user interruption
  const interrupt = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // Clear audio queue
      audioQueueRef.current?.clear();
      
      // Send interrupt signal
      wsRef.current.send(JSON.stringify({
        type: 'interrupt',
      }));
      
      setVoiceState('listening');
      setAiTranscript('');
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVoiceChat();
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
    interrupt,
  };
};
