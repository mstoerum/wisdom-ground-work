import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Check } from "lucide-react";

interface BackgroundAnonymizationProps {
  duration?: number;
  onComplete?: () => void;
}

export const BackgroundAnonymization = ({
  duration = 1500,
  onComplete,
}: BackgroundAnonymizationProps) => {
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsComplete(true);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <div className="fixed top-4 right-4 z-50">
      <AnimatePresence mode="wait">
        {!isComplete ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="relative"
          >
            <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-sm">
              <Shield className="h-5 w-5 text-muted-foreground" />
            </div>
            {/* Progress ring */}
            <svg
              className="absolute inset-0 w-10 h-10 -rotate-90"
              viewBox="0 0 40 40"
            >
              <motion.circle
                cx="20"
                cy="20"
                r="18"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: duration / 1000, ease: "easeInOut" }}
                style={{
                  strokeDasharray: "113.1",
                  strokeDashoffset: "0",
                }}
              />
            </svg>
          </motion.div>
        ) : (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-10 h-10 rounded-full bg-[hsl(var(--lime-green))]/20 border border-[hsl(var(--lime-green))]/30 flex items-center justify-center shadow-sm"
          >
            <Check className="h-5 w-5 text-[hsl(var(--lime-green))]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
