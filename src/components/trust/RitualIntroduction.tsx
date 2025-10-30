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
    <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <Card className="max-w-2xl mx-auto relative overflow-hidden">
        {/* Warm gradient background accents */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-gradient-to-br from-[hsl(var(--butter-yellow))] to-[hsl(var(--coral-pink))] opacity-10 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-gradient-to-br from-[hsl(var(--terracotta-primary))] to-[hsl(var(--lime-green))] opacity-10 blur-3xl" />
        
        <CardHeader className="relative z-10">
          <CardTitle className="text-center text-3xl font-bold bg-gradient-to-r from-[hsl(var(--terracotta-primary))] to-[hsl(var(--coral-accent))] bg-clip-text text-transparent">
            {steps[currentStep].title}
          </CardTitle>
          <Progress value={(currentStep + 1) / steps.length * 100} className="mt-6 h-2" />
        </CardHeader>
        <CardContent className="space-y-8 relative z-10">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[hsl(var(--terracotta-primary))] to-[hsl(var(--coral-accent))] flex items-center justify-center shadow-lg">
              {steps[currentStep].icon}
            </div>
          </div>
          
          <p className="text-lg text-center text-foreground leading-relaxed px-4">
            {steps[currentStep].content}
          </p>
          
          {steps[currentStep].highlight && (
            <div className="bg-[hsl(var(--terracotta-pale))] p-6 rounded-2xl border-2 border-[hsl(var(--terracotta-primary))]/20">
              <p className="text-sm text-[hsl(var(--terracotta-primary))] font-medium text-center">
                💡 <strong>Key Point:</strong> {steps[currentStep].highlight}
              </p>
            </div>
          )}
          
          {steps[currentStep].culturalAcknowledgment && (
            <div className="bg-[hsl(var(--lime-green))]/10 p-6 rounded-2xl border-2 border-[hsl(var(--lime-green))]/20">
              <p className="text-sm text-foreground">
                🌍 <strong>Cultural Note:</strong> This approach is designed to be respectful of different communication styles and cultural backgrounds.
              </p>
            </div>
          )}
          
          <div className="flex justify-center space-x-4 pt-4">
            <Button 
              onClick={handleNext} 
              size="lg"
              variant="coral"
              className="min-w-[160px] shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {currentStep < steps.length - 1 ? 'Continue' : 'Start Your Session'}
            </Button>
            {currentStep > 0 && (
              <Button 
                onClick={handleSkip} 
                variant="outline" 
                size="lg"
                className="min-w-[160px]"
              >
                Skip Introduction
              </Button>
            )}
          </div>
          
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};