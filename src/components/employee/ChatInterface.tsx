import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConversationBubble } from "./ConversationBubble";
import { VoiceInterface } from "./VoiceInterface";
import { Send, Loader2, Save, Mic, ArrowRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { soundEffects } from "@/utils/soundEffects";
import { RitualIntroduction } from "@/components/trust/RitualIntroduction";
import { AnonymizationRitual } from "@/components/trust/AnonymizationRitual";
import { TrustIndicators } from "@/components/trust/TrustIndicators";
import { CulturalContext, detectCulturalContext } from "@/lib/culturalAdaptation";
import { trackTrustMetrics } from "@/lib/trustAnalytics";
import { usePreviewMode } from "@/contexts/PreviewModeContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  conversationId: string;
  onComplete: () => void;
  onSaveAndExit: () => void;
  showTrustFlow?: boolean;
  skipTrustFlow?: boolean;
}

// Constants
const ESTIMATED_TOTAL_QUESTIONS = 8;
const PROGRESS_COMPLETE_THRESHOLD = 100;

type TrustFlowStep = "introduction" | "anonymization" | "chat" | "complete";

export const ChatInterface = ({ conversationId, onComplete, onSaveAndExit, showTrustFlow = true, skipTrustFlow = false }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [trustFlowStep, setTrustFlowStep] = useState<TrustFlowStep>("introduction");
  const [sessionId, setSessionId] = useState<string>("");
  const [culturalContext, setCulturalContext] = useState<CulturalContext | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { isPreviewMode, previewSurveyData } = usePreviewMode();
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Check if browser supports voice
  useEffect(() => {
    const supported = 
      'speechSynthesis' in window &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    setVoiceSupported(supported);
  }, []);

  // Initialize cultural context
  useEffect(() => {
    if (showTrustFlow && !skipTrustFlow) {
      const context = detectCulturalContext();
      setCulturalContext(context);
      trackTrustMetrics('session_started', {
        culturalContext: context.region,
        sessionId: conversationId
      });
    } else {
      setTrustFlowStep("chat");
    }
  }, [showTrustFlow, skipTrustFlow, conversationId]);

  // Track trust indicators being viewed
  useEffect(() => {
    if (sessionId) {
      trackTrustMetrics('trust_indicators_viewed', {
        sessionId,
        culturalContext: culturalContext?.region
      });
    }
  }, [sessionId, culturalContext]);

  // Trust flow handlers
  const handleRitualIntroductionComplete = () => {
    trackTrustMetrics('ritual_introduction_completed', {
      culturalContext: culturalContext?.region,
      sessionId: conversationId
    });
    setTrustFlowStep("anonymization");
  };

  const handleAnonymizationComplete = (newSessionId: string) => {
    trackTrustMetrics('anonymization_completed', {
      sessionId: newSessionId,
      culturalContext: culturalContext?.region
    });
    setSessionId(newSessionId);
    setTrustFlowStep("chat");
  };

  // Load conversation history on mount
  const loadConversation = useCallback(async () => {
    // Fetch existing responses
    const { data: existingResponses } = await supabase
      .from("responses")
      .select("content, ai_response, created_at")
      .eq("conversation_session_id", conversationId)
      .order("created_at", { ascending: true });

    // Reconstruct message history if resuming (NO initial greeting)
    if (existingResponses && existingResponses.length > 0) {
      const history = existingResponses.flatMap(r => [
        { role: "user" as const, content: r.content, timestamp: new Date(r.created_at) },
        { role: "assistant" as const, content: r.ai_response || "", timestamp: new Date(r.created_at) }
      ]);
      setMessages(history);
    } else {
      // Start with empty messages - AI will introduce itself on first interaction
      setMessages([]);
    }
  }, [conversationId]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  // Auto-trigger AI introduction when chat is empty
  useEffect(() => {
    const triggerIntroduction = async () => {
      // Only trigger if:
      // 1. Chat is empty (no messages)
      // 2. Trust flow is complete (in chat phase)
      // 3. Not already loading
      if (messages.length === 0 && trustFlowStep === "chat" && !isLoading) {
        setIsLoading(true);
        
        // Show loading state immediately
        console.log('Spradley is preparing introduction...');
        
        try {
          let session = null;
          if (!isPreviewMode) {
            const { data: { session: authSession } } = await supabase.auth.getSession();
            session = authSession;
            if (!session) {
              console.error("No session for introduction");
              setIsLoading(false);
              return;
            }
          }

          // Send a special trigger message to request introduction
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
              },
              body: JSON.stringify({
                conversationId,
                messages: [{ role: "user", content: "[START_CONVERSATION]" }],
                testMode: isPreviewMode,
                themes: isPreviewMode ? previewSurveyData?.themes : undefined,
              }),
            }
          );

          if (!response.ok) {
            throw new Error("Failed to get introduction");
          }

          const { message: aiResponse } = await response.json();
          
          // Add only the AI introduction to messages (not the trigger)
          const introMessage: Message = {
            role: "assistant",
            content: aiResponse,
            timestamp: new Date()
          };
          
          setMessages([introMessage]);
          soundEffects.playSuccess();
        } catch (error) {
          console.error("Error getting AI introduction:", error);
          // Fallback to a default greeting if AI fails
          setMessages([{
            role: "assistant",
            content: "Hi! I'm Spradley, your AI guide. How can I help you today?",
            timestamp: new Date()
          }]);
        } finally {
          setIsLoading(false);
        }
      }
    };

    triggerIntroduction();
  }, [messages.length, trustFlowStep, isLoading, conversationId, isPreviewMode, previewSurveyData]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Play recording start sound
      soundEffects.playRecordStart();
    } catch (error) {
      // Play error sound
      soundEffects.playError();
      
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to use voice input",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Play recording stop sound
      soundEffects.playRecordStop();
      
      // Play processing sound as transcription begins
      soundEffects.playProcessing();
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];

        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({ audio: base64Audio }),
          }
        );

        if (!response.ok) throw new Error("Transcription failed");

        const { text } = await response.json();
        
        // Play success sound
        soundEffects.playSuccess();
        
        setInput(text);
        
        // Auto-send after brief delay to allow user to see transcription
        setTimeout(() => {
          sendMessage();
        }, 500);
      };
    } catch (error) {
      // Play error sound
      soundEffects.playError();
      
      toast({
        title: "Transcription failed",
        description: "Please try again or type your message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
      let session = null;
      if (!isPreviewMode) {
        const { data: { session: authSession } } = await supabase.auth.getSession();
        session = authSession;
        if (!session) {
          throw new Error("Please sign in to continue");
        }
      }


      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            conversationId,
            messages: [...messages, userMessage].map(m => ({
              role: m.role,
              content: m.content
            })),
            testMode: isPreviewMode,
            themes: isPreviewMode ? previewSurveyData?.themes : undefined,
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
        setTimeout(onComplete, 2000);
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
  }, [input, isLoading, conversationId, messages, onComplete, toast, isPreviewMode]);

  // Handle Enter key to send message
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Save and exit conversation
  const handleSaveAndExit = useCallback(() => {
    toast({
      title: "Progress saved",
      description: "You can resume this conversation anytime.",
    });
    setTimeout(onSaveAndExit, 1000);
  }, [onSaveAndExit, toast]);

  // Calculate conversation progress
  const userMessageCount = messages.filter(m => m.role === "user").length;
  const progressPercent = Math.min((userMessageCount / ESTIMATED_TOTAL_QUESTIONS) * 100, PROGRESS_COMPLETE_THRESHOLD);

  // Show trust flow if enabled and not in chat step
  if (showTrustFlow && !skipTrustFlow && trustFlowStep !== "chat") {
    if (trustFlowStep === "introduction") {
      return (
        <RitualIntroduction 
          onComplete={handleRitualIntroductionComplete}
          culturalContext={culturalContext || undefined}
        />
      );
    }
    
    if (trustFlowStep === "anonymization") {
      return (
        <AnonymizationRitual 
          onComplete={handleAnonymizationComplete}
        />
      );
    }
  }

  // If in voice mode, show voice interface
  if (isVoiceMode && trustFlowStep === "chat") {
    return (
      <VoiceInterface
        conversationId={conversationId}
        onSwitchToText={() => setIsVoiceMode(false)}
        onComplete={onComplete}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-[500px] max-h-[80vh] bg-card rounded-lg border border-border/50">
      {/* ARIA Live Region for Screen Readers */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {isRecording && 'Recording your message. Click the microphone again to send.'}
        {isLoading && 'Spradley is typing a response. Please wait.'}
        {messages.length > 0 && messages[messages.length - 1].role === 'assistant' && 'Spradley has responded. Check the conversation for the message.'}
      </div>

      {/* Trust Indicators */}
      {!skipTrustFlow && sessionId && (
        <TrustIndicators sessionId={sessionId} />
      )}

      {/* Voice Mode Promotion Banner - Only show for real employees, not in preview/demo */}
      {!skipTrustFlow && !isPreviewMode && voiceSupported && !isVoiceMode && trustFlowStep === "chat" && (
        <Alert className="mx-4 mt-4 border-[hsl(var(--lime-green))] bg-[hsl(var(--lime-green))]/10">
          <Mic className="h-4 w-4 text-[hsl(var(--lime-green))]" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm">
              Try our new <strong>Voice Mode</strong> for a more natural conversation experience
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsVoiceMode(true)}
              className="ml-4"
            >
              <Mic className="w-3 h-3 mr-2" />
              Switch to Voice
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Progress Indicator with Voice Mode Toggle */}
      <div className="p-3 border-b border-border/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {userMessageCount > 0 && userMessageCount < ESTIMATED_TOTAL_QUESTIONS && `Question ${userMessageCount} of ~${ESTIMATED_TOTAL_QUESTIONS}`}
              {userMessageCount >= 6 && userMessageCount < ESTIMATED_TOTAL_QUESTIONS && " • Almost done!"}
              {userMessageCount >= ESTIMATED_TOTAL_QUESTIONS && "Wrapping up..."}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Voice Mode Toggle - Always visible */}
            {voiceSupported && (
              <Button
                onClick={() => setIsVoiceMode(true)}
                variant="outline"
                size="sm"
                className="h-7 border-[hsl(var(--lime-green))]/50 hover:bg-[hsl(var(--lime-green))]/10"
              >
                <Mic className="h-3 w-3 mr-1 text-[hsl(var(--lime-green))]" />
                Voice Mode
              </Button>
            )}
            <span className="text-sm font-medium">{Math.round(progressPercent)}%</span>
            <Button
              onClick={handleSaveAndExit}
              variant="ghost"
              size="sm"
              className="h-7"
            >
              <Save className="h-3 w-3 mr-1" />
              Save & Exit
            </Button>
          </div>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
      </div>
      
      <ScrollArea className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-3">
          {/* Loading skeleton when AI is preparing introduction */}
          {isLoading && messages.length === 0 && (
            <div className="flex justify-start">
              <div className="bg-[hsl(var(--coral-pink))]/30 rounded-2xl p-4 max-w-md space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Spradley is preparing...
                </p>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <ConversationBubble
              key={index}
              message={message.content}
              isUser={message.role === "user"}
              timestamp={message.timestamp}
            />
          ))}
          
          {/* Loading state for ongoing conversation */}
          {isLoading && messages.length > 0 && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-4 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  {isRecording ? "Recording..." : "Spradley is typing..."}
                </span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border/50 bg-background/95 backdrop-blur-md">
        {/* Suggested Prompts - Show only when input is empty and no messages yet */}
        {!skipTrustFlow && input === "" && userMessageCount === 0 && (
          <div className="mb-4 p-3 bg-muted/30 rounded-2xl border border-border/30">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <span>💬</span> Not sure where to start? Try:
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "I've been feeling...",
                "What's been challenging is...",
                "I'd like to talk about...",
                "Something on my mind lately..."
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(prompt)}
                  className="text-xs px-3 py-1.5 bg-background hover:bg-muted rounded-full border border-border/50 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <Textarea
              aria-label="Type your message to Spradley"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isRecording ? "🎤 Recording..." : isLoading ? "Transcribing..." : "Type or record your message"}
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
              disabled={isLoading || isRecording}
            />
            <p className="absolute bottom-2 right-4 text-xs text-muted-foreground">
              Press Enter to send
            </p>
          </div>
          
          {/* Voice Recording Button */}
          <div className="relative">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isLoading}
              variant={isRecording ? "destructive" : "outline"}
              className={`
                w-14 h-14 flex-shrink-0 transition-all
                ${isRecording ? 'animate-pulse scale-110 shadow-lg shadow-red-500/50' : ''}
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              type="button"
              aria-label={isRecording ? 'Stop recording. Click to send your recorded message.' : 'Start recording. Click to record a voice message.'}
              aria-pressed={isRecording}
            >
              <Mic className={`w-5 h-5 ${isRecording ? 'text-white' : ''}`} />
            </Button>
            {isRecording && (
              <div className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            )}
          </div>
          
          {/* Send Button */}
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            variant="coral"
            className="w-14 h-14 flex-shrink-0 shadow-sm hover:shadow-md"
            aria-label="Send message to Spradley"
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
  );
};
