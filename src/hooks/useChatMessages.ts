import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface StructuredSummary {
  keyPoints: string[];
  sentiment: "positive" | "mixed" | "negative";
}

interface UseChatMessagesOptions {
  conversationId: string;
  onAutoScroll?: () => void;
}

/**
 * Hook for managing chat message state
 * Handles message list, input, loading states, and message history
 */
export const useChatMessages = ({ conversationId, onAutoScroll }: UseChatMessagesOptions) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInCompletionPhase, setIsInCompletionPhase] = useState(false);
  const [structuredSummary, setStructuredSummary] = useState<StructuredSummary | null>(null);
  const [conversationStartTime] = useState<Date>(new Date());

  // Load conversation history on mount
  const loadConversation = useCallback(async () => {
    const { data: existingResponses } = await supabase
      .from("responses")
      .select("content, ai_response, created_at")
      .eq("conversation_session_id", conversationId)
      .order("created_at", { ascending: true });

    if (existingResponses && existingResponses.length > 0) {
      const history = existingResponses.flatMap(r => [
        { role: "user" as const, content: r.content, timestamp: new Date(r.created_at) },
        { role: "assistant" as const, content: r.ai_response || "", timestamp: new Date(r.created_at) }
      ]);
      setMessages(history);
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  // Auto-scroll when messages change
  useEffect(() => {
    if (onAutoScroll) {
      onAutoScroll();
    }
  }, [messages, onAutoScroll]);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const addMessages = useCallback((newMessages: Message[]) => {
    setMessages(prev => [...prev, ...newMessages]);
  }, []);

  const removeLastMessage = useCallback(() => {
    setMessages(prev => prev.slice(0, -1));
  }, []);

  const clearInput = useCallback(() => {
    setInput("");
  }, []);

  const userMessageCount = messages.filter(m => m.role === "user").length;

  return {
    messages,
    setMessages,
    input,
    setInput,
    clearInput,
    isLoading,
    setIsLoading,
    isInCompletionPhase,
    setIsInCompletionPhase,
    structuredSummary,
    setStructuredSummary,
    conversationStartTime,
    addMessage,
    addMessages,
    removeLastMessage,
    userMessageCount,
  };
};
