import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { soundEffects } from "@/utils/soundEffects";
import { Message, StructuredSummary } from "./useChatMessages";

interface UseChatAPIOptions {
  conversationId: string;
  isPreviewMode: boolean;
  previewSurveyData?: any;
  publicLinkId?: string;
  messages: Message[];
  input: string;
  isLoading: boolean;
  finishEarlyStep: string;
  themeCoverage: { percentage: number };
  setIsLoading: (loading: boolean) => void;
  addMessage: (message: Message) => void;
  addMessages: (messages: Message[]) => void;
  removeLastMessage: () => void;
  clearInput: () => void;
  setInput: (input: string) => void;
  setIsInCompletionPhase: (phase: boolean) => void;
  setStructuredSummary?: (summary: StructuredSummary | null) => void;
  onComplete: () => void;
}

// Helper function to check if a conversation is a public link session
const checkIsPublicLinkSession = async (conversationId: string): Promise<boolean> => {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data: conversationSession } = await supabase
      .from("conversation_sessions")
      .select("public_link_id")
      .eq("id", conversationId)
      .maybeSingle();
    
    return conversationSession?.public_link_id !== null && conversationSession?.public_link_id !== undefined;
  } catch (error) {
    console.error("Error checking public link session:", error);
    return false;
  }
};

// Helper function to get session token
const getSessionForConversation = async (
  conversationId: string, 
  isPreviewMode: boolean,
  publicLinkId?: string
): Promise<{ access_token: string } | null> => {
  if (isPreviewMode || publicLinkId) {
    console.log(publicLinkId ? "Public link conversation - allowing anonymous access" : "Preview mode - skipping auth");
    return null;
  }
  
  const isPublicLink = await checkIsPublicLinkSession(conversationId);
  
  if (isPublicLink) {
    console.log("Public link conversation detected - allowing anonymous access");
    return null;
  }
  
  const { supabase } = await import("@/integrations/supabase/client");
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("Authentication required for non-public link conversations");
  }
  
  return session;
};

/**
 * Hook for managing chat API communication
 * Handles sending messages, transcription, and completion flows
 */
