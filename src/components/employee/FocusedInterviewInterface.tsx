import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AIResponseDisplay } from "./AIResponseDisplay";
import { AmbientArc } from "./AmbientArc";
import { InteractiveInputRouter, type InputType, type InputConfig } from "./inputs/InteractiveInputRouter";
import { MoodSelector } from "./MoodSelector";
import { MoodTransition } from "./MoodTransition";
import { SummaryReceipt } from "./SummaryReceipt";
import { useToast } from "@/hooks/use-toast";
import { usePreviewMode } from "@/contexts/PreviewModeContext";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle } from "lucide-react";
import { FinishEarlyConfirmationDialog } from "./FinishEarlyConfirmationDialog";
import { DurationSelector } from "./DurationSelector";
import { useInterviewCompletion } from "@/hooks/useInterviewCompletion";
import type { Message, ThemeProgress } from "@/types/interview";

interface FocusedInterviewInterfaceProps {
  conversationId: string;
  onComplete: () => void;
  onSaveAndExit: () => void;
  publicLinkId?: string;
  minimalUI?: boolean;
  surveyType?: 'employee_satisfaction' | 'course_evaluation';
  chatEngine?: 'standard' | 'adaptive';
}

export const FocusedInterviewInterface = ({
  conversationId,
  onComplete,
  onSaveAndExit,
  publicLinkId,
  minimalUI = false,
  surveyType = 'employee_satisfaction',
  chatEngine = 'standard',
}: FocusedInterviewInterfaceProps) => {
  const { toast } = useToast();
  const { isPreviewMode, previewSurveyData } = usePreviewMode();
  
  // Use the shared completion hook
  const {
    isActive,
    isReviewing,
    structuredSummary,
    themeProgress: hookThemeProgress,
    isFinishDialogOpen,
    isProcessing,
    handleFinishEarlyClick,
    handleCancelFinishEarly,
    handleConfirmFinishEarly,
    handleAddMore,
    handleComplete,
    enterReviewingPhase,
    updateThemeProgress,
  } = useInterviewCompletion({
    conversationId,
    isPreviewMode,
    previewSurveyData,
    publicLinkId,
    onComplete,
  });
  
  // Mood was already selected in WelcomeScreen, so skip mood selector unless minimalUI (demo mode)
  const [showMoodSelector, setShowMoodSelector] = useState(true);
  const [showMoodTransition, setShowMoodTransition] = useState(false);
  const [transitionMood, setTransitionMood] = useState<number>(3);
  const [isApiReady, setIsApiReady] = useState(false);
  const [initialMood, setInitialMood] = useState<number | null>(null);
  
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentEmpathy, setCurrentEmpathy] = useState<string | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [questionNumber, setQuestionNumber] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  // Voice transcription disabled - kept for future re-enablement
  // const [isTranscribing, setIsTranscribing] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [showDurationSelector, setShowDurationSelector] = useState(false);
  const [currentInputType, setCurrentInputType] = useState<InputType>("text");
  const [currentInputConfig, setCurrentInputConfig] = useState<InputConfig | undefined>(undefined);
  
  // Determine which backend function to call
  const chatFunctionName = chatEngine === 'adaptive' ? 'chat-v2' : 'chat';
  
  // Local theme progress for initial transitions - sync with hook
  const [localThemeProgress, setLocalThemeProgress] = useState<ThemeProgress | null>(null);
  const [conversationStartTime] = useState(() => new Date());
  
  // Use hook's themeProgress if available, otherwise local
  const themeProgress = hookThemeProgress || localThemeProgress;
  
  // Track if API call has completed during transition
  const pendingQuestionRef = useRef<{ question: string; empathy: string | null; history: Message[]; themeProgress: ThemeProgress | null } | null>(null);

  // Get session for authenticated requests
  const getSession = useCallback(async () => {
    if (isPreviewMode || publicLinkId) return null;
    
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }, [isPreviewMode, publicLinkId]);

  // Initialize conversation API call (runs in background during transition)
  const initializeConversation = useCallback(async (mood: number) => {
    try {
      const session = await getSession();
      
      const requestBody: any = {
        conversationId,
        messages: [{ role: "user", content: "[START_CONVERSATION]" }],
        testMode: isPreviewMode,
        initialMood: mood,
      };

      if (isPreviewMode && previewSurveyData) {
        requestBody.themes = previewSurveyData.themes;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${chatFunctionName}`,
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
      
      // Handle duration_selection phase from chat-v2
      if (data.phase === 'duration_selection') {
        setShowDurationSelector(true);
        setIsApiReady(true);
        return;
      }
      
      // Safety check: clean any JSON artifacts from the message
      let introMessage = data.message || "How have things been feeling at work lately?";
      if (introMessage.includes('{"') || introMessage.includes('"question"')) {
        const questionMatch = introMessage.match(/"question"\s*:\s*"([^"]+)/);
        if (questionMatch && questionMatch[1]) {
          introMessage = questionMatch[1].replace(/["\}]+$/, '').trim();
        }
      }
      
      // Store the result for when transition completes
      pendingQuestionRef.current = {
        question: introMessage,
        empathy: data.empathy || null,
        history: [{ role: "assistant", content: introMessage }],
        themeProgress: data.themeProgress || null
      };
      setIsApiReady(true);
    } catch (error) {
      console.error("Error initializing interview:", error);
      // Fallback question based on mood
      const fallbackQuestions: Record<number, string> = {
        1: "I hear that. What's been the biggest challenge this week?",
        2: "Thanks for being honest. What's been weighing on you?",
        3: "Got it. Is there anything that could make things better right now?",
        4: "Nice! What's been going well for you lately?",
        5: "Love to hear it! What's making things feel good right now?"
      };
      const fallback = fallbackQuestions[mood] || "How have things been feeling at work lately?";
      
      pendingQuestionRef.current = {
        question: fallback,
        empathy: null,
        history: [{ role: "assistant", content: fallback }],
        themeProgress: null
      };
      setIsApiReady(true);
      
      if (!isPreviewMode) {
        toast({
          title: "Connection issue",
          description: "Using default question. Your responses will still be saved.",
          variant: "default",
        });
      }
    }
  }, [conversationId, isPreviewMode, previewSurveyData, getSession, toast, chatFunctionName]);

  // Handle duration selection (for adaptive/chat-v2 engine)
  const handleDurationSelect = useCallback(async (minutes: number) => {
    setShowDurationSelector(false);
    setShowMoodTransition(true);
    
    try {
      const session = await getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${chatFunctionName}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            conversationId,
            messages: [{ role: "user", content: `[DURATION_SELECTED:${minutes}]` }],
            selectedDuration: minutes,
            testMode: isPreviewMode,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to set duration");
      
      const data = await response.json();
      
      let introMessage = data.message || "Great! Let's get started.";
      
      pendingQuestionRef.current = {
        question: introMessage,
        empathy: data.empathy || null,
        history: [{ role: "assistant", content: introMessage }],
        themeProgress: data.themeProgress || null,
      };
      setIsApiReady(true);
    } catch (error) {
      console.error("Error setting duration:", error);
      pendingQuestionRef.current = {
        question: "Let's get started! How have things been going?",
        empathy: null,
        history: [{ role: "assistant", content: "Let's get started! How have things been going?" }],
        themeProgress: null,
      };
      setIsApiReady(true);
    }
  }, [conversationId, isPreviewMode, getSession, chatFunctionName]);
  

  // Handle mood selection - show transition and start API call in parallel
  const handleMoodSelect = useCallback(async (mood: number) => {
    setInitialMood(mood);
    setTransitionMood(mood);
    setShowMoodSelector(false);
    setShowMoodTransition(true);
    setIsInitialized(true);
    
    // Start API call in background while showing transition
    initializeConversation(mood);
  }, [initializeConversation]);

  // Handle transition completion - apply the pending question
  const handleTransitionComplete = useCallback(() => {
    setShowMoodTransition(false);
    
    if (pendingQuestionRef.current) {
      setCurrentQuestion(pendingQuestionRef.current.question);
      setCurrentEmpathy(pendingQuestionRef.current.empathy);
      setConversationHistory(pendingQuestionRef.current.history);
      if (pendingQuestionRef.current.themeProgress) {
        setLocalThemeProgress(pendingQuestionRef.current.themeProgress);
        updateThemeProgress(pendingQuestionRef.current.themeProgress);
      }
      pendingQuestionRef.current = null;
    }
  }, [updateThemeProgress]);

  // Auto-initialize removed: MoodSelector now always shows first

  // Submit answer and get next question — accepts an optional override for interactive inputs
  const handleSubmit = useCallback(async (interactiveValue?: string) => {
    const content = interactiveValue || currentAnswer.trim();
    if (!content || isLoading) return;

    const userMessage: Message = { role: "user", content };
    const updatedHistory = [...conversationHistory, userMessage];
    
    // Immediately start transitioning out the current question
    setIsTransitioning(true);
    setIsTypingComplete(false);
    setConversationHistory(updatedHistory);
    setCurrentAnswer("");
    setCurrentInputType("text");
    setCurrentInputConfig(undefined);
    setIsLoading(true);
    
    // Quick fade-out, then show loading dots
    setTimeout(() => {
      setCurrentQuestion("");
      setCurrentEmpathy(null);
    }, 150);

    try {
      const session = await getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${chatFunctionName}`,
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

      // Safety check: clean any JSON artifacts from the message
      let messageText = data.message || "";
      if (messageText.includes('{"') || messageText.includes('"question"') || messageText.includes('"empathy"')) {
        console.warn("Received JSON artifacts in message, cleaning...");
        const questionMatch = messageText.match(/"question"\s*:\s*"([^"]+)/);
        if (questionMatch && questionMatch[1]) {
          messageText = questionMatch[1].replace(/["\}]+$/, '').trim();
        } else {
          messageText = messageText.replace(/\{[^}]*\}/g, '').replace(/"[^"]+"\s*:\s*/g, '').trim();
        }
        if (!messageText || messageText.length < 10 || messageText.includes('{')) {
          messageText = "Thank you for sharing. Could you tell me more about that?";
        }
      }

      // Update theme progress if available
      if (data.themeProgress) {
        setLocalThemeProgress(data.themeProgress);
        updateThemeProgress(data.themeProgress);
      }

      // Extract interactive input type if signaled by backend
      if (data.inputType && data.inputType !== "text") {
        setCurrentInputType(data.inputType as InputType);
        setCurrentInputConfig(data.inputConfig || undefined);
      } else {
        setCurrentInputType("text");
        setCurrentInputConfig(undefined);
      }

      // Handle completion - use hook's enterReviewingPhase
      if (data.shouldComplete || data.isCompletionPrompt) {
        setCurrentQuestion(messageText);
        setCurrentEmpathy(data.empathy || null);
        setConversationHistory([...updatedHistory, { role: "assistant", content: messageText }]);
        
        // Enter reviewing phase via hook
        enterReviewingPhase(data.structuredSummary || null, [...updatedHistory, { role: "assistant", content: messageText }]);
        return;
      }

      // Normal flow - show next question with empathy
      setCurrentQuestion(messageText);
      setCurrentEmpathy(data.empathy || null);
      setConversationHistory([...updatedHistory, { role: "assistant", content: messageText }]);
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
      setIsTransitioning(false);
    }
  }, [currentAnswer, isLoading, conversationHistory, conversationId, isPreviewMode, previewSurveyData, getSession, toast, updateThemeProgress, enterReviewingPhase, chatFunctionName]);

  // Voice transcription disabled - kept for future re-enablement
  // const handleTranscribe = useCallback(async (audioBlob: Blob) => { ... }, [getSession, toast]);

  // Show duration selector (for adaptive/chat-v2 engine)
  if (showDurationSelector) {
    return <DurationSelector onSelect={handleDurationSelect} />;
  }

  // Show mood selector first (only in minimalUI/demo mode)
  if (showMoodSelector) {
    return (
      <div className="min-h-[70vh] flex flex-col">
        <MoodSelector onMoodSelect={handleMoodSelect} />
      </div>
    );
  }

  // Show mood transition (acknowledgment screen)
  if (showMoodTransition) {
    return (
      <MoodTransition
        mood={transitionMood}
        onComplete={handleTransitionComplete}
        isApiReady={isApiReady}
      />
    );
  }

  return (
    <div className="min-h-[70vh] flex flex-col">
      {/* Header with actions */}
      <div className="flex items-center justify-end px-4 py-4 border-b border-border/30">
        {!minimalUI && isActive && (
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFinishEarlyClick}
              disabled={isLoading || questionNumber < 1}
              className="text-muted-foreground hover:text-foreground"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Finish Early
            </Button>
          </div>
        )}
      </div>

      {/* Main content area — full width */}
      <div className="flex-1 flex">
        {/* Completion Phase - Show Enhanced Receipt with inline buttons */}
        {isReviewing && structuredSummary && (
          <motion.div 
            className="flex-1 flex flex-col items-center justify-center px-6 py-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <SummaryReceipt
              conversationId={conversationId}
              structuredSummary={structuredSummary}
              responseCount={questionNumber}
              startTime={conversationStartTime}
              showCompletionFlow={true}
              surveyType={surveyType}
              onComplete={handleComplete}
              onAddMore={handleAddMore}
              isLoading={isLoading || isProcessing}
            />
          </motion.div>
        )}

        {/* Main content - hidden during completion phase */}
        {isActive && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-8 relative">
            {/* Apple-inspired progress arc */}
            <div className="absolute top-0 left-0 right-0">
              <AmbientArc themeProgress={themeProgress} questionNumber={questionNumber} />
            </div>

            <AIResponseDisplay
              empathy={currentEmpathy || undefined}
              question={currentQuestion}
              isLoading={isLoading && !currentQuestion}
              isTransitioning={isTransitioning}
              onTypingComplete={() => setIsTypingComplete(true)}
            />

            <InteractiveInputRouter
              inputType={currentInputType}
              inputConfig={currentInputConfig}
              value={currentAnswer}
              onChange={setCurrentAnswer}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              placeholder="Share your thoughts..."
              disabled={isLoading || !isTypingComplete}
            />
          </div>
        )}
      </div>

      {/* Footer hint - hidden during completion phase */}
      {isActive && (
        <div className="text-center pb-6">
          <p className="text-xs text-muted-foreground">
            Press Enter to continue • Your responses are anonymous
          </p>
        </div>
      )}

      {/* Finish Early Dialog - uses hook's state and handlers */}
      <FinishEarlyConfirmationDialog
        open={isFinishDialogOpen}
        themeCoverage={{ 
          discussed: themeProgress?.discussedCount || questionNumber, 
          total: themeProgress?.totalCount || 6, 
          percentage: themeProgress?.coveragePercent || (questionNumber / 6) * 100 
        }}
        exchangeCount={questionNumber}
        minExchanges={3}
        onConfirm={() => handleConfirmFinishEarly(conversationHistory)}
        onCancel={handleCancelFinishEarly}
      />
    </div>
  );
};
