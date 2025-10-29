import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConversationBubble } from "@/components/employee/ConversationBubble";
import { Send, Loader2, Eye, X, ChevronDown, ChevronUp, Info, User, Smartphone, Monitor, Shield, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConsentModal } from "@/components/employee/ConsentModal";
import { MoodDial } from "@/components/employee/MoodDial";
import { AnonymizationRitual } from "@/components/employee/AnonymizationRitual";
import { ChatInterface } from "@/components/employee/ChatInterface";
import { ClosingRitual } from "@/components/employee/ClosingRitual";
import { useQuery } from "@@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  surveyData 
}: CompleteEmployeeExperiencePreviewProps) => {
  const { title, first_message, themes = [], consent_config } = surveyData;
  const [step, setStep] = useState<ExperienceStep>("consent");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mood, setMood] = useState(50);
  const [showDetails, setShowDetails] = useState(true);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
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
      setStep("consent");
      setMessages([]);
      setInput("");
      setMood(50);
    } else {
      // Reset when closed
      setStep("consent");
      setMessages([]);
      setInput("");
      setMood(50);
    }
  }, [open]);

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

  const handleConsent = () => {
    setStep("anonymization");
  };

  const handleAnonymizationComplete = () => {
    setStep("mood");
  };

  const handleMoodSelect = (selectedMood: number) => {
    setMood(selectedMood);
    setStep("chat");
    
    // Initialize chat with first message
    const greeting: Message = {
      role: "assistant",
      content: first_message || "Hello! Thank you for taking the time to share your feedback with us. This conversation is confidential and will help us create a better workplace for everyone.",
      timestamp: new Date(),
    };
    setMessages([greeting]);
  };

  const handleChatComplete = () => {
    setStep("closing");
  };

  const handleComplete = () => {
    setStep("complete");
  };

  const resetPreview = () => {
    setStep("consent");
    setMessages([]);
    setInput("");
    setMood(50);
  };

  const renderEmployeeExperience = () => {
    switch (step) {
      case "consent":
        return (
          <ConsentModal
            open={true}
            consentMessage={consent_config?.consent_message}
            anonymizationLevel={consent_config?.anonymization_level}
            dataRetentionDays={consent_config?.data_retention_days}
            onConsent={handleConsent}
            onDecline={() => setStep("complete")}
          />
        );
      
      case "anonymization":
        return (
          <AnonymizationRitual 
            sessionId="PREVIEW-SESSION"
            onComplete={handleAnonymizationComplete}
          />
        );
      
      case "mood":
        return <MoodDial onMoodSelect={handleMoodSelect} />;
      
      case "chat":
        return (
          <div className="space-y-4">
            {/* Chat Interface */}
            <div className="bg-gradient-to-br from-background to-muted/20 rounded-lg border border-border/50 shadow-sm min-h-[500px] flex flex-col">
              {/* Progress Indicator */}
              <div className="p-4 border-b border-border/50 bg-card/50 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      Preview Mode • {userMessageCount} {userMessageCount === 1 ? 'message' : 'messages'} sent
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
                <div className="space-y-4 max-w-3xl mx-auto">
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
              <div className="p-6 border-t border-border/50 bg-card/50 backdrop-blur-sm">
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
                        "Something on my mind lately is work-life balance"
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
              </div>
            </div>

            {/* Continue Button */}
            <div className="text-center">
              <Button onClick={handleChatComplete} size="lg">
                Complete Conversation
              </Button>
            </div>
          </div>
        );
      
      case "closing":
        return (
          <div className="text-center py-12 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
              <span className="text-4xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Your feedback has been recorded. This completes the employee experience preview.
            </p>
            <Button onClick={handleComplete} size="lg">
              View Summary
            </Button>
          </div>
        );
      
      case "complete":
        return (
          <div className="text-center py-12 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Eye className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Preview Complete</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              You've experienced the complete employee journey. This is exactly what your employees will see.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={resetPreview} variant="outline">
                Preview Again
              </Button>
              <Button onClick={() => onOpenChange(false)}>
                Close Preview
              </Button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] lg:max-w-7xl max-h-[95vh] p-0 gap-0 overflow-hidden flex flex-col">
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
                Experience the complete survey flow exactly as your employees will see it - from consent to completion.
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={previewMode === "desktop" ? "default" : "outline"}
                size="sm"
                onClick={() => setPreviewMode("desktop")}
              >
                <Monitor className="h-4 w-4 mr-2" />
                Desktop
              </Button>
              <Button
                variant={previewMode === "mobile" ? "default" : "outline"}
                size="sm"
                onClick={() => setPreviewMode("mobile")}
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Mobile
              </Button>
            </div>
          </div>
          
          {/* Quick Info Badges */}
          {consent_config && (
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1">
                <Shield className="h-3.5 w-3.5" />
                {consent_config.anonymization_level === "anonymous" ? "Fully Anonymous" : "Identified"}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1">
                <Clock className="h-3.5 w-3.5" />
                Data retained for {consent_config.data_retention_days || 60} days
              </Badge>
              {themeDetails.length > 0 && (
                <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1">
                  {themeDetails.length} {themeDetails.length === 1 ? 'Theme' : 'Themes'}
                </Badge>
              )}
            </div>
          )}
        </DialogHeader>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* Left Side - Employee Experience */}
          <div className={`flex-1 flex flex-col min-w-0 ${previewMode === "mobile" ? "max-w-sm mx-auto" : ""}`}>
            <div className="flex-1 p-6 lg:p-8">
              <div className={`${previewMode === "mobile" ? "border-2 border-gray-300 rounded-3xl p-4 bg-gray-50" : ""}`}>
                <div className="bg-gradient-to-br from-background to-muted/20 rounded-lg border border-border/50 shadow-sm min-h-[600px]">
                  {renderEmployeeExperience()}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Details Panel */}
          <div className="lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-border/50 bg-muted/20 flex flex-col">
            <Collapsible open={showDetails} onOpenChange={setShowDetails} className="w-full">
              <CollapsibleTrigger asChild className="lg:hidden">
                <Button 
                  variant="ghost" 
                  className="w-full justify-between p-4 hover:bg-muted/50 rounded-none"
                >
                  <span className="font-semibold">Survey Details</span>
                  {showDetails ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="lg:!block">
                <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(95vh-200px)] lg:max-h-full">
                  {/* Current Step */}
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        Current Step
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="default" className="mb-2">
                        {step.charAt(0).toUpperCase() + step.slice(1)}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {step === "consent" && "Employee reviews privacy information and gives consent"}
                        {step === "anonymization" && "System establishes anonymous session"}
                        {step === "mood" && "Employee selects their current mood"}
                        {step === "chat" && "AI conversation with employee"}
                        {step === "closing" && "Conversation completion and thank you"}
                        {step === "complete" && "Preview completed"}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Privacy Settings */}
                  {consent_config && (
                    <Card className="border-border/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" />
                          Privacy Settings
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Anonymization:</span>
                          <Badge variant={consent_config.anonymization_level === "anonymous" ? "default" : "secondary"}>
                            {consent_config.anonymization_level === "anonymous" ? "Anonymous" : "Identified"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Retention:</span>
                          <span className="font-medium">{consent_config.data_retention_days || 60} days</span>
                        </div>
                        {consent_config.consent_message && (
                          <div className="pt-3 border-t border-border/50">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {consent_config.consent_message}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Themes */}
                  {themeDetails.length > 0 && (
                    <Card className="border-border/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Conversation Themes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {themeDetails.map((theme) => (
                            <Badge 
                              key={theme.id} 
                              variant="secondary"
                              className="text-xs px-3 py-1.5"
                            >
                              {theme.name}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Preview Info */}
                  <Card className="border-border/50 bg-primary/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Info className="h-4 w-4 text-primary" />
                        About This Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        This preview shows the complete employee experience from start to finish. 
                        You can interact with each step to understand exactly what your employees will see and experience.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};