import { motion } from "framer-motion";
import { Users, CheckCircle2, AlertCircle, Info } from "lucide-react";
import type { SemanticInsight } from "@/hooks/useThemeAnalytics";

interface ThemeInsightCardProps {
  insight: SemanticInsight;
  variant: 'friction' | 'strength' | 'pattern';
}

function getConfidenceDisplay(level: number) {
  if (level >= 4) return { 
    label: "High confidence", 
    Icon: CheckCircle2, 
    className: "text-emerald-600 dark:text-emerald-400" 
  };
  if (level >= 3) return { 
    label: "Moderate", 
    Icon: AlertCircle, 
    className: "text-amber-600 dark:text-amber-400" 
  };
  return { 
    label: "Limited data", 
    Icon: Info, 
    className: "text-muted-foreground" 
  };
}

/**
 * Display card for AI-generated semantic insights in Theme Terrain
 * Shows the insight text, voice count, and confidence level
 */
export function ThemeInsightCard({ insight, variant }: ThemeInsightCardProps) {
  const colors = {
    friction: {
      border: "border-l-amber-400",
      bg: "bg-amber-50/50 dark:bg-amber-950/20",
    },
    strength: {
      border: "border-l-emerald-400",
      bg: "bg-emerald-50/50 dark:bg-emerald-950/20",
    },
    pattern: {
      border: "border-l-blue-400",
      bg: "bg-blue-50/50 dark:bg-blue-950/20",
    },
  };

  const style = colors[variant];
  const confidenceDisplay = getConfidenceDisplay(insight.confidence);
  const { Icon: ConfidenceIcon } = confidenceDisplay;

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

      {/* Simplified metrics row */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {/* Voice count with icon */}
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {insight.voice_count} voice{insight.voice_count !== 1 ? 's' : ''}
        </span>

        {/* Readable confidence label */}
        <span className={`flex items-center gap-1 ${confidenceDisplay.className}`}>
          <ConfidenceIcon className="h-3 w-3" />
          {confidenceDisplay.label}
        </span>
      </div>
    </motion.div>
  );
}
