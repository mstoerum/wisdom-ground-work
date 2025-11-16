import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePreviewMode } from "@/contexts/PreviewModeContext";

/**
 * Custom hook for managing employee feedback conversation sessions
 * Handles conversation lifecycle: start, end, and state management
 * Supports both authenticated users and anonymous public link users
 */
export const useConversation = (publicLinkId?: string) => {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const { toast } = useToast();
  const { isPreviewMode } = usePreviewMode();

  /**
   * Start a new conversation session with anonymization
   * Creates or reuses anonymous token and initializes session
   * In preview mode, generates a mock conversation ID without database operations
   * Supports anonymous public link users (no authentication required)
   */
  const startConversation = useCallback(async (surveyId: string, initialMood: number, linkId?: string) => {
    try {
      // In preview mode, generate a mock conversation ID without DB operations
      if (isPreviewMode) {
        console.log('Starting preview conversation with ID:', surveyId);
        const mockId = `preview-${surveyId}-${Date.now()}`;
        setConversationId(mockId);
        setIsActive(true);
        console.log('Preview conversation started:', mockId);
        return mockId;
      }

      const { data: { user } } = await supabase.auth.getUser();
      const isPublicLink = !!linkId || !!publicLinkId;
      const effectiveLinkId = linkId || publicLinkId;

      // For public links, allow anonymous access
      if (isPublicLink && !user) {
        // Create anonymous conversation session for public link
        const { data: session, error: sessionError } = await supabase
          .from("conversation_sessions")
          .insert({
            employee_id: null, // Anonymous user
            anonymous_token_id: null, // No anonymous token needed for public links
            survey_id: surveyId,
            public_link_id: effectiveLinkId,
            initial_mood: initialMood,
            status: "active",
            consent_given: true,
            consent_timestamp: new Date().toISOString(),
          })
          .select()
          .single();

        if (sessionError) {
          console.error("Session creation error:", sessionError);
          throw sessionError;
        }

        // Increment response counter for public link
        if (effectiveLinkId) {
          try {
            const { error: incrementError } = await supabase.rpc('increment_link_responses', {
              link_id: effectiveLinkId
            });
            if (incrementError) {
              console.error("Failed to increment response count:", incrementError);
              // Don't fail the whole operation if counter increment fails
            }
          } catch (counterError) {
            console.error("Counter increment error:", counterError);
          }
        }

        setConversationId(session.id);
        setIsActive(true);
        return session.id;
      }

      // For authenticated users
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
          public_link_id: effectiveLinkId || null,
          initial_mood: initialMood,
          status: "active",
          consent_given: true,
          consent_timestamp: new Date().toISOString(),
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Increment response counter if this is a public link
      if (effectiveLinkId) {
        try {
          const { error: incrementError } = await supabase.rpc('increment_link_responses', {
            link_id: effectiveLinkId
          });
          if (incrementError) {
            console.error("Failed to increment response count:", incrementError);
          }
        } catch (counterError) {
          console.error("Counter increment error:", counterError);
        }
      }

      setConversationId(session.id);
      setIsActive(true);

      return session.id;
    } catch (error) {
      console.error("Failed to start conversation:", error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to start conversation. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes("Not authenticated")) {
          errorMessage = "Authentication required. Please sign in and try again.";
        } else if (error.message.includes("RLS")) {
          errorMessage = "Permission denied. Please contact your administrator.";
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  }, [toast, isPreviewMode, publicLinkId]);

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
   * In preview mode, just resets local state without DB operations
   */
  const endConversation = useCallback(async (finalMood?: number) => {
    if (!conversationId) return;

    // In preview mode, just reset state without DB operations
    if (isPreviewMode) {
      setIsActive(false);
      setConversationId(null);
      return;
    }

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
  }, [conversationId, toast, isPreviewMode]);

  return {
    conversationId,
    isActive,
    startConversation,
    endConversation,
  };
};
