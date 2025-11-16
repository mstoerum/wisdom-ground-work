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
  const startConversation = useCallback(async (surveyId: string, initialMood: number | null, linkId?: string) => {
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
        // Check for existing session in localStorage
        const storageKey = `public_survey_session_${effectiveLinkId}`;
        const existingSessionId = localStorage.getItem(storageKey);
        
        if (existingSessionId) {
          // Check if session still exists and is active
          const { data: existingSession, error: checkError } = await supabase
            .from("conversation_sessions")
            .select("id, status")
            .eq("id", existingSessionId)
            .eq("public_link_id", effectiveLinkId)
            .single();
          
          if (!checkError && existingSession && existingSession.status === "active") {
            // Resume existing session
            setConversationId(existingSession.id);
            setIsActive(true);
            return existingSession.id;
          } else {
            // Session doesn't exist or is completed, clear localStorage
            localStorage.removeItem(storageKey);
          }
        }
        
        // Basic rate limiting check (client-side, using localStorage)
        // Note: Proper rate limiting should be done server-side with IP tracking
        const rateLimitKey = `public_link_rate_${effectiveLinkId}`;
        const rateLimitData = localStorage.getItem(rateLimitKey);
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        
        if (rateLimitData) {
          const { count, timestamp } = JSON.parse(rateLimitData);
          if (now - timestamp < oneHour) {
            if (count >= 10) { // Max 10 sessions per hour per browser
              toast({
                title: "Rate Limit Exceeded",
                description: "You've created too many sessions. Please wait before trying again.",
                variant: "destructive",
              });
              throw new Error("Rate limit exceeded. Please wait before creating a new session.");
            }
            // Update count
            localStorage.setItem(rateLimitKey, JSON.stringify({ count: count + 1, timestamp }));
          } else {
            // Reset counter for new hour
            localStorage.setItem(rateLimitKey, JSON.stringify({ count: 1, timestamp: now }));
          }
        } else {
          // First time, create counter
          localStorage.setItem(rateLimitKey, JSON.stringify({ count: 1, timestamp: now }));
        }
        
        // Create new anonymous conversation session for public link
        const { data: session, error: sessionError } = await supabase
          .from("conversation_sessions")
          .insert({
            employee_id: null, // Anonymous user
            anonymous_token_id: null, // No anonymous token needed for public links
            survey_id: surveyId,
            public_link_id: effectiveLinkId,
            initial_mood: initialMood ?? null,
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
        
        // Store session ID in localStorage for public links
        if (effectiveLinkId) {
          localStorage.setItem(`public_survey_session_${effectiveLinkId}`, session.id);
        }
        
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
      
      // Store session ID in localStorage for public links
      if (effectiveLinkId) {
        localStorage.setItem(`public_survey_session_${effectiveLinkId}`, session.id);
      }

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
  const endConversation = useCallback(async (finalMood?: number | null) => {
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
          final_mood: finalMood ?? null,
          ended_at: new Date().toISOString(),
        })
        .eq("id", conversationId);

      // Clear localStorage for public links
      if (publicLinkId) {
        localStorage.removeItem(`public_survey_session_${publicLinkId}`);
      }

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
  }, [conversationId, toast, isPreviewMode, publicLinkId]);

  return {
    conversationId,
    isActive,
    startConversation,
    endConversation,
  };
};
