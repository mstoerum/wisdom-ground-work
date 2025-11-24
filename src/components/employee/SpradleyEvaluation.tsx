import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConversationBubble } from "./ConversationBubble";
import { Send, Loader2, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface SpradleyEvaluationProps {
  surveyId: string;
  conversationSessionId: string;
  onComplete: () => void;
  onSkip?: () => void;
}

const MAX_DURATION_SECONDS = 150; // 2.5 minutes (slightly more flexible)
const ESTIMATED_QUESTIONS = 5; // Allow 4-5 questions for better coverage

export const SpradleyEvaluation = ({
  surveyId,
  conversationSessionId,
  onComplete,
  onSkip,
}: SpradleyEvaluationProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sentimentData, setSentimentData] = useState<{ sentiment?: string; sentimentScore?: number }>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Save evaluation and complete
  const handleComplete = useCallback(async () => {
    try {
      // Get user if authenticated (may be null for anonymous surveys)
      const { data: { user } } = await supabase.auth.getUser();
      
      const duration = Math.floor((Date.now() - startTime) / 1000);
      const userMessages = messages.filter(m => m.role === "user");
      const assistantMessages = messages.filter(m => m.role === "assistant");

      // Validate that we have responses
      if (userMessages.length === 0) {
        console.warn("⚠️ No user messages to save in evaluation");
        toast({
          title: "No responses to save",
          description: "Please answer at least one question",
          variant: "destructive",
        });
        return;
      }

      // Extract key insights from conversation with structured data
      const evaluationResponses = userMessages.map((msg, idx) => ({
        question: assistantMessages[idx]?.content || "",
        answer: msg.content,
        timestamp: msg.timestamp.toISOString(),
        questionNumber: idx + 1,
      }));

      // Extract evaluation dimensions from responses
      const dimensions = {
        overall_experience: evaluationResponses[0]?.answer || null,
        ease_of_use: evaluationResponses.find(r => 
          r.question.toLowerCase().includes("easier") || 
          r.question.toLowerCase().includes("natural")
        )?.answer || null,
        conversation_quality: evaluationResponses.find(r => 
          r.question.toLowerCase().includes("understand") || 
          r.question.toLowerCase().includes("rephrase")
        )?.answer || null,
        value_comparison: evaluationResponses.find(r => 
          r.question.toLowerCase().includes("compare") || 
          r.question.toLowerCase().includes("other")
        )?.answer || null,
      };

      // Calculate overall sentiment from stored sentiment data or responses
      const overallSentiment = sentimentData.sentiment || "neutral";
      const overallSentimentScore = sentimentData.sentimentScore || 0.5;

      // Prepare evaluation data
      const evaluationData = {
        survey_id: surveyId,
        conversation_session_id: conversationSessionId,
        employee_id: user?.id || null,
        evaluation_responses: evaluationResponses,
        overall_sentiment: overallSentiment,
        sentiment_score: overallSentimentScore,
        key_insights: {
          dimensions,
          total_questions: userMessages.length,
          average_response_length: userMessages.length > 0 
            ? userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length 
            : 0,
        },
        duration_seconds: duration,
        completed_at: new Date().toISOString(),
      };

      console.log("🔍 Submitting Spradley evaluation with data:", {
        ...evaluationData,
        response_count: evaluationResponses.length,
        user_id: user?.id || 'anonymous',
      });

      // Save evaluation with structured data (employee_id may be null for anonymous)
      const { data, error } = await supabase
        .from("spradley_evaluations" as any)
        .insert(evaluationData)
        .select();

      if (error) {
        console.error("❌ Error saving Spradley evaluation:", {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        toast({
          title: "Error saving feedback",
          description: error.message || "Please contact support",
          variant: "destructive",
        });
        // Don't throw - allow completion anyway
      } else {
        console.log("✅ Spradley evaluation saved successfully:", data);
      }

      toast({
        title: "Thank you!",
        description: "Your feedback helps us improve Spradley.",
      });

      setTimeout(() => {
        onComplete();
      }, 1000);
    } catch (error) {
      console.error("Error completing evaluation:", error);
      // Still complete even if save fails
      onComplete();
    }
  }, [surveyId, conversationSessionId, messages, startTime, onComplete, toast, sentimentData]);

  // Track elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(elapsed);
      
      // Auto-complete if time limit reached
      if (elapsed >= MAX_DURATION_SECONDS) {
        handleComplete();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, handleComplete]);

  // Auto-trigger AI introduction
  useEffect(() => {
    if (messages.length === 0 && !isLoading) {
      setIsLoading(true);
      
      // Improved introduction with better framing
      const introMessage: Message = {
        role: "assistant",
        content: "Thank you for completing the survey! I'd love to hear about your experience. Overall, how did you find this conversation compared to traditional surveys? Did it feel more natural, or was there anything that felt different or off?",
        timestamp: new Date()
      };
      
      setMessages([introMessage]);
      setIsLoading(false);
    }
  }, [messages.length, isLoading]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message to evaluation AI
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
      // Get session if available (optional for anonymous surveys)
      const { data: { session } } = await supabase.auth.getSession();

      // Prepare headers with optional authorization
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      // Call evaluation-specific chat endpoint
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evaluate-spradley`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            surveyId,
            conversationSessionId,
            messages: [...messages, userMessage].map(m => ({
              role: m.role,
              content: m.content
            })),
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

      setMessages(prev => {
        const updatedMessages = [...prev, assistantMessage];
        
        // Store sentiment from response for later saving
        if (data.sentiment && data.sentimentScore !== undefined) {
          setSentimentData({
            sentiment: data.sentiment,
            sentimentScore: data.sentimentScore,
          });
        }

        // Auto-complete after sufficient exchanges or if AI indicates completion
        // Use updated messages count (includes the user message we just added)
        const userMessageCount = updatedMessages.filter(m => m.role === "user").length;
        // Updated to allow 4-5 questions instead of hard 4 limit
        if (data.shouldComplete || userMessageCount >= 5) {
          setTimeout(() => handleComplete(), 2000);
        }
        
        return updatedMessages;
      });
    } catch (error) {
      console.error("Evaluation error:", error);
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
  }, [input, isLoading, surveyId, conversationSessionId, messages, toast, handleComplete]);

  // Handle Enter key to send message
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const userMessageCount = messages.filter(m => m.role === "user").length;
  const progressPercent = Math.min((userMessageCount / ESTIMATED_QUESTIONS) * 100, 100);
  const remainingSeconds = Math.max(0, MAX_DURATION_SECONDS - elapsedSeconds);

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Help Us Improve Spradley</CardTitle>
            <CardDescription className="mt-2">
              Your feedback directly helps us improve Spradley for everyone. Just 3-4 quick questions (about 2 minutes).
            </CardDescription>
          </div>
          {onSkip && (
            <Button variant="ghost" size="sm" onClick={onSkip}>
              <X className="h-4 w-4 mr-2" />
              Skip
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Time remaining alert */}
        {remainingSeconds < 30 && remainingSeconds > 0 && (
          <Alert className="mb-4 border-orange-500">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              {remainingSeconds} seconds remaining
            </AlertDescription>
          </Alert>
        )}

        {/* Progress Indicator */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {userMessageCount > 0 && `Question ${userMessageCount} of ~${ESTIMATED_QUESTIONS}`}
              {userMessageCount === 0 && "Getting started..."}
              {userMessageCount >= 3 && " • Almost done!"}
            </span>
            <span className="text-muted-foreground">
              {Math.floor(remainingSeconds / 60)}:{(remainingSeconds % 60).toString().padStart(2, '0')} remaining
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        <div className="flex flex-col min-h-[400px] max-h-[60vh] bg-card rounded-lg border border-border/50">
          <ScrollArea className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-3">
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
                  <div className="bg-muted rounded-lg p-4 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      Spradley is typing...
                    </span>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-border/50 bg-background/95 backdrop-blur-md">
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <Textarea
                  aria-label="Type your feedback about Spradley"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Share your thoughts..."
                  className="
                    bg-muted
                    border-0
                    rounded-3xl
                    px-6
                    py-4
                    text-base
                    leading-relaxed
                    resize-none
                    focus:ring-2
                    focus:ring-[hsl(var(--terracotta-primary))]
                    focus:ring-offset-2
                    transition-shadow
                  "
                  rows={2}
                  disabled={isLoading || remainingSeconds === 0}
                />
                <p className="absolute bottom-2 right-4 text-xs text-muted-foreground">
                  Press Enter to send
                </p>
              </div>
              
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading || remainingSeconds === 0}
                variant="coral"
                className="w-14 h-14 flex-shrink-0 shadow-sm hover:shadow-md"
                aria-label="Send feedback"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
