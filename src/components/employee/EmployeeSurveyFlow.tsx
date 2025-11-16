import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChatInterface } from "@/components/employee/ChatInterface";
import { VoiceInterface } from "@/components/employee/VoiceInterface";
import { AnonymizationBanner } from "@/components/employee/AnonymizationBanner";
import { AnonymizationRitual } from "@/components/employee/AnonymizationRitual";
import { ConsentModal } from "@/components/employee/ConsentModal";
import { ClosingRitual } from "@/components/employee/ClosingRitual";
import { ChatErrorBoundary } from "@/components/employee/ChatErrorBoundary";
import { SpradleyEvaluation } from "@/components/employee/SpradleyEvaluation";
import { SurveyModeSelector } from "@/components/hr/wizard/SurveyModeSelector";
import { useConversation } from "@/hooks/useConversation";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";
import { usePreviewMode } from "@/contexts/PreviewModeContext";

type ConversationStep = "consent" | "anonymization" | "mode-select" | "chat" | "voice" | "closing" | "evaluation" | "complete";

interface EmployeeSurveyFlowProps {
  surveyId: string;
  surveyDetails: any;
  onComplete?: () => void;
  onExit?: () => void;
  quickPreview?: boolean;
  publicLinkId?: string;
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
}: EmployeeSurveyFlowProps) => {
  const { isPreviewMode } = usePreviewMode();
  const [step, setStep] = useState<ConversationStep>("consent");
  const [selectedMode, setSelectedMode] = useState<'text' | 'voice' | null>(null);
  const { conversationId, startConversation, endConversation } = useConversation(publicLinkId);
  const { toast } = useToast();

  const handleConsent = async () => {
    if (!isPreviewMode && surveyId && surveyDetails) {
      // Log consent to consent_history table (skip in preview mode and for anonymous public links)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Only log consent for authenticated users
        await supabase.from("consent_history").insert({
          user_id: user.id,
          survey_id: surveyId,
          anonymization_level: surveyDetails?.consent_config?.anonymization_level || "anonymous",
          data_retention_days: surveyDetails?.consent_config?.data_retention_days || 60,
        });
      }
      // For anonymous public link users, consent is recorded in the conversation session
    }

    setStep("anonymization");
  };

  const handleAnonymizationComplete = async () => {
    if (quickPreview) {
      // In quick preview mode, skip mode selection, go directly to chat
      try {
        const sessionId = await startConversation(surveyId, null, publicLinkId);
        if (sessionId) {
          setStep("chat");
        } else {
          // If session creation failed, show error
          toast({
            title: "Preview Error",
            description: "Failed to start preview conversation. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error starting preview conversation:", error);
        toast({
          title: "Preview Error",
          description: "An error occurred while starting the preview. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      // Show mode selector
      setStep("mode-select");
    }
  };

  const handleModeSelect = async (mode: 'text' | 'voice') => {
    setSelectedMode(mode);
    
    if (!surveyId) {
      toast({
        title: "Error",
        description: "Survey ID is missing. Please try reloading.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Start conversation without mood (pass null or undefined)
      const sessionId = await startConversation(surveyId, null, publicLinkId);
      if (sessionId) {
        // Go to the appropriate interface based on selected mode
        if (mode === 'voice') {
          setStep("voice");
        } else {
          setStep("chat");
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to start conversation. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast({
        title: "Error",
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

  const handleChatComplete = () => {
    setStep("closing");
  };

  const handleSurveyComplete = async () => {
    if (!isPreviewMode) {
      await endConversation(null);
    } else {
      // In preview mode, just reset conversation state
      if (conversationId) {
        // No DB operations in preview mode
      }
    }

    // Check if evaluation is enabled
    const enableEvaluation = surveyDetails?.consent_config?.enable_spradley_evaluation;
    
    if (enableEvaluation && !isPreviewMode && conversationId) {
      // Show evaluation step
      setStep("evaluation");
    } else {
      // Skip evaluation and go to complete
      setStep("complete");
      
      toast({
        title: isPreviewMode ? "Preview Complete!" : "Thank you!",
        description: isPreviewMode
          ? "You've experienced the complete employee survey journey."
          : "Your feedback has been recorded.",
      });

      // Call completion handler after a delay
      setTimeout(() => {
        onComplete?.();
      }, isPreviewMode ? 1000 : 2000);
    }
  };

  const handleEvaluationComplete = () => {
    setStep("complete");
    
    toast({
      title: "Thank you!",
      description: "Your feedback has been recorded.",
    });

    // Call completion handler after a delay
    setTimeout(() => {
      onComplete?.();
    }, 2000);
  };

  const handleEvaluationSkip = () => {
    setStep("complete");
    
    toast({
      title: "Thank you!",
      description: "Your feedback has been recorded.",
    });

    // Call completion handler after a delay
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
          {step === "consent" && (
            <ConsentModal
              open={true}
              consentMessage={surveyDetails?.consent_config?.consent_message}
              anonymizationLevel={surveyDetails?.consent_config?.anonymization_level}
              dataRetentionDays={surveyDetails?.consent_config?.data_retention_days}
              onConsent={handleConsent}
              onDecline={handleDecline}
            />
          )}

          {step === "anonymization" && (
            <AnonymizationRitual
              sessionId={surveyId || "PREVIEW-SESSION"}
              onComplete={handleAnonymizationComplete}
              minimal={quickPreview}
            />
          )}

          {step === "mode-select" && (
            <SurveyModeSelector
              onSelectMode={handleModeSelect}
              surveyTitle={surveyDetails?.title || "Employee Feedback Survey"}
              firstMessage={surveyDetails?.first_message}
            />
          )}

          {step === "chat" && conversationId && (
            <ChatErrorBoundary conversationId={conversationId} onExit={handleSaveAndExit}>
              <ChatInterface
                conversationId={conversationId}
                onComplete={handleChatComplete}
                onSaveAndExit={handleSaveAndExit}
                showTrustFlow={true}
                skipTrustFlow={quickPreview}
              />
            </ChatErrorBoundary>
          )}

          {step === "voice" && conversationId && (
            <ChatErrorBoundary conversationId={conversationId} onExit={handleSaveAndExit}>
              <VoiceInterface
                conversationId={conversationId}
                onSwitchToText={() => setStep("chat")}
                onComplete={handleChatComplete}
              />
            </ChatErrorBoundary>
          )}

          {step === "closing" && conversationId && (
            <ClosingRitual
              conversationId={conversationId}
              onComplete={handleSurveyComplete}
            />
          )}

          {step === "evaluation" && conversationId && (
            <SpradleyEvaluation
              surveyId={surveyId}
              conversationSessionId={conversationId}
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
