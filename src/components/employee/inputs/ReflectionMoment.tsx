import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface ReflectionMomentProps {
  message?: string;
  onContinue: () => void;
  disabled?: boolean;
}

export const ReflectionMoment = ({
  message = "Thank you for sharing that. Take a moment.",
  onContinue,
  disabled,
}: ReflectionMomentProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center gap-8 py-8"
    >
      {/* Breathing circle */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="w-20 h-20 rounded-full bg-[hsl(var(--accent))]/30 border border-[hsl(var(--accent))]/20"
      />

      <p className="text-center text-muted-foreground text-lg font-serif max-w-sm leading-relaxed">
        {message}
      </p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3 }}
      >
        <Button
          onClick={onContinue}
          disabled={disabled}
          variant="ghost"
          className="text-muted-foreground hover:text-foreground"
        >
          I'm ready to continue
        </Button>
      </motion.div>
    </motion.div>
  );
};
