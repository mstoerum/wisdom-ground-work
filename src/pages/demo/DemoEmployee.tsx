import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles, BarChart3 } from "lucide-react";
import { PreviewModeProvider } from "@/contexts/PreviewModeContext";
import { EmployeeSurveyFlow } from "@/components/employee/EmployeeSurveyFlow";
import { Card } from "@/components/ui/card";

export default function DemoEmployee() {
  const navigate = useNavigate();
  const [surveyCompleted, setSurveyCompleted] = useState(false);

  // Demo survey data that matches the complete preview
  const demoSurveyData = {
    id: "demo-survey-001",
    title: "Quarterly Feedback Survey - Demo",
    description: "Experience how Spradley makes feedback feel natural and safe",
    first_message: "Hello! Thank you for taking the time to share your feedback with us. This conversation is confidential and will help us create a better workplace for everyone. I'm here to listen and understand your perspective. How has your experience been at work lately?",
    themes: [
      "Work-Life Balance",
      "Team Collaboration",
      "Career Development",
      "Management Support",
      "Workplace Culture"
    ],
    consent_config: {
      anonymization_level: "anonymous",
      data_retention_days: 60,
      consent_message: "Your responses will be kept confidential and used to improve our workplace. We take your privacy seriously and follow strict data protection guidelines. Your feedback is anonymous and will only be viewed as aggregated insights by HR."
    },
    status: "demo",
  };

  const handleComplete = () => {
    setSurveyCompleted(true);
  };

  const handleExit = () => {
    navigate('/demo');
  };

  if (surveyCompleted) {
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

        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <Card className="p-8 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mb-6 shadow-xl">
                <span className="text-5xl">✓</span>
              </div>
              <h2 className="text-3xl font-bold mb-3">Demo Complete!</h2>
              <p className="text-lg text-muted-foreground max-w-md mx-auto mb-8">
                You've experienced the complete employee survey journey. See how this data transforms into actionable insights for HR.
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-6 mb-8">
              <h3 className="font-semibold mb-4 text-lg">What You Just Experienced:</h3>
              <ul className="space-y-3 text-sm text-muted-foreground text-left max-w-md mx-auto">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Privacy-First Consent:</strong> Clear information about data handling and retention</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Anonymization Ritual:</strong> Visual demonstration of identity protection</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Mood Tracking:</strong> Before and after emotional state capture</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Natural Conversation:</strong> AI-powered empathetic dialogue</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Thoughtful Closing:</strong> Reflection and completion ritual</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button onClick={() => navigate('/demo/hr')} size="lg" className="w-full sm:w-auto">
                <BarChart3 className="h-4 w-4 mr-2" />
                See HR Analytics Dashboard
              </Button>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => setSurveyCompleted(false)} variant="outline">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={() => navigate('/demo')} variant="ghost">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Demo Menu
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Demo Banner */}
      <div className="bg-primary/10 border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Demo Mode - Employee View</span>
            <Badge variant="secondary" className="ml-2">
              Interactive Demo
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/demo')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Demo Menu
          </Button>
        </div>
      </div>

      {/* Real Survey Flow in Preview Mode */}
      <PreviewModeProvider
        isPreviewMode={true}
        previewSurveyId={demoSurveyData.id}
        previewSurveyData={demoSurveyData}
      >
        <EmployeeSurveyFlow
          surveyId={demoSurveyData.id}
          surveyDetails={demoSurveyData}
          onComplete={handleComplete}
          onExit={handleExit}
          quickPreview={false}
        />
      </PreviewModeProvider>
    </div>
  );
}
