import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConversationBubble } from "./ConversationBubble";
import { Send, Loader2, Save, Heart, Brain, Shield, Lightbulb } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  emotionalTone?: string;
  urgencyLevel?: string;
}

interface EnhancedChatInterfaceProps {
  conversationId: string;
  onComplete: () => void;
  onSaveAndExit: () => void;
}

// Don Norman Design Principles Implementation
const ESTIMATED_TOTAL_QUESTIONS = 8;
const PROGRESS_COMPLETE_THRESHOLD = 100;

export const EnhancedChatInterface = ({ conversationId, onComplete, onSaveAndExit }: EnhancedChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emotionalState, setEmotionalState] = useState<{
    tone: string;
    confidence: number;
    trend: 'improving' | 'stable' | 'declining';
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load conversation history with enhanced emotional context
  const loadConversation = useCallback(async () => {
    const { data: existingResponses } = await supabase
      .from("responses")
      .select("content, ai_response, created_at, ai_analysis")
      .eq("conversation_session_id", conversationId)
      .order("created_at", { ascending: true });

    const { data: session } = await supabase
      .from("conversation_sessions")
      .select("surveys(first_message)")
      .eq("id", conversationId)
      .single();

    const greeting: Message = {
      role: "assistant",
      content: session?.surveys?.first_message || "Hi! I'm Spradley, and I'm here to listen. How are you feeling about work today?",
      timestamp: new Date()
    };

    if (existingResponses && existingResponses.length > 0) {
      const history = existingResponses.flatMap(r => [
        { 
          role: "user" as const, 
          content: r.content, 
          timestamp: new Date(r.created_at),
          emotionalTone: r.ai_analysis?.emotionalTone,
          urgencyLevel: r.ai_analysis?.urgencyLevel
        },
        { 
          role: "assistant" as const, 
          content: r.ai_response || "", 
          timestamp: new Date(r.created_at)
        }
      ]);
      setMessages([greeting, ...history]);
      
      // Analyze emotional state from recent messages
      const recentTones = existingResponses
        .slice(-3)
        .map(r => r.ai_analysis?.emotionalTone)
        .filter(Boolean);
      
      if (recentTones.length > 0) {
        const toneCounts = recentTones.reduce((acc, tone) => {
          acc[tone] = (acc[tone] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const dominantTone = Object.entries(toneCounts)
          .sort((a, b) => b[1] - a[1])[0][0];
        
        setEmotionalState({
          tone: dominantTone,
          confidence: Math.round((toneCounts[dominantTone] / recentTones.length) * 100),
          trend: 'stable' // Could be enhanced with historical analysis
        });
      }
    } else {
      setMessages([greeting]);
    }
  }, [conversationId]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  // Auto-scroll with smooth behavior
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Enhanced message sending with emotional intelligence
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
            }))
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

      // Update emotional state based on response
      if (data.emotionalTone) {
        setEmotionalState(prev => ({
          tone: data.emotionalTone,
          confidence: 85, // High confidence from AI analysis
          trend: prev?.trend || 'stable'
        }));
      }

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
      
      setMessages(prev => prev.slice(0, -1));
      setInput(currentInput);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, conversationId, messages, onComplete, toast]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSaveAndExit = useCallback(() => {
    toast({
      title: "Progress saved",
      description: "You can resume this conversation anytime.",
    });
    setTimeout(onSaveAndExit, 1000);
  }, [onSaveAndExit, toast]);

  // Calculate conversation progress with enhanced metrics
  const userMessageCount = messages.filter(m => m.role === "user").length;
  const progressPercent = Math.min((userMessageCount / ESTIMATED_TOTAL_QUESTIONS) * 100, PROGRESS_COMPLETE_THRESHOLD);
  
  // Don Norman's Affordance Design: Clear visual cues for interaction
  const getProgressColor = () => {
    if (progressPercent < 30) return "bg-blue-500";
    if (progressPercent < 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getEmotionalStateColor = () => {
    if (!emotionalState) return "bg-gray-100";
    const tone = emotionalState.tone;
    if (tone === 'excited' || tone === 'satisfied' || tone === 'grateful') return "bg-green-100";
    if (tone === 'frustrated' || tone === 'overwhelmed' || tone === 'discouraged') return "bg-red-100";
    return "bg-blue-100";
  };

  const getEmotionalStateIcon = () => {
    if (!emotionalState) return <MessageSquare className="h-4 w-4" />;
    const tone = emotionalState.tone;
    if (tone === 'excited' || tone === 'satisfied' || tone === 'grateful') return <Heart className="h-4 w-4 text-green-600" />;
    if (tone === 'frustrated' || tone === 'overwhelmed' || tone === 'discouraged') return <AlertTriangle className="h-4 w-4 text-red-600" />;
    return <Brain className="h-4 w-4 text-blue-600" />;
  };

  return (
    <div className="flex flex-col h-[700px] bg-card rounded-lg border border-border/50 shadow-lg">
      {/* Enhanced Header with Emotional Intelligence */}
      <div className="p-4 border-b border-border/50 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Spradley</span>
            </div>
            {emotionalState && (
              <Badge variant="outline" className={`${getEmotionalStateColor()} border-0`}>
                <div className="flex items-center space-x-1">
                  {getEmotionalStateIcon()}
                  <span className="text-xs capitalize">{emotionalState.tone}</span>
                </div>
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
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
        
        {/* Enhanced Progress Bar with Visual Affordances */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {userMessageCount > 0 && userMessageCount < ESTIMATED_TOTAL_QUESTIONS && `Question ${userMessageCount} of ~${ESTIMATED_TOTAL_QUESTIONS}`}
              {userMessageCount >= 6 && userMessageCount < ESTIMATED_TOTAL_QUESTIONS && " • Almost done!"}
              {userMessageCount >= ESTIMATED_TOTAL_QUESTIONS && "Wrapping up..."}
            </span>
            <span className="text-xs">
              {progressPercent < 30 ? "Getting started" : 
               progressPercent < 70 ? "Making progress" : 
               "Almost there"}
            </span>
          </div>
          <Progress 
            value={progressPercent} 
            className={`h-2 ${getProgressColor()}`}
          />
        </div>
      </div>
      
      {/* Enhanced Message Area with Better Visual Hierarchy */}
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div key={index} className="space-y-2">
              <ConversationBubble
                message={message.content}
                isUser={message.role === "user"}
                timestamp={message.timestamp}
              />
              {message.emotionalTone && message.role === "user" && (
                <div className="flex justify-end">
                  <Badge variant="outline" className="text-xs">
                    <Brain className="h-3 w-3 mr-1" />
                    {message.emotionalTone}
                  </Badge>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-4 flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Spradley is thinking...</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Enhanced Input Area with Better Affordances */}
      <div className="p-4 border-t border-border/50 bg-gray-50/50">
        <div className="space-y-3">
          {/* Contextual Hints Based on Progress */}
          {progressPercent < 30 && (
            <Alert className="py-2">
              <Lightbulb className="h-4 w-4" />
              <AlertDescription className="text-xs">
                This is a safe space. Share as much or as little as you're comfortable with.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                progressPercent < 30 ? "Share your thoughts about work..." :
                progressPercent < 70 ? "Tell me more about your experience..." :
                "Is there anything else you'd like to share?"
              }
              className="min-h-[60px] resize-none border-2 focus:border-blue-500 transition-colors"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-[60px] w-[60px] bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Visual Cue for Input State */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {input.length > 0 ? `${input.length} characters` : "Type your message above"}
            </span>
            <span>
              Press Enter to send, Shift+Enter for new line
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};