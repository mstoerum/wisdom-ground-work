import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MoodDial } from "@/components/employee/MoodDial";
import { ChatInterface } from "@/components/employee/ChatInterface";
import { AnonymizationBanner } from "@/components/employee/AnonymizationBanner";
import { ConsentModal } from "@/components/employee/ConsentModal";
import { ClosingRitual } from "@/components/employee/ClosingRitual";
import { useConversation } from "@/hooks/useConversation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

type ConversationStep = "consent" | "mood" | "chat" | "closing" | "complete";

const EmployeeDashboard = () => {
  const [step, setStep] = useState<ConversationStep>("consent");
  const [surveyId, setSurveyId] = useState<string | null>(null);
  const [mood, setMood] = useState(50);
  const { conversationId, startConversation, endConversation } = useConversation();
  const { toast } = useToast();

  useEffect(() => {
    loadActiveSurvey();
  }, []);

  const loadActiveSurvey = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: assignments } = await supabase
      .from("survey_assignments")
      .select("survey_id")
      .eq("employee_id", user.id);

    if (assignments && assignments.length > 0) {
      const { data: survey } = await supabase
        .from("surveys")
        .select("id")
        .eq("id", assignments[0].survey_id)
        .eq("status", "active")
        .maybeSingle();

      if (survey) {
        setSurveyId(survey.id);
      }
    }
  };

  const handleConsent = () => {
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

  const handleComplete = async () => {
    await endConversation(mood);
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

  if (!surveyId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">No Active Surveys</h1>
          <p className="text-muted-foreground mb-4">
            There are currently no surveys assigned to you.
          </p>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
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

        <div className="mt-8">
          {step === "consent" && (
            <ConsentModal
              open={true}
              onConsent={handleConsent}
              onDecline={handleDecline}
            />
          )}

          {step === "mood" && (
            <MoodDial onMoodSelect={handleMoodSelect} />
          )}

          {step === "chat" && conversationId && (
            <ChatInterface
              conversationId={conversationId}
              onComplete={handleChatComplete}
            />
          )}

          {step === "closing" && (
            <ClosingRitual onComplete={handleComplete} />
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
