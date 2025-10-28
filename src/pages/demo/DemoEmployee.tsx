import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MoodDial } from "@/components/employee/MoodDial";
import { DemoAIChat } from "@/components/demo/DemoAIChat";
import { DemoComparison } from "@/components/demo/DemoComparison";
interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}
import { ArrowLeft, Sparkles } from "lucide-react";

export default function DemoEmployee() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<'intro' | 'interactive' | 'comparison' | 'complete'>('intro');
  const [mood, setMood] = useState(7);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);

  const handleStartSurvey = () => {
    setCurrentStep('interactive');
  };

  const handleChatComplete = (messages: Message[]) => {
    setConversationMessages(messages);
    setCurrentStep('comparison');
  };

  const handleSkipToResults = () => {
    setCurrentStep('comparison');
  };

  const handleViewAnalytics = () => {
    navigate('/demo/hr');
  };

  const handleComplete = () => {
    setCurrentStep('complete');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Demo Banner */}
      <div className="bg-primary/10 border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Demo Mode - Employee View</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/demo')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Demo Menu
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {currentStep === 'intro' && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-3">Quarterly Feedback Survey</h1>
              <p className="text-muted-foreground">
                Your feedback helps us create a better workplace. This conversation is confidential.
              </p>
            </div>

            {/* Privacy Info */}
            <div className="bg-muted/50 rounded-lg p-6 mb-8">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span className="text-green-600">🔒</span>
                Your Privacy is Protected
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Your responses are fully anonymous</li>
                <li>✓ Data is encrypted and kept for 60 days</li>
                <li>✓ No individual responses are shown to managers</li>
                <li>✓ GDPR compliant and secure</li>
              </ul>
            </div>

            {/* Mood Check */}
            <div className="mb-8">
              <h3 className="font-semibold mb-4 text-center">How are you feeling today?</h3>
              <MoodDial onMoodSelect={setMood} />
            </div>

            <Button onClick={handleStartSurvey} className="w-full" size="lg">
              Start Conversation
            </Button>
          </Card>
        )}

        {currentStep === 'interactive' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold mb-1">Your Feedback Conversation</h2>
                <p className="text-sm text-muted-foreground">
                  Respond naturally - the AI will adapt to your answers
                </p>
              </div>
              <Badge variant="secondary">Anonymous & Encrypted</Badge>
            </div>
            
            <DemoAIChat 
              onComplete={handleChatComplete}
              onSkip={handleSkipToResults}
            />
          </Card>
        )}

        {currentStep === 'comparison' && (
          <DemoComparison
            conversationMessages={conversationMessages}
            onViewAnalytics={handleViewAnalytics}
            onBackToMenu={() => navigate('/demo')}
          />
        )}

        {currentStep === 'complete' && (
          <Card className="p-8 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <span className="text-3xl">✓</span>
              </div>
              <h2 className="text-2xl font-bold mb-3">Thank You!</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Your feedback has been recorded anonymously. We'll review responses and share updates on actions we're taking.
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold mb-3">What Happens Next?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground text-left max-w-md mx-auto">
                <li>✓ Your responses are analyzed for themes and sentiment</li>
                <li>✓ HR reviews aggregated insights (never individual responses)</li>
                <li>✓ Action commitments are shared with all employees</li>
                <li>✓ You'll receive updates on progress</li>
              </ul>
            </div>

            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate('/demo/hr')} variant="default">
                See HR Analytics
              </Button>
              <Button onClick={() => navigate('/demo')} variant="outline">
                Back to Demo Menu
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
