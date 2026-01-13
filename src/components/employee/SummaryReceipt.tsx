import { CheckCircle2, Clock, MessageSquare, Shield, Tag } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

export interface StructuredSummary {
  keyPoints: string[];
  sentiment: "positive" | "mixed" | "negative";
}

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
  // Fetch themes covered in this conversation
  const { data: themes = [] } = useQuery({
    queryKey: ["receipt-themes", conversationId],
    queryFn: async () => {
      const { data } = await supabase
        .from("responses")
        .select("theme_id, survey_themes(name)")
        .eq("conversation_session_id", conversationId)
        .not("theme_id", "is", null);

      if (!data) return [];

      // Extract unique theme names
      const uniqueThemes = [
        ...new Set(
          data
            .map((r: any) => r.survey_themes?.name)
            .filter(Boolean)
        ),
      ];
      return uniqueThemes as string[];
    },
    staleTime: 30000,
  });

  // Calculate duration
  const duration = startTime
    ? Math.round((Date.now() - startTime.getTime()) / 60000)
    : null;

  const sentimentColor = {
    positive: "text-[hsl(var(--lime-green))]",
    mixed: "text-[hsl(var(--warm-gold))]",
    negative: "text-[hsl(var(--coral-pink))]",
  }[structuredSummary.sentiment];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className="border-[hsl(var(--lime-green))]/30 bg-gradient-to-br from-[hsl(var(--lime-green))]/5 to-background shadow-lg overflow-hidden">
        {/* Header */}
        <CardHeader className="pb-3 border-b border-border/30">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-[hsl(var(--lime-green))]/20">
              <CheckCircle2 className="h-5 w-5 text-[hsl(var(--lime-green))]" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Your Feedback Summary</h3>
              <p className="text-sm text-muted-foreground">
                Here's what we captured
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-5">
          {/* Topics Covered */}
          {themes.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Topics Covered
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {themes.map((theme, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-[hsl(var(--coral-pink))]/10 text-[hsl(var(--coral-pink))] border-[hsl(var(--coral-pink))]/30 hover:bg-[hsl(var(--coral-pink))]/20"
                  >
                    {theme}
                  </Badge>
                ))}
              </div>
            </motion.div>
          )}

          {/* Key Points */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                What You Shared
              </span>
            </div>
            <ul className="space-y-2">
              {structuredSummary.keyPoints.map((point, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[hsl(var(--lime-green))] flex-shrink-0" />
                  <span className="text-sm leading-relaxed">{point}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Session Details */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="pt-4 border-t border-border/30"
          >
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{responseCount} responses</span>
              </div>
              {duration !== null && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>~{duration} min</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-[hsl(var(--lime-green))]" />
                <span className="text-[hsl(var(--lime-green))]">Anonymous</span>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
