import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MoodTransitionProps {
  mood: number;
  onComplete: () => void;
  isApiReady?: boolean;
}

const moodData: Record<number, { emoji: string; label: string; acknowledgment: string }> = {
  1: {
    emoji: "😔",
    label: "Tough",
    acknowledgment: "I hear you. Thanks for being open about how things are. Let's talk through it together."
  },
  2: {
    emoji: "😟",
    label: "Not great",
    acknowledgment: "Thanks for being honest. That takes courage. I'm here to listen."
  },
  3: {
    emoji: "😐",
    label: "Okay",
    acknowledgment: "Got it. Sometimes 'okay' says a lot. Let's explore what's on your mind."
  },
  4: {
    emoji: "🙂",
    label: "Good",
    acknowledgment: "That's nice to hear! Let's dig into what's working well for you."
  },
  5: {
    emoji: "😊",
    label: "Great!",
    acknowledgment: "Love that energy! I'd love to hear more about what's making things feel good."
  }
};

export const MoodTransition = ({ mood, onComplete, isApiReady = false }: MoodTransitionProps) => {
  const [showDots, setShowDots] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  
  const data = moodData[mood] || moodData[3]; // Fallback to "okay"

  // Minimum display time for the acknowledgment (2 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Show loading dots if API isn't ready after acknowledgment is shown
  useEffect(() => {
    if (minTimeElapsed && !isApiReady) {
      setShowDots(true);
    }
  }, [minTimeElapsed, isApiReady]);

  // Complete when both conditions are met
  useEffect(() => {
    if (minTimeElapsed && isApiReady) {
      // Small delay for smooth exit animation
      const timer = setTimeout(onComplete, 300);
      return () => clearTimeout(timer);
    }
  }, [minTimeElapsed, isApiReady, onComplete]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6">
      <AnimatePresence mode="wait">
        <motion.div
          key="transition"
          className="flex flex-col items-center text-center max-w-md"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98, y: -10 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {/* Emoji */}
          <motion.span
            className="text-6xl md:text-7xl mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.3, ease: "easeOut" }}
            role="img"
            aria-label={data.label}
          >
            {data.emoji}
          </motion.span>

          {/* Acknowledgment Message */}
          <motion.p
            className="text-xl md:text-2xl text-foreground leading-relaxed font-medium"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
          >
            {data.acknowledgment}
          </motion.p>

          {/* Subtle loading indicator if waiting for API */}
          <AnimatePresence>
            {showDots && (
              <motion.div
                className="flex items-center gap-1 mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-2 h-2 rounded-full bg-muted-foreground"
                    animate={{ 
                      opacity: [0.3, 1, 0.3],
                      scale: [0.8, 1, 0.8]
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
