import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { 
  InterviewPhase, 
  StructuredSummary, 
  ThemeProgress, 
  ThemeCoverage,
  Message 
} from "@/types/interview";

interface UseInterviewCompletionOptions {
  conversationId: string;
  isPreviewMode: boolean;
  previewSurveyData?: any;
  publicLinkId?: string;
  onComplete: () => void;
}

/**
 * Shared hook for managing interview completion flow
 * Used by both ChatInterface and FocusedInterviewInterface
 * 
 * State machine: active -> reviewing -> complete
 */
export const useInterviewCompletion = ({
  conversationId,
  isPreviewMode,
  previewSurveyData,
  publicLinkId,
  onComplete,
}: UseInterviewCompletionOptions) => {
  const { toast } = useToast();
  
  // Simplified phase: active, reviewing, or complete
  const [phase, setPhase] = useState<InterviewPhase>('active');
  
  // Summary data for review phase
  const [structuredSummary, setStructuredSummary] = useState<StructuredSummary | null>(null);
  
  // Theme progress from backend
  const [themeProgress, setThemeProgress] = useState<ThemeProgress | null>(null);
  
  // Dialog state for finish early confirmation
  const [isFinishDialogOpen, setFinishDialogOpen] = useState(false);
  
  // Loading state for API calls
  const [isProcessing, setIsProcessing] = useState(false);

  // Derive theme coverage for UI from themeProgress
  const themeCoverage: ThemeCoverage = {
    discussed: themeProgress?.discussedCount ?? 0,
    total: themeProgress?.totalCount ?? 0,
    percentage: themeProgress?.coveragePercent ?? 0,
  };

  /**
   * Get session for authenticated requests
   */
  const getSession = useCallback(async () => {
    if (isPreviewMode || publicLinkId) return null;
    
    // Check if this is a public link conversation
    const { data: conversationSession } = await supabase
      .from("conversation_sessions")
      .select("public_link_id")
      .eq("id", conversationId)
      .maybeSingle();
    
    if (conversationSession?.public_link_id) return null;
    
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }, [isPreviewMode, publicLinkId, conversationId]);

  /**
   * Open finish early confirmation dialog
   */
  const handleFinishEarlyClick = useCallback(() => {
    setFinishDialogOpen(true);
  }, []);

  /**
   * Cancel finish early - close dialog and stay in active phase
   */
  const handleCancelFinishEarly = useCallback(() => {
    setFinishDialogOpen(false);
  }, []);

  /**
   * Confirm finish early - call API and enter reviewing phase
   */
  const handleConfirmFinishEarly = useCallback(async (messages: Message[]) => {
    setFinishDialogOpen(false);
    setIsProcessing(true);

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
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            finishEarly: true,
            testMode: isPreviewMode,
            themes: isPreviewMode ? previewSurveyData?.themes : undefined,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }

      const data = await response.json();
      
      // Update theme progress if returned
      if (data.themeProgress) {
        setThemeProgress(data.themeProgress);
      }
      
      // Set structured summary and enter reviewing phase
      if (data.structuredSummary) {
        setStructuredSummary(data.structuredSummary);
      } else {
        // Generate fallback summary from messages
        const userMessages = messages.filter(m => m.role === "user").slice(-3);
        setStructuredSummary({
          opening: "Thank you for taking the time to share your thoughts today.",
          keyPoints: userMessages.map(m => 
            m.content.length > 100 ? m.content.substring(0, 97) + "..." : m.content
          ),
          sentiment: "mixed"
        });
      }
      
      setPhase('reviewing');
    } catch (error) {
      console.error("Error finishing early:", error);
      toast({
        title: "Error",
        description: "Failed to generate summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [conversationId, isPreviewMode, previewSurveyData, getSession, toast]);

  /**
   * Enter reviewing phase when backend signals completion
   */
  const enterReviewingPhase = useCallback((summary: StructuredSummary | null, messages: Message[]) => {
    if (summary) {
      setStructuredSummary(summary);
    } else {
      // Generate fallback from messages
      const userMessages = messages.filter(m => m.role === "user").slice(-3);
      setStructuredSummary({
        opening: "Thank you for taking the time to share your thoughts today.",
        keyPoints: userMessages.map(m => 
          m.content.length > 100 ? m.content.substring(0, 97) + "..." : m.content
        ),
        sentiment: "mixed"
      });
    }
    setPhase('reviewing');
  }, []);

  /**
   * User clicked "Add More" - return to active phase
   */
  const handleAddMore = useCallback(() => {
    setPhase('active');
    setStructuredSummary(null);
    toast({
      title: "Continue sharing",
      description: "You can add more feedback below",
    });
  }, [toast]);

  /**
   * User clicked "Complete" - finalize and call onComplete
   */
  const handleComplete = useCallback(async () => {
    setIsProcessing(true);
    
    try {
      // Mark conversation as complete in database
      if (!isPreviewMode && conversationId) {
        await supabase
          .from("conversation_sessions")
          .update({ status: "completed", ended_at: new Date().toISOString() })
          .eq("id", conversationId);
      }
      
      setPhase('complete');
      onComplete();
    } catch (error) {
      console.error("Error completing interview:", error);
      // Complete anyway - don't block user
      setPhase('complete');
      onComplete();
    } finally {
      setIsProcessing(false);
    }
  }, [conversationId, isPreviewMode, onComplete]);

  /**
   * Update theme progress from API response
   */
  const updateThemeProgress = useCallback((progress: ThemeProgress) => {
    setThemeProgress(progress);
  }, []);

  /**
   * Check if we're in an active conversation state
   */
  const isActive = phase === 'active';
  
  /**
   * Check if we're showing the review/summary phase
   */
  const isReviewing = phase === 'reviewing';
  
  /**
   * Check if the interview is complete
   */
  const isComplete = phase === 'complete';

  return {
    // Phase state
    phase,
    isActive,
    isReviewing,
    isComplete,
    
    // Summary data
    structuredSummary,
    
    // Theme progress (single source of truth from backend)
    themeProgress,
    themeCoverage,
    updateThemeProgress,
    
    // Dialog state
    isFinishDialogOpen,
    
    // Loading state
    isProcessing,
    
    // Actions
    handleFinishEarlyClick,
    handleCancelFinishEarly,
    handleConfirmFinishEarly,
    handleAddMore,
    handleComplete,
    enterReviewingPhase,
  };
};
