import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ConversationBubble } from "@/components/employee/ConversationBubble";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send } from "lucide-react";
import {
  DemoMessage,
  ConversationState,
  generateResponse,
  getEducationalTip
} from "@/utils/demoConversationLogic";

interface DemoChatProps {
  onComplete: (messages: DemoMessage[]) => void;
  onSkip: () => void;
}

export const DemoChat = ({ onComplete, onSkip }: DemoChatProps) => {
  const [state, setState] = useState<ConversationState>({
    messages: [],
    currentTheme: null,
    exchangeCount: 0,
    detectedSentiment: null,
    mentionedTopics: new Set()
  });
  
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [educationalTip, setEducationalTip] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const maxExchanges = 5;

  // Send initial greeting
  useEffect(() => {
    const initialGreeting = generateResponse(state, "");
    setState(prev => ({
      ...prev,
      messages: [initialGreeting],
      exchangeCount: 1
    }));
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: DemoMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date()
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage]
    }));

    setInput("");
    setIsTyping(true);

    // Show educational tip
    const tip = getEducationalTip(state.exchangeCount);
    if (tip) {
      setTimeout(() => setEducationalTip(tip), 500);
      setTimeout(() => setEducationalTip(null), 4000);
    }

    // Simulate AI thinking delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

    // Generate AI response
    const newState = {
      ...state,
      messages: [...state.messages, userMessage],
      exchangeCount: state.exchangeCount + 1
    };
    
    const aiResponse = generateResponse(newState, userMessage.content);
    
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, aiResponse],
      exchangeCount: prev.exchangeCount + 1,
      currentTheme: aiResponse.theme || prev.currentTheme
    }));

    setIsTyping(false);

    // Check if conversation is complete
    if (state.exchangeCount >= maxExchanges) {
      setTimeout(() => {
        onComplete([...state.messages, userMessage, aiResponse]);
      }, 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const progress = (state.exchangeCount / maxExchanges) * 100;

  return (
    <div className="space-y-4">
      {/* Progress and Skip */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              Question {Math.min(state.exchangeCount, maxExchanges)} of {maxExchanges}
            </span>
            <Button variant="ghost" size="sm" onClick={onSkip}>
              Skip to Results
            </Button>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Educational Tip */}
      {educationalTip && (
        <Card className="p-3 bg-primary/5 border-primary/20 animate-fade-in">
          <p className="text-sm text-muted-foreground">{educationalTip}</p>
        </Card>
      )}

      {/* Chat Messages */}
      <Card className="p-6">
        <ScrollArea className="h-[400px] pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {state.messages.map((msg, idx) => (
              <ConversationBubble
                key={idx}
                message={msg.content}
                isUser={msg.role === "user"}
                timestamp={msg.timestamp}
              />
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-muted rounded-lg p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        {state.exchangeCount < maxExchanges && (
          <div className="mt-4 flex gap-2">
            <Textarea
              placeholder="Type your response..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isTyping}
              className="min-h-[80px] resize-none"
            />
            <Button
              onClick={handleSend}
              disabled={isTyping || !input.trim()}
              size="icon"
              className="h-[80px] w-12"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
