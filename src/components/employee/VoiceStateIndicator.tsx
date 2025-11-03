import { Mic, Loader2, Volume2, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { VoiceState } from '@/hooks/useVoiceChat';

interface VoiceStateIndicatorProps {
  state: VoiceState;
  estimatedTime?: number | null;
}

/**
 * Large, prominent voice state indicator with color coding and icons
 * Removes user confusion about when to speak or wait
 */
export const VoiceStateIndicator = ({ state, estimatedTime }: VoiceStateIndicatorProps) => {
  const stateConfig = {
    idle: {
      icon: Mic,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/20',
      message: 'Ready to start',
      animation: '',
    },
    connecting: {
      icon: Wifi,
      color: 'text-[hsl(var(--butter-yellow))]',
      bgColor: 'bg-[hsl(var(--butter-yellow))]/10',
      message: 'Connecting to Spradley...',
      animation: 'animate-pulse',
    },
    listening: {
      icon: Mic,
      color: 'text-[hsl(var(--lime-green))]',
      bgColor: 'bg-[hsl(var(--lime-green))]/10',
      message: '🎤 Speak now',
      animation: 'animate-pulse',
    },
    processing: {
      icon: Loader2,
      color: 'text-[hsl(var(--coral-pink))]',
      bgColor: 'bg-[hsl(var(--coral-pink))]/10',
      message: estimatedTime 
        ? `💭 Spradley is thinking... (~${estimatedTime}s)`
        : '💭 Spradley is thinking...',
      animation: 'animate-spin',
    },
    speaking: {
      icon: Volume2,
      color: 'text-[hsl(var(--terracotta-red))]',
      bgColor: 'bg-[hsl(var(--terracotta-red))]/10',
      message: '🔊 Spradley is speaking',
      animation: 'animate-pulse',
    },
    error: {
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      message: '⚠️ Connection error',
      animation: '',
    },
  };

  const config = stateConfig[state];
  const Icon = config.icon;

  return (
    <div 
      className={`flex items-center justify-center gap-3 px-6 py-4 rounded-lg ${config.bgColor} transition-all duration-300`}
      role="status"
      aria-live="polite"
    >
      <Icon className={`h-6 w-6 ${config.color} ${config.animation}`} />
      <span className={`text-lg font-medium ${config.color}`}>
        {config.message}
      </span>
    </div>
  );
};
