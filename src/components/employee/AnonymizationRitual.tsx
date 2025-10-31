import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Shield, Check, Lock, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AnonymizationRitualProps {
  sessionId: string;
  onComplete: () => void;
  minimal?: boolean;
}

export const AnonymizationRitual = ({ sessionId, onComplete, minimal = false }: AnonymizationRitualProps) => {
  const [step, setStep] = useState(0);
  
  // Generate a readable session ID from the actual session ID
  const displaySessionId = sessionId.substring(0, 8).toUpperCase();

  useEffect(() => {
    // Animate through steps
    const timer1 = setTimeout(() => setStep(1), 800);
    const timer2 = setTimeout(() => setStep(2), 1600);
    const timer3 = setTimeout(() => setStep(3), 2400);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const steps = [
    {
      icon: Fingerprint,
      text: "Creating anonymous session...",
      detail: "Generating secure session ID",
      complete: step >= 1
    },
    {
      icon: Lock,
      text: "Disconnecting your identity...",
      detail: "Your name will not be linked to responses",
      complete: step >= 2
    },
    {
      icon: Shield,
      text: "Establishing secure channel...",
      detail: "All data encrypted end-to-end",
      complete: step >= 3
    }
  ];

  return (
    <Card className="p-8 max-w-md mx-auto bg-gradient-to-br from-card to-card/50 border-border/50">
      {!minimal && (
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Protecting Your Privacy</h2>
          <p className="text-sm text-muted-foreground">
            Setting up your anonymous feedback session
          </p>
        </div>
      )}

      <div className="space-y-4 mb-6">
        {steps.map((stepItem, index) => {
          const Icon = stepItem.icon;
          return (
            <div
              key={index}
              className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ${
                stepItem.complete 
                  ? 'bg-primary/5 border border-primary/20' 
                  : 'bg-muted/30 opacity-50'
              }`}
            >
              <div className="mt-0.5">
                {stepItem.complete ? (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                ) : (
                  <Icon className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{stepItem.text}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stepItem.detail}</p>
              </div>
            </div>
          );
        })}
      </div>

      {step >= 3 && (
        <div className="space-y-4 animate-fade-in">
          {!minimal && (
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-xs text-muted-foreground mb-2">Your Anonymous Session ID</p>
              <p className="text-2xl font-mono font-bold text-primary tracking-wider">
                #{displaySessionId}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                HR will see session #{displaySessionId}, not your name
              </p>
            </div>
          )}

          <Button onClick={onComplete} className="w-full" size="lg">
            Start Conversation
          </Button>
        </div>
      )}
    </Card>
  );
};
