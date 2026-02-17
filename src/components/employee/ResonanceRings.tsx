import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ThemeProgress } from "@/types/interview";
import { useIsMobile } from "@/hooks/use-mobile";

interface RingData {
  id: number;
  radius: number;
  thickness: number;
  color: string;
  isDashed: boolean;
}

interface ResonanceRingsProps {
  questionNumber: number;
  themeProgress?: ThemeProgress | null;
  lastAnswerLength?: number;
}

// Theme-mapped ring colors using CSS custom properties (HSL)
const RING_COLORS = [
  "hsl(var(--terracotta-primary))",   // terracotta — passionate
  "hsl(var(--accent))",               // sage — reflective
  "hsl(var(--butter-yellow))",        // butter-yellow — positive
  "hsl(var(--coral-accent))",         // coral — neutral/warm
];

// Get color based on current theme index
const getThemeColor = (themeIndex: number): string => {
  return RING_COLORS[themeIndex % RING_COLORS.length];
};

export const ResonanceRings = ({
  questionNumber,
  themeProgress,
  lastAnswerLength = 40,
}: ResonanceRingsProps) => {
  const isMobile = useIsMobile();
  const [rings, setRings] = useState<RingData[]>([]);
  const prevQuestionNumber = useRef(0);

  // Layout constants
  const baseRadius = isMobile ? 24 : 36;
  const radiusStep = isMobile ? 14 : 18;
  const viewSize = isMobile ? 220 : 360;
  const center = viewSize / 2;

  // Determine current theme index for color mapping
  const currentThemeIndex = themeProgress
    ? themeProgress.themes.findIndex((t) => t.current)
    : 0;

  // Detect theme boundary for dashed ring style
  const prevThemeIndexRef = useRef(currentThemeIndex);

  useEffect(() => {
    if (questionNumber > prevQuestionNumber.current) {
      const newIndex = rings.length;
      const wordCount = lastAnswerLength;
      const thickness = Math.max(2, Math.min(8, wordCount / 15));
      const themeChanged = currentThemeIndex !== prevThemeIndexRef.current;

      const newRing: RingData = {
        id: Date.now(),
        radius: baseRadius + newIndex * radiusStep,
        thickness,
        color: getThemeColor(currentThemeIndex >= 0 ? currentThemeIndex : newIndex),
        isDashed: themeChanged,
      };

      setRings((prev) => [...prev, newRing]);
      prevQuestionNumber.current = questionNumber;
      prevThemeIndexRef.current = currentThemeIndex;
    }
  }, [questionNumber, lastAnswerLength, currentThemeIndex, baseRadius, radiusStep, rings.length]);

  // Warmth intensity for center glow (0 → 1 as rings grow)
  const warmth = Math.min(1, rings.length / 10);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      <svg
        width={viewSize}
        height={viewSize}
        viewBox={`0 0 ${viewSize} ${viewSize}`}
        aria-hidden="true"
        className="max-w-full max-h-full"
      >
        {/* Center radial glow — grows warmer with more rings */}
        <defs>
          <radialGradient id="resonance-center-glow">
            <stop
              offset="0%"
              stopColor={`hsl(var(--terracotta-light))`}
              stopOpacity={0.12 + warmth * 0.12}
            />
            <stop offset="70%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={center} cy={center} r={center * 0.7} fill="url(#resonance-center-glow)" />

        <AnimatePresence>
          {rings.map((ring, i) => {
            const isNewest = i === rings.length - 1;

            return (
              <g key={ring.id}>
                {/* Ghost ripple for newest ring */}
                {isNewest && (
                  <motion.circle
                    cx={center}
                    cy={center}
                    r={ring.radius}
                    fill="none"
                    stroke={ring.color}
                    strokeWidth={1.5}
                    initial={{ r: 0, opacity: 0.45 }}
                    animate={{ r: ring.radius * 1.15, opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                )}

                {/* Persistent ring */}
                <motion.circle
                  cx={center}
                  cy={center}
                  r={ring.radius}
                  fill="none"
                  stroke={ring.color}
                  strokeWidth={ring.thickness}
                  strokeDasharray={ring.isDashed ? "6 4" : undefined}
                  initial={{ r: 0, opacity: 0 }}
                  animate={{
                    r: ring.radius,
                    opacity: [0, 0.35, 0.2],
                  }}
                  transition={{
                    r: { duration: 0.6, ease: "easeOut" },
                    opacity: { duration: 1, ease: "easeOut", times: [0, 0.4, 1] },
                  }}
                />
              </g>
            );
          })}
        </AnimatePresence>
      </svg>

      {/* Accessible live region */}
      {questionNumber > 0 && (
        <div className="sr-only" role="status" aria-live="polite">
          Question {questionNumber} answered
        </div>
      )}
    </div>
  );
};
