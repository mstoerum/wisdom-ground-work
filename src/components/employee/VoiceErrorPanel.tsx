import { AlertTriangle, RefreshCw, MessageSquare, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface VoiceErrorPanelProps {
  error: string;
  onRetry: () => void;
  onSwitchToText?: () => void;
}

/**
 * Error recovery panel with troubleshooting guidance
 * Maps technical errors to user-friendly messages
 */
export const VoiceErrorPanel = ({ error, onRetry, onSwitchToText }: VoiceErrorPanelProps) => {
  // Map technical errors to user-friendly messages
  const getErrorInfo = (error: string) => {
    if (error.includes('NotAllowedError') || error.includes('permission')) {
      return {
        title: 'Microphone Access Denied',
        message: 'Please allow microphone access in your browser settings to use voice mode.',
        checklist: [
          'Click the microphone icon in your browser\'s address bar',
          'Select "Allow" for microphone access',
          'Refresh this page and try again',
        ],
      };
    }
    
    if (error.includes('NotFoundError') || error.includes('microphone')) {
      return {
        title: 'No Microphone Detected',
        message: 'We couldn\'t find a microphone connected to your device.',
        checklist: [
          'Check that a microphone is connected',
          'Make sure the microphone is not being used by another app',
          'Try unplugging and reconnecting your microphone',
        ],
      };
    }
    
    if (error.includes('NetworkError') || error.includes('connection')) {
      return {
        title: 'Connection Lost',
        message: 'The connection to our servers was interrupted.',
        checklist: [
          'Check your internet connection',
          'Try refreshing the page',
          'If the problem persists, switch to text mode',
        ],
      };
    }

    return {
      title: 'Voice Mode Error',
      message: 'An unexpected error occurred while trying to start voice mode.',
      checklist: [
        'Try refreshing the page',
        'Check your internet connection',
        'Ensure your microphone is working properly',
        'If issues persist, use text mode instead',
      ],
    };
  };

  const errorInfo = getErrorInfo(error);

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-destructive">{errorInfo.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{errorInfo.message}</p>
        
        <div className="space-y-2">
          <p className="text-sm font-medium">Troubleshooting steps:</p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {errorInfo.checklist.map((step, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground/50" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button onClick={onRetry} variant="default" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry Voice Mode
          </Button>
          
          {onSwitchToText && (
            <Button onClick={onSwitchToText} variant="outline" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Switch to Text Chat
            </Button>
          )}
        </div>

        <Alert>
          <AlertDescription className="text-xs">
            <strong>Technical details:</strong> {error}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
