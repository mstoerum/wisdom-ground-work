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
      className="flex items-center justify-center text-center px-4 max-w-2xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
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
  );
};