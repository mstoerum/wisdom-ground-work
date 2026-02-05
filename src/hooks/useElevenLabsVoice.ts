import { useState, useCallback, useRef, useEffect } from 'react';
import { useConversation } from '@elevenlabs/react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export type VoiceState = 'idle' | 'connecting' | 'listening' | 'speaking' | 'processing' | 'error';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface UseElevenLabsVoiceOptions {
  conversationId?: string;
  isPreviewMode?: boolean;
  surveyData?: { 
    first_message?: string; 
    themes?: Array<{ name: string; description: string }> 
  };
  onTranscript?: (text: string, role: 'user' | 'assistant') => void;
  onError?: (error: string) => void;
}

/**
 * ElevenLabs Conversational AI voice hook for Spradley
 * Provides natural, empathetic voice interactions using the Lily voice
 */
export const useElevenLabsVoice = ({
  conversationId = 'preview-conversation',
  isPreviewMode = false,
  surveyData,
  onTranscript,
  onError,
}: UseElevenLabsVoiceOptions) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [userTranscript, setUserTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  
  const currentUserTextRef = useRef('');
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
        description: 'Your browser does not support voice features. Please use Chrome, Edge, or Safari.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // ElevenLabs conversation hook
  const conversation = useConversation({
    onConnect: () => {
      console.log('✅ ElevenLabs connected');
      setVoiceState('listening');
      toast({
        title: 'Voice activated',
        description: surveyData?.first_message || 'Start speaking naturally. I\'m listening...',
      });
    },
    onDisconnect: () => {
      console.log('🔌 ElevenLabs disconnected');
      setVoiceState('idle');
    },
    onMessage: (message) => {
      console.log('📨 ElevenLabs message:', message);
      handleMessage(message);
    },
    onError: (error) => {
      console.error('❌ ElevenLabs error:', error);
      setVoiceState('error');
      onError?.(error.message || 'Voice connection error');
      toast({
        title: 'Voice error',
        description: error.message || 'Connection error occurred',
        variant: 'destructive',
      });
    },
  });

  // Handle incoming messages from ElevenLabs
  const handleMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'user_transcript':
        // User's finalized speech
        const userText = message.user_transcription_event?.user_transcript || message.text;
        if (userText) {
          currentUserTextRef.current = userText;
          setUserTranscript(userText);
          onTranscript?.(userText, 'user');
        }
        break;

      case 'agent_response':
        // Agent's complete response
        const aiText = message.agent_response_event?.agent_response || message.text;
        if (aiText) {
          currentAiTextRef.current = aiText;
          setAiTranscript(aiText);
          onTranscript?.(aiText, 'assistant');
          
          // Add to message history
          if (currentUserTextRef.current) {
            setMessages(prev => [
              ...prev,
              { role: 'user', content: currentUserTextRef.current, timestamp: new Date() },
              { role: 'assistant', content: aiText, timestamp: new Date() },
            ]);
            
            // Save to database (non-preview mode)
            if (!isPreviewMode && conversationId !== 'preview-conversation') {
              saveResponse(currentUserTextRef.current, aiText);
            }
            
            // Clear transcripts after a delay
            setTimeout(() => {
              currentUserTextRef.current = '';
              currentAiTextRef.current = '';
              setUserTranscript('');
              setAiTranscript('');
            }, 2000);
          }
        }
        break;

      case 'agent_response_correction':
        // Agent was interrupted, use corrected response
        const correctedText = message.agent_response_correction_event?.corrected_agent_response;
        if (correctedText) {
          setAiTranscript(correctedText);
        }
        break;
    }
  }, [isPreviewMode, conversationId, onTranscript]);

  // Save response to database
  const saveResponse = useCallback(async (userText: string, aiText: string) => {
    try {
      const { error } = await supabase.functions.invoke('save-voice-response', {
        body: {
          conversationId,
          userText,
          aiText,
          isPreviewMode: false,
        },
      });

      if (error) {
        console.error('Error saving response:', error);
      }
    } catch (err) {
      console.error('Failed to save response:', err);
    }
  }, [conversationId]);

  // Update voice state based on conversation status
  useEffect(() => {
    if (conversation.status === 'connected') {
      if (conversation.isSpeaking) {
        setVoiceState('speaking');
      } else {
        setVoiceState('listening');
      }
    } else if (conversation.status === 'disconnected') {
      if (voiceState !== 'idle' && voiceState !== 'error') {
        setVoiceState('idle');
      }
    }
  }, [conversation.status, conversation.isSpeaking, voiceState]);

  // Start voice conversation
  const startVoiceChat = useCallback(async () => {
    if (!isSupported) {
      toast({
        title: 'Not supported',
        description: 'Voice features require a modern browser',
        variant: 'destructive',
      });
      return;
    }

    try {
      setVoiceState('connecting');

      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get signed URL from edge function
      const { data, error } = await supabase.functions.invoke('elevenlabs-conversation-token', {
        body: {
          conversationId,
          isPreviewMode,
          surveyData,
        },
      });

      if (error || !data?.signed_url) {
        throw new Error(error?.message || 'Failed to get conversation token');
      }

      console.log('🎤 Starting ElevenLabs conversation with signed URL');

      // Initialize with greeting if provided
      if (data.first_message) {
        const greeting: Message = {
          role: 'assistant',
          content: data.first_message,
          timestamp: new Date(),
        };
        setMessages([greeting]);
        setAiTranscript(data.first_message);
      }

      // Start the ElevenLabs conversation
      await conversation.startSession({
        signedUrl: data.signed_url,
      });

    } catch (error) {
      console.error('Failed to start voice chat:', error);
      setVoiceState('error');
      
      const errorMessage = error instanceof Error ? error.message : 'Could not start voice chat';
      onError?.(errorMessage);
      
      toast({
        title: 'Failed to start',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [isSupported, conversationId, isPreviewMode, surveyData, conversation, toast, onError]);

  // Stop voice conversation
  const stopVoiceChat = useCallback(async () => {
    try {
      await conversation.endSession();
      setVoiceState('idle');
      setUserTranscript('');
      setAiTranscript('');
      currentUserTextRef.current = '';
      currentAiTextRef.current = '';
      
      toast({
        title: 'Voice chat ended',
        description: 'Your conversation has been saved.',
      });
    } catch (error) {
      console.error('Error stopping voice chat:', error);
    }
  }, [conversation, toast]);

  return {
    voiceState,
    messages,
    userTranscript,
    aiTranscript,
    isSupported,
    startVoiceChat,
    stopVoiceChat,
    // Expose conversation for advanced usage
    conversation,
  };
};
