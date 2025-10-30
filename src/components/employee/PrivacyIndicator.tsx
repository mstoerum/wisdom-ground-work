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
 * Connection quality indicator
 */
interface ConnectionQualityIndicatorProps {
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

export const ConnectionQualityIndicator = ({ quality }: ConnectionQualityIndicatorProps) => {
  const qualityConfig = {
    excellent: { color: 'lime-green', label: 'Excellent Connection', icon: '✓' },
    good: { color: 'lime-green', label: 'Good Connection', icon: '✓' },
    fair: { color: 'butter-yellow', label: 'Fair Connection', icon: '⚠' },
    poor: { color: 'red', label: 'Poor Connection', icon: '⚠' },
  };

  const config = qualityConfig[quality];

  return (
    <div className={`flex items-center gap-2 text-xs text-[hsl(var(--${config.color}))]`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </div>
  );
};
