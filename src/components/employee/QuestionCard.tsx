import { motion, AnimatePresence } from "framer-motion";

interface QuestionCardProps {
  question: string;
  questionNumber: number;
  isLoading?: boolean;
}

export const QuestionCard = ({ question, questionNumber, isLoading }: QuestionCardProps) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={questionNumber}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col items-center justify-center text-center px-4"
      >
        {isLoading ? (
          <motion.div 
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-[hsl(var(--terracotta-primary))]"
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              ))}
            </div>
            <p className="text-muted-foreground text-sm">Preparing next question...</p>
          </motion.div>
        ) : (
          <motion.p
            className="text-2xl md:text-3xl lg:text-4xl font-medium text-foreground leading-relaxed max-w-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {question}
          </motion.p>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
