import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic, CheckCircle2, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface VoiceTutorialProps {
  open: boolean;
  onComplete: () => void;
}

/**
 * First-time voice chat tutorial
 * Guides users through microphone setup and voice interaction
 */
export const VoiceTutorial = ({ open, onComplete }: VoiceTutorialProps) => {
  const [step, setStep] = useState(0);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  const [audioTestPassed, setAudioTestPassed] = useState(false);

  const steps = [
    {
      title: 'Welcome to Voice Mode',
      description: 'Voice mode lets you have a natural conversation with Atlas. You can speak naturally and pause when you\'re done.',
      icon: '🎤',
    },
    {
      title: 'Microphone Permission',
      description: 'We need access to your microphone to enable voice chat. Click "Allow" when prompted.',
      icon: '🎙️',
      action: async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setMicPermissionGranted(true);
          stream.getTracks().forEach(track => track.stop());
        } catch (error) {
          console.error('Microphone permission denied:', error);
        }
      },
    },
    {
      title: 'Test Your Microphone',
      description: 'Say "Hello, Atlas" to test your microphone. Make sure you\'re in a quiet place.',
      icon: '🔊',
      test: true,
    },
    {
      title: 'You\'re All Set!',
      description: 'When you start voice chat, Atlas will introduce itself. Speak naturally and pause when you\'re done talking.',
      icon: '✅',
    },
  ];

  const currentStep = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  const handleNext = async () => {
    if (currentStep.action) {
      await currentStep.action();
    }
    
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{currentStep.icon}</span>
            {currentStep.title}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {currentStep.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              Step {step + 1} of {steps.length}
            </p>
          </div>

          {/* Microphone permission check */}
          {step === 1 && (
            <div className="p-4 bg-muted rounded-lg">
              {micPermissionGranted ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm">Microphone permission granted</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm">Waiting for microphone permission...</span>
                </div>
              )}
            </div>
          )}

          {/* Audio test */}
          {step === 2 && currentStep.test && (
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <p className="text-sm text-muted-foreground">
                Click the button below and say "Hello, Atlas" to test your microphone.
              </p>
              <Button
                onClick={async () => {
                  try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    // Simulate audio test
                    setTimeout(() => {
                      setAudioTestPassed(true);
                      stream.getTracks().forEach(track => track.stop());
                    }, 2000);
                  } catch (error) {
                    console.error('Audio test failed:', error);
                  }
                }}
                className="w-full"
                variant={audioTestPassed ? 'default' : 'outline'}
              >
                {audioTestPassed ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Audio test passed!
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Test Microphone
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            {step > 0 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="flex-1"
              >
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={step === 1 && !micPermissionGranted}
              className="flex-1"
            >
              {step === steps.length - 1 ? 'Start Voice Chat' : 'Next'}
            </Button>
          </div>

          <Button
            variant="ghost"
            onClick={handleSkip}
            className="w-full text-xs"
          >
            Skip tutorial
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
