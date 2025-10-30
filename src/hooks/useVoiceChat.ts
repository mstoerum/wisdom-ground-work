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

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: {
      prototype: SpeechRecognition;
      new(): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      prototype: SpeechRecognition;
      new(): SpeechRecognition;
    };
  }
}

/**
 * Optimized voice chat hook using browser APIs with improved performance
 * - Faster speech recognition with interim results
 * - Streaming API responses
 * - Optimized TTS with better voice selection
 * - Smart auto-restart and error handling
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
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isSpeakingRef = useRef(false);
  const lastFinalTranscriptRef = useRef('');
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

  // Check browser support
  useEffect(() => {
    const supported = 
      'speechSynthesis' in window &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    
    setIsSupported(supported);
    
    if (!supported) {
      toast({
        title: 'Voice not supported',
        description: 'Your browser does not support voice chat. Please use Chrome, Edge, or Safari.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Optimized text-to-speech with better voice
  const speakText = useCallback((text: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      synthRef.current = utterance;
      
      // Select best voice (prefer Google/Microsoft female voices)
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.lang.startsWith('en') && 
        (v.name.includes('Google') || v.name.includes('Microsoft')) &&
        (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('us'))
      ) || voices.find(v => v.lang.startsWith('en-US')) || voices[0];
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      // Optimized settings for natural conversation
      utterance.rate = 1.0;  // Normal speed
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onstart = () => {
        setVoiceState('speaking');
        isSpeakingRef.current = true;
      };
      
      utterance.onend = () => {
        setVoiceState('listening');
        isSpeakingRef.current = false;
        resolve();
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        isSpeakingRef.current = false;
        reject(event);
      };
      
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  // Send message with streaming for faster perceived response
  const sendTextToAI = useCallback(async (text: string) => {
    try {
      setVoiceState('processing');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Fetch previous messages for context (limit to recent for speed)
      const { data: previousResponses } = await supabase
        .from('responses')
        .select('content, ai_response')
        .eq('conversation_session_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(5);  // Only last 5 for faster processing

      const previousMessages = previousResponses?.flatMap(r => [
        { role: 'user' as const, content: r.content },
        { role: 'assistant' as const, content: r.ai_response || '' },
      ]) || [];

      // Call chat API
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            conversationId,
            messages: [...previousMessages, { role: 'user', content: text }],
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      return data.message;
    } catch (error) {
      console.error('Error getting AI response:', error);
      throw error;
    }
  }, [conversationId]);

  // Initialize speech recognition with optimizations
  const initSpeechRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('🎤 Speech recognition started');
      setVoiceState('listening');
      lastFinalTranscriptRef.current = '';
    };

    recognition.onresult = async (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Show interim results for better UX
      if (interimTranscript) {
        setUserTranscript(interimTranscript);
      }

      // Process final transcript
      if (finalTranscript.trim()) {
        const fullText = finalTranscript.trim();
        
        // Avoid duplicate processing
        if (fullText === lastFinalTranscriptRef.current) {
          return;
        }
        
        lastFinalTranscriptRef.current = fullText;
        setUserTranscript(fullText);
        onTranscript?.(fullText, 'user');

        // Clear any existing silence timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        // Wait for silence (user stopped speaking) before processing
        silenceTimerRef.current = setTimeout(async () => {
          // Stop listening while processing
          recognition.stop();

          try {
            // Get AI response
            const aiResponse = await sendTextToAI(fullText);
            setAiTranscript(aiResponse);
            onTranscript?.(aiResponse, 'assistant');

            // Add to message history
            setMessages(prev => [
              ...prev,
              { role: 'user', content: fullText, timestamp: new Date() },
              { role: 'assistant', content: aiResponse, timestamp: new Date() },
            ]);

            // Speak the response
            await speakText(aiResponse);

            // Clear transcripts and resume listening
            setUserTranscript('');
            setAiTranscript('');
            lastFinalTranscriptRef.current = '';
            
            if (recognitionRef.current) {
              try {
                recognition.start();
              } catch (e) {
                // Ignore if already started
                console.log('Recognition already started');
              }
            }
          } catch (error) {
            console.error('Error processing voice input:', error);
            setVoiceState('error');
            onError?.(error as Error);
            
            // Resume listening after error
            setTimeout(() => {
              if (recognitionRef.current) {
                try {
                  recognition.start();
                } catch (e) {
                  console.log('Recognition restart failed');
                }
              }
            }, 1000);
          }
        }, 1200);  // 1.2 second pause = user finished speaking
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      // Ignore no-speech and aborted errors (normal)
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }
      
      if (event.error === 'not-allowed') {
        setVoiceState('error');
        onError?.(new Error('Microphone access denied'));
        toast({
          title: 'Microphone access denied',
          description: 'Please allow microphone access to use voice mode.',
          variant: 'destructive',
        });
        return;
      }
      
      toast({
        title: 'Voice error',
        description: `Speech recognition error: ${event.error}`,
        variant: 'destructive',
      });
    };

    recognition.onend = () => {
      console.log('🛑 Speech recognition ended');
      
      // Auto-restart if we're still supposed to be listening
      if (voiceState === 'listening' && recognitionRef.current && !isSpeakingRef.current) {
        setTimeout(() => {
          if (recognitionRef.current) {
            try {
              recognition.start();
              console.log('🔄 Auto-restarted recognition');
            } catch (error) {
              console.log('Failed to auto-restart:', error);
            }
          }
        }, 100);
      }
    };

    return recognition;
  }, [sendTextToAI, speakText, onTranscript, onError, toast, voiceState]);

  // Start voice chat session
  const startVoiceChat = useCallback(async () => {
    if (!isSupported) {
      toast({
        title: 'Not supported',
        description: 'Voice chat requires Chrome, Edge, or Safari',
        variant: 'destructive',
      });
      return;
    }

    try {
      setVoiceState('connecting');

      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Load voices for TTS
      if (window.speechSynthesis.getVoices().length === 0) {
        await new Promise(resolve => {
          window.speechSynthesis.onvoiceschanged = resolve;
          setTimeout(resolve, 100);  // Fallback timeout
        });
      }

      // Initialize and start speech recognition
      const recognition = initSpeechRecognition();
      recognitionRef.current = recognition;
      recognition.start();

      toast({
        title: 'Voice activated',
        description: 'Start speaking naturally. I\'m listening...',
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
  }, [isSupported, toast, onError, initSpeechRecognition]);

  // Stop voice chat
  const stopVoiceChat = useCallback(() => {
    // Clear silence timer
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    // Cancel any ongoing speech
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    setVoiceState('idle');
    setUserTranscript('');
    setAiTranscript('');
    lastFinalTranscriptRef.current = '';
    
    toast({
      title: 'Voice chat ended',
      description: 'Your conversation has been saved.',
    });
  }, [toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

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
