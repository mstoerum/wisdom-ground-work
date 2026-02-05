import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VoiceOrb } from './VoiceOrb';
import { useElevenLabsVoice } from '@/hooks/useElevenLabsVoice';
import { usePreviewMode } from '@/contexts/PreviewModeContext';
import { supabase } from '@/integrations/supabase/client';
import { Mic, MicOff, MessageSquare, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { AudioLevelMeter } from './AudioLevelMeter';
import { PrivacyIndicator, ConnectionQualityIndicator } from './PrivacyIndicator';
import { VoiceStateIndicator } from './VoiceStateIndicator';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { PrivacyBadge } from './PrivacyBadge';
import { VoiceErrorPanel } from './VoiceErrorPanel';

interface VoiceInterfaceProps {
  conversationId: string;
  onSwitchToText?: () => void;
  onComplete?: () => void;
}

/**
 * Voice interaction interface for employee survey
 * Optimized hybrid approach with browser APIs for reliable performance
 * Features: Real-time transcription, smart silence detection, natural TTS
 */
export const VoiceInterface = ({
  conversationId,
  onSwitchToText,
  onComplete,
}: VoiceInterfaceProps) => {
  const { isPreviewMode, previewSurveyData } = usePreviewMode();
  const [showTranscript, setShowTranscript] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [connectionLatency, setConnectionLatency] = useState<number | null>(null);
  const [surveyDataForVoice, setSurveyDataForVoice] = useState<{ first_message?: string; themes?: Array<{ name: string; description: string }> } | undefined>();
  const [processingStartTime, setProcessingStartTime] = useState<number | null>(null);
  const [estimatedProcessingTime, setEstimatedProcessingTime] = useState<number | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'fair' | 'poor' | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Connection quality check
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const start = Date.now();
        
        // Ping Supabase endpoint
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/realtime-session`,
          {
            method: 'HEAD',
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
            }
          }
        );
        
        const latency = Date.now() - start;
        setConnectionLatency(latency);
        
        // Categorize quality
        if (latency < 100) setConnectionQuality('excellent');
        else if (latency < 300) setConnectionQuality('good');
        else if (latency < 500) setConnectionQuality('fair');
        else setConnectionQuality('poor');
        
      } catch (error) {
        console.error('Connection check failed:', error);
        setConnectionQuality('poor');
        setConnectionLatency(999);
      }
    };
    
    // Check on mount
    checkConnection();
    
    // Check every 5 seconds
    const interval = setInterval(checkConnection, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch theme details if in preview mode and survey data is available
  useEffect(() => {
    if (isPreviewMode && previewSurveyData) {
      const loadSurveyData = async () => {
        try {
          const firstMessage = previewSurveyData.first_message;
          const themeIds = previewSurveyData.themes || [];
          
          // If themes are IDs, fetch theme details
          if (themeIds.length > 0 && typeof themeIds[0] === 'string') {
            try {
              const { data: themesData, error: themesError } = await supabase
                .from('survey_themes')
                .select('id, name, description')
                .in('id', themeIds);
              
              if (themesError) {
                console.error('Error fetching themes:', themesError);
                setSurveyDataForVoice({
                  first_message: firstMessage,
                  themes: []
                });
              } else if (themesData && themesData.length > 0) {
                setSurveyDataForVoice({
                  first_message: firstMessage,
                  themes: themesData.map(t => ({ name: t.name, description: t.description }))
                });
              } else {
                setSurveyDataForVoice({
                  first_message: firstMessage,
                  themes: []
                });
              }
            } catch (err) {
              console.error('Error loading themes:', err);
              setSurveyDataForVoice({
                first_message: firstMessage,
                themes: []
              });
            }
          } else if (Array.isArray(themeIds) && themeIds.length > 0 && typeof themeIds[0] === 'object') {
            // Themes are already expanded objects
            try {
              setSurveyDataForVoice({
                first_message: firstMessage,
                themes: themeIds.map((t: any) => ({ 
                  name: t.name || t.id || 'Unknown Theme', 
                  description: t.description || '' 
                }))
              });
            } catch (err) {
              console.error('Error processing theme objects:', err);
              setSurveyDataForVoice({
                first_message: firstMessage,
                themes: []
              });
            }
          } else {
            // No themes or empty array - this is valid for preview
            setSurveyDataForVoice({
              first_message: firstMessage,
              themes: []
            });
          }
        } catch (error) {
          console.error('Error loading survey data for voice:', error);
          setSurveyDataForVoice({
            first_message: previewSurveyData.first_message,
            themes: []
          });
        }
      };

      loadSurveyData();
    } else {
      setSurveyDataForVoice(undefined);
    }
  }, [isPreviewMode, previewSurveyData]);

  // Unified ElevenLabs Conversational AI voice hook
  const {
    voiceState,
    messages,
    userTranscript,
    aiTranscript,
    isSupported,
    startVoiceChat,
    stopVoiceChat,
    conversation,
  } = useElevenLabsVoice({
    conversationId,
    isPreviewMode,
    surveyData: surveyDataForVoice,
    onTranscript: (text, role) => {
      console.log(`${role}: ${text}`);
      
      // Measure latency (simple approximation)
      if (role === 'assistant') {
        setConnectionLatency(Date.now());
      }
    },
    onError: (error) => {
      console.error('Voice error:', error);
    },
  });

  const isActive = voiceState !== 'idle' && voiceState !== 'error';

  // Track conversation progress
  const ESTIMATED_TOTAL_QUESTIONS = 8;
  const userMessageCount = messages.filter(m => m.role === 'user').length;
  const conversationProgress = Math.min((userMessageCount / ESTIMATED_TOTAL_QUESTIONS) * 100, 100);

  const handleToggleVoice = useCallback(() => {
    if (isActive) {
      stopVoiceChat();
    } else {
      startVoiceChat();
    }
  }, [isActive, startVoiceChat, stopVoiceChat]);

  // Monitor audio levels for visualization
  useEffect(() => {
    if (voiceState === 'listening' && !audioContextRef.current) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const audioContext = new AudioContext();
          const analyser = audioContext.createAnalyser();
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);
          analyser.fftSize = 256;
          
          audioContextRef.current = audioContext;
          analyserRef.current = analyser;
          
          const updateAudioLevel = () => {
            if (!analyserRef.current) return;
            
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setAudioLevel(Math.min(average, 100));
            
            if (voiceState === 'listening') {
              animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
            }
          };
          
          updateAudioLevel();
        })
        .catch(err => console.error('Audio monitoring error:', err));
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [voiceState]);

  // Track processing time
  useEffect(() => {
    if (voiceState === 'processing') {
      setProcessingStartTime(Date.now());
      // Estimate processing time based on transcript length
      const transcriptLength = userTranscript.length;
      const estimatedMs = Math.min(Math.max(transcriptLength * 50, 1000), 5000);
      setEstimatedProcessingTime(estimatedMs);
    } else {
      setProcessingStartTime(null);
      setEstimatedProcessingTime(null);
    }
  }, [voiceState, userTranscript]);

  // Calculate elapsed processing time
  const [elapsedProcessingTime, setElapsedProcessingTime] = useState(0);
  useEffect(() => {
    if (!processingStartTime) {
      setElapsedProcessingTime(0);
      return;
    }
    
    const interval = setInterval(() => {
      setElapsedProcessingTime(Date.now() - processingStartTime);
    }, 100);
    
    return () => clearInterval(interval);
  }, [processingStartTime]);

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Space bar to toggle voice (only when focused)
      if (e.code === 'Space' && !isActive && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        handleToggleVoice();
      }
      
      // Escape to stop voice
      if (e.code === 'Escape' && isActive) {
        e.preventDefault();
        stopVoiceChat();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isActive, voiceState, handleToggleVoice, stopVoiceChat]);

  const getStateMessage = () => {
    switch (voiceState) {
      case 'idle':
        return 'Ready to start';
      case 'connecting':
        return 'Connecting...';
      case 'listening':
        return 'Listening...';
      case 'speaking':
        return 'Spradley is speaking...';
      case 'processing':
        const remaining = estimatedProcessingTime 
          ? Math.max(0, Math.ceil((estimatedProcessingTime - elapsedProcessingTime) / 1000))
          : null;
        return remaining !== null ? `Spradley is thinking... (~${remaining}s)` : 'Spradley is thinking...';
      case 'error':
        return 'Error occurred';
      default:
        return '';
    }
  };

  if (!isSupported) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <VoiceErrorPanel 
          error="Browser does not support voice features. Missing Web Audio API or MediaDevices." 
          onRetry={() => window.location.reload()}
          onSwitchToText={onSwitchToText}
        />
      </div>
    );
  }


  return (
    <div className="min-h-[600px] flex flex-col relative">
      {/* ARIA Live Region for Screen Readers */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {voiceState === 'connecting' && 'Connecting to voice assistant. Please wait.'}
        {voiceState === 'listening' && 'Microphone is listening. Speak now.'}
        {voiceState === 'processing' && `Spradley is thinking. ${estimatedProcessingTime ? `Estimated ${Math.ceil(estimatedProcessingTime / 1000)} seconds` : ''}`}
        {voiceState === 'speaking' && 'Spradley is speaking. Please listen.'}
        {voiceState === 'idle' && !isSupported && 'An error occurred. Please check the troubleshooting panel.'}
      </div>

      {/* Persistent Privacy Badge (top-right) */}
      {isActive && (
        <div className="fixed top-4 right-4 z-10">
          <PrivacyBadge isRecording={voiceState === 'listening'} />
        </div>
      )}

      {/* Connection Quality Indicator (always visible) */}
      <div className="fixed top-16 right-4 z-10">
        <ConnectionQualityIndicator 
          quality={connectionQuality} 
          latency={connectionLatency}
        />
      </div>

      {/* Preview Mode Indicator */}
      {isPreviewMode && (
        <Alert className="mx-4 mb-4 border-[hsl(var(--coral-accent))] bg-[hsl(var(--coral-pink))]/10">
          <Info className="h-4 w-4 text-[hsl(var(--coral-accent))]" />
          <AlertDescription>
            <strong>Voice Preview Mode:</strong> Experience the voice interface exactly as employees will. 
            Spradley will introduce itself and explore the selected themes naturally. No data is saved during preview.
          </AlertDescription>
        </Alert>
      )}

      {/* Show selected themes in preview */}
      {isPreviewMode && surveyDataForVoice?.themes && surveyDataForVoice.themes.length > 0 && (
        <div className="px-4 mb-4">
          <Card className="p-4 border-[hsl(var(--lime-green))]/20 bg-[hsl(var(--lime-green))]/5">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Conversation Themes:
            </p>
            <div className="flex flex-wrap gap-2">
              {surveyDataForVoice.themes.map((theme, idx) => (
                <span key={idx} className="text-xs px-2 py-1 bg-background rounded border border-border">
                  {theme.name}
                </span>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Privacy Indicator */}
      <div className="px-4 mb-4">
        <PrivacyIndicator />
      </div>

      {/* Header with controls */}
      <div className="flex items-center justify-between mb-6 px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-transcript"
              checked={showTranscript}
              onCheckedChange={setShowTranscript}
            />
            <Label htmlFor="show-transcript" className="text-sm">
              Show transcript
            </Label>
          </div>
        </div>

        {onSwitchToText && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSwitchToText}
            className="text-muted-foreground"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Switch to text
          </Button>
        )}
      </div>

      {/* Conversation Progress Indicator */}
      {isActive && userMessageCount > 0 && (
        <div className="px-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">
              Question {userMessageCount} of ~{ESTIMATED_TOTAL_QUESTIONS}
            </span>
            <span className="text-xs font-medium">{Math.round(conversationProgress)}%</span>
          </div>
          <Progress value={conversationProgress} className="h-1.5" />
        </div>
      )}

      {/* Main voice interface */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        {/* Enhanced Voice State Indicator (prominent) */}
        <VoiceStateIndicator 
          state={voiceState} 
          estimatedTime={estimatedProcessingTime ? Math.max(0, Math.ceil((estimatedProcessingTime - elapsedProcessingTime) / 1000)) : null}
        />

        {/* Voice Orb */}
        <div className="relative">
          <VoiceOrb state={voiceState} audioLevel={audioLevel} />
        </div>

        {/* Audio Level Meter - Always visible when active */}
        {isActive && (
          <div className="flex flex-col items-center gap-2">
            <AudioLevelMeter audioLevel={audioLevel} isActive={isActive} />
          </div>
        )}

        {/* Processing Progress */}
        {voiceState === 'processing' && estimatedProcessingTime && (
          <div className="w-full max-w-xs">
            <Progress 
              value={Math.min((elapsedProcessingTime / estimatedProcessingTime) * 100, 100)} 
              className="h-2"
            />
          </div>
        )}

        {/* Transcript display */}
        {showTranscript && (
          <div className="w-full max-w-2xl min-h-[200px] space-y-4">
            {/* Live transcripts */}
            <div className="space-y-3">
              {userTranscript && (
                <div className="bg-muted/50 rounded-2xl p-4 animate-fade-in">
                  <p className="text-xs text-muted-foreground mb-1">You</p>
                  <p className="text-base leading-relaxed">{userTranscript}</p>
                </div>
              )}
              
              {aiTranscript && (
                <div className="bg-[hsl(var(--coral-pink))]/30 rounded-2xl p-4 animate-fade-in">
                  <p className="text-xs text-[hsl(var(--coral-accent))] mb-1">Spradley</p>
                  <p className="text-base leading-relaxed">{aiTranscript}</p>
                </div>
              )}
            </div>

            {/* Message history */}
            {messages.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-border/30">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Conversation History
                </p>
                {messages.slice(-4).reverse().map((msg, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl p-3 ${
                      msg.role === 'user'
                        ? 'bg-muted/30'
                        : 'bg-[hsl(var(--coral-pink))]/20'
                    }`}
                  >
                    <p className="text-xs text-muted-foreground mb-1">
                      {msg.role === 'user' ? 'You' : 'Spradley'}
                    </p>
                    <p className="text-sm leading-relaxed opacity-70">
                      {msg.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Voice control button */}
        <Button
          onClick={handleToggleVoice}
          size="lg"
          variant={isActive ? 'destructive' : 'coral'}
          className="w-20 h-20 rounded-full shadow-lg hover:shadow-xl transition-all focus:ring-2 focus:ring-[hsl(var(--coral-accent))] focus:ring-offset-2"
          aria-label={isActive ? 'Stop voice chat. Press Escape or click to stop.' : 'Start voice chat. Press Space or click to start.'}
          aria-pressed={isActive}
        >
          {isActive ? (
            <MicOff className="w-8 h-8" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </Button>
        
        {/* Keyboard shortcut hints */}
        <KeyboardShortcuts isVoiceActive={isActive} />

        {/* Instructions */}
        {voiceState === 'idle' && (
          <div className="text-center space-y-2 max-w-md">
            <p className="text-sm text-muted-foreground">
              Click the microphone to start a natural voice conversation with Spradley.
            </p>
            <p className="text-xs text-muted-foreground">
              Speak naturally • Take your time • Pauses are okay • The system waits for you to finish
            </p>
          </div>
        )}

        {voiceState === 'connecting' && (
          <div className="text-center space-y-2 max-w-md">
            <p className="text-sm text-muted-foreground animate-pulse">
              Initializing voice recognition...
            </p>
          </div>
        )}

        {voiceState === 'processing' && (
          <div className="text-center space-y-2 max-w-md">
            <p className="text-sm text-muted-foreground">
              💭 Spradley is analyzing your response...
            </p>
            {estimatedProcessingTime && (
              <p className="text-xs text-muted-foreground opacity-70">
                Estimated time: ~{Math.ceil(estimatedProcessingTime / 1000)} seconds
              </p>
            )}
          </div>
        )}

        {voiceState === 'listening' && (
          <div className="text-center space-y-2 max-w-md">
            <p className="text-sm text-muted-foreground">
              🎤 Listening... take your time
            </p>
            <p className="text-xs text-muted-foreground opacity-70">
              Speak naturally • You can pause to think • I'll wait for you to finish
            </p>
          </div>
        )}

        {voiceState === 'speaking' && (
          <div className="text-center space-y-2 max-w-md">
            <p className="text-sm text-muted-foreground">
              🔊 Spradley is speaking...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
