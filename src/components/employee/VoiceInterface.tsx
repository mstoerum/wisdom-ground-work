import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VoiceOrb } from './VoiceOrb';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import { Mic, MicOff, MessageSquare } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface VoiceInterfaceProps {
  conversationId: string;
  onSwitchToText?: () => void;
  onComplete?: () => void;
}

/**
 * Voice interaction interface for employee survey
 * Provides natural voice conversation with AI using Gemini Live API
 */
export const VoiceInterface = ({
  conversationId,
  onSwitchToText,
  onComplete,
}: VoiceInterfaceProps) => {
  const [showTranscript, setShowTranscript] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);

  const {
    voiceState,
    messages,
    userTranscript,
    aiTranscript,
    isSupported,
    startVoiceChat,
    stopVoiceChat,
  } = useVoiceChat({
    conversationId,
    onTranscript: (text, role) => {
      console.log(`${role}: ${text}`);
    },
    onError: (error) => {
      console.error('Voice error:', error);
    },
  });

  const isActive = voiceState !== 'idle' && voiceState !== 'error';

  const handleToggleVoice = () => {
    if (isActive) {
      stopVoiceChat();
    } else {
      startVoiceChat();
    }
  };

  const getStateMessage = () => {
    switch (voiceState) {
      case 'idle':
        return 'Ready to start';
      case 'connecting':
        return 'Connecting...';
      case 'listening':
        return 'Listening...';
      case 'speaking':
        return 'Speaking...';
      case 'processing':
        return 'Processing...';
      case 'error':
        return 'Error occurred';
      default:
        return '';
    }
  };

  if (!isSupported) {
    return (
      <Card className="p-8 max-w-2xl mx-auto">
        <Alert variant="destructive">
          <AlertDescription>
            Voice chat is not supported in your browser. Please use text mode instead.
          </AlertDescription>
        </Alert>
        {onSwitchToText && (
          <Button onClick={onSwitchToText} className="mt-4 w-full">
            <MessageSquare className="w-4 h-4 mr-2" />
            Switch to Text Mode
          </Button>
        )}
      </Card>
    );
  }

  return (
    <div className="min-h-[600px] flex flex-col">
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

      {/* Main voice interface */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        {/* Voice Orb */}
        <div className="relative">
          <VoiceOrb state={voiceState} audioLevel={audioLevel} />
          
          {/* State indicator */}
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
            <p className="text-sm font-medium text-muted-foreground">
              {getStateMessage()}
            </p>
          </div>
        </div>

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
                  <p className="text-xs text-[hsl(var(--coral-accent))] mb-1">Atlas</p>
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
                {messages.slice(-4).map((msg, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl p-3 ${
                      msg.role === 'user'
                        ? 'bg-muted/30'
                        : 'bg-[hsl(var(--coral-pink))]/20'
                    }`}
                  >
                    <p className="text-xs text-muted-foreground mb-1">
                      {msg.role === 'user' ? 'You' : 'Atlas'}
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
          className="w-20 h-20 rounded-full shadow-lg hover:shadow-xl transition-all"
        >
          {isActive ? (
            <MicOff className="w-8 h-8" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </Button>

        {/* Instructions */}
        {voiceState === 'idle' && (
          <div className="text-center space-y-2 max-w-md">
            <p className="text-sm text-muted-foreground">
              Click the microphone to start a natural voice conversation with Atlas.
            </p>
            <p className="text-xs text-muted-foreground">
              You can speak freely and interrupt at any time.
            </p>
          </div>
        )}

        {voiceState === 'listening' && (
          <div className="text-center space-y-2 max-w-md">
            <p className="text-sm text-muted-foreground">
              Start speaking whenever you're ready...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
