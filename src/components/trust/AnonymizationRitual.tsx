import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Shield, Lock, Key } from 'lucide-react';

interface AnonymizationRitualProps {
  onComplete: (sessionId: string) => void;
}

export const AnonymizationRitual: React.FC<AnonymizationRitualProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [sessionId, setSessionId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(true);

  const steps = [
    {
      icon: <Key className="w-8 h-8 text-blue-500" />,
      title: "Creating Anonymous Session",
      description: "Generating unique session identifier",
      status: "processing",
      duration: 2000
    },
    {
      icon: <Lock className="w-8 h-8 text-green-500" />,
      title: "Disconnecting Identity",
      description: "Removing personal identifiers from session",
      status: "processing",
      duration: 2000
    },
    {
      icon: <Shield className="w-8 h-8 text-purple-500" />,
      title: "Secure Channel Established",
      description: "Your session is now completely anonymous",
      status: "completed",
      duration: 1000
    }
  ];

  useEffect(() => {
    // Generate session ID
    const generateSessionId = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '#';
      for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    setSessionId(generateSessionId());
  }, []);

  useEffect(() => {
    if (currentStep < steps.length) {
      const timer = setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, steps[currentStep].duration);
      return () => clearTimeout(timer);
    } else {
      setIsProcessing(false);
    }
  }, [currentStep]);

  const handleComplete = () => {
    onComplete(sessionId);
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-xl font-bold flex items-center justify-center space-x-2">
            <Shield className="w-6 h-6 text-blue-500" />
            <span>Anonymizing Your Session</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {steps.map((step, index) => (
            <div 
              key={index}
              className={`flex items-center space-x-4 p-4 rounded-lg transition-all duration-500 ${
                index <= currentStep 
                  ? 'bg-green-50 border border-green-200 shadow-sm' 
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="flex-shrink-0">
                {step.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{step.title}</h3>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
              {index < currentStep && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              {index === currentStep && isProcessing && (
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          ))}
          
          {currentStep >= steps.length && (
            <div className="text-center space-y-4">
              <div className="bg-green-100 p-4 rounded-lg border border-green-200">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-800 flex items-center justify-center space-x-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Session ID created: {sessionId}</span>
                  </p>
                  <p className="text-sm font-medium text-green-800 flex items-center justify-center space-x-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Your identity disconnected</span>
                  </p>
                  <p className="text-sm font-medium text-green-800 flex items-center justify-center space-x-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Secure channel established</span>
                  </p>
                </div>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-800">
                  <strong>What this means:</strong> HR will see session {sessionId}, not your name. 
                  Your responses are completely anonymous.
                </p>
              </div>
              
              <Button onClick={handleComplete} size="lg" className="w-full">
                Continue to Conversation
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};