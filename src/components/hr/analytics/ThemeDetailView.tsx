import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Users, MessageSquareQuote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RootCauseCard } from "./RootCauseCard";
import { ThemeInsightCard } from "./ThemeInsightCard";
import { PolarizationBadge } from "./PolarizationBadge";
import { ConfidenceIndicator } from "./ConfidenceIndicator";
import { getHealthConfig } from "./ThemeCard";
import type { ThemeInsight } from "@/hooks/useAnalytics";
import type { ThemeAnalyticsData } from "@/hooks/useThemeAnalytics";

interface ThemeDetailViewProps {
  theme: ThemeInsight;
  enrichedData?: ThemeAnalyticsData;
  onBack: () => void;
}

function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 4) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}

export function ThemeDetailView({ theme, enrichedData, onBack }: ThemeDetailViewProps) {
  const healthScore = enrichedData?.healthIndex ?? theme.avgSentiment;
  const healthStatus = enrichedData?.healthStatus;
  const config = getHealthConfig(healthScore, healthStatus);

  const rootCauses = enrichedData?.rootCauses || [];
  const strengths = enrichedData?.insights.strengths || [];
  const frictions = enrichedData?.insights.frictions || [];
  const responseCount = enrichedData?.responseCount || theme.responseCount;
  const confidence = enrichedData?.confidence ?? 3;
  const polarizationLevel = enrichedData?.polarizationLevel || 'low';
  const polarizationScore = enrichedData?.polarizationScore;

  // Collect quotes from insights as supporting evidence
  const allQuotes = [
    ...theme.keySignals.positives.map(q => ({ text: q, type: 'positive' as const })),
    ...theme.keySignals.concerns.map(q => ({ text: q, type: 'concern' as const })),
  ].slice(0, 5);

  // Escape key to go back
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onBack();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onBack]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Back button */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Theme Landscape
        </Button>
      </motion.div>

      {/* Header - shared layout animation from card */}
      <motion.div
        layoutId={`theme-card-${theme.id}`}
        className={`rounded-2xl bg-gradient-to-br ${config.gradient} p-6`}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <motion.h2
              layoutId={`theme-name-${theme.id}`}
              className="text-xl font-semibold text-foreground"
            >
              {theme.name}
            </motion.h2>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {responseCount} voice{responseCount !== 1 ? 's' : ''}
              </span>
              <ConfidenceIndicator
                level={getConfidenceLevel(confidence)}
                sampleSize={responseCount}
              />
              <PolarizationBadge
                level={polarizationLevel}
                score={polarizationScore}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <motion.span
              layoutId={`theme-score-${theme.id}`}
              className={`text-4xl font-bold ${config.text}`}
            >
              {Math.round(healthScore)}
            </motion.span>
            <motion.div
              layoutId={`theme-status-${theme.id}`}
              className="flex items-center gap-2"
            >
              <span className="text-sm font-medium text-muted-foreground">
                {config.label}
              </span>
              <div className={`w-3 h-3 rounded-full ${config.orb}`} />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Root Causes & Recommendations - PRIMARY SECTION */}
      {rootCauses.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="space-y-3"
        >
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Root Causes & Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rootCauses.map((cause, i) => (
              <RootCauseCard key={i} rootCause={cause} />
            ))}
          </div>
        </motion.section>
      )}

      {/* No root causes fallback */}
      {rootCauses.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground"
        >
          Root cause analysis will appear here after AI analysis runs.
          Make sure you have enough responses and click "Generate Theme Insights" below.
        </motion.div>
      )}

      {/* Strengths & Frictions - Two columns */}
      {(strengths.length > 0 || frictions.length > 0) && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* What's Working */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              What's Working
            </h3>
            {strengths.length > 0 ? (
              <div className="space-y-2">
                {strengths.map((insight, i) => (
                  <ThemeInsightCard key={i} insight={insight} variant="strength" />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No strengths identified yet</p>
            )}
          </div>

          {/* What Needs Attention */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              What Needs Attention
            </h3>
            {frictions.length > 0 ? (
              <div className="space-y-2">
                {frictions.map((insight, i) => (
                  <ThemeInsightCard key={i} insight={insight} variant="friction" />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No frictions identified yet</p>
            )}
          </div>
        </motion.section>
      )}

      {/* Supporting Quotes */}
      {allQuotes.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="space-y-3"
        >
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquareQuote className="h-3.5 w-3.5" />
            Supporting Quotes
          </h3>
          <div className="space-y-2">
            {allQuotes.map((quote, i) => (
              <div
                key={i}
                className={`
                  rounded-lg p-3 text-sm italic text-foreground/80
                  border-l-2
                  ${quote.type === 'positive'
                    ? 'border-l-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/10'
                    : 'border-l-amber-400 bg-amber-50/30 dark:bg-amber-950/10'
                  }
                `}
              >
                "{quote.text}"
              </div>
            ))}
          </div>
        </motion.section>
      )}
    </motion.div>
  );
}
