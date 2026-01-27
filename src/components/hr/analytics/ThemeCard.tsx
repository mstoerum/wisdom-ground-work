import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Users } from "lucide-react";
import { ThemeInsightCard } from "./ThemeInsightCard";
import { RootCauseCard } from "./RootCauseCard";
import type { ThemeInsight } from "@/hooks/useAnalytics";
import type { ThemeAnalyticsData, SemanticInsight } from "@/hooks/useThemeAnalytics";

interface ThemeCardProps {
  theme: ThemeInsight;
  enrichedData?: ThemeAnalyticsData;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
}

// Health status configuration
const getHealthConfig = (health: number, status?: string) => {
  if (health >= 80) return {
    gradient: "from-emerald-50/60 to-white dark:from-emerald-950/20 dark:to-card",
    border: "border-l-emerald-400",
    orb: "bg-emerald-500",
    bar: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
    label: status || "Thriving",
    pulse: false,
  };
  if (health >= 60) return {
    gradient: "from-teal-50/60 to-white dark:from-teal-950/20 dark:to-card",
    border: "border-l-teal-400",
    orb: "bg-teal-500",
    bar: "bg-teal-500",
    text: "text-teal-700 dark:text-teal-400",
    label: status || "Growing",
    pulse: false,
  };
  if (health >= 45) return {
    gradient: "from-amber-50/60 to-white dark:from-amber-950/20 dark:to-card",
    border: "border-l-amber-400",
    orb: "bg-amber-500",
    bar: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
    label: status || "Emerging",
    pulse: false,
  };
  if (health >= 30) return {
    gradient: "from-orange-50/60 to-white dark:from-orange-950/20 dark:to-card",
    border: "border-l-orange-400",
    orb: "bg-orange-500",
    bar: "bg-orange-500",
    text: "text-orange-700 dark:text-orange-400",
    label: status || "Challenged",
    pulse: false,
  };
  return {
    gradient: "from-rose-50/60 to-white dark:from-rose-950/20 dark:to-card",
    border: "border-l-rose-400",
    orb: "bg-rose-500",
    bar: "bg-rose-500",
    text: "text-rose-700 dark:text-rose-400",
    label: status || "Critical",
    pulse: true,
  };
};

// Get representative quote based on health
const getRepresentativeQuote = (
  theme: ThemeInsight,
  enrichedData?: ThemeAnalyticsData,
  health?: number
): string | null => {
  const isHealthy = (health ?? 50) >= 50;

  // Try AI-enriched insights first
  if (enrichedData) {
    if (isHealthy && enrichedData.insights.strengths.length > 0) {
      return enrichedData.insights.strengths[0].text;
    }
    if (!isHealthy && enrichedData.insights.frictions.length > 0) {
      return enrichedData.insights.frictions[0].text;
    }
  }

  // Fallback to key signals
  if (isHealthy && theme.keySignals.positives.length > 0) {
    return theme.keySignals.positives[0];
  }
  if (!isHealthy && theme.keySignals.concerns.length > 0) {
    return theme.keySignals.concerns[0];
  }

  // Last resort: any available quote
  return theme.keySignals.positives[0] || theme.keySignals.concerns[0] || null;
};

