import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ThemeProgress } from "@/types/interview";

interface AmbientArcProps {
  themeProgress: ThemeProgress | null;
  questionNumber?: number;
}

// Palette mapped to theme index — warm progression
const SEGMENT_COLORS = [
  "hsl(var(--accent))",           // sage
  "hsl(var(--primary))",          // terracotta
  "hsl(150 30% 55%)",             // muted green
  "hsl(35 70% 62%)",              // butter-yellow
  "hsl(12 60% 65%)",              // coral
  "hsl(220 30% 60%)",             // slate blue
];

export const AmbientArc = ({ themeProgress, questionNumber = 0 }: AmbientArcProps) => {
  const segments = useMemo(() => {
    if (!themeProgress || themeProgress.themes.length === 0) {
      // Fallback: single bar based on question count (assume ~6 questions total)
      const fallbackTotal = 6;
      return [{
        id: "fallback",
        fraction: 1,
        filled: false,
        current: true,
        progress: Math.min(questionNumber / fallbackTotal, 1),
        color: SEGMENT_COLORS[0],
      }];
    }

    return themeProgress.themes.map((theme, i) => ({
      id: theme.id,
      fraction: 1 / themeProgress.themes.length,
      filled: theme.discussed,
      current: theme.current,
      progress: theme.depth / 100,
      color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
    }));
  }, [themeProgress, questionNumber]);

  const totalSegments = segments.length;
  const discussedCount = themeProgress?.discussedCount ?? questionNumber;
  const totalCount = themeProgress?.totalCount ?? 6;

  return (
    <div className="relative w-full px-6 py-2">
      {/* Accessibility announcement */}
      <span className="sr-only" aria-live="polite">
        {discussedCount} of {totalCount} topics explored
      </span>

      {/* The arc track */}
      <div className="relative w-full h-[3px] rounded-full overflow-hidden bg-foreground/[0.05]">
        <AnimatePresence>
          {segments.map((seg, i) => {
            const leftPercent = (i / totalSegments) * 100;
            const widthPercent = (1 / totalSegments) * 100;

            // How much of this segment is filled
            const fillRatio = seg.filled ? 1 : seg.current ? seg.progress : 0;

            return (
              <motion.div
                key={seg.id}
                className="absolute top-0 h-full origin-left"
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                }}
              >
                {/* Filled portion */}
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: seg.color }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: fillRatio }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                />

                {/* Breathing pulse for current theme */}
                {seg.current && fillRatio > 0 && fillRatio < 1 && (
                  <motion.div
                    className="absolute top-0 h-full rounded-full"
                    style={{
                      backgroundColor: seg.color,
                      width: `${fillRatio * 100}%`,
                    }}
                    animate={{ opacity: [0.6, 0.9, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}

                {/* Leading edge glow bead */}
                {fillRatio > 0 && fillRatio < 1 && (
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                    style={{
                      left: `${fillRatio * 100}%`,
                      backgroundColor: seg.color,
                      boxShadow: `0 0 6px 2px ${seg.color}`,
                      transform: "translate(-50%, -50%)",
                    }}
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
