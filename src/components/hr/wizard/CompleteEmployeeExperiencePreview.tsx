import { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConversationBubble } from "@/components/employee/ConversationBubble";
import { ConsentModal } from "@/components/employee/ConsentModal";
import { AnonymizationRitual } from "@/components/employee/AnonymizationRitual";
import { MoodDial } from "@/components/employee/MoodDial";
import { Send, Loader2, Eye, CheckCircle2, Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Shield, Clock, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface CompleteEmployeeExperiencePreviewProps {
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

type ExperienceStep = "consent" | "anonymization" | "mood" | "chat" | "closing" | "complete";

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

export const CompleteEmployeeExperiencePreview = ({
  open,
  onOpenChange,
  surveyData,
}: CompleteEmployeeExperiencePreviewProps) => {
  const { title, first_message, themes = [], consent_config } = surveyData;
  const [step, setStep] = useState<ExperienceStep>("consent");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initialMood, setInitialMood] = useState(50);
  const [finalMood, setFinalMood] = useState(50);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate a mock session ID for the anonymization ritual
  const mockSessionId = `PREVIEW-${Date.now().toString(36).toUpperCase()}`;

  // Fetch theme details
  const { data: themeDetails = [] } = useQuery({
    queryKey: ["theme-details", themes],
    queryFn: async () => {
      if (!themes || themes.length === 0) return [];
      const { data, error } = await supabase
        .from("survey_themes")
        .select("id, name")
        .in("id", themes);
      if (error) throw error;
      return data;
    },
    enabled: !!themes && themes.length > 0 && open,
  });

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setStep("consent");
      setMessages([]);
      setInput("");
      setInitialMood(50);
      setFinalMood(50);
    }
  }, [open]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current && step === "chat") {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, step]);

  // Initialize conversation when entering chat step
  useEffect(() => {
    if (step === "chat" && messages.length === 0) {
      const greeting: Message = {
        role: "assistant",
        content: first_message || "Hello! Thank you for taking the time to share your feedback with us. This conversation is confidential and will help us create a better workplace for everyone.",
        timestamp: new Date(),
      };
      setMessages([greeting]);
    }
  }, [step, first_message, messages.length]);

  // Handle consent
  const handleConsent = () => {
    setStep("anonymization");
  };

  const handleDecline = () => {
    onOpenChange(false);
  };

  // Handle anonymization complete
  const handleAnonymizationComplete = () => {
    setStep("mood");
  };

  // Handle mood selection
  const handleMoodSelect = (mood: number) => {
    setInitialMood(mood);
    setFinalMood(mood);
    setStep("chat");
  };

  // Send message (mock AI response)
  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    // Simulate AI thinking delay
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 800));

    const messageCount = messages.filter((m) => m.role === "user").length;
    const aiResponse: Message = {
      role: "assistant",
      content: generateMockAIResponse(currentInput, themes, themeDetails, messageCount + 1),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, aiResponse]);
    setIsLoading(false);

    // Auto-advance to closing after enough messages
    const userMessageCount = messages.filter((m) => m.role === "user").length + 1;
    if (userMessageCount >= 5) {
      // Suggest wrapping up
    }
  }, [input, isLoading, messages, themes, themeDetails]);

  // Handle Enter key to send message
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle chat complete (user can manually end or auto-advance)
  const handleChatComplete = () => {
    setStep("closing");
  };

  // Handle closing complete
  const handleClosingComplete = (mood: number) => {
    setFinalMood(mood);
    setStep("complete");
  };

  // Calculate conversation progress
  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const estimatedQuestions = Math.max(6, themeDetails.length * 2 + 2);
  const progressPercent = Math.min((userMessageCount / estimatedQuestions) * 100, 100);

  // Step indicator component
  const StepIndicator = () => {
    const steps = [
      { key: "consent", label: "Consent", completed: step !== "consent" },
      { key: "anonymization", label: "Anonymization", completed: ["mood", "chat", "closing", "complete"].includes(step) },
      { key: "mood", label: "Mood", completed: ["chat", "closing", "complete"].includes(step) },
      { key: "chat", label: "Chat", completed: ["closing", "complete"].includes(step) },
      { key: "closing", label: "Closing", completed: step === "complete" },
    ];

    return (
      <div className="flex items-center justify-between px-2 pb-4 border-b">
        {steps.map((s, idx) => (
          <div key={s.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  s.completed
                    ? "bg-primary text-primary-foreground"
                    : step === s.key
                    ? "bg-primary/20 text-primary border-2 border-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s.completed ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  idx + 1
                )}
              </div>
              <span className="text-xs mt-1 text-muted-foreground hidden sm:block">{s.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-1 transition-all ${
                  s.completed ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] lg:max-w-6xl max-h-[95vh] p-0 gap-0 overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="px-8 pt-8 pb-6 border-b bg-muted/30">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <span>Complete Employee Experience Preview</span>
              </DialogTitle>
              <DialogDescription className="text-base mt-2 max-w-2xl">
                Experience the complete end-to-end employee survey journey, from consent to completion.
                This preview shows exactly what your employees will see and experience.
              </DialogDescription>
            </div>
          </div>

          {/* Survey Info Badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1">
              <Info className="h-3.5 w-3.5" />
              Preview Mode
            </Badge>
            {consent_config && (
              <>
                <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1">
                  <Shield className="h-3.5 w-3.5" />
                  {consent_config.anonymization_level === "anonymous" ? "Fully Anonymous" : "Identified"}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1">
                  <Clock className="h-3.5 w-3.5" />
                  Data retained for {consent_config.data_retention_days || 60} days
                </Badge>
              </>
            )}
            {themeDetails.length > 0 && (
              <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1">
                {themeDetails.length} {themeDetails.length === 1 ? "Theme" : "Themes"}
              </Badge>
            )}
          </div>

          {/* Step Indicator */}
          <div className="mt-6">
            <StepIndicator />
          </div>
        </DialogHeader>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            {/* Consent Step */}
            {step === "consent" && (
              <div className="space-y-4">
                <Alert className="border-primary/50 bg-primary/10">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Step 1: Consent</strong> - Employees see this privacy and consent modal first.
                  </AlertDescription>
                </Alert>
                <ConsentModal
                  open={true}
                  consentMessage={consent_config?.consent_message}
                  anonymizationLevel={consent_config?.anonymization_level || "anonymous"}
                  dataRetentionDays={consent_config?.data_retention_days || 60}
                  onConsent={handleConsent}
                  onDecline={handleDecline}
                />
              </div>
            )}

            {/* Anonymization Step */}
            {step === "anonymization" && (
              <div className="space-y-4">
                <Alert className="border-primary/50 bg-primary/10">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Step 2: Anonymization Ritual</strong> - Visual confirmation of privacy protection.
                  </AlertDescription>
                </Alert>
                <AnonymizationRitual sessionId={mockSessionId} onComplete={handleAnonymizationComplete} />
              </div>
            )}

            {/* Mood Selection Step */}
            {step === "mood" && (
              <div className="space-y-4">
                <Alert className="border-primary/50 bg-primary/10">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Step 3: Mood Selection</strong> - Employees set their initial mood before the conversation.
                  </AlertDescription>
                </Alert>
                <MoodDial onMoodSelect={handleMoodSelect} />
              </div>
            )}

            {/* Chat Step */}
            {step === "chat" && (
              <div className="space-y-6">
                <Alert className="border-primary/50 bg-primary/10">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Step 4: Chat Interface</strong> - The main conversation where employees share feedback.
                    You can type responses to see how the AI conversation flows.
                  </AlertDescription>
                </Alert>

                <Card className="flex flex-col h-[600px]">
                  {/* Progress Indicator */}
                  <div className="p-5 border-b border-border/50 bg-card/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground">
                          Preview Mode • {userMessageCount} {userMessageCount === 1 ? "message" : "messages"} sent
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-foreground">{Math.round(progressPercent)}%</span>
                      </div>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                  </div>

                  {/* Messages Area */}
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
                          <div className="bg-muted rounded-lg p-4 flex items-center gap-3">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">AI is thinking...</span>
                          </div>
                        </div>
                      )}
                      <div ref={scrollRef} />
                    </div>
                  </ScrollArea>

                  {/* Input Area */}
                  <div className="p-6 border-t border-border/50 bg-card/50">
                    {/* Suggested Prompts */}
                    {input === "" && userMessageCount === 0 && messages.length === 1 && (
                      <div className="mb-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
                        <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                          <Info className="h-4 w-4 text-primary" />
                          Try typing a response to see how the AI responds
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            "I've been feeling positive about the team collaboration lately",
                            "What's been challenging is managing my workload",
                            "I'd like to talk about career development opportunities",
                            "Something on my mind lately is work-life balance",
                          ].map((prompt, idx) => (
                            <button
                              key={idx}
                              onClick={() => setInput(prompt)}
                              className="text-left text-sm px-4 py-2.5 bg-background hover:bg-primary/10 rounded-lg border border-border/50 hover:border-primary/30 transition-all text-foreground"
                            >
                              {prompt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your response to preview the conversation..."
                        className="min-h-[80px] text-base resize-none flex-1"
                        disabled={isLoading}
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!input.trim() || isLoading}
                        size="icon"
                        className="h-[80px] w-[80px] shrink-0"
                      >
                        {isLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </Button>
                    </div>

                    {/* Option to proceed to closing */}
                    {userMessageCount >= 3 && (
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          onClick={handleChatComplete}
                          className="w-full"
                        >
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Proceed to Closing Step (Preview)
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}

            {/* Closing Step */}
            {step === "closing" && (
              <div className="space-y-4">
                <Alert className="border-primary/50 bg-primary/10">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Step 5: Closing Ritual</strong> - Final mood check and completion.
                  </AlertDescription>
                </Alert>
                {/* Note: ClosingRitual expects a real conversationId, so we'll create a simplified version */}
                <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
                  <CardContent className="p-8 space-y-6">
                    <div className="text-center">
                      <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
                      <h2 className="text-2xl font-semibold mb-2">Thank You</h2>
                      <p className="text-muted-foreground">
                        In the preview, we're showing you the closing ritual. In the real flow,
                        employees can adjust their mood and see a summary of their feedback session.
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                      <h3 className="font-medium text-center">Final Mood Check</h3>
                      <p className="text-sm text-muted-foreground text-center">
                        Initial mood: {initialMood}/100
                      </p>
                      <p className="text-xs text-muted-foreground text-center">
                        (In the real experience, employees can adjust their mood here)
                      </p>
                    </div>
                    <Button
                      onClick={() => handleClosingComplete(initialMood)}
                      className="w-full"
                      size="lg"
                    >
                      Complete Session (Preview)
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Complete Step */}
            {step === "complete" && (
              <div className="space-y-4">
                <Card className="bg-gradient-to-br from-success/10 to-background border-success/20">
                  <CardContent className="p-12 text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/20 mb-4">
                      <CheckCircle2 className="h-10 w-10 text-success" />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">Preview Complete!</h2>
                    <p className="text-muted-foreground max-w-md mx-auto text-lg">
                      You've experienced the complete employee survey journey from start to finish.
                      This is exactly what your employees will see when they participate in this survey.
                    </p>
                    <div className="pt-6 space-y-2">
                      <p className="text-sm font-medium">Journey Summary:</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        <Badge variant="secondary">✓ Consent</Badge>
                        <Badge variant="secondary">✓ Anonymization</Badge>
                        <Badge variant="secondary">✓ Mood Selection</Badge>
                        <Badge variant="secondary">✓ Chat Conversation</Badge>
                        <Badge variant="secondary">✓ Closing Ritual</Badge>
                      </div>
                    </div>
                    <div className="pt-6">
                      <Button onClick={() => onOpenChange(false)} size="lg">
                        Close Preview
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
