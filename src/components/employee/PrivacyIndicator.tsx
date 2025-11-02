import { Shield, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Privacy indicator banner for voice chat
 * Clearly communicates what is recorded and stored
 */
export const PrivacyIndicator = () => {
  return (
    <Alert className="border-[hsl(var(--lime-green))] bg-[hsl(var(--lime-green))]/10 mb-4">
      <Shield className="h-4 w-4 text-[hsl(var(--lime-green))]" />
      <AlertDescription className="text-sm">
        <strong>Privacy Protected:</strong> Only your conversation transcript is saved. 
        Your voice audio is <strong>not recorded</strong> or stored.
      </AlertDescription>
    </Alert>
  );
};

/**
 * Connection quality indicator with latency display
 */
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ConnectionQualityIndicatorProps {
  quality: 'excellent' | 'good' | 'fair' | 'poor' | null;
  latency?: number | null;
}

export const ConnectionQualityIndicator = ({ quality, latency }: ConnectionQualityIndicatorProps) => {
  const getQualityIcon = () => {
    if (!quality) return <Loader2 className="h-3 w-3 animate-spin" />;
    
    switch (quality) {
      case 'excellent':
      case 'good':
        return <Wifi className="h-3 w-3 text-[hsl(var(--lime-green))]" />;
      case 'fair':
        return <Wifi className="h-3 w-3 text-[hsl(var(--butter-yellow))]" />;
      case 'poor':
        return <WifiOff className="h-3 w-3 text-destructive" />;
    }
  };
  
  const getQualityColor = () => {
    if (!quality) return 'text-muted-foreground';
    
    switch (quality) {
      case 'excellent':
      case 'good':
        return 'text-[hsl(var(--lime-green))]';
      case 'fair':
        return 'text-[hsl(var(--butter-yellow))]';
      case 'poor':
        return 'text-destructive';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-2 py-1 bg-background/80 backdrop-blur-sm rounded-md border">
            {getQualityIcon()}
            <span className={`text-xs ${getQualityColor()}`}>
              {latency ? `${latency}ms` : 'Checking...'}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Connection quality: {quality || 'Unknown'}</p>
          {latency && <p>Latency: {latency}ms</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
