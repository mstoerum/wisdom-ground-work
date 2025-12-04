import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Shield, Heart, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  liked?: boolean;
}

const INITIAL_MESSAGE = "Hi! I'm Spradley. How's work been going for you lately—anything on your mind?";

export const HeroInteractiveChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: INITIAL_MESSAGE, timestamp: new Date() }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [conversationId] = useState(() => `preview-hero-${Date.now()}`);
  const scrollRef = useRef<HTMLDivElement>(null);

  const maxExchanges = 2;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || exchangeCount >= maxExchanges || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            messages: updatedMessages.map(m => ({
              role: m.role,
              content: m.content
            })),
            testMode: true,
            surveyType: "employee_satisfaction",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      const aiContent = data.response || data.message || "Thanks for sharing. Could you tell me more about that?";

      setMessages(prev => [...prev, {
        role: "assistant",
        content: aiContent,
        timestamp: new Date(),
      }]);
      setExchangeCount(prev => prev + 1);
    } catch (error) {
      console.error("Chat error:", error);
      // Fallback response if API fails
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I appreciate you sharing that. What would make the biggest difference for you right now?",
        timestamp: new Date(),
      }]);
      setExchangeCount(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleLike = (index: number) => {
    setMessages(prev => prev.map((msg, i) => 
      i === index ? { ...msg, liked: !msg.liked } : msg
    ));
  };

  return (
    <div className="relative bg-card rounded-xl shadow-xl overflow-hidden border border-border/50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/90 to-[hsl(var(--coral-accent)/0.85)] px-5 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
          <div className="w-5 h-5 rounded-full bg-white/80" />
        </div>
        <div>
          <p className="font-medium text-white">Spradley</p>
          <p className="text-xs text-white/70">AI Feedback Companion</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-white/70">
          <Shield className="w-3.5 h-3.5" />
          <span>Anonymous</span>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="h-[280px] overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-background to-muted/20"
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-[hsl(var(--coral-accent))] flex-shrink-0 opacity-90" />
            )}
            
            <div className="relative group max-w-[75%]">
              <div
                className={`px-4 py-3 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-primary/10 text-foreground rounded-tr-sm"
                    : "bg-muted/80 text-foreground rounded-tl-sm"
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
              
              {msg.role === "user" && (
                <button
                  onClick={() => toggleLike(index)}
                  className={`absolute -bottom-2 -left-2 p-1.5 rounded-full transition-all ${
                    msg.liked 
                      ? "bg-[hsl(var(--destructive))] text-white scale-110" 
                      : "bg-card border border-border text-muted-foreground opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <Heart className={`w-3 h-3 ${msg.liked ? "fill-current" : ""}`} />
                </button>
              )}
            </div>

            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(var(--butter-yellow))] to-[hsl(var(--coral-pink))] flex-shrink-0 opacity-90" />
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-[hsl(var(--coral-accent))] flex-shrink-0 opacity-90" />
            <div className="bg-muted/80 px-4 py-3 rounded-2xl rounded-tl-sm">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-pulse" />
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-pulse delay-100" />
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-pulse delay-200" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input or CTA */}
      <div className="border-t border-border/50 p-4 bg-card">
        {exchangeCount < maxExchanges ? (
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Share what's on your mind..."
              className="min-h-[44px] max-h-[88px] resize-none border-border/50 bg-background"
              rows={1}
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="flex-shrink-0"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        ) : (
          <Link to="/demo/employee" className="block">
            <Button className="w-full gap-2 font-medium" size="lg">
              Continue Full Experience
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        )}
      </div>

      {/* Privacy footer */}
      <div className="bg-muted/30 px-4 py-2.5 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Shield className="w-3 h-3" /> 100% Anonymous
        </span>
        <span className="text-border">•</span>
        <span>End-to-end Encrypted</span>
      </div>
    </div>
  );
};
