import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface PriorityRankingProps {
  options: string[];
  onSubmit: (value: string) => void;
  disabled?: boolean;
}

export const PriorityRanking = ({ options, onSubmit, disabled }: PriorityRankingProps) => {
  const [ranked, setRanked] = useState<string[]>([]);
  const remaining = options.filter((o) => !ranked.includes(o));

  const handleTap = (option: string) => {
    if (disabled) return;
    setRanked((prev) => [...prev, option]);
  };

  const handleUndo = (index: number) => {
    if (disabled) return;
    setRanked((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (ranked.length === 0) return;
    onSubmit(`[RANKED: ${ranked.map((r, i) => `${i + 1}. ${r}`).join(", ")}]`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-2xl mx-auto space-y-4"
    >
      {/* Ranked items */}
      {ranked.length > 0 && (
        <div className="space-y-2">
          <AnimatePresence>
            {ranked.map((item, i) => (
              <motion.button
                key={item}
                layout
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                onClick={() => handleUndo(i)}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-[hsl(var(--terracotta-pale))] border border-[hsl(var(--terracotta-primary))]/20 text-left group"
              >
                <span className="w-7 h-7 rounded-full bg-[hsl(var(--terracotta-primary))] text-primary-foreground text-sm font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-foreground flex-1">{item}</span>
                <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  undo
                </span>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Remaining items to rank */}
      {remaining.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground text-center">
            {ranked.length === 0 ? "Tap in order of importance" : `${remaining.length} remaining`}
          </p>
          {remaining.map((option) => (
            <motion.button
              key={option}
              layout
              onClick={() => handleTap(option)}
              disabled={disabled}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/40 text-left hover:bg-muted transition-colors"
            >
              <span className="w-7 h-7 rounded-full border-2 border-border/50 text-muted-foreground text-sm font-bold flex items-center justify-center shrink-0">
                ?
              </span>
              <span className="text-sm font-medium text-foreground">{option}</span>
            </motion.button>
          ))}
        </div>
      )}

      {/* Submit when all ranked */}
      {ranked.length > 0 && remaining.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center pt-2"
        >
          <Button
            onClick={handleSubmit}
            disabled={disabled}
            size="lg"
            className="px-8 py-6 text-lg font-medium bg-[hsl(var(--terracotta-primary))] hover:bg-[hsl(var(--terracotta-primary))]/90 rounded-full"
          >
            Continue
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};
