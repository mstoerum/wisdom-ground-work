import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConversationBubble } from "@/components/employee/ConversationBubble";
import { VoiceInterface } from "@/components/employee/VoiceInterface";
import { PreviewModeProvider } from "@/contexts/PreviewModeContext";
import { SurveyModeSelector } from "./SurveyModeSelector";
import { Send, Loader2, Eye, X, ChevronDown, ChevronUp, Info, Mic, MessageSquare, ArrowLeft, Lock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Shield, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";

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
  const [showDetails, setShowDetails] = useState(true); // Default open for better UX on desktop
  const [previewMode, setPreviewMode] = useState<'text' | 'voice' | null>(null); // null = mode not selected yet
  const [modeSelected, setModeSelected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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
      // Reset to mode selection when opening
      if (!modeSelected) {
        setPreviewMode(null);
        setMessages([]);
        setInput("");
      }
    } else {
      // Reset everything when closed
      setModeSelected(false);
      setPreviewMode(null);
      setMessages([]);
      setInput("");
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

  // Handle mode selection
  const handleModeSelection = useCallback((mode: 'text' | 'voice') => {
    setPreviewMode(mode);
    setModeSelected(true);
    
    // Initialize conversation with greeting
    const greeting: Message = {
      role: "assistant",
      content: first_message || "Hello! Thank you for taking the time to share your feedback with us. This conversation is confidential and will help us create a better workplace for everyone.",
      timestamp: new Date(),
    };
    setMessages([greeting]);

    // Show success toast
    toast({
      title: `${mode === 'voice' ? '?? Voice' : '?? Text'} mode selected`,
      description: mode === 'voice' 
        ? 'Click the microphone to start speaking'
        : 'Type your responses to continue the conversation',
    });
  }, [first_message, toast]);

  // Handle mode change (back to selector)
  const handleChangeMode = useCallback(() => {
    if (messages.length > 1) {
      // Warn if conversation has started
      const confirmed = window.confirm(
        'Changing modes will reset your preview conversation. Continue?'
      );
      if (!confirmed) return;
    }
    
    setModeSelected(false);
    setPreviewMode(null);
    setMessages([]);
    setInput("");
  }, [messages.length]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open || !modeSelected) return;

    const handleKeyPress = (e: KeyboardEvent) => {      
      // Escape: Close dialog (with confirmation if conversation started)
      if (e.key === 'Escape' && messages.length > 1) {
        e.preventDefault();
        const confirmExit = window.confirm(
          'Are you sure you want to exit? Your preview progress will be lost.'
        );
        if (confirmExit) {
          onOpenChange(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [open, modeSelected, messages.length, onOpenChange]);

  // Auto-focus textarea when text mode is selected
  useEffect(() => {
    if (modeSelected && previewMode === 'text') {
      const textarea = document.querySelector('textarea[placeholder*="Type your response"]');
      if (textarea instanceof HTMLTextAreaElement) {
        setTimeout(() => textarea.focus(), 300);
      }
    }
  }, [modeSelected, previewMode]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] lg:max-w-6xl max-h-[95vh] p-0 gap-0 overflow-hidden flex flex-col">
        {!modeSelected ? (
          // STEP 1: Show mode selector first
          <SurveyModeSelector
            surveyTitle={title}
            firstMessage={first_message}
            onSelectMode={handleModeSelection}
          />
        ) : (
          // STEP 2: Show the actual preview interface after mode selection
          <>
        {/* Header with improved spacing */}
        <DialogHeader className="px-8 pt-8 pb-6 border-b bg-muted/30">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleChangeMode}
                  className="mr-2"
                  aria-label="Change preview mode"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Eye className="h-6 w-6 text-primary" />
                  </div>
                  <span>{title}</span>
                  {/* Preview Mode Watermark Badge */}
                  <Badge variant="outline" className="ml-auto bg-yellow-50 border-yellow-400 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-600 dark:text-yellow-200">
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    Preview - No Data Saved
                  </Badge>
                </DialogTitle>
              </div>
              <DialogDescription className="text-base mt-2 max-w-2xl ml-12">
                {previewMode === 'voice' 
                  ? 'Experience the voice conversation exactly as your employees will. Speak naturally to respond.'
                  : 'Experience the survey exactly as your employees will see it. Type responses to simulate the conversation flow.'}
              </DialogDescription>
            </div>
          </div>
          
          {/* Mode Badge and Info */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 ml-12">
            {/* Current Mode Indicator */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5">
                {previewMode === 'voice' ? (
                  <>
                    <Mic className="h-3.5 w-3.5" />
                    Voice Mode
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-3.5 w-3.5" />
                    Text Mode
                  </>
                )}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1.5 px-2 py-1 bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300">
                <Lock className="h-3 w-3" />
                Private & Encrypted
              </Badge>
            </div>

            {/* Quick Info Badges */}
            {consent_config && (
              <div className="flex flex-wrap gap-2">
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
          </div>
        </DialogHeader>

        {/* Main Content Area - Split Layout */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* Left Side - Preview Interface (Text or Voice) */}
          <div className="flex-1 flex flex-col min-w-0 min-h-[500px] lg:min-h-0">
            {previewMode === 'voice' ? (
              <PreviewModeProvider
                isPreviewMode={true}
                previewSurveyId="preview-voice-session"
                previewSurveyData={{
                  first_message,
                  themes: themeDetails,
                  title
                }}
              >
                <VoiceInterface
                  conversationId="preview-voice-session"
                  onComplete={() => {}}
                />
              </PreviewModeProvider>
            ) : (
              // Original text chat interface
              <>
            {/* Chat Container with generous padding */}
            <div className="flex-1 flex flex-col bg-gradient-to-br from-background to-muted/20 rounded-lg m-6 lg:m-8 border border-border/50 shadow-sm min-h-0">
              {/* Progress Indicator */}
              <div className="p-5 border-b border-border/50 bg-card/50 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      Preview Mode
                    </span>
                    <span className="text-xs text-muted-foreground">?</span>
                    <span className="text-sm text-muted-foreground">
                      {userMessageCount} {userMessageCount === 1 ? 'message' : 'messages'} sent
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">{Math.round(progressPercent)}%</span>
                  </div>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>

              {/* Messages Area with better spacing */}
              <ScrollArea className="flex-1 p-8">
                <div className="space-y-6 max-w-4xl mx-auto">
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
                      <div className="bg-muted rounded-xl p-4 flex items-center gap-3 shadow-sm">
                        <div className="relative">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Atlas is thinking...</p>
                          <p className="text-xs text-muted-foreground">Crafting a thoughtful response</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              {/* Input Area with improved styling */}
              <div className="p-6 border-t border-border/50 bg-card/50 backdrop-blur-sm">
                {/* Suggested Prompts */}
                {input === "" && userMessageCount === 0 && messages.length === 1 && (
                  <div className="mb-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
                    <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      <Info className="h-4 w-4 text-primary" />
                      Try a sample response or type your own
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
                    className="min-h-[80px] text-base resize-none flex-1 focus-visible:ring-2 focus-visible:ring-primary"
                    disabled={isLoading}
                    aria-label="Type your survey response"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading}
                    size="icon"
                    className="h-[80px] w-[80px] shrink-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    aria-label="Send message"
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
            </>
            )}
          </div>

          {/* Right Side - Details Panel (Collapsible on mobile) */}
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
                    <CardContent className="space-y-2">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        This preview simulates the employee experience. The AI responses are mock examples. 
                        In the actual survey, AI responses will be dynamically generated based on employee input and survey themes.
                      </p>
                      <div className="pt-2 border-t border-border/30">
                        <p className="text-xs font-medium text-foreground mb-1">Keyboard Shortcuts:</p>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border text-xs">Enter</kbd> Send message
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border text-xs">Esc</kbd> Close preview
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};