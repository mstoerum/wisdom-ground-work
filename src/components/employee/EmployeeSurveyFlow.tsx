import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MoodDial } from "@/components/employee/MoodDial";
import { ChatInterface } from "@/components/employee/ChatInterface";
import { AnonymizationBanner } from "@/components/employee/AnonymizationBanner";
import { AnonymizationRitual } from "@/components/employee/AnonymizationRitual";
import { ConsentModal } from "@/components/employee/ConsentModal";
import { ClosingRitual } from "@/components/employee/ClosingRitual";
import { ChatErrorBoundary } from "@/components/employee/ChatErrorBoundary";
import { useConversation } from "@/hooks/useConversation";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PlayCircle } from "lucide-react";
import { usePreviewMode } from "@/contexts/PreviewModeContext";

type ConversationStep = "consent" | "anonymization" | "mood" | "chat" | "closing" | "complete";

interface EmployeeSurveyFlowProps {
  surveyId: string;
  surveyDetails: any;
  onComplete?: () => void;
  onExit?: () => void;
  quickPreview?: boolean;
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
}: EmployeeSurveyFlowProps) => {
  const { isPreviewMode } = usePreviewMode();
  const [step, setStep] = useState<ConversationStep>("consent");
  const [mood, setMood] = useState(50);
  const { conversationId, startConversation, endConversation } = useConversation();
  const { toast } = useToast();

  const handleConsent = async () => {
    if (!isPreviewMode && surveyId && surveyDetails) {
      // Log consent to consent_history table (skip in preview mode)
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

    setStep("anonymization");
  };

  const handleAnonymizationComplete = async () => {
    if (quickPreview) {
      // In quick preview mode, skip mood dial and go directly to chat
      const sessionId = await startConversation(surveyId, 50);
      if (sessionId) {
        setStep("chat");
      }
    } else {
      setStep("mood");
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

  const handleMoodSelect = async (selectedMood: number) => {
    setMood(selectedMood);
    if (!surveyId) return;

    const sessionId = await startConversation(surveyId, selectedMood);
    if (sessionId) {
      setStep("chat");
    }
  };

  const handleChatComplete = () => {
    setStep("closing");
  };

  const handleSurveyComplete = async (finalMood: number) => {
    if (!isPreviewMode) {
      await endConversation(finalMood);
    } else {
      // In preview mode, just reset conversation state
      if (conversationId) {
        // No DB operations in preview mode
      }
    }

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
          <Alert className="mb-6 border-[hsl(var(--coral-accent))] bg-[hsl(var(--coral-pink))] rounded-2xl">
            <PlayCircle className="h-5 w-5 text-[hsl(var(--coral-accent))]" />
            <AlertDescription className="text-foreground">
              <strong>Preview Mode:</strong> You are experiencing the employee survey exactly as employees will see it.
              No data will be saved during this preview.
            </AlertDescription>
          </Alert>
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

          {step === "mood" && (
            <MoodDial onMoodSelect={handleMoodSelect} />
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

          {step === "closing" && conversationId && (
            <ClosingRitual
              initialMood={mood}
              conversationId={conversationId}
              onComplete={handleSurveyComplete}
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
                  : "Your feedback has been recorded. Explore the tabs below to see how we're acting on employee feedback."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
