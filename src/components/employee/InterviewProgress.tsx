import { motion } from "framer-motion";

interface InterviewProgressProps {
  currentQuestion: number;
  estimatedTotal?: number;
}

export const InterviewProgress = ({ 
  currentQuestion, 
  estimatedTotal = 6 
}: InterviewProgressProps) => {
  // Show progress as dots
  const dots = Array.from({ length: estimatedTotal }, (_, i) => i);
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-2"
    >
      <div className="flex gap-2">
        {dots.map((index) => (
          <motion.div
            key={index}
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              index < currentQuestion 
                ? "bg-[hsl(var(--terracotta-primary))]" 
                : index === currentQuestion 
                  ? "bg-[hsl(var(--terracotta-primary))]" 
                  : "bg-border"
            }`}
            initial={{ scale: 0 }}
            animate={{ 
              scale: 1,
              opacity: index <= currentQuestion ? 1 : 0.4
            }}
            transition={{ delay: index * 0.05 }}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Question {currentQuestion + 1} of ~{estimatedTotal}
      </p>
    </motion.div>
  );
};
