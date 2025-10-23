import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MoodDial } from "@/components/employee/MoodDial";
import { ChatInterface } from "@/components/employee/ChatInterface";
import { AnonymizationBanner } from "@/components/employee/AnonymizationBanner";
import { ConsentModal } from "@/components/employee/ConsentModal";
import { ClosingRitual } from "@/components/employee/ClosingRitual";
import { ChatErrorBoundary } from "@/components/employee/ChatErrorBoundary";
import { VisibleCommitments } from "@/components/employee/VisibleCommitments";
import { SurveyHistory } from "@/components/employee/SurveyHistory";
import { SurveyUpdates } from "@/components/employee/SurveyUpdates";
import { ConsentHistory } from "@/components/employee/ConsentHistory";
import { useConversation } from "@/hooks/useConversation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LogOut, MessageSquare, PlayCircle } from "lucide-react";

type ConversationStep = "consent" | "mood" | "chat" | "closing" | "complete";

const EmployeeDashboard = () => {
  const [step, setStep] = useState<ConversationStep>("consent");
  const [surveyId, setSurveyId] = useState<string | null>(null);
  const [surveyDetails, setSurveyDetails] = useState<any>(null);
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [mood, setMood] = useState(50);
  const { conversationId, startConversation, endConversation } = useConversation();
  const { toast } = useToast();

  useEffect(() => {
    loadActiveSurvey();
  }, []);

  const loadActiveSurvey = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check for active conversation to resume
    const { data: activeSession } = await supabase
      .from("conversation_sessions")
      .select("id, survey_id, initial_mood, surveys(consent_config, first_message)")
      .eq("employee_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (activeSession) {
      // Resume existing conversation
      setSurveyId(activeSession.survey_id);
      setSurveyDetails(activeSession.surveys);
      setMood(activeSession.initial_mood || 50);
      // Skip consent and mood selection, go straight to chat
      setStep("chat");
      
      toast({
        title: "Conversation Resumed",
        description: "Continuing your active feedback session.",
      });
      return;
    }

    // Look for new pending surveys
    const { data: assignments } = await supabase
      .from("survey_assignments")
      .select("id, survey_id, surveys(id, consent_config, first_message)")
      .eq("employee_id", user.id)
      .eq("status", "pending");

    if (assignments && assignments.length > 0) {
      const assignment = assignments[0];
      setSurveyId(assignment.survey_id);
      setAssignmentId(assignment.id);
      setSurveyDetails(assignment.surveys);
    }
  };

  const handleConsent = async () => {
    if (!surveyId || !surveyDetails) return;

    // Log consent to consent_history table
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("consent_history").insert({
        user_id: user.id,
        survey_id: surveyId,
        anonymization_level: surveyDetails?.consent_config?.anonymization_level || "anonymous",
        data_retention_days: surveyDetails?.consent_config?.data_retention_days || 60,
      });
    }

    setStep("mood");
  };

  const handleDecline = async () => {
    toast({
      title: "Thank you",
      description: "You can participate whenever you're ready.",
    });
    await supabase.auth.signOut();
  };

  const handleMoodSelect = async (selectedMood: number) => {
    setMood(selectedMood);
    if (!surveyId) return;

    const sessionId = await startConversation(surveyId, selectedMood);
    if (sessionId) {
      setStep("chat");
    }
  };

  const handleChatComplete = () => {
    setStep("closing");
  };

  const handleComplete = async (finalMood: number) => {
    await endConversation(finalMood);
    
    // Mark assignment as completed
    if (assignmentId) {
      await supabase
        .from("survey_assignments")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", assignmentId);
    }

    setStep("complete");
    
    toast({
      title: "Thank you!",
      description: "Your feedback has been recorded.",
    });

    setTimeout(() => {
      supabase.auth.signOut();
    }, 3000);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleSaveAndExit = () => {
    handleSignOut();
  };

  if (!surveyId) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Your Feedback Hub</h1>
              <p className="text-muted-foreground mt-1">Track your participation and see our commitments</p>
            </div>
            <Button onClick={handleSignOut} variant="ghost" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>

          <div className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-6 text-center">
              <div className="bg-muted rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold mb-2">No Active Surveys</h2>
              <p className="text-muted-foreground">
                You don't have any surveys assigned right now. Check back later for new feedback opportunities.
              </p>
            </div>

            <Tabs defaultValue="updates" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="updates">Updates</TabsTrigger>
                <TabsTrigger value="commitments">Commitments</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="consent">Privacy</TabsTrigger>
              </TabsList>

              <TabsContent value="updates">
                <SurveyUpdates />
              </TabsContent>

              <TabsContent value="commitments">
                <VisibleCommitments />
              </TabsContent>

              <TabsContent value="history">
                <SurveyHistory />
              </TabsContent>

              <TabsContent value="consent">
                <ConsentHistory />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Feedback Session</h1>
            <p className="text-muted-foreground mt-1">Your voice matters</p>
          </div>
          <Button onClick={handleSignOut} variant="ghost" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <AnonymizationBanner />

        {step === "chat" && (
          <Alert className="mt-6 border-primary/50 bg-primary/10">
            <PlayCircle className="h-4 w-4" />
            <AlertDescription>
              You have an active conversation in progress. Your responses are being saved automatically.
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-8">
          {step === "consent" && (
            <ConsentModal
              open={true}
              consentMessage={surveyDetails?.consent_config?.consent_message}
              anonymizationLevel={surveyDetails?.consent_config?.anonymization_level}
              dataRetentionDays={surveyDetails?.consent_config?.data_retention_days}
              onConsent={handleConsent}
              onDecline={handleDecline}
            />
          )}

          {step === "mood" && (
            <MoodDial onMoodSelect={handleMoodSelect} />
          )}

          {step === "chat" && conversationId && (
            <ChatErrorBoundary conversationId={conversationId} onExit={handleSaveAndExit}>
              <ChatInterface 
                conversationId={conversationId}
                onComplete={handleChatComplete}
                onSaveAndExit={handleSaveAndExit}
              />
            </ChatErrorBoundary>
          )}

          {step === "closing" && conversationId && (
            <ClosingRitual 
              initialMood={mood} 
              conversationId={conversationId}
              onComplete={handleComplete} 
            />
          )}

          {step === "complete" && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-2">Session Complete</h2>
              <p className="text-muted-foreground">Redirecting...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