export function ThemeCard({ theme, enrichedData, isExpanded, onToggle, index }: ThemeCardProps) {
  const healthScore = enrichedData?.healthIndex ?? theme.avgSentiment;
  const healthStatus = enrichedData?.healthStatus;
  const config = getHealthConfig(healthScore, healthStatus);
  const representativeQuote = getRepresentativeQuote(theme, enrichedData, healthScore);

  // Get insights for expanded state
  const strengths: SemanticInsight[] = enrichedData?.insights.strengths || [];
  const frictions: SemanticInsight[] = enrichedData?.insights.frictions || [];
  const rootCauses = enrichedData?.rootCauses || [];

  // Fallback quotes when no AI analysis
  const fallbackStrengths = theme.keySignals.positives;
  const fallbackFrictions = theme.keySignals.concerns;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      layout
      className={`
        rounded-2xl border-l-4 ${config.border}
        bg-gradient-to-br ${config.gradient}
        transition-shadow duration-200
        ${isExpanded ? 'shadow-lg col-span-full' : 'shadow-sm hover:shadow-md'}
      `}
    >
      {/* Collapsed Header - Always Visible */}
      <button
        onClick={onToggle}
        className="w-full p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          {/* Status Orb */}
          <div className="relative">
            <div className={`w-3 h-3 rounded-full ${config.orb}`} />
            {config.pulse && (
              <div className={`absolute inset-0 w-3 h-3 rounded-full ${config.orb} animate-ping opacity-75`} />
            )}
          </div>

          {/* Theme Name */}
          <h3 className="text-base font-semibold text-foreground flex-1">
            {theme.name}
          </h3>

          {/* Chevron */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          </motion.div>
        </div>

        {/* Health Bar Section */}
        <div className="mt-4 flex items-center gap-4">
          {/* Score */}
          <span className={`text-2xl font-bold ${config.text} w-12`}>
            {Math.round(healthScore)}
          </span>

          {/* Progress Bar */}
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${config.bar}`}
              initial={{ width: 0 }}
              animate={{ width: `${healthScore}%` }}
              transition={{ delay: index * 0.05 + 0.2, duration: 0.6, ease: "easeOut" }}
            />
          </div>

          {/* Voice Count */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{theme.responseCount}</span>
          </div>

          {/* Status Label */}
          <span className={`text-xs font-medium ${config.text} min-w-[70px] text-right`}>
            {config.label}
          </span>
        </div>

        {/* Representative Quote */}
        {representativeQuote && (
          <p className="mt-3 text-sm text-muted-foreground italic line-clamp-2">
            "{representativeQuote}"
          </p>
        )}
      </button>

      {/* Expanded Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0">
              {/* Divider */}
              <div className="border-t border-border/50 mb-5" />

              <motion.div
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                variants={{
                  expanded: { transition: { staggerChildren: 0.1 } },
                  collapsed: {},
                }}
                className="space-y-6"
              >
                {/* Strengths Section */}
                {(strengths.length > 0 || fallbackStrengths.length > 0) && (
                  <motion.div
                    variants={{
                      collapsed: { opacity: 0, y: 8 },
                      expanded: { opacity: 1, y: 0 },
                    }}
                    className="space-y-2"
                  >
                    <h4 className="text-[10px] uppercase tracking-wider text-emerald-600 font-medium">
                      Strengths
                    </h4>
                    {strengths.length > 0 ? (
                      strengths.slice(0, 3).map((insight, i) => (
                        <ThemeInsightCard key={i} insight={insight} variant="strength" />
                      ))
                    ) : (
                      fallbackStrengths.slice(0, 2).map((quote, i) => (
                        <div
                          key={i}
                          className="rounded-lg border-l-2 border-l-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 p-3"
                        >
                          <p className="text-sm text-foreground italic">"{quote}"</p>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}

                {/* Frictions Section */}
                {(frictions.length > 0 || fallbackFrictions.length > 0) && (
                  <motion.div
                    variants={{
                      collapsed: { opacity: 0, y: 8 },
                      expanded: { opacity: 1, y: 0 },
                    }}
                    className="space-y-2"
                  >
                    <h4 className="text-[10px] uppercase tracking-wider text-amber-600 font-medium">
                      Frictions
                    </h4>
                    {frictions.length > 0 ? (
                      frictions.slice(0, 3).map((insight, i) => (
                        <ThemeInsightCard key={i} insight={insight} variant="friction" />
                      ))
                    ) : (
                      fallbackFrictions.slice(0, 2).map((quote, i) => (
                        <div
                          key={i}
                          className="rounded-lg border-l-2 border-l-amber-400 bg-amber-50/50 dark:bg-amber-950/20 p-3"
                        >
                          <p className="text-sm text-foreground italic">"{quote}"</p>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}

                {/* Root Causes Section */}
                {rootCauses.length > 0 && (
                  <motion.div
                    variants={{
                      collapsed: { opacity: 0, y: 8 },
                      expanded: { opacity: 1, y: 0 },
                    }}
                    className="space-y-2 pt-2 border-t border-border/50"
                  >
                    <h4 className="text-[10px] uppercase tracking-wider text-foreground/70 font-medium">
                      Root Causes
                    </h4>
                    {rootCauses.slice(0, 2).map((cause, i) => (
                      <RootCauseCard key={i} rootCause={cause} />
                    ))}
                  </motion.div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
