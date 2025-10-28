import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ConversationBubble } from "@/components/employee/ConversationBubble";
import { MoodDial } from "@/components/employee/MoodDial";
import { ArrowLeft, Sparkles } from "lucide-react";

const demoConversation = [
  {
    role: "assistant" as const,
    content: "Hello! Thank you for taking the time to share your feedback with us. This conversation is completely confidential and will help us create a better workplace. How are you feeling today?",
    timestamp: new Date(Date.now() - 180000),
  },
  {
    role: "user" as const,
    content: "I'm feeling pretty good overall, thanks for asking.",
    timestamp: new Date(Date.now() - 150000),
  },
  {
    role: "assistant" as const,
    content: "That's wonderful to hear! I'd like to understand more about your experience with work-life balance. How do you feel about the flexibility and boundaries between work and personal time?",
    timestamp: new Date(Date.now() - 120000),
  },
  {
    role: "user" as const,
    content: "Honestly, it's been challenging. I often find myself answering emails late at night and on weekends. It feels like there's an expectation to always be available.",
    timestamp: new Date(Date.now() - 90000),
  },
  {
    role: "assistant" as const,
    content: "I appreciate you sharing that. It sounds like the blurred boundaries are affecting your personal time. Can you tell me more about when this happens most - is it certain projects, times of the month, or particular team expectations?",
    timestamp: new Date(Date.now() - 60000),
  },
  {
    role: "user" as const,
    content: "It's mostly during month-end reporting. The deadlines are tight, and there's pressure from leadership to deliver quickly. I don't feel I can say no.",
    timestamp: new Date(Date.now() - 30000),
  },
  {
    role: "assistant" as const,
    content: "Thank you for being so open. Before we finish, is there anything else about your work experience you'd like to share?",
    timestamp: new Date(),
  },
];

export default function DemoEmployee() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<'intro' | 'chat' | 'complete'>('intro');
  const [mood, setMood] = useState(7);

  const handleStartSurvey = () => {
    setCurrentStep('chat');
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

        {currentStep === 'chat' && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Conversation</h2>
                <Badge variant="secondary">Anonymous</Badge>
              </div>
              
              <div className="space-y-4 max-h-[500px] overflow-y-auto mb-4">
                {demoConversation.map((msg, idx) => (
                  <ConversationBubble
                    key={idx}
                    message={msg.content}
                    isUser={msg.role === "user"}
                    timestamp={msg.timestamp}
                  />
                ))}
              </div>

              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  In a real survey, you'd continue the conversation here.
                </p>
                <Button onClick={handleComplete}>
                  Complete Survey (Demo)
                </Button>
              </div>
            </Card>
          </div>
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
