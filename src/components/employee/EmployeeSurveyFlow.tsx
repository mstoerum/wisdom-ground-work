import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FocusedInterviewInterface } from "@/components/employee/FocusedInterviewInterface";
import { AnonymizationBanner } from "@/components/employee/AnonymizationBanner";
import { WelcomeScreen } from "@/components/employee/WelcomeScreen";
import { ChatErrorBoundary } from "@/components/employee/ChatErrorBoundary";
import { FocusedEvaluation } from "@/components/employee/FocusedEvaluation";
import { useConversation } from "@/hooks/useConversation";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";
import { usePreviewMode } from "@/contexts/PreviewModeContext";
import { InterviewContext, createDefaultContext } from "@/utils/evaluationQuestions";

// Removed "closing" step - now handled in SummaryReceipt
type ConversationStep = "welcome" | "chat" | "evaluation" | "complete";

interface EmployeeSurveyFlowProps {
  surveyId: string;
  surveyDetails: any;
  onComplete?: () => void;
  onExit?: () => void;
  quickPreview?: boolean;
  publicLinkId?: string;
  skipIntro?: boolean; // Skip welcome screen for demo
}

/**
 * Reusable employee survey flow component
 * Can be used in both real and preview mode
 */
export const EmployeeSurveyFlow = ({
  surveyId,
  surveyDetails,
  onComplete,
  onExit,
  quickPreview = false,
  publicLinkId,
  skipIntro = false,
}: EmployeeSurveyFlowProps) => {
  const { isPreviewMode } = usePreviewMode();
  // Skip directly to chat for demo mode (skipIntro)
  const [step, setStep] = useState<ConversationStep>(skipIntro ? "chat" : "welcome");
  const [autoStarted, setAutoStarted] = useState(false);
  const { conversationId, startConversation, endConversation } = useConversation(publicLinkId);
  const { toast } = useToast();
  
  // Track interview context for evaluation personalization
  const [interviewContext, setInterviewContext] = useState<InterviewContext>(createDefaultContext());
  const conversationStartTime = useRef<number>(Date.now());

  // Auto-start conversation for skipIntro mode
  const autoStartConversation = async () => {
    if (autoStarted || !surveyId) return;
    setAutoStarted(true);
    
    try {
      const sessionId = await startConversation(surveyId, null, publicLinkId);
      if (!sessionId) {
        toast({
          title: "Error",
          description: "Failed to start conversation. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error auto-starting conversation:", error);
    }
  };

  // Effect to auto-start conversation when skipIntro is true
  if (skipIntro && step === "chat" && !conversationId && !autoStarted) {
    autoStartConversation();
  }

  const handleWelcomeComplete = async (mood: number) => {
    // Log consent
    if (!isPreviewMode && surveyId && surveyDetails) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("consent_history").insert({
          user_id: user.id,
          survey_id: surveyId,
          anonymization_level: surveyDetails?.consent_config?.anonymization_level || "anonymous",
          data_retention_days: surveyDetails?.consent_config?.data_retention_days || 60,
        });
      }
    }

    // Store initial mood for context
    const moodValue = mood;
    localStorage.setItem(`spradley_initial_mood_${surveyId}`, String(moodValue));
    // Mark user as having visited Spradley
    localStorage.setItem("spradley-visited", "true");
    
    // Update interview context with initial mood
    setInterviewContext(prev => ({
      ...prev,
      initialMood: moodValue,
    }));
    conversationStartTime.current = Date.now();

    // Start conversation with mood
    if (!surveyId) {
      toast({
        title: "Error",
        description: "Survey ID is missing. Please try reloading.",
        variant: "destructive",
      });
      return;
    }

    try {
      const sessionId = await startConversation(surveyId, mood, publicLinkId);
      if (sessionId) {
        setStep("chat");
      } else {
        toast({
          title: quickPreview ? "Preview Error" : "Error",
          description: "Failed to start conversation. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast({
        title: quickPreview ? "Preview Error" : "Error",
        description: "An error occurred while starting the conversation.",
        variant: "destructive",
      });
    }
  };


  const handleDecline = async () => {
    if (isPreviewMode) {
      onExit?.();
    } else {
      toast({
        title: "Thank you",
        description: "You can participate whenever you're ready.",
      });
      onExit?.();
    }
  };

  // Callback to receive interview data from chat interface
  const handleChatComplete = useCallback((chatData?: {
    themesDiscussed?: string[];
    exchangeCount?: number;
    sentiment?: 'positive' | 'neutral' | 'negative';
  }) => {
    // Update context with interview data
    if (chatData) {
      const duration = Math.floor((Date.now() - conversationStartTime.current) / 1000);
      setInterviewContext(prev => ({
        ...prev,
        themesDiscussed: chatData.themesDiscussed || [],
        exchangeCount: chatData.exchangeCount || 0,
        overallSentiment: chatData.sentiment || 'neutral',
        duration,
      }));
    }
    
    // Skip closing ritual - now integrated into SummaryReceipt
    handleSurveyComplete();
  }, []);

  const handleSurveyComplete = async () => {
    // Check if evaluation is enabled FIRST
    const enableEvaluation = surveyDetails?.consent_config?.enable_spradley_evaluation;
    
    if (enableEvaluation && !isPreviewMode && conversationId) {
      // Don't end conversation yet - evaluation needs active session
      setStep("evaluation");
    } else {
      // No evaluation - end conversation now
      if (!isPreviewMode) {
        await endConversation(null);
      }
      setStep("complete");
      
      toast({
        title: isPreviewMode ? "Preview Complete!" : "Thank you!",
        description: isPreviewMode
          ? "You've experienced the complete employee survey journey."
          : "Your feedback has been recorded.",
      });

      setTimeout(() => {
        onComplete?.();
      }, isPreviewMode ? 1000 : 2000);
    }
  };

  const handleEvaluationComplete = async () => {
    // End conversation after evaluation is complete
    if (!isPreviewMode) {
      await endConversation(null);
    }
    
    setStep("complete");
    
    toast({
      title: "Thank you!",
      description: "Your feedback has been recorded.",
    });

    setTimeout(() => {
      onComplete?.();
    }, 2000);
  };

  const handleEvaluationSkip = async () => {
    // End conversation even if evaluation was skipped
    if (!isPreviewMode) {
      await endConversation(null);
    }
    
    setStep("complete");
    
    toast({
      title: "Thank you!",
      description: "Your feedback has been recorded.",
    });

    setTimeout(() => {
      onComplete?.();
    }, 2000);
  };

  const handleSaveAndExit = () => {
    if (isPreviewMode) {
      onExit?.();
    } else {
      onExit?.();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-[hsl(var(--terracotta-pale))]/5 to-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Anonymization Banner - only show in non-preview mode */}
        {!isPreviewMode && <AnonymizationBanner />}

        {/* Preview Mode Alert */}
        {isPreviewMode && (
          <div className="mb-4">
            <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1 w-fit">
              <PlayCircle className="h-3.5 w-3.5" />
              Preview Mode
            </Badge>
          </div>
        )}

        {step === "chat" && !isPreviewMode && (
          <Alert className="mt-6 border-[hsl(var(--terracotta-primary))] bg-[hsl(var(--terracotta-pale))] rounded-2xl">
            <PlayCircle className="h-5 w-5 text-[hsl(var(--terracotta-primary))]" />
            <AlertDescription className="text-foreground">
              You have an active conversation in progress. Your responses are being saved automatically.
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-8">
          {step === "welcome" && (
            <WelcomeScreen
              surveyId={surveyId}
              surveyDetails={surveyDetails}
              onComplete={handleWelcomeComplete}
              onDecline={handleDecline}
              anonymizationLevel={surveyDetails?.consent_config?.anonymization_level}
            />
          )}

          {step === "chat" && conversationId && (
            <ChatErrorBoundary conversationId={conversationId} onExit={handleSaveAndExit}>
              <FocusedInterviewInterface
                conversationId={conversationId}
                onComplete={handleChatComplete}
                onSaveAndExit={handleSaveAndExit}
                publicLinkId={publicLinkId}
                minimalUI={skipIntro}
                surveyType={surveyDetails?.survey_type}
              />
            </ChatErrorBoundary>
          )}

          {/* Closing ritual removed - now integrated into SummaryReceipt */}

          {step === "evaluation" && conversationId && (
            <FocusedEvaluation
              surveyId={surveyId}
              conversationSessionId={conversationId}
              interviewContext={interviewContext}
              onComplete={handleEvaluationComplete}
              onSkip={handleEvaluationSkip}
            />
          )}

          {step === "complete" && (
            <div className="text-center py-16 space-y-6">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-[hsl(var(--lime-green))] to-[hsl(var(--butter-yellow))] mb-6 shadow-xl">
                <span className="text-6xl">✓</span>
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-[hsl(var(--terracotta-primary))] to-[hsl(var(--coral-accent))] bg-clip-text text-transparent">
                Thank You!
              </h2>
              <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
                {isPreviewMode
                  ? "Preview complete! You've experienced the complete employee survey journey."
                  : publicLinkId
                  ? "Your feedback has been recorded. Thank you for participating!"
                  : "Your feedback has been recorded. Explore the tabs below to see how we're acting on employee feedback."}
              </p>
              {publicLinkId && (
                <div className="flex justify-center mt-8">
                  <Button
                    onClick={() => {
                      // Clear any session data from localStorage
                      if (conversationId) {
                        localStorage.removeItem(`public_survey_session_${publicLinkId}`);
                      }
                      // Close the window/tab
                      window.close();
                      // If window.close() doesn't work (some browsers block it), show message
                      setTimeout(() => {
                        toast({
                          title: "Survey Complete",
                          description: "You can safely close this window now.",
                        });
                      }, 100);
                    }}
                    size="lg"
                    className="bg-[hsl(var(--terracotta-primary))] hover:bg-[hsl(var(--terracotta-primary))]/90"
                  >
                    Close Window
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
