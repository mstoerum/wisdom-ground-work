import { motion } from "framer-motion";
import type { ThemeInsight } from "@/hooks/useAnalytics";
import type { ThemeAnalyticsData } from "@/hooks/useThemeAnalytics";

interface ThemeCardProps {
  theme: ThemeInsight;
  enrichedData?: ThemeAnalyticsData;
  index: number;
  onClick?: () => void;
}

// Health status configuration - exported for reuse in ThemeDetailView
export const getHealthConfig = (health: number, status?: string) => {
  if (health >= 80) return {
    gradient: "from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20",
    orb: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    label: status || "Thriving",
  };
  if (health >= 60) return {
    gradient: "from-teal-50 to-teal-100/50 dark:from-teal-950/40 dark:to-teal-900/20",
    orb: "bg-teal-500",
    text: "text-teal-600 dark:text-teal-400",
    label: status || "Growing",
  };
  if (health >= 45) return {
    gradient: "from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20",
    orb: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    label: status || "Emerging",
  };
  if (health >= 30) return {
    gradient: "from-orange-50 to-orange-100/50 dark:from-orange-950/40 dark:to-orange-900/20",
    orb: "bg-orange-500",
    text: "text-orange-600 dark:text-orange-400",
    label: status || "Challenged",
  };
  return {
    gradient: "from-rose-50 to-rose-100/50 dark:from-rose-950/40 dark:to-rose-900/20",
    orb: "bg-rose-500",
    text: "text-rose-600 dark:text-rose-400",
    label: status || "Critical",
  };
};

export function ThemeCard({ theme, enrichedData, index, onClick }: ThemeCardProps) {
  const healthScore = enrichedData?.healthIndex ?? theme.avgSentiment;
  const healthStatus = enrichedData?.healthStatus;
  const config = getHealthConfig(healthScore, healthStatus);

  // Signal preview data
  const responseCount = enrichedData?.responseCount || theme.responseCount;
  const frictionCount = enrichedData?.insights?.frictions?.length || 0;

  return (
    <motion.div
      layoutId={`theme-card-${theme.id}`}
      className={`
        relative h-52 rounded-2xl shadow-sm
        bg-gradient-to-br ${config.gradient}
        flex flex-col items-center justify-center gap-2.5
        cursor-pointer select-none
        hover:shadow-md hover:scale-[1.02]
        transition-shadow duration-200
      `}
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={`${theme.name} theme. Score: ${Math.round(healthScore)}. Click to explore details.`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Theme Name */}
      <motion.h3
        layoutId={`theme-name-${theme.id}`}
        className="text-base font-medium text-foreground/80 px-4 text-center"
      >
        {theme.name}
      </motion.h3>

      {/* Large Score */}
      <motion.span
        layoutId={`theme-score-${theme.id}`}
        className={`text-5xl font-bold ${config.text}`}
      >
        {Math.round(healthScore)}
      </motion.span>

      {/* Status with Orb */}
      <motion.div
        layoutId={`theme-status-${theme.id}`}
        className="flex items-center gap-2"
      >
        <span className="text-sm font-medium text-muted-foreground">
          {config.label}
        </span>
        <div className={`w-2.5 h-2.5 rounded-full ${config.orb}`} />
      </motion.div>

      {/* Signal Preview */}
      <div className="text-xs text-muted-foreground/70">
        {responseCount} voice{responseCount !== 1 ? 's' : ''}
        {frictionCount > 0 && (
          <>
            <span className="mx-1.5">·</span>
            <span className="text-amber-600 dark:text-amber-400">{frictionCount} flag{frictionCount !== 1 ? 's' : ''}</span>
          </>
        )}
      </div>
    </motion.div>
  );
}
