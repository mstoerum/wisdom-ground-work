import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConversationBubble } from "@/components/employee/ConversationBubble";
import { Send, Loader2, Eye, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Shield, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface InteractiveSurveyPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyData: {
    title: string;
    first_message?: string;
    themes?: string[];
    consent_config?: {
      anonymization_level?: string;
      data_retention_days?: number;
      consent_message?: string;
    };
  };
}

// Mock AI responses based on themes
const generateMockAIResponse = (
  userMessage: string,
  themes: string[],
  themeDetails: Array<{ id: string; name: string }>,
  messageCount: number
): string => {
  const lowerMessage = userMessage.toLowerCase();
  
  // If it's early in the conversation, acknowledge and probe
  if (messageCount <= 2) {
    if (themeDetails.length > 0 && messageCount === 2) {
      // Try to introduce a theme naturally
      const currentTheme = themeDetails[messageCount - 2];
      return `I appreciate you sharing that. I'd like to understand more about ${currentTheme.name.toLowerCase()} in your work. Could you tell me more about how ${currentTheme.name.toLowerCase()} impacts your day-to-day experience?`;
    }
    return "Thank you for sharing that with me. I'm here to listen and understand your perspective. Can you tell me more about what's on your mind?";
  }
  
  // Mid-conversation - show engagement
  if (messageCount <= 4) {
    if (themeDetails.length > 1 && messageCount === 4) {
      const nextTheme = themeDetails[Math.min(themeDetails.length - 1, 1)];
      return `That's really helpful context. I'd also like to hear your thoughts on ${nextTheme.name.toLowerCase()}. How would you describe your experience with ${nextTheme.name.toLowerCase()}?`;
    }
    const responses = [
      "I see, that makes sense. Can you elaborate on that?",
      "That's an important point. What else comes to mind?",
      "Thank you for being so open. I'd love to hear more details about that.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // Later in conversation - wrap up
  if (messageCount >= 6) {
    return "Thank you for sharing all of that valuable feedback. Is there anything else you'd like to add before we wrap up?";
  }
  
  // Generic follow-up
  const followUps = [
    "That's very insightful. Can you tell me more?",
    "I understand. How does that make you feel?",
    "Thanks for sharing. What impact does that have on your work?",
  ];
  return followUps[Math.floor(Math.random() * followUps.length)];
};

export const InteractiveSurveyPreview = ({ 
  open, 
  onOpenChange, 
  surveyData 
}: InteractiveSurveyPreviewProps) => {
  const { title, first_message, themes = [], consent_config } = surveyData;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch theme details
  const { data: themeDetails = [] } = useQuery({
    queryKey: ['theme-details', themes],
    queryFn: async () => {
      if (!themes || themes.length === 0) return [];
      const { data, error } = await supabase
        .from('survey_themes')
        .select('id, name')
        .in('id', themes);
      if (error) throw error;
      return data;
    },
    enabled: !!themes && themes.length > 0 && open,
  });

  // Initialize conversation when dialog opens
  useEffect(() => {
    if (open) {
      const greeting: Message = {
        role: "assistant",
        content: first_message || "Hello! Thank you for taking the time to share your feedback with us. This conversation is confidential and will help us create a better workplace for everyone.",
        timestamp: new Date(),
      };
      setMessages([greeting]);
      setInput("");
    } else {
      // Reset when closed
      setMessages([]);
      setInput("");
    }
  }, [open, first_message]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Send message (mock AI response)
  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    // Simulate AI thinking delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 800));

    const messageCount = messages.filter(m => m.role === "user").length;
    const aiResponse: Message = {
      role: "assistant",
      content: generateMockAIResponse(currentInput, themes, themeDetails, messageCount + 1),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, aiResponse]);
    setIsLoading(false);
  }, [input, isLoading, messages, themes, themeDetails]);

  // Handle Enter key to send message
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Calculate conversation progress
  const userMessageCount = messages.filter(m => m.role === "user").length;
  const estimatedQuestions = Math.max(6, themeDetails.length * 2 + 2);
  const progressPercent = Math.min((userMessageCount / estimatedQuestions) * 100, 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Interactive Preview: {title}
          </DialogTitle>
          <DialogDescription>
            Experience the survey exactly as your employees will see it. Type responses to simulate the conversation.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 space-y-4">
          {/* Privacy Settings Preview */}
          {consent_config && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 border">
              <h3 className="font-semibold text-sm">Privacy Settings</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {consent_config.anonymization_level === "anonymous" ? "Fully Anonymous" : "Identified"}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Data kept for {consent_config.data_retention_days || 60} days
                </Badge>
              </div>
              {consent_config.consent_message && (
                <p className="text-sm text-muted-foreground mt-2">{consent_config.consent_message}</p>
              )}
            </div>
          )}

          {/* Chat Interface */}
          <div className="flex-1 flex flex-col bg-card rounded-lg border border-border/50 min-h-0">
            {/* Progress Indicator */}
            <div className="p-4 border-b border-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  Preview Mode • {userMessageCount} {userMessageCount === 1 ? 'message' : 'messages'}
                </span>
                <span className="text-sm font-medium">{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-1.5" />
            </div>

            {/* Messages */}
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

            {/* Input Area */}
            <div className="p-4 border-t border-border/50">
              {/* Suggested Prompts - Show only when input is empty and no messages yet */}
              {input === "" && userMessageCount === 0 && messages.length === 1 && (
                <div className="mb-3 p-3 bg-muted/30 rounded-lg border border-border/30">
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <span>💡</span> Try typing a response to see how the AI responds
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "I've been feeling positive about the team collaboration lately",
                      "What's been challenging is managing my workload",
                      "I'd like to talk about career development opportunities",
                      "Something on my mind lately is work-life balance"
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
                  placeholder="Type your response to preview the conversation..."
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

          {/* Themes Preview */}
          {themeDetails.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-4 border">
              <h3 className="font-semibold text-sm mb-2">Covered Themes (Preview)</h3>
              <div className="flex flex-wrap gap-2">
                {themeDetails.map((theme) => (
                  <Badge key={theme.id} variant="secondary">
                    {theme.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};