import { CheckCircle2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import type { ThemeInsight } from "@/hooks/useAnalytics";

interface QuickInsightBadgesProps {
  themes: ThemeInsight[];
  isLoading?: boolean;
}

export function QuickInsightBadges({ themes, isLoading }: QuickInsightBadgesProps) {
  if (isLoading || themes.length === 0) {
    return null;
  }

  // Sort themes by sentiment to find top and bottom
  const sortedThemes = [...themes].sort((a, b) => b.avgSentiment - a.avgSentiment);
  const topTheme = sortedThemes[0];
  const bottomTheme = sortedThemes[sortedThemes.length - 1];

  // Only show if there's meaningful difference
  if (!topTheme || !bottomTheme || themes.length < 2) {
    return null;
  }

  const topHealth = Math.round(topTheme.avgSentiment);
  const bottomHealth = Math.round(bottomTheme.avgSentiment);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="flex flex-wrap gap-3"
    >
      {/* Top Strength */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-full border border-emerald-200 dark:border-emerald-800/50">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
          Top strength
        </span>
        <span className="text-xs text-emerald-600 dark:text-emerald-400">
          {topTheme.name}
        </span>
        <span className="text-xs text-emerald-500 dark:text-emerald-500">
          {topHealth}%
        </span>
      </div>

      {/* Primary Friction */}
      {bottomHealth < 70 && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/30 rounded-full border border-amber-200 dark:border-amber-800/50">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
            Primary friction
          </span>
          <span className="text-xs text-amber-600 dark:text-amber-400">
            {bottomTheme.name}
          </span>
          <span className="text-xs text-amber-500 dark:text-amber-500">
            {bottomHealth}%
          </span>
        </div>
      )}
    </motion.div>
  );
}
