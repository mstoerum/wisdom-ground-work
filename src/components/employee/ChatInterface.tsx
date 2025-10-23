import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConversationBubble } from "./ConversationBubble";
import { Send, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  conversationId: string;
  onComplete: () => void;
}

export const ChatInterface = ({ conversationId, onComplete }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadConversation = async () => {
      // Load existing messages first
      const { data: existingResponses } = await supabase
        .from("responses")
        .select("content, ai_response, created_at")
        .eq("conversation_session_id", conversationId)
        .order("created_at", { ascending: true });

      // Get first message
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
    };
    loadConversation();
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      
      const assistantMessage: Message = {
        role: "assistant",
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Check if conversation should complete
      if (data.shouldComplete) {
        setTimeout(() => {
          onComplete();
        }, 2000);
      }
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const userMessageCount = messages.filter(m => m.role === "user").length;
  const estimatedTotal = 8;
  const progressPercent = Math.min((userMessageCount / estimatedTotal) * 100, 100);

  return (
    <div className="flex flex-col h-[600px] bg-card rounded-lg border border-border/50">
      {/* Progress Indicator */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            {userMessageCount > 0 && userMessageCount < estimatedTotal && `Question ${userMessageCount} of ~${estimatedTotal}`}
            {userMessageCount >= 6 && userMessageCount < estimatedTotal && " • Almost done!"}
            {userMessageCount >= estimatedTotal && "Wrapping up..."}
          </span>
          <span className="text-sm font-medium">{Math.round(progressPercent)}%</span>
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
