import { CheckCircle2, Clock, MessageSquare, Shield, Heart, ArrowRight, Plus, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import type { StructuredSummary } from "@/types/interview";

// Re-export for backwards compatibility
export type { StructuredSummary };

interface SummaryReceiptProps {
  conversationId: string;
  structuredSummary: StructuredSummary;
  responseCount: number;
  startTime?: Date;
  // Enhanced completion flow props
  showCompletionFlow?: boolean;
  surveyType?: 'employee_satisfaction' | 'course_evaluation';
  onComplete?: () => void;
  onAddMore?: () => void;
  isLoading?: boolean;
}

export const SummaryReceipt = ({
  conversationId,
  structuredSummary,
  responseCount,
  startTime,
  showCompletionFlow = false,
  surveyType = 'employee_satisfaction',
  onComplete,
  onAddMore,
  isLoading = false,
}: SummaryReceiptProps) => {
  // Calculate duration
  const duration = startTime
    ? Math.round((Date.now() - startTime.getTime()) / 60000)
    : null;

  const isCourseEvaluation = surveyType === 'course_evaluation';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-lg mx-auto"
    >
      <Card className="border-[hsl(var(--lime-green))]/30 bg-gradient-to-br from-[hsl(var(--lime-green))]/5 to-background shadow-lg overflow-hidden">
        {/* Header */}
        <CardHeader className="pb-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            <motion.div 
              className="p-2.5 rounded-full bg-[hsl(var(--lime-green))]/20"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckCircle2 className="h-6 w-6 text-[hsl(var(--lime-green))]" />
            </motion.div>
            <div>
              <h3 className="font-semibold text-xl">Your Voice Has Been Heard</h3>
              <p className="text-sm text-muted-foreground">
                Thank you for sharing your thoughts
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-5 space-y-5">
          {/* Opening acknowledgment - personalized message */}
          {structuredSummary.opening && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="flex items-start gap-3 p-4 rounded-lg bg-[hsl(var(--warm-gold))]/10 border border-[hsl(var(--warm-gold))]/20"
            >
              <Heart className="h-5 w-5 text-[hsl(var(--warm-gold))] mt-0.5 flex-shrink-0" />
              <p className="text-foreground italic leading-relaxed">
                "{structuredSummary.opening}"
              </p>
            </motion.div>
          )}

          {/* Key Points - richer content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                What You Shared
              </span>
            </div>
            <ul className="space-y-3">
              {structuredSummary.keyPoints.map((point, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="mt-2 h-2 w-2 rounded-full bg-[hsl(var(--lime-green))] flex-shrink-0" />
                  <span className="text-sm leading-relaxed text-foreground/90">{point}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Session Details - simplified footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="pt-4 border-t border-border/30"
          >
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-[hsl(var(--lime-green))]" />
                <span className="text-[hsl(var(--lime-green))]">Anonymous</span>
              </div>
              <span className="text-border">•</span>
              <div className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{responseCount} responses</span>
              </div>
              {duration !== null && (
                <>
                  <span className="text-border">•</span>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>~{duration} min</span>
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* What happens next - only shown when showCompletionFlow is true */}
          {showCompletionFlow && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="bg-muted/50 rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                <Heart className="h-5 w-5 text-[hsl(var(--coral-accent))] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-2 text-foreground">What happens next?</p>
                  {isCourseEvaluation ? (
                    <ul className="text-sm text-muted-foreground space-y-1.5">
                      <li>• Your feedback is analyzed with other responses</li>
                      <li>• Instructors review insights to improve the course</li>
                      <li>• Common themes shape future improvements</li>
                    </ul>
                  ) : (
                    <ul className="text-sm text-muted-foreground space-y-1.5">
                      <li>• Your feedback is analyzed with others to find trends</li>
                      <li>• Leadership reviews aggregated insights</li>
                      <li>• Action plans are developed based on common themes</li>
                    </ul>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Action buttons - only shown when showCompletionFlow is true */}
          {showCompletionFlow && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="pt-2 space-y-3"
            >
              <p className="text-sm text-center text-muted-foreground">
                Does this capture everything?
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onAddMore}
                  disabled={isLoading}
                  className="flex-1 gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add more
                </Button>
                <Button
                  variant="coral"
                  onClick={onComplete}
                  disabled={isLoading}
                  className="flex-1 gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      Complete Session
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
