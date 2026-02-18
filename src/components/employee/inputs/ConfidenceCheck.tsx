import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfidenceCheckProps {
  options: string[];
  onSubmit: (value: string) => void;
  disabled?: boolean;
}

export const ConfidenceCheck = ({ options, onSubmit, disabled }: ConfidenceCheckProps) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (option: string) => {
    if (disabled || selected) return;
    setSelected(option);
    // Brief delay so user sees the selection before it sends
    setTimeout(() => onSubmit(`[CHOICE: ${option}]`), 400);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="flex gap-3 justify-center flex-wrap">
        <AnimatePresence>
          {options.map((option) => {
            const isSelected = selected === option;
            const isFaded = selected !== null && !isSelected;

            return (
              <motion.button
                key={option}
                onClick={() => handleSelect(option)}
                disabled={disabled || selected !== null}
                animate={{
                  opacity: isFaded ? 0.3 : 1,
                  scale: isSelected ? 1.05 : isFaded ? 0.95 : 1,
                }}
                whileHover={!selected ? { scale: 1.04 } : undefined}
                whileTap={!selected ? { scale: 0.97 } : undefined}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`
                  px-6 py-4 rounded-2xl text-base font-medium transition-colors min-w-[100px]
                  ${isSelected
                    ? "bg-[hsl(var(--terracotta-primary))] text-primary-foreground shadow-md"
                    : "bg-muted hover:bg-muted/80 text-foreground border border-border/50"
                  }
                  disabled:cursor-default
                `}
              >
                {option}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
