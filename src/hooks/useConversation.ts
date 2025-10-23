import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useConversation = () => {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const { toast } = useToast();

  const startConversation = useCallback(async (surveyId: string, initialMood: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get or create anonymous token
      const { data: tokenData } = await supabase
        .from("anonymous_tokens")
        .select("id")
        .eq("employee_id", user.id)
        .eq("survey_id", surveyId)
        .maybeSingle();

      let anonymousTokenId = tokenData?.id;

      if (!anonymousTokenId) {
        const tokenHash = crypto.randomUUID();
        const { data: newToken, error: createError } = await supabase
          .from("anonymous_tokens")
          .insert({
            employee_id: user.id,
            survey_id: surveyId,
            token_hash: tokenHash,
          })
          .select()
          .single();

        if (createError) throw createError;
        anonymousTokenId = newToken.id;
      }

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
