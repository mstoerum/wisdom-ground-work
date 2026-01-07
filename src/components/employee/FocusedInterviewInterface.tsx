import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "./QuestionCard";
import { AnswerInput } from "./AnswerInput";
import { ThemeJourneyPath } from "./ThemeJourneyPath";
import { useToast } from "@/hooks/use-toast";
import { usePreviewMode } from "@/contexts/PreviewModeContext";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle } from "lucide-react";
import { FinishEarlyConfirmationDialog } from "./FinishEarlyConfirmationDialog";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ThemeProgress {
  themes: Array<{ id: string; name: string; discussed: boolean; current: boolean }>;
  coveragePercent: number;
  discussedCount: number;
  totalCount: number;
}

interface FocusedInterviewInterfaceProps {
  conversationId: string;
  onComplete: () => void;
  onSaveAndExit: () => void;
  publicLinkId?: string;
  minimalUI?: boolean;
}

export const FocusedInterviewInterface = ({
  conversationId,
  onComplete,
  onSaveAndExit,
  publicLinkId,
  minimalUI = false,
}: FocusedInterviewInterfaceProps) => {
  const { toast } = useToast();
  const { isPreviewMode, previewSurveyData } = usePreviewMode();
  
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [questionNumber, setQuestionNumber] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [themeProgress, setThemeProgress] = useState<ThemeProgress | null>(null);

  // Get session for authenticated requests
  const getSession = useCallback(async () => {
    if (isPreviewMode || publicLinkId) return null;
    
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }, [isPreviewMode, publicLinkId]);

  // Initialize with first question from AI
  useEffect(() => {
    if (isInitialized || !conversationId) return;
    
    const initializeInterview = async () => {
      setIsLoading(true);
      setIsInitialized(true);
      
      try {
        const session = await getSession();
        
        const requestBody: any = {
          conversationId,
          messages: [{ role: "user", content: "[START_CONVERSATION]" }],
          testMode: isPreviewMode,
        };

        if (isPreviewMode && previewSurveyData) {
          requestBody.themes = previewSurveyData.themes;
          requestBody.firstMessage = previewSurveyData.first_message;
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
            },
            body: JSON.stringify(requestBody),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to initialize interview");
        }

        const data = await response.json();
        const introMessage = data.message || "How have things been feeling at work lately?";
        
        // Set theme progress if available
        if (data.themeProgress) {
          setThemeProgress(data.themeProgress);
        }
        
        setCurrentQuestion(introMessage);
        setConversationHistory([{ role: "assistant", content: introMessage }]);
      } catch (error) {
        console.error("Error initializing interview:", error);
        // Fallback question
        const fallback = "How have things been feeling at work lately?";
        setCurrentQuestion(fallback);
        setConversationHistory([{ role: "assistant", content: fallback }]);
        
        if (!isPreviewMode) {
          toast({
            title: "Connection issue",
            description: "Using default question. Your responses will still be saved.",
            variant: "default",
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeInterview();
  }, [conversationId, isInitialized, isPreviewMode, previewSurveyData, getSession, toast]);

  // Submit answer and get next question
  const handleSubmit = useCallback(async () => {
    if (!currentAnswer.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: currentAnswer.trim() };
    const updatedHistory = [...conversationHistory, userMessage];
    
    setConversationHistory(updatedHistory);
    setCurrentAnswer("");
    setIsLoading(true);

    try {
      const session = await getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            conversationId,
            messages: updatedHistory.map(m => ({ role: m.role, content: m.content })),
            testMode: isPreviewMode,
            themes: isPreviewMode ? previewSurveyData?.themes : undefined,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      // Update theme progress if available
      if (data.themeProgress) {
        setThemeProgress(data.themeProgress);
      }

      // Handle completion
      if (data.shouldComplete || data.isCompletionPrompt) {
        setCurrentQuestion(data.message);
        setConversationHistory([...updatedHistory, { role: "assistant", content: data.message }]);
        
        if (data.shouldComplete && data.showSummary) {
          setTimeout(onComplete, 2500);
        }
        return;
      }

      // Normal flow - show next question
      const nextQuestion = data.message;
      setCurrentQuestion(nextQuestion);
      setConversationHistory([...updatedHistory, { role: "assistant", content: nextQuestion }]);
      setQuestionNumber(prev => prev + 1);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send your response. Please try again.",
        variant: "destructive",
      });
      // Restore the answer so user can retry
      setCurrentAnswer(userMessage.content);
    } finally {
      setIsLoading(false);
    }
  }, [currentAnswer, isLoading, conversationHistory, conversationId, isPreviewMode, previewSurveyData, getSession, onComplete, toast]);

  // Handle audio transcription
  const handleTranscribe = useCallback(async (audioBlob: Blob) => {
    setIsTranscribing(true);
    
    try {
      const session = await getSession();
      
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
            },
            body: JSON.stringify({ audio: base64Audio }),
          }
        );

        if (!response.ok) {
          throw new Error("Transcription failed");
        }

        const data = await response.json();
        if (data.text) {
          setCurrentAnswer(prev => prev + (prev ? " " : "") + data.text);
        }
        setIsTranscribing(false);
      };
    } catch (error) {
      console.error("Transcription error:", error);
      toast({
        title: "Transcription failed",
        description: "Please try again or type your response",
        variant: "destructive",
      });
      setIsTranscribing(false);
    }
  }, [getSession, toast]);

  // Handle finish early
  const handleFinishEarly = useCallback(async () => {
    setShowFinishDialog(false);
    setIsLoading(true);
    
    try {
      const session = await getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            conversationId,
            messages: conversationHistory.map(m => ({ role: m.role, content: m.content })),
            finishEarly: true,
            testMode: isPreviewMode,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to finish");
      }

      const data = await response.json();
      setCurrentQuestion(data.message || "Thank you for sharing your thoughts today.");
      
      setTimeout(onComplete, 2500);
    } catch (error) {
      console.error("Error finishing early:", error);
      onComplete();
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, conversationHistory, isPreviewMode, getSession, onComplete]);

  return (
    <div className="min-h-[70vh] flex flex-col">
      {/* Header with actions */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border/30">
        {/* Mobile progress indicator */}
        <div className="md:hidden text-sm text-muted-foreground">
          {themeProgress && (
            <span>Topic {themeProgress.discussedCount + 1} of {themeProgress.totalCount}</span>
          )}
        </div>
        
        {!minimalUI && (
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFinishDialog(true)}
              disabled={isLoading || questionNumber < 1}
              className="text-muted-foreground hover:text-foreground"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Finish Early
            </Button>
          </div>
        )}
      </div>

      {/* Main content area with side panel */}
      <div className="flex-1 flex">
        {/* Side panel with journey path - hidden on mobile */}
        {themeProgress && themeProgress.themes.length > 0 && (
          <motion.aside
            className="hidden md:flex flex-col w-[240px] border-r border-border/30 p-4 bg-muted/20"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Your Journey</h3>
            <ThemeJourneyPath
              themes={themeProgress.themes}
              coveragePercent={themeProgress.coveragePercent}
              className="flex-1"
            />
          </motion.aside>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-8">
          <QuestionCard
            question={currentQuestion}
            questionNumber={questionNumber}
            isLoading={isLoading && !currentQuestion}
          />

          <AnswerInput
            value={currentAnswer}
            onChange={setCurrentAnswer}
            onSubmit={handleSubmit}
            onTranscribe={handleTranscribe}
            isLoading={isLoading || isTranscribing}
            placeholder="Share your thoughts..."
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Footer hint */}
      <div className="text-center pb-6">
        <p className="text-xs text-muted-foreground">
          Press Enter to continue • Your responses are anonymous
        </p>
      </div>

      {/* Finish Early Dialog */}
      <FinishEarlyConfirmationDialog
        open={showFinishDialog}
        themeCoverage={{ 
          discussed: themeProgress?.discussedCount || questionNumber, 
          total: themeProgress?.totalCount || 6, 
          percentage: themeProgress?.coveragePercent || (questionNumber / 6) * 100 
        }}
        exchangeCount={questionNumber}
        minExchanges={3}
        onConfirm={handleFinishEarly}
        onCancel={() => setShowFinishDialog(false)}
      />
    </div>
  );
};
