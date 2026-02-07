import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EvidenceTrail } from "./EvidenceTrail";
import { NarrativeInsight } from "@/hooks/useNarrativeReports";
import { useBookmarkedInsights } from "@/hooks/useBookmarkedInsights";
import { CONFIDENCE_CONFIG } from "@/lib/reportDesignSystem";
import { cn } from "@/lib/utils";

interface InsightCardProps {
  insight: NarrativeInsight;
  colorClass?: string;
  accentColor?: string;
  surveyId?: string;
  chapterKey?: string;
}

export function InsightCard({ insight, colorClass, accentColor, surveyId, chapterKey }: InsightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isBookmarked, getBookmarkId, addBookmark, removeBookmark } = useBookmarkedInsights(surveyId ?? null);

  const starred = isBookmarked(insight.text);

  const toggleBookmark = () => {
    if (starred) {
      const id = getBookmarkId(insight.text);
      if (id) removeBookmark.mutate(id);
    } else if (surveyId) {
      addBookmark.mutate({
        survey_id: surveyId,
        insight_text: insight.text,
        insight_category: insight.category || null,
        agreement_percentage: insight.agreement_percentage || null,
        chapter_key: chapterKey || null,
      });
    }
  };

  const confidenceLabel = CONFIDENCE_CONFIG.labels[insight.confidence] || 'Good';
  const confidenceColors = CONFIDENCE_CONFIG.colors[insight.confidence] || CONFIDENCE_CONFIG.colors[3];

  const agreementPercentage = insight.agreement_percentage;
  const sampleSize = insight.sample_size;
  const hasAgreementData = typeof agreementPercentage === 'number' && agreementPercentage > 0;
  const hasEvidence = insight.evidence_ids && insight.evidence_ids.length > 0;

  const getAgreementColor = (pct: number) => {
    if (pct >= 70) return "text-emerald-600 dark:text-emerald-400";
    if (pct >= 50) return "text-amber-600 dark:text-amber-400";
    return "text-rose-600 dark:text-rose-400";
  };

  return (
    <Card 
      className={cn(
        "rounded-xl border-0 shadow-sm hover:shadow-md transition-all duration-200",
        "bg-gradient-to-br from-card to-card/80",
        colorClass
      )}
    >
      <div className="p-5 relative">
        {/* Bookmark star button */}
        {surveyId && (
          <button
            onClick={toggleBookmark}
            className="absolute top-4 right-4 p-1 rounded-md hover:bg-muted/50 transition-colors"
            aria-label={starred ? "Remove bookmark" : "Bookmark insight"}
          >
            <Star className={cn(
              "h-4 w-4 transition-colors",
              starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40 hover:text-muted-foreground"
            )} />
          </button>
        )}

        {/* Main content: horizontal layout when agreement data exists */}
        {hasAgreementData ? (
          <div className="flex gap-5">
            {/* Agreement % - primary visual */}
            <div className="flex-shrink-0 flex flex-col items-center justify-center min-w-[64px]">
              <span className={cn("text-2xl font-bold tabular-nums", getAgreementColor(agreementPercentage!))}>
                {agreementPercentage}%
              </span>
              <span className="text-xs text-muted-foreground">agree</span>
              {sampleSize && (
                <span className="text-xs text-muted-foreground/60 mt-0.5">
                  n={sampleSize}
                </span>
              )}
            </div>

            {/* Insight text + metadata */}
            <div className="flex-1 space-y-3">
              <p className="text-base font-medium leading-relaxed tracking-[-0.01em]">
                {insight.text}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={cn("text-xs font-medium border-0", confidenceColors.bg, confidenceColors.text)}
                >
                  {confidenceLabel} confidence
                </Badge>
                {insight.category && (
                  <Badge variant="secondary" className="text-xs font-normal">
                    {insight.category}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Fallback: full-width text layout */
          <div className="space-y-3">
            <p className="text-base font-medium leading-relaxed tracking-[-0.01em]">
              {insight.text}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge 
                variant="outline" 
                className={cn("text-xs font-medium border-0", confidenceColors.bg, confidenceColors.text)}
              >
                {confidenceLabel} confidence
              </Badge>
              {insight.category && (
                <Badge variant="secondary" className="text-xs font-normal">
                  {insight.category}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Evidence toggle */}
        {hasEvidence && (
          <div className="pt-3 mt-3 border-t border-muted/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs h-auto py-1.5 px-3 text-muted-foreground hover:text-foreground gap-1.5"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  Hide supporting quotes
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  View supporting quotes ({insight.evidence_ids!.length})
                </>
              )}
            </Button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 pl-3 border-l-2 border-muted mt-3">
                    <EvidenceTrail evidenceIds={insight.evidence_ids!} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Card>
  );
}
