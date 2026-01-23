import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConversationBubble } from "./ConversationBubble";
import { VoiceInterface } from "./VoiceInterface";
import { Send, Loader2, Mic, CheckCircle, CheckCircle2 } from "lucide-react";
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
import { FinishEarlyConfirmationDialog } from "./FinishEarlyConfirmationDialog";
import { CompletionConfirmationButtons } from "./CompletionConfirmationButtons";
import { SummaryReceipt } from "./SummaryReceipt";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useChatAPI } from "@/hooks/useChatAPI";
import type { ThemeProgress, ThemeCoverage } from "@/types/interview";

interface ChatInterfaceProps {
  conversationId: string;
  onComplete: () => void;
  onSaveAndExit: () => void;
  showTrustFlow?: boolean;
  skipTrustFlow?: boolean;
  publicLinkId?: string;
  minimalUI?: boolean; // Simplified UI for demo mode
}

// Constants
const ESTIMATED_TOTAL_QUESTIONS = 8;
const PROGRESS_COMPLETE_THRESHOLD = 100;

type TrustFlowStep = "introduction" | "anonymization" | "chat" | "complete";

// Simplified completion phase: active, reviewing, or complete
type CompletionPhase = "active" | "reviewing" | "complete";

// Helper function to check if a conversation session is a public link session
const checkIsPublicLinkSession = async (conversationId: string): Promise<boolean> => {
  try {
    const { data: conversationSession } = await supabase
      .from("conversation_sessions")
      .select("public_link_id")
      .eq("id", conversationId)
      .maybeSingle();
    
    return conversationSession?.public_link_id !== null && conversationSession?.public_link_id !== undefined;
  } catch (error) {
    console.error("Error checking public link session:", error);
    return false;
  }
};

// Helper function to get session token, allowing anonymous access for public links
const getSessionForConversation = async (
  conversationId: string, 
  isPreviewMode: boolean,
  publicLinkId?: string
): Promise<{ access_token: string } | null> => {
  // Skip auth check for preview mode or public links
  if (isPreviewMode || publicLinkId) {
    console.log(publicLinkId ? "Public link conversation - allowing anonymous access" : "Preview mode - skipping auth");
    return null;
  }
  
  // Check if this is a public link conversation (fallback if publicLinkId not provided)
  const isPublicLink = await checkIsPublicLinkSession(conversationId);
  
  if (isPublicLink) {
    console.log("Public link conversation detected - allowing anonymous access");
    return null; // Anonymous access allowed for public links
  }
  
  // For regular sessions, require authentication
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("Authentication required for non-public link conversations");
  }
  
  return session;
};

