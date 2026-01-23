import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { AIResponseDisplay } from "./AIResponseDisplay";
import { AnswerInput } from "./AnswerInput";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquareHeart, SkipForward } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  InterviewContext,
  EVALUATION_DIMENSIONS,
  getContextualQuestion,
  buildEvaluationResponses,
  calculateEvaluationSentiment,
  createDefaultContext,
} from "@/utils/evaluationQuestions";

interface FocusedEvaluationProps {
  surveyId: string;
  conversationSessionId: string;
  interviewContext?: InterviewContext;
  onComplete: () => void;
  onSkip?: () => void;
}

type EvaluationPhase = "intro" | "rating" | "questions" | "saving" | "complete";

export const FocusedEvaluation = ({
  surveyId,
  conversationSessionId,
  interviewContext,
  onComplete,
  onSkip,
}: FocusedEvaluationProps) => {
  const { toast } = useToast();
  const [phase, setPhase] = useState<EvaluationPhase>("intro");
  const [quickRating, setQuickRating] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [questionsAsked, setQuestionsAsked] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [startTime] = useState<number>(Date.now());

  // Use provided context or create default
  const context = useMemo(() => interviewContext || createDefaultContext(), [interviewContext]);

  // Auto-advance from intro after a brief pause
  useEffect(() => {
    if (phase === "intro") {
      const timer = setTimeout(() => setPhase("rating"), 1800);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Get current question dynamically based on context
  const currentQuestion = useMemo(() => {
    return getContextualQuestion(
      currentQuestionIndex,
      context,
      responses,
      quickRating
    );
  }, [currentQuestionIndex, context, responses, quickRating]);

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

  const saveEvaluation = useCallback(async (allResponses: Record<string, string>, allQuestionsAsked: Record<string, string>, rating: number | null) => {
    setPhase("saving");
    
    try {
      // Get session if authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      // Calculate sentiment using utility function
      const { sentiment, sentimentScore } = calculateEvaluationSentiment(allResponses, rating);
      
      // Calculate duration
      const durationSeconds = Math.floor((Date.now() - startTime) / 1000);

      // Build structured evaluation responses
      const evaluationResponses = buildEvaluationResponses(allResponses, allQuestionsAsked);

      // Save to database
      const { error } = await supabase.from("spradley_evaluations").insert({
        survey_id: surveyId,
        conversation_session_id: conversationSessionId,
        employee_id: session?.user?.id || null,
        evaluation_responses: JSON.parse(JSON.stringify(evaluationResponses)),
        overall_sentiment: sentiment,
        sentiment_score: sentimentScore,
        key_insights: JSON.parse(JSON.stringify({
          response_count: Object.keys(allResponses).length,
          quick_rating: rating,
          interview_context: context,
        })),
        duration_seconds: durationSeconds,
        completed_at: new Date().toISOString(),
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
  }, [surveyId, conversationSessionId, context, startTime, onComplete, toast]);

  const handleSubmit = useCallback(async () => {
    if (!currentAnswer.trim()) return;

    const dimensionId = currentQuestion.dimensionId;
    const newResponses = { ...responses, [dimensionId]: currentAnswer };
    const newQuestionsAsked = { ...questionsAsked, [dimensionId]: currentQuestion.question };
    
    setResponses(newResponses);
    setQuestionsAsked(newQuestionsAsked);

    setIsTransitioning(true);

    // Short transition delay
    await new Promise(resolve => setTimeout(resolve, 250));

    if (currentQuestionIndex < EVALUATION_DIMENSIONS.length - 1) {
      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentAnswer("");
      setIsTransitioning(false);
    } else {
      // All questions answered - save and complete
      await saveEvaluation(newResponses, newQuestionsAsked, quickRating);
    }
  }, [currentAnswer, currentQuestionIndex, currentQuestion, responses, questionsAsked, quickRating, saveEvaluation]);

  const handleSkip = useCallback(() => {
    // Save whatever we have and complete
    if (Object.keys(responses).length > 0) {
      saveEvaluation(responses, questionsAsked, quickRating);
    } else {
      onSkip?.();
    }
  }, [responses, questionsAsked, quickRating, saveEvaluation, onSkip]);

  const progressPercentage = ((currentQuestionIndex + 1) / EVALUATION_DIMENSIONS.length) * 100;

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
                Question {currentQuestionIndex + 1} of {EVALUATION_DIMENSIONS.length}
              </p>
              {/* Progress dots */}
              <div className="flex items-center justify-center gap-2">
                {EVALUATION_DIMENSIONS.map((_, idx) => (
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

            {/* Empathy acknowledgment from previous answer */}
            <AnimatePresence mode="wait">
              {currentQuestion.empathy && (
                <motion.p
                  key={`empathy-${currentQuestionIndex}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-muted-foreground italic"
                >
                  {currentQuestion.empathy}
                </motion.p>
              )}
            </AnimatePresence>

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
