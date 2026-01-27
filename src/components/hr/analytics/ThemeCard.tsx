import { useState } from "react";
import { motion } from "framer-motion";
import { X, Users, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import type { ThemeInsight } from "@/hooks/useAnalytics";
import type { ThemeAnalyticsData } from "@/hooks/useThemeAnalytics";

interface ThemeCardProps {
  theme: ThemeInsight;
  enrichedData?: ThemeAnalyticsData;
  index: number;
}

// Health status configuration
const getHealthConfig = (health: number, status?: string) => {
  if (health >= 80) return {
    gradient: "from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20",
    backGradient: "from-emerald-100/80 to-white dark:from-emerald-950/60 dark:to-card",
    orb: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    label: status || "Thriving",
  };
  if (health >= 60) return {
    gradient: "from-teal-50 to-teal-100/50 dark:from-teal-950/40 dark:to-teal-900/20",
    backGradient: "from-teal-100/80 to-white dark:from-teal-950/60 dark:to-card",
    orb: "bg-teal-500",
    text: "text-teal-600 dark:text-teal-400",
    label: status || "Growing",
  };
  if (health >= 45) return {
    gradient: "from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20",
    backGradient: "from-amber-100/80 to-white dark:from-amber-950/60 dark:to-card",
    orb: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    label: status || "Emerging",
  };
  if (health >= 30) return {
    gradient: "from-orange-50 to-orange-100/50 dark:from-orange-950/40 dark:to-orange-900/20",
    backGradient: "from-orange-100/80 to-white dark:from-orange-950/60 dark:to-card",
    orb: "bg-orange-500",
    text: "text-orange-600 dark:text-orange-400",
    label: status || "Challenged",
  };
  return {
    gradient: "from-rose-50 to-rose-100/50 dark:from-rose-950/40 dark:to-rose-900/20",
    backGradient: "from-rose-100/80 to-white dark:from-rose-950/60 dark:to-card",
    orb: "bg-rose-500",
    text: "text-rose-600 dark:text-rose-400",
    label: status || "Critical",
  };
};

export function ThemeCard({ theme, enrichedData, index }: ThemeCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  
  const healthScore = enrichedData?.healthIndex ?? theme.avgSentiment;
  const healthStatus = enrichedData?.healthStatus;
  const config = getHealthConfig(healthScore, healthStatus);

  // Get insights for back face
  const strengths = enrichedData?.insights.strengths || [];
  const frictions = enrichedData?.insights.frictions || [];
  const rootCauses = enrichedData?.rootCauses || [];
  
  // Fallback quotes
  const fallbackStrengths = theme.keySignals.positives;
  const fallbackFrictions = theme.keySignals.concerns;

  const handleFlip = () => setIsFlipped(!isFlipped);
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(false);
  };

  // Keyboard handling
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleFlip();
    }
    if (e.key === "Escape" && isFlipped) {
      setIsFlipped(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="relative h-56"
      style={{ perspective: "1000px" }}
    >
      <motion.div
        className="relative w-full h-full cursor-pointer"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        onClick={handleFlip}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`${theme.name} theme card. ${isFlipped ? "Showing details" : "Click to see details"}`}
      >
        {/* Front Face */}
        <div
          className={`
            absolute inset-0 w-full h-full
            rounded-2xl shadow-sm hover:shadow-md
            bg-gradient-to-br ${config.gradient}
            flex flex-col items-center justify-center gap-3
            transition-shadow duration-200
          `}
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Theme Name */}
          <h3 className="text-base font-medium text-foreground/80 px-4 text-center">
            {theme.name}
          </h3>

          {/* Large Score */}
          <span className={`text-5xl font-bold ${config.text}`}>
            {Math.round(healthScore)}
          </span>

          {/* Status with Orb */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              {config.label}
            </span>
            <div className={`w-2.5 h-2.5 rounded-full ${config.orb}`} />
          </div>
        </div>

        {/* Back Face */}
        <div
          className={`
            absolute inset-0 w-full h-full
            rounded-2xl shadow-lg
            bg-gradient-to-br ${config.backGradient}
            flex flex-col overflow-hidden
          `}
          style={{ 
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
            <h3 className="text-sm font-semibold text-foreground truncate flex-1">
              {theme.name}
            </h3>
            <button
              onClick={handleClose}
              className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Close details"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Metrics Row */}
          <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground border-b border-border/20">
            <span className={`font-semibold ${config.text}`}>{Math.round(healthScore)}</span>
            <span>·</span>
            <span>{config.label}</span>
            <span>·</span>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{theme.responseCount} voices</span>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {/* Strengths */}
            {(strengths.length > 0 || fallbackStrengths.length > 0) && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-emerald-600 font-medium">
                  <CheckCircle2 className="h-3 w-3" />
                  Strengths
                </div>
                <p className="text-xs text-foreground/80 italic line-clamp-2">
                  "{strengths[0]?.text || fallbackStrengths[0] || "No data"}"
                </p>
              </div>
            )}

            {/* Frictions */}
            {(frictions.length > 0 || fallbackFrictions.length > 0) && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-amber-600 font-medium">
                  <AlertTriangle className="h-3 w-3" />
                  Frictions
                </div>
                <p className="text-xs text-foreground/80 italic line-clamp-2">
                  "{frictions[0]?.text || fallbackFrictions[0] || "No data"}"
                </p>
              </div>
            )}

            {/* Root Cause */}
            {rootCauses.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-foreground/60 font-medium">
                  <ArrowRight className="h-3 w-3" />
                  Root Cause
                </div>
                <p className="text-xs text-foreground/80 line-clamp-2">
                  {rootCauses[0].cause}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
