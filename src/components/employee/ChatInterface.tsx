import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConversationBubble } from "./ConversationBubble";
import { Send, Loader2, Save } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RitualIntroduction } from "@/components/trust/RitualIntroduction";
import { AnonymizationRitual } from "@/components/trust/AnonymizationRitual";
import { TrustIndicators } from "@/components/trust/TrustIndicators";
import { CulturalContext, detectCulturalContext } from "@/lib/culturalAdaptation";
import { trackTrustMetrics } from "@/lib/trustAnalytics";
import { usePreviewMode } from "@/contexts/PreviewModeContext";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  conversationId: string;
  onComplete: () => void;
  onSaveAndExit: () => void;
  showTrustFlow?: boolean;
}

// Constants
const ESTIMATED_TOTAL_QUESTIONS = 8;
const PROGRESS_COMPLETE_THRESHOLD = 100;

type TrustFlowStep = "introduction" | "anonymization" | "chat" | "complete";

export const ChatInterface = ({ conversationId, onComplete, onSaveAndExit, showTrustFlow = true }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [trustFlowStep, setTrustFlowStep] = useState<TrustFlowStep>("introduction");
  const [sessionId, setSessionId] = useState<string>("");
  const [culturalContext, setCulturalContext] = useState<CulturalContext | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { isPreviewMode } = usePreviewMode();

  // Initialize cultural context
  useEffect(() => {
    if (showTrustFlow) {
      const context = detectCulturalContext();
      setCulturalContext(context);
      trackTrustMetrics('session_started', {
        culturalContext: context.region,
        sessionId: conversationId
      });
    } else {
      setTrustFlowStep("chat");
    }
  }, [showTrustFlow, conversationId]);

  // Track trust indicators being viewed
  useEffect(() => {
    if (sessionId) {
      trackTrustMetrics('trust_indicators_viewed', {
        sessionId,
        culturalContext: culturalContext?.region
      });
    }
  }, [sessionId, culturalContext]);

  // Trust flow handlers
  const handleRitualIntroductionComplete = () => {
    trackTrustMetrics('ritual_introduction_completed', {
      culturalContext: culturalContext?.region,
      sessionId: conversationId
    });
    setTrustFlowStep("anonymization");
  };

  const handleAnonymizationComplete = (newSessionId: string) => {
    trackTrustMetrics('anonymization_completed', {
      sessionId: newSessionId,
      culturalContext: culturalContext?.region
    });
    setSessionId(newSessionId);
    setTrustFlowStep("chat");
  };

  // Load conversation history on mount
  const loadConversation = useCallback(async () => {
    // Fetch existing responses
    const { data: existingResponses } = await supabase
      .from("responses")
      .select("content, ai_response, created_at")
      .eq("conversation_session_id", conversationId)
      .order("created_at", { ascending: true });

    // Fetch first message from survey
    const { data: session } = await supabase
      .from("conversation_sessions")
      .select("surveys(first_message)")
      .eq("id", conversationId)
      .single();

    const greeting: Message = {
      role: "assistant",
      content: session?.surveys?.first_message || "Hi! I'm here to listen. How are you feeling about work today?",
      timestamp: new Date()
    };

    // Reconstruct message history if resuming
    if (existingResponses && existingResponses.length > 0) {
      const history = existingResponses.flatMap(r => [
        { role: "user" as const, content: r.content, timestamp: new Date(r.created_at) },
        { role: "assistant" as const, content: r.ai_response || "", timestamp: new Date(r.created_at) }
      ]);
      setMessages([greeting, ...history]);
    } else {
      setMessages([greeting]);
    }
  }, [conversationId]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message to AI
  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Please sign in to continue");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            conversationId,
            messages: [...messages, userMessage].map(m => ({
              role: m.role,
              content: m.content
            })),
            testMode: isPreviewMode, // Flag for preview mode to prevent data persistence
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get response");
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      const assistantMessage: Message = {
        role: "assistant",
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Auto-complete conversation after sufficient exchanges
      if (data.shouldComplete) {
        setTimeout(onComplete, 2000);
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Message failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      
      // Restore state on error
      setMessages(prev => prev.slice(0, -1));
      setInput(currentInput);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, conversationId, messages, onComplete, toast]);

  // Handle Enter key to send message
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Save and exit conversation
  const handleSaveAndExit = useCallback(() => {
    toast({
      title: "Progress saved",
      description: "You can resume this conversation anytime.",
    });
    setTimeout(onSaveAndExit, 1000);
  }, [onSaveAndExit, toast]);

  // Calculate conversation progress
  const userMessageCount = messages.filter(m => m.role === "user").length;
  const progressPercent = Math.min((userMessageCount / ESTIMATED_TOTAL_QUESTIONS) * 100, PROGRESS_COMPLETE_THRESHOLD);

  // Show trust flow if enabled and not in chat step
  if (showTrustFlow && trustFlowStep !== "chat") {
    if (trustFlowStep === "introduction") {
      return (
        <RitualIntroduction 
          onComplete={handleRitualIntroductionComplete}
          culturalContext={culturalContext || undefined}
        />
      );
    }
    
    if (trustFlowStep === "anonymization") {
      return (
        <AnonymizationRitual 
          onComplete={handleAnonymizationComplete}
        />
      );
    }
  }

  return (
    <div className="flex flex-col h-[600px] bg-card rounded-lg border border-border/50">
      {/* Trust Indicators */}
      {sessionId && (
        <TrustIndicators sessionId={sessionId} />
      )}
      
      {/* Progress Indicator */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {userMessageCount > 0 && userMessageCount < ESTIMATED_TOTAL_QUESTIONS && `Question ${userMessageCount} of ~${ESTIMATED_TOTAL_QUESTIONS}`}
              {userMessageCount >= 6 && userMessageCount < ESTIMATED_TOTAL_QUESTIONS && " • Almost done!"}
              {userMessageCount >= ESTIMATED_TOTAL_QUESTIONS && "Wrapping up..."}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{Math.round(progressPercent)}%</span>
            <Button
              onClick={handleSaveAndExit}
              variant="ghost"
              size="sm"
              className="h-7"
            >
              <Save className="h-3 w-3 mr-1" />
              Save & Exit
            </Button>
          </div>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
      </div>
      
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <ConversationBubble
              key={index}
              message={message.content}
              isUser={message.role === "user"}
              timestamp={message.timestamp}
            />
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border/50">
        {/* Suggested Prompts - Show only when input is empty and no messages yet */}
        {input === "" && userMessageCount === 0 && (
          <div className="mb-3 p-3 bg-muted/30 rounded-lg border border-border/30">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <span>💬</span> Not sure where to start? Try:
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "I've been feeling...",
                "What's been challenging is...",
                "I'd like to talk about...",
                "Something on my mind lately..."
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(prompt)}
                  className="text-xs px-2 py-1 bg-background hover:bg-muted rounded border border-border/50 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Share your thoughts..."
            className="min-h-[60px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-[60px] w-[60px]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
