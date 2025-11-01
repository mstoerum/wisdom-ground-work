import { Shield, Circle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PrivacyBadgeProps {
  isRecording?: boolean;
}

/**
 * Persistent privacy badge shown during voice sessions
 * Reinforces privacy messaging without being intrusive
 */
export const PrivacyBadge = ({ isRecording = false }: PrivacyBadgeProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-3 py-2 bg-background/80 backdrop-blur-sm border border-border rounded-full shadow-sm">
            <Shield className="h-3 w-3 text-[hsl(var(--lime-green))]" />
            <span className="text-xs font-medium">Transcript only</span>
            {isRecording && (
              <Circle className="h-2 w-2 fill-[hsl(var(--terracotta-red))] text-[hsl(var(--terracotta-red))] animate-pulse" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="text-xs">
            <strong>Privacy Protected:</strong> Only your conversation transcript is saved. 
            Your voice audio is <strong>not recorded</strong> or stored.
            {isRecording && (
              <span className="block mt-1 text-[hsl(var(--terracotta-red))]">
                Currently transcribing your words (audio not saved)
              </span>
            )}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
