import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { AIResponseDisplay } from "./AIResponseDisplay";
import { AnswerInput } from "./AnswerInput";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquareHeart, SkipForward, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEvaluationLLM } from "@/hooks/useEvaluationLLM";
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

type EvaluationPhase = "intro" | "rating" | "questions" | "probe" | "saving" | "complete";

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
  
  // LLM-generated content
  const [llmEmpathy, setLlmEmpathy] = useState<string | null>(null);
  const [probeQuestion, setProbeQuestion] = useState<string | null>(null);
  const [probeAnswer, setProbeAnswer] = useState("");
  const [currentDimensionForProbe, setCurrentDimensionForProbe] = useState<string | null>(null);

  // Use provided context or create default
  const context = useMemo(() => interviewContext || createDefaultContext(), [interviewContext]);

  // LLM hook for generating follow-ups
  const {
    generateFollowUp,
    recordProbeAnswer,
    getCollectedInsights,
    isGenerating,
  } = useEvaluationLLM({
    surveyId,
    conversationSessionId,
    interviewContext: context,
    quickRating,
  });

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

  const saveEvaluation = useCallback(async (
    allResponses: Record<string, string>, 
    allQuestionsAsked: Record<string, string>, 
    rating: number | null
  ) => {
    setPhase("saving");
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { sentiment, sentimentScore } = calculateEvaluationSentiment(allResponses, rating);
      const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
      const evaluationResponses = buildEvaluationResponses(allResponses, allQuestionsAsked);
      
      // Include LLM-collected insights
      const llmInsights = getCollectedInsights();

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
          llm_insights: llmInsights,
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
  }, [surveyId, conversationSessionId, context, startTime, onComplete, toast, getCollectedInsights]);

  const moveToNextQuestion = useCallback(async (
    newResponses: Record<string, string>,
    newQuestionsAsked: Record<string, string>
  ) => {
    if (currentQuestionIndex < EVALUATION_DIMENSIONS.length - 1) {
      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentAnswer("");
      setLlmEmpathy(null);
      setProbeQuestion(null);
      setIsTransitioning(false);
      setPhase("questions");
    } else {
      // All questions answered - save and complete
      await saveEvaluation(newResponses, newQuestionsAsked, quickRating);
    }
  }, [currentQuestionIndex, quickRating, saveEvaluation]);

  const handleSubmit = useCallback(async () => {
    if (!currentAnswer.trim()) return;

    const dimensionId = currentQuestion.dimensionId;
    const newResponses = { ...responses, [dimensionId]: currentAnswer };
    const newQuestionsAsked = { ...questionsAsked, [dimensionId]: currentQuestion.question };
    
    setResponses(newResponses);
    setQuestionsAsked(newQuestionsAsked);
    setIsTransitioning(true);

    // Generate LLM follow-up
    const followUp = await generateFollowUp(
      dimensionId,
      currentQuestion.dimensionName,
      currentAnswer,
      responses
    );

    setLlmEmpathy(followUp.empathy);

    // Check if we should probe deeper
    if (followUp.shouldProbeDeeper && followUp.probeQuestion) {
      setProbeQuestion(followUp.probeQuestion);
      setCurrentDimensionForProbe(dimensionId);
      setIsTransitioning(false);
      setPhase("probe");
    } else {
      // Short pause to show empathy, then move on
      await new Promise(resolve => setTimeout(resolve, 800));
      await moveToNextQuestion(newResponses, newQuestionsAsked);
    }
  }, [currentAnswer, currentQuestion, responses, questionsAsked, generateFollowUp, moveToNextQuestion]);

  const handleProbeSubmit = useCallback(async () => {
    if (!probeAnswer.trim()) return;

    setIsTransitioning(true);
    
    // Record the probe answer
    recordProbeAnswer(probeAnswer);
    
    // Add probe answer to the dimension's response
    if (currentDimensionForProbe) {
      const enhancedResponse = `${responses[currentDimensionForProbe]}\n\n[Follow-up: ${probeQuestion}]\n${probeAnswer}`;
      setResponses(prev => ({
        ...prev,
        [currentDimensionForProbe]: enhancedResponse,
      }));
    }

    setProbeAnswer("");
    setProbeQuestion(null);
    setCurrentDimensionForProbe(null);

    // Small pause then continue
    await new Promise(resolve => setTimeout(resolve, 300));
    await moveToNextQuestion(responses, questionsAsked);
  }, [probeAnswer, probeQuestion, currentDimensionForProbe, responses, questionsAsked, recordProbeAnswer, moveToNextQuestion]);

  const handleSkipProbe = useCallback(async () => {
    setProbeQuestion(null);
    setCurrentDimensionForProbe(null);
    setProbeAnswer("");
    await moveToNextQuestion(responses, questionsAsked);
  }, [responses, questionsAsked, moveToNextQuestion]);

  const handleSkip = useCallback(() => {
    if (Object.keys(responses).length > 0) {
      saveEvaluation(responses, questionsAsked, quickRating);
    } else {
      onSkip?.();
    }
  }, [responses, questionsAsked, quickRating, saveEvaluation, onSkip]);

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
        {/* Intro Phase */}
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

            {/* LLM Empathy from previous answer */}
            <AnimatePresence mode="wait">
              {llmEmpathy && (
                <motion.p
                  key="llm-empathy"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-muted-foreground italic"
                >
                  {llmEmpathy}
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
                  isTransitioning={isTransitioning || isGenerating}
                />
              </motion.div>
            </AnimatePresence>

            {/* Answer input */}
            <AnswerInput
              value={currentAnswer}
              onChange={setCurrentAnswer}
              onSubmit={handleSubmit}
              isLoading={isTransitioning || isGenerating}
              placeholder={currentQuestion.placeholder}
              disabled={isTransitioning || isGenerating}
            />

            {isGenerating && (
              <p className="text-xs text-muted-foreground animate-pulse">
                Thinking...
              </p>
            )}

            <p className="text-xs text-muted-foreground text-center">
              Your feedback helps improve the experience for everyone
            </p>
          </motion.div>
        )}

        {/* Probe Phase - LLM-generated follow-up question */}
        {phase === "probe" && probeQuestion && (
          <motion.div
            key="probe"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-2xl flex flex-col items-center gap-6"
          >
            {/* Empathy acknowledgment */}
            {llmEmpathy && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-base text-foreground/80"
              >
                {llmEmpathy}
              </motion.p>
            )}

            {/* Probe question */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <AIResponseDisplay
                question={probeQuestion}
                isTransitioning={isTransitioning}
              />
            </motion.div>

            {/* Probe answer input */}
            <AnswerInput
              value={probeAnswer}
              onChange={setProbeAnswer}
              onSubmit={handleProbeSubmit}
              isLoading={isTransitioning}
              placeholder="Tell me more..."
              disabled={isTransitioning}
            />

            {/* Skip probe option */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkipProbe}
              className="text-muted-foreground gap-1"
            >
              Continue <ArrowRight className="h-3 w-3" />
            </Button>
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
