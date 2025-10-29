import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ConversationBubble } from "@/components/employee/ConversationBubble";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useConversation } from "@/hooks/useConversation";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface DemoAIChatProps {
  onComplete: (messages: Message[]) => void;
  onSkip: () => void;
}

// Constants
const ESTIMATED_TOTAL_QUESTIONS = 8;
const PROGRESS_COMPLETE_THRESHOLD = 100;

export const DemoAIChat = ({ onComplete, onSkip }: DemoAIChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { startConversation, endConversation } = useConversation();

  // Initialize demo conversation
  useEffect(() => {
    const initializeDemoConversation = async () => {
      try {
        // Create a demo survey for the conversation
        const userId = (await supabase.auth.getUser()).data.user?.id;
        const { data: survey, error: surveyError } = await supabase
          .from('surveys')
          .insert({
            title: 'Demo Employee Feedback Survey',
            description: 'Interactive demo of Spradley AI conversation',
            first_message: "Hi! I'm Atlas, an AI guide here to help you share your thoughts about work. I'm not a person, and nothing you say here is connected to your name. This might feel a bit different from typical surveys, and that's okay. Let's start with something simple: What's one thing that's been on your mind about work lately?",
            themes: [],
            consent_config: {},
            schedule: {},
            created_by: userId || '',
          })
          .select()
          .single();

        if (surveyError) {
          console.error('Survey creation error:', surveyError);
          // Fallback to mock conversation if survey creation fails
          setMessages([{
            role: "assistant",
            content: "Hi! I'm Atlas, an AI guide here to help you share your thoughts about work. What's one thing that's been on your mind about work lately?",
            timestamp: new Date()
          }]);
          return;
        }

        // Create demo themes
        const demoThemes = [
          { name: 'Work-Life Balance', description: 'Balance between work and personal life' },
          { name: 'Career Growth', description: 'Professional development and advancement opportunities' },
          { name: 'Team Collaboration', description: 'Working relationships and team dynamics' },
          { name: 'Leadership', description: 'Management and leadership effectiveness' },
          { name: 'Compensation', description: 'Pay, benefits, and financial rewards' }
        ];

        const { data: themes, error: themesError } = await supabase
          .from('survey_themes')
          .insert(
            demoThemes.map(theme => ({
              name: theme.name,
              description: theme.description,
              survey_id: survey.id,
              is_demo: true
            }))
          )
          .select();

        if (themesError) {
          console.error('Themes creation error:', themesError);
        }

        // Update survey with theme IDs
        if (themes && themes.length > 0) {
          await supabase
            .from('surveys')
            .update({ themes: themes.map(t => t.id) })
            .eq('id', survey.id);
        }

        // Start conversation
        const convId = await startConversation(survey.id, 7); // Default mood of 7
        if (convId) {
          setConversationId(convId);
          setMessages([{
            role: "assistant",
            content: survey.first_message,
            timestamp: new Date()
          }]);
        }
      } catch (error) {
        console.error('Demo initialization error:', error);
        // Fallback to mock conversation
        setMessages([{
          role: "assistant",
          content: "Hi! I'm Atlas, an AI guide here to help you share your thoughts about work. What's one thing that's been on your mind about work lately?",
          timestamp: new Date()
        }]);
      }
    };

    initializeDemoConversation();
  }, [startConversation]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

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
      if (conversationId) {
        // Use real AI chat function
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

        // Auto-complete conversation after sufficient exchanges
        if (data.shouldComplete) {
          setTimeout(() => {
            onComplete([...messages, userMessage, assistantMessage]);
          }, 2000);
        }
      } else {
        // Fallback to mock conversation if no conversation ID
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
        
        const mockResponses = [
          "That's really insightful. Can you tell me more about how that affects your daily experience?",
          "I appreciate you sharing that. What would you say is the biggest challenge you're facing right now?",
          "Thank you for being so open. How do you think we could improve this situation?",
          "That's helpful context. Is there anything else about your work experience you'd like to discuss?",
          "I understand. Before we wrap up, is there one thing you'd change about your current situation if you could?"
        ];
        
        const assistantMessage: Message = {
          role: "assistant",
          content: mockResponses[Math.min(messages.filter(m => m.role === "user").length - 1, mockResponses.length - 1)],
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Complete after 5 exchanges
        if (messages.filter(m => m.role === "user").length >= 4) {
          setTimeout(() => {
            onComplete([...messages, userMessage, assistantMessage]);
          }, 2000);
        }
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

  // Calculate conversation progress
  const userMessageCount = messages.filter(m => m.role === "user").length;
  const progressPercent = Math.min((userMessageCount / ESTIMATED_TOTAL_QUESTIONS) * 100, PROGRESS_COMPLETE_THRESHOLD);

  return (
    <div className="space-y-4">
      {/* Progress and Skip */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              Question {Math.min(userMessageCount, ESTIMATED_TOTAL_QUESTIONS)} of {ESTIMATED_TOTAL_QUESTIONS}
            </span>
            <Button variant="ghost" size="sm" onClick={onSkip}>
              Skip to Results
            </Button>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </div>

      {/* Chat Messages */}
      <Card className="p-6">
        <ScrollArea className="h-[400px] pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <ConversationBubble
                key={idx}
                message={msg.content}
                isUser={msg.role === "user"}
                timestamp={msg.timestamp}
              />
            ))}
            
            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-muted rounded-lg p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        {userMessageCount < ESTIMATED_TOTAL_QUESTIONS && (
          <div className="mt-4 flex gap-2">
            <Textarea
              placeholder="Type your response..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading}
              className="min-h-[80px] resize-none"
            />
            <Button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
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