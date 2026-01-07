import { motion } from "framer-motion";
import type { SemanticInsight } from "@/hooks/useThemeAnalytics";

interface ThemeInsightCardProps {
  insight: SemanticInsight;
  variant: 'friction' | 'strength' | 'pattern';
}

/**
 * Display card for AI-generated semantic insights in Theme Terrain
 * Shows the insight text, agreement percentage, voice count, and confidence dots
 */
export function ThemeInsightCard({ insight, variant }: ThemeInsightCardProps) {
  const colors = {
    friction: {
      border: "border-l-amber-400",
      bg: "bg-amber-50/50 dark:bg-amber-950/20",
      bar: "bg-amber-400",
      text: "text-amber-700 dark:text-amber-400",
    },
    strength: {
      border: "border-l-emerald-400",
      bg: "bg-emerald-50/50 dark:bg-emerald-950/20",
      bar: "bg-emerald-400",
      text: "text-emerald-700 dark:text-emerald-400",
    },
    pattern: {
      border: "border-l-blue-400",
      bg: "bg-blue-50/50 dark:bg-blue-950/20",
      bar: "bg-blue-400",
      text: "text-blue-700 dark:text-blue-400",
    },
  };

  const style = colors[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border-l-2 ${style.border} ${style.bg} p-3`}
    >
      {/* Insight statement */}
      <p className="text-sm font-medium text-foreground mb-2">
        {insight.text}
      </p>

      {/* Metrics row */}
      <div className="flex items-center gap-4 text-xs">
        {/* Agreement bar */}
        <div className="flex items-center gap-2 flex-1">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[120px]">
            <motion.div
              className={`h-full rounded-full ${style.bar}`}
              initial={{ width: 0 }}
              animate={{ width: `${insight.agreement_pct}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <span className={`font-semibold ${style.text}`}>
            {insight.agreement_pct}%
          </span>
        </div>

        {/* Voice count */}
        <span className="text-muted-foreground">
          {insight.voice_count} voice{insight.voice_count !== 1 ? 's' : ''}
        </span>

        {/* Confidence dots */}
        <div className="flex items-center gap-0.5" title={`Confidence: ${insight.confidence}/5`}>
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={`w-1.5 h-1.5 rounded-full ${
                level <= insight.confidence
                  ? 'bg-foreground'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
