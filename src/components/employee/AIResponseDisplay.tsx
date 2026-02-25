import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTypewriter } from "@/hooks/useTypewriter";

interface AIResponseDisplayProps {
  empathy?: string;
  question: string;
  isLoading?: boolean;
  isTransitioning?: boolean;
  onTypingComplete?: () => void;
}

export const AIResponseDisplay = ({ empathy, question, isLoading, isTransitioning, onTypingComplete }: AIResponseDisplayProps) => {
  const showLoading = (isLoading || isTransitioning) && !question;

  // Phase 1: Type out empathy
  const empathyTypewriter = useTypewriter({
    text: empathy || "",
    speed: 30,
    enabled: !!empathy && !!question && !showLoading,
  });

  // Phase 2: Type out question (starts after empathy completes or immediately if no empathy)
  const questionTypewriter = useTypewriter({
    text: question,
    speed: 30,
    startDelay: empathy ? 200 : 0,
    enabled: !!question && !showLoading && (!empathy || empathyTypewriter.isComplete),
  });

  // Notify parent when all typing is done
  useEffect(() => {
    if (questionTypewriter.isComplete && onTypingComplete) {
      onTypingComplete();
    }
  }, [questionTypewriter.isComplete, onTypingComplete]);

  const isAnyTyping = empathyTypewriter.isTyping || questionTypewriter.isTyping;

  return (
    <AnimatePresence mode="wait">
      {showLoading ? (
        <motion.div
          key="loading"
          className="flex items-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-primary"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15
              }}
            />
          ))}
        </motion.div>
      ) : (
        <motion.div
          key={question}
          className="flex items-center justify-center px-4 max-w-2xl w-full"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
          transition={{ duration: 0.2 }}
        >
          <div className="relative w-full">
            {/* Hidden ghost text to reserve full dimensions */}
            <p className="text-xl md:text-2xl font-medium leading-relaxed text-left invisible" aria-hidden="true">
              {empathy && (
                <>
                  <span>{empathy}</span>
                  <span> — </span>
                </>
              )}
              <span>{question}</span>
            </p>
            {/* Visible typewriter text overlaid on top */}
            <p className="text-xl md:text-2xl font-medium leading-relaxed text-left absolute inset-0">
              {empathy && (
                <>
                  <span className="text-muted-foreground">
                    {empathyTypewriter.displayText}
                  </span>
                  {empathyTypewriter.isComplete && (
                    <span className="text-muted-foreground/50"> — </span>
                  )}
                </>
              )}
              <span className="text-foreground">
                {questionTypewriter.displayText}
              </span>
              {isAnyTyping && (
                <span className="inline-block w-[2px] h-[1em] bg-primary ml-0.5 align-middle animate-[blink_0.7s_step-end_infinite]" />
              )}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