export const ChatInterface = ({ 
  conversationId, 
  onComplete, 
  onSaveAndExit, 
  showTrustFlow = true, 
  skipTrustFlow = false,
  publicLinkId,
  minimalUI = false
}: ChatInterfaceProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { isPreviewMode, previewSurveyData } = usePreviewMode();
  
  const [trustFlowStep, setTrustFlowStep] = useState<TrustFlowStep>(() => {
    if (skipTrustFlow) return "chat";
    if (showTrustFlow === false) return "chat";
    return "introduction";
  });
  const [sessionId, setSessionId] = useState<string>("");
  const [culturalContext, setCulturalContext] = useState<CulturalContext | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  
  // Simplified state machine: use boolean for dialog + phase from isInCompletionPhase
  const [isFinishDialogOpen, setFinishDialogOpen] = useState(false);
  
  // Theme progress from backend (single source of truth)
  const [themeProgress, setThemeProgress] = useState<ThemeProgress | null>(null);
  
  // Derive theme coverage from themeProgress
  const themeCoverage: ThemeCoverage = {
    discussed: themeProgress?.discussedCount ?? 0,
    total: themeProgress?.totalCount ?? 0,
    percentage: themeProgress?.coveragePercent ?? 0,
  };
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Use extracted hooks for message and API management
  const {
    messages,
    input,
    setInput,
    clearInput,
    isLoading,
    setIsLoading,
    isInCompletionPhase,
    setIsInCompletionPhase,
    structuredSummary,
    setStructuredSummary,
    conversationStartTime,
    addMessage,
    removeLastMessage,
    userMessageCount,
  } = useChatMessages({
    conversationId,
    onAutoScroll: () => scrollRef.current?.scrollIntoView({ behavior: "smooth" }),
  });

  const {
    triggerIntroduction,
    sendMessage,
    handleFinalResponse,
    handleConfirmFinishEarly,
    transcribeAudio,
  } = useChatAPI({
    conversationId,
    isPreviewMode,
    previewSurveyData,
    publicLinkId,
    messages,
    input,
    isLoading,
    finishEarlyStep: isFinishDialogOpen ? "confirming" : "none", // Map to legacy format
    themeCoverage,
    setIsLoading,
    addMessage,
    addMessages: (msgs) => msgs.forEach(addMessage),
    removeLastMessage,
    clearInput,
    setInput,
    setIsInCompletionPhase,
    setStructuredSummary,
    onThemeProgressUpdate: setThemeProgress,
    onComplete,
  });

  // Check if browser supports voice
  useEffect(() => {
    const supported = 
      'speechSynthesis' in window &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    setVoiceSupported(supported);
  }, []);

  // Initialize cultural context
  useEffect(() => {
    if (showTrustFlow && !skipTrustFlow && trustFlowStep !== "chat") {
      const context = detectCulturalContext();
      setCulturalContext(context);
      trackTrustMetrics('session_started', {
        culturalContext: context.region,
        sessionId: conversationId
      });
    }
    // Don't override trustFlowStep if already set to "chat"
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

  // Auto-trigger AI introduction when chat is empty
  useEffect(() => {
    if (messages.length === 0 && trustFlowStep === "chat" && !isLoading && conversationId) {
      triggerIntroduction();
    }
  }, [messages.length, trustFlowStep, isLoading, conversationId, triggerIntroduction]);

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
      soundEffects.playRecordStop();
      soundEffects.playProcessing();
    }
  };

  // Handle Enter key to send message
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Theme progress is now updated from backend via onThemeProgressUpdate callback
  // No need for frontend calculation - backend is single source of truth
  
  // For preview mode fallback: estimate theme progress from messages
  useEffect(() => {
    if (isPreviewMode && messages.length > 0 && trustFlowStep === "chat" && !themeProgress) {
      const totalThemes = previewSurveyData?.themes?.length || 0;
      if (totalThemes > 0) {
        const discussed = Math.min(Math.ceil(messages.filter(m => m.role === "user").length / 2), totalThemes);
        setThemeProgress({
          themes: (previewSurveyData?.themes || []).map((t: any, i: number) => ({
            id: t.id || `theme-${i}`,
            name: t.name || `Theme ${i + 1}`,
            discussed: i < discussed,
            current: i === discussed,
            depth: i < discussed ? 50 : 0
          })),
          coveragePercent: (discussed / totalThemes) * 100,
          discussedCount: discussed,
          totalCount: totalThemes
        });
      }
    }
  }, [messages, trustFlowStep, isPreviewMode, previewSurveyData, themeProgress]);

  // Fallback: Generate a basic structured summary from messages if we enter completion
  // phase but don't have a structured summary from the backend
  useEffect(() => {
    if (isInCompletionPhase && !structuredSummary && messages.length > 0) {
      console.log("[ChatInterface] Fallback: Generating structured summary from messages");
      const userMessages = messages.filter(m => m.role === "user");
      const fallbackSummary = {
        opening: "Thank you for taking the time to share your thoughts today.",
        keyPoints: userMessages.slice(-3).map(m => 
          m.content.length > 100 ? m.content.substring(0, 97) + "..." : m.content
        ),
        sentiment: "mixed" as const
      };
      setStructuredSummary(fallbackSummary);
    }
  }, [isInCompletionPhase, structuredSummary, messages, setStructuredSummary]);


  // Handle finish early - trigger confirmation dialog (simplified state)
  const handleFinishEarlyClick = useCallback(() => {
    setFinishDialogOpen(true);
  }, []);

  // Handle completion confirmation via buttons
  const handleCompleteFromButtons = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Send empty string as the final response (user clicked "Complete Survey")
      await handleFinalResponse("");
    } catch (error) {
      console.error("Error completing survey:", error);
      toast({
        title: "Error",
        description: "Failed to complete the survey. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  }, [handleFinalResponse, toast]);

  const handleAddMoreFromButtons = useCallback(() => {
    // Clear the completion phase, structured summary, and allow user to type more
    setIsInCompletionPhase(false);
    setStructuredSummary(null);
    toast({
      title: "Continue sharing",
      description: "You can add more feedback below",
    });
  }, [toast, setStructuredSummary]);

  // Calculate conversation progress
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
    <div className={`flex flex-col bg-card rounded-lg border border-border/50 ${minimalUI ? 'min-h-[400px] max-h-[70vh]' : 'min-h-[500px] max-h-[80vh]'}`}>
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

      {/* Trust Indicators - hide in minimal UI */}
      {!minimalUI && !skipTrustFlow && sessionId && (
        <TrustIndicators sessionId={sessionId} />
      )}

      {/* Voice Mode Promotion Banner - Only show for real employees, not in preview/demo/minimal */}
      {!minimalUI && !skipTrustFlow && !isPreviewMode && voiceSupported && !isVoiceMode && trustFlowStep === "chat" && (
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
      
      {/* Progress Indicator - Simplified for minimal UI */}
      <div className={`border-b border-border/50 ${minimalUI ? 'px-4 py-2' : 'p-3'}`}>
        {minimalUI ? (
          // Minimal progress bar only
          <div className="flex items-center gap-3">
            <Progress value={progressPercent} className="h-1.5 flex-1" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">{Math.round(progressPercent)}%</span>
          </div>
        ) : (
          // Full progress header
          <>
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
                  onClick={handleFinishEarlyClick}
                  variant="ghost"
                  size="sm"
                  className="h-7"
                  disabled={isFinishDialogOpen || isLoading}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Finish Early
                </Button>
              </div>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
          </>
        )}
      </div>
      
      <ScrollArea className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-3">
          {/* Summary Receipt - shown when in completion phase with structured summary */}
          {isInCompletionPhase && structuredSummary && (
            <SummaryReceipt
              conversationId={conversationId}
              structuredSummary={structuredSummary}
              responseCount={userMessageCount}
              startTime={conversationStartTime}
            />
          )}
          
          {/* Fallback completion phase indicator - shown only when no structured summary */}
          {!minimalUI && isInCompletionPhase && !structuredSummary && (
            <Alert className="mx-4 mb-2 border-[hsl(var(--lime-green))] bg-[hsl(var(--lime-green))]/10">
              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--lime-green))]" />
              <AlertDescription>
                Almost done! Please review the summary and add any final thoughts.
              </AlertDescription>
            </Alert>
          )}
          
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

      {/* Completion Confirmation Buttons */}
      {isInCompletionPhase && messages.length > 0 && (
        <CompletionConfirmationButtons
          onComplete={handleCompleteFromButtons}
          onAddMore={handleAddMoreFromButtons}
          isLoading={isLoading}
        />
      )}

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

      {/* Finish Early Confirmation Dialog */}
      <FinishEarlyConfirmationDialog
        open={isFinishDialogOpen}
        onConfirm={handleConfirmFinishEarly}
        onCancel={() => setFinishDialogOpen(false)}
        themeCoverage={themeCoverage}
        exchangeCount={userMessageCount}
        minExchanges={4}
      />
    </div>
  );
};
