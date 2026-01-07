import { motion } from "framer-motion";

interface AIResponseDisplayProps {
  empathy?: string;
  question: string;
  isLoading?: boolean;
}

export const AIResponseDisplay = ({ empathy, question, isLoading }: AIResponseDisplayProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-primary"
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
      </div>
    );
  }

  return (
    <motion.div
      className="flex flex-col items-center justify-center text-center px-4 gap-2 max-w-2xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Empathy - simple muted text, flows naturally into question */}
      {empathy && (
        <motion.p
          className="text-sm md:text-base text-muted-foreground italic leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {empathy}
        </motion.p>
      )}

      {/* Question - prominent, immediately following */}
      <motion.p
        className="text-2xl md:text-3xl font-medium text-foreground leading-relaxed"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: empathy ? 0.15 : 0 }}
      >
        {question}
      </motion.p>
    </motion.div>
  );
};