import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CulturalContext, getCulturalTone } from '@/lib/culturalAdaptation';
import { Shield, Heart, Users, CheckCircle } from 'lucide-react';

interface RitualIntroductionProps {
  onComplete: () => void;
  culturalContext?: CulturalContext;
}

export const RitualIntroduction: React.FC<RitualIntroductionProps> = ({ 
  onComplete, 
  culturalContext 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const tone = culturalContext ? getCulturalTone(culturalContext) : getCulturalTone({
    region: 'US/UK',
    language: 'en',
    organizationType: 'Corporate'
  });

  const steps = [
    {
      icon: <Heart className="w-8 h-8 text-blue-500" />,
      title: "Welcome to Your Feedback Session",
      content: tone.introduction,
      culturalAcknowledgment: true,
      highlight: "This is different from typical surveys"
    },
    {
      icon: <Shield className="w-8 h-8 text-green-500" />,
      title: "Your Privacy is Protected",
      content: "I don't work for HR. I'm here just to listen and ask questions so your voice can be heard clearly.",
      powerClarification: true,
      highlight: "I don't work for HR"
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-purple-500" />,
      title: "Complete Anonymity",
      content: "Everything you say stays anonymous—I promise HR will never know this was you specifically.",
      anonymityPerformance: true,
      highlight: "HR will never know this was you"
    },
    {
      icon: <Users className="w-8 h-8 text-orange-500" />,
      title: "No Right or Wrong Way",
      content: "There's no right or wrong way to do this. You can share as much or as little as you want.",
      permissionToBeUncomfortable: true,
      highlight: "Share as much or as little as you want"
    }
  ];

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className={`transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            {steps[currentStep].title}
          </CardTitle>
          <Progress value={(currentStep + 1) / steps.length * 100} className="mt-4" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center mb-4">
            {steps[currentStep].icon}
          </div>
          
          <p className="text-lg text-center text-muted-foreground leading-relaxed">
            {steps[currentStep].content}
          </p>
          
          {steps[currentStep].highlight && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 font-medium text-center">
                💡 <strong>Key Point:</strong> {steps[currentStep].highlight}
              </p>
            </div>
          )}
          
          {steps[currentStep].culturalAcknowledgment && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                🌍 <strong>Cultural Note:</strong> This approach is designed to be respectful of different communication styles and cultural backgrounds.
              </p>
            </div>
          )}
          
          <div className="flex justify-center space-x-4">
            <Button 
              onClick={handleNext} 
              size="lg"
              className="min-w-[120px]"
            >
              {currentStep < steps.length - 1 ? 'Continue' : 'Start Your Session'}
            </Button>
            {currentStep > 0 && (
              <Button 
                onClick={handleSkip} 
                variant="outline" 
                size="lg"
                className="min-w-[120px]"
              >
                Skip Introduction
              </Button>
            )}
          </div>
          
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};