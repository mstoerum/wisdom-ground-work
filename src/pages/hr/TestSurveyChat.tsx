import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { HRLayout } from "@/components/hr/HRLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ConversationBubble } from "@/components/employee/ConversationBubble";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Send, Loader2, TestTube, Info, Shield, Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const TestSurveyChat = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get("draft_id");
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [surveyData, setSurveyData] = useState<any>(null);
  const [isLoadingSurvey, setIsLoadingSurvey] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load survey data from draft
  useEffect(() => {
    const loadSurveyData = async () => {
      if (!draftId) {
        toast.error("No survey draft ID provided");
        navigate("/hr/create-survey");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("surveys")
          .select("*")
          .eq("id", draftId)
          .single();

        if (error) throw error;

        setSurveyData(data);
        
        // No first message needed - will be auto-generated from themes
        setMessages([]);
      } catch (error) {
        console.error("Error loading survey:", error);
        toast.error("Failed to load survey data");
        navigate("/hr/create-survey");
      } finally {
        setIsLoadingSurvey(false);
      }
    };

    loadSurveyData();
  }, [draftId, navigate]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Send message to AI (using test mode)
  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading || !surveyData) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Please sign in to continue");
      }

      // Create a test conversation session ID
      const testConversationId = `test-${draftId}-${Date.now()}`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            conversationId: testConversationId,
            surveyId: draftId,
            messages: [...messages, userMessage].map(m => ({
              role: m.role,
              content: m.content
            })),
            testMode: true, // Flag to indicate this is a test
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
        content: data.message || "Thank you for your feedback. This is a test response.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error(error instanceof Error ? error.message : "Message failed. Please try again.");
      
      // Restore state on error
      setMessages(prev => prev.slice(0, -1));
      setInput(currentInput);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, surveyData, draftId]);

  // Handle Enter key to send message
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Calculate conversation progress
  const userMessageCount = messages.filter(m => m.role === "user").length;
  const estimatedQuestions = Math.max(6, (surveyData?.themes?.length || 3) * 2 + 2);
  const progressPercent = Math.min((userMessageCount / estimatedQuestions) * 100, 100);

  if (isLoadingSurvey) {
    return (
      <HRLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </HRLayout>
    );
  }

  if (!surveyData) {
    return (
      <HRLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Survey data not found. Please go back and try again.</AlertDescription>
        </Alert>
      </HRLayout>
    );
  }

  const consentConfig = (surveyData.consent_config as any) || {};

  return (
    <HRLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/hr/create-survey?draft_id=${draftId}`)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <TestTube className="h-5 w-5 text-primary" />
                <h1 className="text-3xl font-bold">Test Chat Experience</h1>
              </div>
              <p className="text-muted-foreground mt-1">
                Experience the survey exactly as your employees will see it
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate(`/hr/create-survey?draft_id=${draftId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Survey
          </Button>
        </div>

        {/* Test Mode Banner */}
        <Alert className="border-primary/50 bg-primary/10">
          <TestTube className="h-4 w-4" />
          <AlertDescription>
            <strong>Test Mode:</strong> You are testing the survey chat interface. Responses are not saved to the database and will not affect employee data or analytics.
          </AlertDescription>
        </Alert>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="flex flex-col h-[700px]">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{surveyData.title}</CardTitle>
                    <CardDescription>
                      Test conversation interface
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1.5">
                    <TestTube className="h-3 w-3" />
                    Test Mode
                  </Badge>
                </div>
              </CardHeader>

              {/* Progress Indicator */}
              <div className="p-4 border-b border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {userMessageCount > 0 && userMessageCount < estimatedQuestions && 
                        `Message ${userMessageCount} of ~${estimatedQuestions}`}
                      {userMessageCount >= 6 && userMessageCount < estimatedQuestions && " • Almost done!"}
                      {userMessageCount >= estimatedQuestions && "Wrapping up..."}
                      {userMessageCount === 0 && "Start typing to begin the conversation"}
                    </span>
                  </div>
                  <span className="text-sm font-medium">{Math.round(progressPercent)}%</span>
                </div>
                <Progress value={progressPercent} className="h-1.5" />
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6">
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
              </div>

              {/* Input Area */}
              <div className="p-6 border-t border-border/50">
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
                    placeholder="Type your response to test the conversation..."
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
            </Card>
          </div>

          {/* Sidebar with Survey Details */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  Survey Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Title</p>
                  <p className="text-sm text-muted-foreground">{surveyData.title}</p>
                </div>
                {surveyData.description && (
                  <div>
                    <p className="text-sm font-medium mb-1">Description</p>
                    <p className="text-sm text-muted-foreground">{surveyData.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            {consentConfig && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Privacy Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Anonymization:</span>
                    <Badge variant={consentConfig.anonymization_level === "anonymous" ? "default" : "secondary"}>
                      {consentConfig.anonymization_level === "anonymous" ? "Anonymous" : "Identified"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Retention:</span>
                    <span className="font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {consentConfig.data_retention_days || 60} days
                    </span>
                  </div>
                  {consentConfig.consent_message && (
                    <div className="pt-3 border-t border-border/50">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {consentConfig.consent_message}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Themes */}
            {surveyData.themes && Array.isArray(surveyData.themes) && surveyData.themes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Conversation Themes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {surveyData.themes.length} {surveyData.themes.length === 1 ? "theme" : "themes"} selected
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Themes are used to guide the AI conversation flow.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Helpful Info */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  About This Test
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This test page simulates the employee experience. Use it to verify the chat interface works correctly 
                  and to get a feel for how employees will interact with your survey. All responses in test mode are 
                  temporary and won't affect your survey data.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </HRLayout>
  );
};

export default TestSurveyChat;