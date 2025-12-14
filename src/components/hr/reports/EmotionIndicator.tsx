import { 
  EMOTION_SPECTRUM, 
  EMOTION_LABELS, 
  getEmotionState 
} from "@/lib/reportDesignSystem";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface EmotionIndicatorProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showScore?: boolean;
  animated?: boolean;
}

export function EmotionIndicator({ 
  score, 
  size = 'md',
  showLabel = true,
  showScore = true,
  animated = true,
}: EmotionIndicatorProps) {
  const state = getEmotionState(score);
  const colors = EMOTION_SPECTRUM[state];
  const label = EMOTION_LABELS[state];

  const sizeClasses = {
    sm: { container: 'gap-1.5', bar: 'h-1.5', text: 'text-xs', badge: 'text-xs px-1.5 py-0.5' },
    md: { container: 'gap-2', bar: 'h-2', text: 'text-sm', badge: 'text-sm px-2 py-1' },
    lg: { container: 'gap-3', bar: 'h-3', text: 'text-base', badge: 'text-base px-3 py-1.5' },
  };

  const classes = sizeClasses[size];

  return (
    <div className={cn("flex flex-col", classes.container)}>
      {/* Label row */}
      <div className="flex items-center justify-between">
        {showLabel && (
          <span 
            className={cn("font-medium", classes.text)}
            style={{ color: colors.text }}
          >
            {label}
          </span>
        )}
        {showScore && (
          <span 
            className={cn("font-bold", classes.text)}
            style={{ color: colors.primary }}
          >
            {Math.round(score)}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative w-full rounded-full overflow-hidden bg-muted">
        <div 
          className={cn("rounded-full", classes.bar)}
          style={{ backgroundColor: 'hsl(var(--muted))' }}
        />
        {animated ? (
          <motion.div
            className={cn("absolute inset-y-0 left-0 rounded-full", classes.bar)}
            style={{ backgroundColor: colors.primary }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(0, score))}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        ) : (
          <div
            className={cn("absolute inset-y-0 left-0 rounded-full", classes.bar)}
            style={{ 
              backgroundColor: colors.primary,
              width: `${Math.min(100, Math.max(0, score))}%` 
            }}
          />
        )}
      </div>
    </div>
  );
}

// Compact badge version
export function EmotionBadge({ 
  score,
  className 
}: { 
  score: number;
  className?: string;
}) {
  const state = getEmotionState(score);
  const colors = EMOTION_SPECTRUM[state];
  const label = EMOTION_LABELS[state];

  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
        className
      )}
      style={{ 
        backgroundColor: colors.background,
        color: colors.text
      }}
    >
      <span 
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: colors.primary }}
      />
      {label}
    </span>
  );
}

// Spectrum visualization showing all states
export function EmotionSpectrumBar({
  currentScore,
  showMarker = true,
}: {
  currentScore?: number;
  showMarker?: boolean;
}) {
  return (
    <div className="relative">
      {/* Gradient bar */}
      <div className="h-3 rounded-full flex overflow-hidden">
        {Object.entries(EMOTION_SPECTRUM).map(([key, colors], index) => (
          <div
            key={key}
            className="flex-1 first:rounded-l-full last:rounded-r-full"
            style={{ backgroundColor: colors.primary }}
          />
        ))}
      </div>

      {/* Current position marker */}
      {showMarker && currentScore !== undefined && (
        <motion.div
          className="absolute top-0 w-1 h-3 bg-background border-2 border-foreground rounded-full"
          style={{ 
            left: `calc(${Math.min(100, Math.max(0, currentScore))}% - 2px)`,
          }}
          initial={{ y: -4, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        />
      )}

      {/* Labels */}
      <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
        <span>Critical</span>
        <span>Thriving</span>
      </div>
    </div>
  );
}
