import { motion, AnimatePresence } from "framer-motion";

interface AIResponseDisplayProps {
  empathy?: string;
  question: string;
  isLoading?: boolean;
  isTransitioning?: boolean;
}

export const AIResponseDisplay = ({ empathy, question, isLoading, isTransitioning }: AIResponseDisplayProps) => {
  const showLoading = (isLoading || isTransitioning) && !question;
  
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
          className="flex items-center justify-center text-center px-4 max-w-2xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
          transition={{ duration: 0.2 }}
        >
          <p className="text-xl md:text-2xl font-medium leading-relaxed">
            {empathy && (
              <>
                <span className="text-muted-foreground">{empathy}</span>
                <span className="text-muted-foreground/50"> — </span>
              </>
            )}
            <span className="text-foreground">{question}</span>
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};