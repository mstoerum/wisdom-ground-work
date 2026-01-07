import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

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
      className="flex flex-col items-center justify-center text-center px-4 gap-6 max-w-2xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Empathy/Context Section */}
      {empathy && (
        <motion.div
          className="flex items-start gap-3 bg-muted/30 rounded-xl px-4 py-3 w-full"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <MessageCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground italic leading-relaxed text-left">
            {empathy}
          </p>
        </motion.div>
      )}

      {/* Question Section */}
      <motion.p
        className="text-2xl md:text-3xl font-medium text-foreground leading-relaxed"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: empathy ? 0.2 : 0 }}
      >
        {question}
      </motion.p>
    </motion.div>
  );
};
