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

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

/**
 * Custom hook for managing voice chat using Web Speech API + Gemini
 * Hybrid approach: Browser speech-to-text → Gemini text API → Browser text-to-speech
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

  // Send text message to AI and get response
  const sendTextToAI = useCallback(async (text: string) => {
    try {
      setVoiceState('processing');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Fetch previous messages for context
      const { data: previousResponses } = await supabase
        .from('responses')
        .select('content, ai_response')
        .eq('conversation_session_id', conversationId)
        .order('created_at', { ascending: true });

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

  // Speak text using browser TTS
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
      
      // Configure voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.lang.startsWith('en') && v.name.toLowerCase().includes('female')
      ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      utterance.rate = 0.95;
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

  // Initialize speech recognition
  const initSpeechRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('Speech recognition started');
      setVoiceState('listening');
    };

    recognition.onresult = async (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      // Update interim transcript
      if (interim) {
        setUserTranscript(interim);
      }

      // Process final transcript
      if (final) {
        const fullText = final.trim();
        setUserTranscript(fullText);
        onTranscript?.(fullText, 'user');

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
          
          if (recognitionRef.current) {
            recognition.start();
          }
        } catch (error) {
          console.error('Error processing voice input:', error);
          setVoiceState('error');
          onError?.(error as Error);
          
          // Resume listening after error
          setTimeout(() => {
            if (recognitionRef.current) {
              recognition.start();
            }
          }, 1000);
        }
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      // Ignore 'no-speech' errors, just restart
      if (event.error === 'no-speech') {
        recognition.start();
        return;
      }
      
      setVoiceState('error');
      onError?.(new Error(event.error));
      
      toast({
        title: 'Voice error',
        description: `Speech recognition error: ${event.error}`,
        variant: 'destructive',
      });
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      
      // Auto-restart if we're still supposed to be listening
      if (voiceState === 'listening' && recognitionRef.current) {
        setTimeout(() => {
          if (recognitionRef.current) {
            recognition.start();
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
    
    toast({
      title: 'Voice chat ended',
      description: 'Your conversation has been saved.',
    });
  }, [toast]);

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
  };
};
