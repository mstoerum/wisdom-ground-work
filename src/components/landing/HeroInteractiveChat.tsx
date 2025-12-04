import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Shield, Heart } from "lucide-react";
import { Link } from "react-router-dom";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  liked?: boolean;
}

const INITIAL_MESSAGE = "Hi! I'm Spradley, here to understand your experience at work. No surveys, just a conversation. What's been on your mind lately about your day-to-day?";

const RESPONSES = [
  "I hear you. That sounds like it's been weighing on you. Can you tell me more about what specifically feels challenging?",
  "Thank you for sharing that. It takes courage to be open. What would make the biggest difference for you right now?",
  "That's really valuable insight. I want to make sure I understand—how long has this been affecting your experience?",
];

export const HeroInteractiveChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: INITIAL_MESSAGE, timestamp: new Date() }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const maxExchanges = 2;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim() || exchangeCount >= maxExchanges) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const response = RESPONSES[exchangeCount] || RESPONSES[0];
      setMessages(prev => [...prev, {
        role: "assistant",
        content: response,
        timestamp: new Date(),
      }]);
      setIsTyping(false);
      setExchangeCount(prev => prev + 1);
    }, 1500);
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
    <div className="relative bg-card border-2 border-foreground rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-[hsl(var(--terracotta-primary))] px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(var(--butter-yellow))] to-[hsl(var(--coral-pink))] flex items-center justify-center">
          <span className="text-lg">🎙️</span>
        </div>
        <div>
          <p className="font-semibold text-white">Spradley</p>
          <p className="text-xs text-white/80">AI Feedback Companion</p>
        </div>
        <div className="ml-auto flex items-center gap-1 text-xs text-white/80">
          <Shield className="w-3 h-3" />
          <span>Anonymous</span>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="h-[280px] overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-background to-muted/30"
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(var(--terracotta-primary))] to-[hsl(var(--coral-pink))] flex-shrink-0" />
            )}
            
            <div className="relative group max-w-[75%]">
              <div
                className={`px-4 py-3 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-[hsl(var(--coral-pink))] text-[hsl(var(--coral-accent))] rounded-tr-md"
                    : "bg-muted text-foreground rounded-tl-md"
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
              
              {/* Like button for user messages */}
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
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(var(--butter-yellow))] to-[hsl(var(--coral-pink))] flex-shrink-0" />
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(var(--terracotta-primary))] to-[hsl(var(--coral-pink))] flex-shrink-0" />
            <div className="bg-muted px-4 py-3 rounded-2xl rounded-tl-md">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse" />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse delay-100" />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse delay-200" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input or CTA */}
      <div className="border-t border-border p-3 bg-card">
        {exchangeCount < maxExchanges ? (
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Share what's on your mind..."
              className="min-h-[44px] max-h-[88px] resize-none border-muted-foreground/20"
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              size="icon"
              className="flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Link to="/demo/employee" className="block">
            <Button className="w-full gap-2" size="lg">
              Continue Full Experience
              <span className="text-lg">→</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Privacy footer */}
      <div className="bg-muted/50 px-4 py-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Shield className="w-3 h-3" /> 100% Anonymous
        </span>
        <span>•</span>
        <span>End-to-end Encrypted</span>
      </div>
    </div>
  );
};
