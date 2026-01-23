import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { AIResponseDisplay } from "./AIResponseDisplay";
import { AnswerInput } from "./AnswerInput";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, MessageSquareHeart, SkipForward } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FocusedEvaluationProps {
  surveyId: string;
  conversationSessionId: string;
  onComplete: () => void;
  onSkip?: () => void;
}

const EVALUATION_QUESTIONS = [
  {
    id: "overall",
    question: "Overall, how did you find this conversation compared to traditional surveys?",
    placeholder: "Share your impression...",
  },
  {
    id: "ease",
    question: "Was it easier to express yourself in conversation versus filling out a form?",
    placeholder: "What felt different...",
  },
  {
    id: "understanding",
    question: "Did I understand your responses well, or did you need to rephrase things?",
    placeholder: "How was our back-and-forth...",
  },
  {
    id: "value",
    question: "What would make you want to use Spradley again?",
    placeholder: "Any suggestions...",
  },
];

type EvaluationPhase = "intro" | "rating" | "questions" | "saving" | "complete";

export const FocusedEvaluation = ({
  surveyId,
  conversationSessionId,
  onComplete,
  onSkip,
}: FocusedEvaluationProps) => {
  const { toast } = useToast();
  const [phase, setPhase] = useState<EvaluationPhase>("intro");
  const [quickRating, setQuickRating] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto-advance from intro after a brief pause
  useEffect(() => {
    if (phase === "intro") {
      const timer = setTimeout(() => setPhase("rating"), 1800);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleRatingSelect = (rating: number) => {
    setQuickRating(rating);
    setIsTransitioning(true);
    setTimeout(() => {
      setPhase("questions");
      setIsTransitioning(false);
    }, 300);
  };

  const handleSkipRating = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setPhase("questions");
      setIsTransitioning(false);
    }, 300);
  };

  const saveEvaluation = useCallback(async (allResponses: Record<string, string>, rating: number | null) => {
    setPhase("saving");
    
    try {
      // Get session if authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      // Calculate simple sentiment from responses
      const allText = Object.values(allResponses).join(" ").toLowerCase();
      const positiveWords = ["good", "great", "easy", "natural", "helpful", "better", "love", "excellent", "comfortable"];
      const negativeWords = ["hard", "difficult", "confusing", "bad", "worse", "awkward", "frustrating"];
      
      const positiveCount = positiveWords.filter(w => allText.includes(w)).length;
      const negativeCount = negativeWords.filter(w => allText.includes(w)).length;
      
      let sentiment = "neutral";
      let sentimentScore = 0.5;
      
      if (positiveCount > negativeCount) {
        sentiment = "positive";
        sentimentScore = 0.7 + (positiveCount * 0.05);
      } else if (negativeCount > positiveCount) {
        sentiment = "negative";
        sentimentScore = 0.3 - (negativeCount * 0.05);
      }
      
      // Adjust sentiment based on quick rating if provided
      if (rating !== null) {
        if (rating >= 4) {
          sentiment = "positive";
          sentimentScore = Math.max(sentimentScore, 0.7);
        } else if (rating <= 2) {
          sentiment = "negative";
          sentimentScore = Math.min(sentimentScore, 0.3);
        }
      }

      // Save to database
      const { error } = await supabase.from("spradley_evaluations").insert({
        survey_id: surveyId,
        conversation_session_id: conversationSessionId,
        employee_id: session?.user?.id || null,
        evaluation_responses: Object.entries(allResponses).map(([questionId, answer]) => ({
          question_id: questionId,
          question: EVALUATION_QUESTIONS.find(q => q.id === questionId)?.question || "",
          answer,
        })),
        quick_rating: rating,
        sentiment_analysis: {
          overall: sentiment,
          score: sentimentScore,
        },
        insights: {
          response_count: Object.keys(allResponses).length,
          quick_rating: rating,
          completed_at: new Date().toISOString(),
        },
        duration_seconds: 0, // Could track if needed
      });

      if (error) {
        console.error("Failed to save evaluation:", error);
        toast({
          title: "Couldn't save feedback",
          description: "Your feedback was noted but we had trouble saving it.",
          variant: "destructive",
        });
      }

      setPhase("complete");
      setTimeout(onComplete, 800);
    } catch (error) {
      console.error("Error saving evaluation:", error);
      setPhase("complete");
      setTimeout(onComplete, 800);
    }
  }, [surveyId, conversationSessionId, onComplete, toast]);

  const handleSubmit = useCallback(async () => {
    if (!currentAnswer.trim()) return;

    const questionId = EVALUATION_QUESTIONS[currentQuestionIndex].id;
    const newResponses = { ...responses, [questionId]: currentAnswer };
    setResponses(newResponses);

    setIsTransitioning(true);

    // Short transition delay
    await new Promise(resolve => setTimeout(resolve, 250));

    if (currentQuestionIndex < EVALUATION_QUESTIONS.length - 1) {
      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentAnswer("");
      setIsTransitioning(false);
    } else {
      // All questions answered - save and complete
      await saveEvaluation(newResponses, quickRating);
    }
  }, [currentAnswer, currentQuestionIndex, responses, quickRating, saveEvaluation]);

  const handleSkip = useCallback(() => {
    // Save whatever we have and complete
    if (Object.keys(responses).length > 0) {
      saveEvaluation(responses, quickRating);
    } else {
      onSkip?.();
    }
  }, [responses, quickRating, saveEvaluation, onSkip]);

  const currentQuestion = EVALUATION_QUESTIONS[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex + 1) / EVALUATION_QUESTIONS.length) * 100;

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
      {/* Skip button - always visible except during saving */}
      {phase !== "saving" && phase !== "complete" && (
        <div className="fixed top-6 right-6 z-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground gap-1.5"
          >
            <SkipForward className="h-4 w-4" />
            Skip
          </Button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Intro Phase - Brief transition */}
        {phase === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center gap-6 text-center"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-[hsl(var(--terracotta-primary))] to-[hsl(var(--coral-accent))] flex items-center justify-center"
            >
              <MessageSquareHeart className="h-8 w-8 text-white" />
            </motion.div>
            <h2 className="text-2xl font-semibold text-foreground">
              One more thing...
            </h2>
            <p className="text-muted-foreground max-w-md">
              Help us improve Spradley with a few quick questions
            </p>
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </motion.div>
        )}

        {/* Quick Rating Phase */}
        {phase === "rating" && (
          <motion.div
            key="rating"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center gap-8 text-center max-w-lg"
          >
            <div className="space-y-2">
              <h2 className="text-xl md:text-2xl font-medium text-foreground">
                How would you rate your experience with Spradley?
              </h2>
              <p className="text-sm text-muted-foreground">
                Click to rate, or skip to detailed questions
              </p>
            </div>

            <div className="flex items-center gap-3">
              {[
                { value: 1, emoji: "😟", label: "Poor" },
                { value: 2, emoji: "😕", label: "Fair" },
                { value: 3, emoji: "😐", label: "Okay" },
                { value: 4, emoji: "🙂", label: "Good" },
                { value: 5, emoji: "🤩", label: "Great" },
              ].map((option) => (
                <motion.button
                  key={option.value}
                  onClick={() => handleRatingSelect(option.value)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <span className="text-3xl md:text-4xl">{option.emoji}</span>
                  <span className="text-xs text-muted-foreground">{option.label}</span>
                </motion.button>
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkipRating}
              className="text-muted-foreground"
            >
              Skip to questions →
            </Button>
          </motion.div>
        )}

        {/* Questions Phase */}
        {phase === "questions" && (
          <motion.div
            key="questions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-2xl flex flex-col items-center gap-8"
          >
            {/* Header with progress */}
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {EVALUATION_QUESTIONS.length}
              </p>
              {/* Progress dots */}
              <div className="flex items-center justify-center gap-2">
                {EVALUATION_QUESTIONS.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx <= currentQuestionIndex
                        ? "bg-[hsl(var(--terracotta-primary))]"
                        : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Question display */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <AIResponseDisplay
                  question={currentQuestion.question}
                  isTransitioning={isTransitioning}
                />
              </motion.div>
            </AnimatePresence>

            {/* Answer input */}
            <AnswerInput
              value={currentAnswer}
              onChange={setCurrentAnswer}
              onSubmit={handleSubmit}
              isLoading={isTransitioning}
              placeholder={currentQuestion.placeholder}
              disabled={isTransitioning}
            />

            {/* Helper text */}
            <p className="text-xs text-muted-foreground text-center">
              Your feedback helps improve the experience for everyone
            </p>
          </motion.div>
        )}

        {/* Saving Phase */}
        {phase === "saving" && (
          <motion.div
            key="saving"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--terracotta-primary))]" />
            <p className="text-muted-foreground">Saving your feedback...</p>
          </motion.div>
        )}

        {/* Complete Phase */}
        {phase === "complete" && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[hsl(var(--lime-green))] to-[hsl(var(--butter-yellow))] flex items-center justify-center">
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="text-xl font-medium text-foreground">Thank you!</h2>
            <p className="text-muted-foreground">Your feedback has been recorded</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
