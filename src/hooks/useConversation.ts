import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * Custom hook for managing employee feedback conversation sessions
 * Handles conversation lifecycle: start, end, and state management
 */
export const useConversation = () => {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const { toast } = useToast();

  /**
   * Start a new conversation session with anonymization
   * Creates or reuses anonymous token and initializes session
   */
  const startConversation = useCallback(async (surveyId: string, initialMood: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get or create anonymous token for privacy
      const anonymousTokenId = await getOrCreateAnonymousToken(user.id, surveyId);

      // Create conversation session
      const { data: session, error: sessionError } = await supabase
        .from("conversation_sessions")
        .insert({
          employee_id: user.id,
          anonymous_token_id: anonymousTokenId,
          survey_id: surveyId,
          initial_mood: initialMood,
          status: "active",
          consent_given: true,
          consent_timestamp: new Date().toISOString(),
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      setConversationId(session.id);
      setIsActive(true);

      return session.id;
    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast({
        title: "Error",
        description: "Failed to start conversation. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  /**
   * Get existing or create new anonymous token
   * Ensures employee identity is protected in survey responses
   */
  const getOrCreateAnonymousToken = async (employeeId: string, surveyId: string): Promise<string> => {
    const { data: tokenData } = await supabase
      .from("anonymous_tokens")
      .select("id")
      .eq("employee_id", employeeId)
      .eq("survey_id", surveyId)
      .maybeSingle();

    if (tokenData?.id) return tokenData.id;

    const tokenHash = crypto.randomUUID();
    const { data: newToken, error } = await supabase
      .from("anonymous_tokens")
      .insert({
        employee_id: employeeId,
        survey_id: surveyId,
        token_hash: tokenHash,
      })
      .select()
      .single();

    if (error) throw error;
    return newToken.id;
  };

  /**
   * End active conversation session
   * Records final mood and marks session as completed
   */
  const endConversation = useCallback(async (finalMood?: number) => {
    if (!conversationId) return;

    try {
      await supabase
        .from("conversation_sessions")
        .update({
          status: "completed",
          final_mood: finalMood,
          ended_at: new Date().toISOString(),
        })
        .eq("id", conversationId);

      setIsActive(false);
      setConversationId(null);
    } catch (error) {
      console.error("Failed to end conversation:", error);
      toast({
        title: "Error",
        description: "Failed to save session. Please try again.",
        variant: "destructive",
      });
    }
  }, [conversationId, toast]);

  return {
    conversationId,
    isActive,
    startConversation,
    endConversation,
  };
};
