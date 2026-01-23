import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { InterviewContext } from "@/utils/evaluationQuestions";

interface EvaluationMessage {
  role: "user" | "assistant";
  content: string;
}

interface LLMFollowUpResponse {
  empathy: string;
  probeQuestion: string | null;
  shouldProbeDeeper: boolean;
  detectedSentiment?: string;
  keyInsight?: string;
}

interface UseEvaluationLLMProps {
  surveyId: string;
  conversationSessionId: string;
  interviewContext: InterviewContext;
  quickRating: number | null;
}

/**
 * Hook for LLM-powered evaluation follow-up questions
 * Generates contextual probing questions based on user responses
 */
export function useEvaluationLLM({
  surveyId,
  conversationSessionId,
  interviewContext,
  quickRating,
}: UseEvaluationLLMProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingProbe, setPendingProbe] = useState<string | null>(null);
  const conversationHistoryRef = useRef<EvaluationMessage[]>([]);
  const insightsCollectedRef = useRef<Array<{ dimensionId: string; insight: string }>>([]);

  /**
   * Generate LLM follow-up based on user's answer
   */
  const generateFollowUp = useCallback(async (
    dimensionId: string,
    dimensionName: string,
    userAnswer: string,
    previousAnswers: Record<string, string>
  ): Promise<LLMFollowUpResponse> => {
    setIsGenerating(true);
    
    try {
      // Get auth token if available
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      // Add user's answer to conversation history
      conversationHistoryRef.current.push({
        role: "user",
        content: userAnswer,
      });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evaluate-spradley`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            action: "generate_followup",
            surveyId,
            conversationSessionId,
            currentDimensionId: dimensionId,
            currentDimensionName: dimensionName,
            userAnswer,
            previousAnswers,
            interviewContext,
            quickRating,
            conversationHistory: conversationHistoryRef.current,
          }),
        }
      );

      if (!response.ok) {
        console.warn("Failed to generate LLM follow-up, using fallback");
        return getSimpleFallback(userAnswer);
      }

      const data = await response.json();
      
      if (!data.success) {
        console.warn("LLM follow-up failed:", data.error);
        return getSimpleFallback(userAnswer);
      }

      // Add assistant's response to history
      if (data.empathy) {
        conversationHistoryRef.current.push({
          role: "assistant",
          content: data.probeQuestion 
            ? `${data.empathy} ${data.probeQuestion}`
            : data.empathy,
        });
      }

      // Store insight for analytics
      if (data.keyInsight) {
        insightsCollectedRef.current.push({
          dimensionId,
          insight: data.keyInsight,
        });
      }

      // Set pending probe for the component to handle
      if (data.probeQuestion) {
        setPendingProbe(data.probeQuestion);
      } else {
        setPendingProbe(null);
      }

      return {
        empathy: data.empathy || "Thanks for sharing.",
        probeQuestion: data.probeQuestion || null,
        shouldProbeDeeper: data.shouldProbeDeeper || false,
        detectedSentiment: data.detectedSentiment,
        keyInsight: data.keyInsight,
      };

    } catch (error) {
      console.error("Error generating LLM follow-up:", error);
      return getSimpleFallback(userAnswer);
    } finally {
      setIsGenerating(false);
    }
  }, [surveyId, conversationSessionId, interviewContext, quickRating]);

  /**
   * Record probe answer (doesn't generate new follow-up)
   */
  const recordProbeAnswer = useCallback((answer: string) => {
    conversationHistoryRef.current.push({
      role: "user",
      content: answer,
    });
    setPendingProbe(null);
  }, []);

  /**
   * Get collected insights for saving
   */
  const getCollectedInsights = useCallback(() => {
    return insightsCollectedRef.current;
  }, []);

  /**
   * Clear pending probe (user skipped it)
   */
  const clearPendingProbe = useCallback(() => {
    setPendingProbe(null);
  }, []);

  return {
    generateFollowUp,
    recordProbeAnswer,
    getCollectedInsights,
    clearPendingProbe,
    isGenerating,
    pendingProbe,
  };
}

/**
 * Simple fallback when LLM isn't available
 */
function getSimpleFallback(answer: string): LLMFollowUpResponse {
  const lower = answer.toLowerCase();
  
  const positiveWords = ["good", "great", "easy", "natural", "helpful", "better", "love", "nice"];
  const negativeWords = ["hard", "difficult", "confusing", "bad", "worse", "awkward"];
  
  const hasPositive = positiveWords.some(w => lower.includes(w));
  const hasNegative = negativeWords.some(w => lower.includes(w));
  
  let empathy = "Thanks for sharing.";
  let sentiment: "positive" | "neutral" | "negative" = "neutral";
  
  if (hasPositive && !hasNegative) {
    empathy = ["Glad to hear that!", "That's great feedback.", "Thanks for sharing that."][Math.floor(Math.random() * 3)];
    sentiment = "positive";
  } else if (hasNegative) {
    empathy = ["Thanks for being honest.", "I appreciate the candid feedback.", "That's helpful to know."][Math.floor(Math.random() * 3)];
    sentiment = "negative";
  }
  
  return {
    empathy,
    probeQuestion: null,
    shouldProbeDeeper: false,
    detectedSentiment: sentiment,
  };
}
