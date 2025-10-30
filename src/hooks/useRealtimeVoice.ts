import { useState, useRef, useEffect } from 'react';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { useToast } from '@/hooks/use-toast';

export type VoiceState = 'idle' | 'connecting' | 'listening' | 'speaking' | 'processing' | 'error';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface UseRealtimeVoiceOptions {
  isPreviewMode?: boolean;
  onError?: (error: string) => void;
}

export const useRealtimeVoice = (options: UseRealtimeVoiceOptions = {}) => {
  const { isPreviewMode = false, onError } = options;
  const { toast } = useToast();
  
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [userTranscript, setUserTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  
  const chatRef = useRef<RealtimeChat | null>(null);

  // Check browser support
  useEffect(() => {
    const checkSupport = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setIsSupported(false);
        toast({
          title: "Browser not supported",
          description: "Your browser doesn't support voice chat. Please use a modern browser.",
          variant: "destructive",
        });
      }
    };
    checkSupport();
  }, [toast]);

  const handleMessage = (event: any) => {
    console.log('📨 Event received:', event.type);

    switch (event.type) {
      case 'session.created':
        console.log('✅ Session created');
        setVoiceState('listening');
        break;

      case 'input_audio_buffer.speech_started':
        console.log('🎤 User started speaking');
        setVoiceState('listening');
        setUserTranscript('');
        break;

      case 'input_audio_buffer.speech_stopped':
        console.log('🤫 User stopped speaking');
        setVoiceState('processing');
        break;

      case 'conversation.item.input_audio_transcription.completed':
        console.log('📝 User transcript:', event.transcript);
        setUserTranscript(event.transcript);
        setMessages(prev => [...prev, {
          role: 'user',
          content: event.transcript,
          timestamp: Date.now(),
        }]);
        break;

      case 'response.created':
        console.log('🤖 AI response started');
        setVoiceState('speaking');
        setAiTranscript('');
        break;

      case 'response.audio_transcript.delta':
        console.log('📝 AI transcript delta:', event.delta);
        setAiTranscript(prev => prev + event.delta);
        break;

      case 'response.audio_transcript.done':
        console.log('✅ AI transcript complete:', event.transcript);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: event.transcript,
          timestamp: Date.now(),
        }]);
        setAiTranscript('');
        break;

      case 'response.done':
        console.log('✅ Response complete');
        setVoiceState('listening');
        break;

      case 'error':
        console.error('❌ Error event:', event);
        setVoiceState('error');
        const errorMsg = event.error?.message || 'An error occurred';
        toast({
          title: "Voice error",
          description: errorMsg,
          variant: "destructive",
        });
        if (onError) onError(errorMsg);
        break;

      default:
        // Ignore other events
        break;
    }
  };

  const startVoiceChat = async () => {
    try {
      console.log('🚀 Starting voice chat...');
      setVoiceState('connecting');
      
      chatRef.current = new RealtimeChat(handleMessage, isPreviewMode);
      await chatRef.current.init();
      
      toast({
        title: "Connected",
        description: "Voice chat is ready. Start speaking!",
      });
    } catch (error) {
      console.error('❌ Error starting voice chat:', error);
      setVoiceState('error');
      
      const errorMsg = error instanceof Error ? error.message : 'Failed to start voice chat';
      toast({
        title: "Connection failed",
        description: errorMsg,
        variant: "destructive",
      });
      
      if (onError) onError(errorMsg);
    }
  };

  const stopVoiceChat = () => {
    console.log('🛑 Stopping voice chat...');
    chatRef.current?.disconnect();
    chatRef.current = null;
    setVoiceState('idle');
    setUserTranscript('');
    setAiTranscript('');
    
    toast({
      title: "Disconnected",
      description: "Voice chat ended.",
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chatRef.current) {
        console.log('🧹 Cleaning up on unmount');
        chatRef.current.disconnect();
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
