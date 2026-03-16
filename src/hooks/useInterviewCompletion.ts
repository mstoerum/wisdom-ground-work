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
   * Confirm finish early - skip reviewing, go straight to complete
   */
  const handleConfirmFinishEarly = useCallback(async (_messages: Message[]) => {
    setFinishDialogOpen(false);
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
      console.error("Error finishing early:", error);
      // Complete anyway - don't block user
      setPhase('complete');
      onComplete();
    } finally {
      setIsProcessing(false);
    }
  }, [conversationId, isPreviewMode, onComplete]);

  /**
   * Backend signals completion - skip reviewing, go straight to complete
   */
  const enterCompletionDirectly = useCallback(async () => {
    setIsProcessing(true);
    try {
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
      setPhase('complete');
      onComplete();
    } finally {
      setIsProcessing(false);
    }
  }, [conversationId, isPreviewMode, onComplete]);

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
    handleComplete,
    enterCompletionDirectly,
  };
};