export const useChatAPI = (options: UseChatAPIOptions) => {
  const { toast } = useToast();
  const {
    conversationId,
    isPreviewMode,
    previewSurveyData,
    publicLinkId,
    messages,
    input,
    isLoading,
    finishEarlyStep,
    themeCoverage,
    setIsLoading,
    addMessage,
    addMessages,
    removeLastMessage,
    clearInput,
    setInput,
    setIsInCompletionPhase,
    setStructuredSummary,
    onComplete,
  } = options;

  // Trigger AI introduction when chat is empty
  const triggerIntroduction = useCallback(async () => {
    if (messages.length > 0 || isLoading || !conversationId) return;

    setIsLoading(true);
    console.log('Spradley is preparing introduction...');
    
    try {
      if (isPreviewMode && !previewSurveyData) {
        console.warn("Preview mode but no survey data available - using fallback");
        const fallbackMessage = "Hello! Thank you for taking the time to share your feedback with us.";
        addMessage({
          role: "assistant",
          content: fallbackMessage,
          timestamp: new Date()
        });
        setIsLoading(false);
        return;
      }
      
      let session = null;
      if (!isPreviewMode) {
        try {
          session = await getSessionForConversation(conversationId, isPreviewMode, publicLinkId);
        } catch (error) {
          console.error("Error getting session for introduction:", error);
          session = null;
        }
      }

      if (!conversationId) {
        const errorMsg = isPreviewMode 
          ? "Conversation ID is missing. Please try refreshing the preview."
          : "Conversation ID is missing. Please try reloading the page.";
        throw new Error(errorMsg);
      }

      const requestBody: any = {
        conversationId,
        messages: [{ role: "user", content: "[START_CONVERSATION]" }],
        testMode: isPreviewMode,
      };

      if (isPreviewMode && previewSurveyData) {
        requestBody.themes = previewSurveyData.themes || undefined;
        requestBody.firstMessage = previewSurveyData.first_message || undefined;
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
        const errorText = await response.text().catch(() => "Unknown error");
        console.error("Chat API error:", response.status, errorText);
        throw new Error(`Failed to get introduction: ${response.status}`);
      }

      const responseData = await response.json().catch((err) => {
        console.error("Failed to parse response:", err);
        throw new Error("Invalid response from server");
      });

      if (!responseData || !responseData.message) {
        throw new Error("Invalid response format from server");
      }

      addMessage({
        role: "assistant",
        content: responseData.message,
        timestamp: new Date()
      });
      soundEffects.playSuccess();
    } catch (error: any) {
      console.error("Error getting AI introduction:", error);
      
      const fallbackMessage = isPreviewMode && previewSurveyData?.first_message 
        ? previewSurveyData.first_message
        : "Hi! I'm Spradley, your AI guide. How can I help you today?";
      
      addMessage({
        role: "assistant",
        content: fallbackMessage,
        timestamp: new Date()
      });
      
      if (isPreviewMode) {
        toast({
          title: "Preview Mode: Using Fallback",
          description: "The chat API is unavailable. Showing preview with default message.",
          variant: "default",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages.length, isLoading, conversationId, isPreviewMode, previewSurveyData, publicLinkId, setIsLoading, addMessage, toast]);

  // Send message to AI
  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    if (!conversationId) {
      toast({
        title: "Error",
        description: "Conversation session is invalid. Please try reloading.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date()
    };

    addMessage(userMessage);
    const currentInput = input;
    clearInput();
    setIsLoading(true);

    try {
      let session = null;
      if (!isPreviewMode) {
        try {
          session = await getSessionForConversation(conversationId, isPreviewMode, publicLinkId);
        } catch (error) {
          console.log("Session retrieval error:", error);
          session = null;
        }
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            conversationId,
            messages: [...messages, userMessage].map(m => ({
              role: m.role,
              content: m.content
            })),
            isCompletionConfirmation: finishEarlyStep === "final-question",
            testMode: isPreviewMode,
            themes: isPreviewMode ? previewSurveyData?.themes : undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get response");
      }

      const data = await response.json();
      
      // Debug logging for completion flow
      console.log("[useChatAPI] Backend response:", {
        messagePreview: data.message?.substring(0, 50),
        shouldComplete: data.shouldComplete,
        isCompletionPrompt: data.isCompletionPrompt,
        hasStructuredSummary: !!data.structuredSummary,
        keyPointsCount: data.structuredSummary?.keyPoints?.length
      });
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (!data || !data.message) {
        throw new Error("Invalid response from server - no message content");
      }
      
      // Handle completion prompt - ALWAYS show receipt, never chat bubble
      if (data.isCompletionPrompt) {
        console.log("[useChatAPI] Completion prompt received - ensuring receipt shows");
        
        // Ensure we always have a valid structured summary
        let summary = data.structuredSummary;
        
        if (!summary || !summary.keyPoints || summary.keyPoints.length === 0) {
          console.warn("[useChatAPI] Missing/invalid structuredSummary - generating fallback");
          const userMessages = messages.filter(m => m.role === "user").slice(-3);
          summary = {
            keyPoints: userMessages.length > 0 
              ? userMessages.map(m => m.content.length > 60 ? m.content.substring(0, 60) + "..." : m.content)
              : ["Your feedback has been recorded"],
            sentiment: "mixed"
          };
        }
        
        if (setStructuredSummary) {
          setStructuredSummary(summary);
        }
        // CRITICAL: Never add message as chat bubble - receipt will always show
        setIsInCompletionPhase(true);
        setIsLoading(false);
        return;
      }

      // Handle final completion with structured summary
      if (data.shouldComplete && (data.showSummary || data.isCompletionPrompt)) {
        // If we have a structured summary, show the receipt
        if (data.structuredSummary && setStructuredSummary) {
          console.log("[useChatAPI] Completion with structured summary:", data.structuredSummary);
          setStructuredSummary(data.structuredSummary);
          setIsInCompletionPhase(true);
          setIsLoading(false);
          return;
        }
        
        // Fallback: Generate summary from messages if backend didn't provide one
        console.warn("[useChatAPI] Completion without structuredSummary - generating fallback");
        const userMessages = messages.filter(m => m.role === "user").slice(-3);
        const fallbackSummary = {
          keyPoints: userMessages.length > 0 
            ? userMessages.map(m => m.content.length > 60 ? m.content.substring(0, 60) + "..." : m.content)
            : ["Thank you for sharing your feedback"],
          sentiment: "mixed" as const
        };
        
        if (setStructuredSummary) {
          setStructuredSummary(fallbackSummary);
          setIsInCompletionPhase(true);
          setIsLoading(false);
          return;
        }
        
        // Last resort fallback - show message and complete
        addMessage({
          role: "assistant",
          content: data.message,
          timestamp: new Date()
        });
        
        setTimeout(() => {
          onComplete();
        }, 2000);
        setIsLoading(false);
        return;
      }
      
      // Regular message
      addMessage({
        role: "assistant",
        content: data.message,
        timestamp: new Date()
      });

      // Handle shouldComplete without showSummary (edge case) - show receipt, don't auto-complete
      if (data.shouldComplete) {
        console.log("[useChatAPI] shouldComplete detected - entering completion phase");
        // Generate fallback summary
        const userMessages = messages.filter(m => m.role === "user").slice(-3);
        const fallbackSummary = {
          keyPoints: userMessages.length > 0 
            ? userMessages.map(m => m.content.length > 60 ? m.content.substring(0, 60) + "..." : m.content)
            : ["Thank you for sharing your feedback"],
          sentiment: "mixed" as const
        };
        
        if (setStructuredSummary) {
          setStructuredSummary(fallbackSummary);
          setIsInCompletionPhase(true);
        } else {
          // Only auto-complete if we can't show the receipt
          setTimeout(onComplete, 2000);
        }
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      
      const errorMessage = error?.message?.includes("Authentication")
        ? (publicLinkId ? "Connection error. Please refresh the page and try again." : "Authentication required. Please sign in to continue.")
        : (error instanceof Error ? error.message : "An error occurred. Please try again.");
      
      toast({
        title: "Message failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      removeLastMessage();
      setInput(currentInput);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, conversationId, messages, isPreviewMode, previewSurveyData, publicLinkId, finishEarlyStep, setIsLoading, addMessage, clearInput, setInput, removeLastMessage, setIsInCompletionPhase, onComplete, toast]);

  // Handle final response in finish early flow
  const handleFinalResponse = useCallback(async (finalInput: string) => {
    // When called with empty input (from Submit Feedback button),
    // the SummaryReceipt is already visible - just complete immediately
    if (!finalInput.trim()) {
      // Mark conversation as complete in database if needed
      if (!isPreviewMode && conversationId) {
        try {
          const { supabase } = await import("@/integrations/supabase/client");
          await supabase
            .from("conversation_sessions")
            .update({ status: "completed", ended_at: new Date().toISOString() })
            .eq("id", conversationId);
        } catch (error) {
          console.error("Error marking conversation complete:", error);
        }
      }
      onComplete();
      return;
    }

    if (!conversationId) {
      toast({
        title: "Error",
        description: "Conversation session is invalid. Please try reloading.",
        variant: "destructive",
      });
      return;
    }

    if (isLoading) {
      console.warn("Operation already in progress, skipping final response");
      return;
    }

    setIsLoading(true);
    try {
      let authSession = null;
      if (!isPreviewMode) {
        try {
          authSession = await getSessionForConversation(conversationId, isPreviewMode);
        } catch (error) {
          console.error("Error getting session for final response:", error);
          toast({
            title: "Error",
            description: "Authentication required. Please sign in to continue.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authSession ? { Authorization: `Bearer ${authSession.access_token}` } : {}),
          },
          body: JSON.stringify({
            conversationId,
            messages: [
              ...messages.map(m => ({ role: m.role, content: m.content })),
              { role: "user", content: finalInput },
            ],
            isFinalResponse: true,
            testMode: isPreviewMode,
            themes: isPreviewMode ? previewSurveyData?.themes : undefined,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send final response");
      }

      const data = await response.json();
      const aiResponse = data?.message || "Thank you for your response.";
      
      console.log("[useChatAPI] handleFinalResponse received:", {
        hasStructuredSummary: !!data.structuredSummary,
        isCompletionPrompt: data.isCompletionPrompt,
        shouldComplete: data.shouldComplete,
        keyPointsCount: data.structuredSummary?.keyPoints?.length
      });
      
      addMessages([
        { role: "user", content: finalInput, timestamp: new Date() },
        { role: "assistant", content: aiResponse, timestamp: new Date() },
      ]);

      // If backend returns structured summary and completion prompt, enter completion phase
      if (data.isCompletionPrompt && data.structuredSummary) {
        console.log("[useChatAPI] Entering completion phase with structured summary");
        setStructuredSummary(data.structuredSummary);
        setIsInCompletionPhase(true);
        // DO NOT auto-complete - let user review and click Submit
        return;
      }

      // Fallback: auto-complete after delay if no structured summary
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (error) {
      console.error("Error sending final response:", error);
      toast({
        title: "Error",
        description: "Failed to send response. Completing survey anyway.",
        variant: "destructive",
      });
      setTimeout(() => {
        onComplete();
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, messages, isPreviewMode, previewSurveyData, toast, onComplete, isLoading, setIsLoading, addMessages, setStructuredSummary, setIsInCompletionPhase]);

  // Handle finish early confirmation
  const handleConfirmFinishEarly = useCallback(async () => {
    if (!conversationId) {
      toast({
        title: "Error",
        description: "Conversation session is invalid. Cannot finish early.",
        variant: "destructive",
      });
      return;
    }

    if (isLoading) {
      console.warn("Operation already in progress, skipping finish early");
      return;
    }

    try {
      let authSession = null;
      if (!isPreviewMode) {
        try {
          authSession = await getSessionForConversation(conversationId, isPreviewMode);
        } catch (error) {
          console.error("Error getting session for finish early:", error);
          toast({
            title: "Error",
            description: "Authentication required. Please sign in to continue.",
            variant: "destructive",
          });
          return;
        }
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authSession ? { Authorization: `Bearer ${authSession.access_token}` } : {}),
          },
          body: JSON.stringify({
            conversationId,
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            finishEarly: true,
            themeCoverage: themeCoverage.percentage,
            testMode: isPreviewMode,
            themes: isPreviewMode ? previewSurveyData?.themes : undefined,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get summary");
      }

      const responseData = await response.json();
      
      if (!responseData) {
        throw new Error("Empty response from server");
      }
      
      const summaryMessage = responseData.message || "Thank you for your responses so far.";
      
      // Add the summary message to chat
      addMessage({
        role: "assistant",
        content: summaryMessage,
        timestamp: new Date(),
      });

      // If we have a structured summary and isCompletionPrompt, enter completion phase
      if (responseData.isCompletionPrompt && responseData.structuredSummary) {
        console.log("[useChatAPI] Finish early - entering completion phase with structured summary");
        setStructuredSummary(responseData.structuredSummary);
        setIsInCompletionPhase(true);
      } else if (responseData.finalQuestion) {
        // Legacy flow: show final question if no structured summary
        setTimeout(() => {
          addMessage({
            role: "assistant",
            content: responseData.finalQuestion,
            timestamp: new Date(),
          });
        }, 1500);
      }
    } catch (error) {
      console.error("Error finishing early:", error);
      toast({
        title: "Error",
        description: "Failed to generate summary. Please try again.",
        variant: "destructive",
      });
    }
  }, [conversationId, messages, themeCoverage, isPreviewMode, previewSurveyData, toast, isLoading, addMessage, setIsInCompletionPhase, setStructuredSummary]);

  // Transcribe audio
  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];

        try {
          const session = await getSessionForConversation(conversationId, isPreviewMode, publicLinkId);
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

          if (!response.ok) throw new Error("Transcription failed");

          const { text } = await response.json();
          
          soundEffects.playSuccess();
          setInput(text);
          
          // Auto-send after brief delay
          setTimeout(() => {
            sendMessage();
          }, 500);
        } catch (error) {
          console.error("Error in transcription:", error);
          setIsLoading(false);
          soundEffects.playError();
          
          const errorMessage = error instanceof Error && error.message.includes("Authentication") 
            ? (publicLinkId ? "Unable to connect. Please refresh the page and try again." : "Authentication required. Please sign in to continue.")
            : "Please try again or type your message";
            
          toast({
            title: "Transcription failed",
            description: errorMessage,
            variant: "destructive",
          });
        }
      };
    } catch (error) {
      soundEffects.playError();
      toast({
        title: "Transcription failed",
        description: "Please try again or type your message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, isPreviewMode, publicLinkId, setIsLoading, setInput, sendMessage, toast]);

  return {
    triggerIntroduction,
    sendMessage,
    handleFinalResponse,
    handleConfirmFinishEarly,
    transcribeAudio,
  };
};
