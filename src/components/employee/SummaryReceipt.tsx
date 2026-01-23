import { CheckCircle2, Clock, MessageSquare, Shield, Heart } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { motion } from "framer-motion";
import type { StructuredSummary } from "@/types/interview";

// Re-export for backwards compatibility
export type { StructuredSummary };

interface SummaryReceiptProps {
  conversationId: string;
  structuredSummary: StructuredSummary;
  responseCount: number;
  startTime?: Date;
}

export const SummaryReceipt = ({
  conversationId,
  structuredSummary,
  responseCount,
  startTime,
}: SummaryReceiptProps) => {
  // Calculate duration
  const duration = startTime
    ? Math.round((Date.now() - startTime.getTime()) / 60000)
    : null;

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
        </CardContent>
      </Card>
    </motion.div>
  );
};
