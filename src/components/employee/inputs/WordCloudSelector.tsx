import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight } from "lucide-react";

interface WordCloudSelectorProps {
  options: string[];
  maxSelections?: number;
  allowOther?: boolean;
  onSubmit: (value: string) => void;
  disabled?: boolean;
}

export const WordCloudSelector = ({
  options,
  maxSelections = 3,
  allowOther = true,
  onSubmit,
  disabled,
}: WordCloudSelectorProps) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showOther, setShowOther] = useState(false);
  const [otherText, setOtherText] = useState("");

  const toggleOption = (option: string) => {
    if (disabled) return;
    const next = new Set(selected);
    if (next.has(option)) {
      next.delete(option);
    } else if (next.size < maxSelections) {
      next.add(option);
    }
    setSelected(next);
  };

  const handleSubmit = () => {
    const tags = Array.from(selected);
    if (showOther && otherText.trim()) {
      tags.push(otherText.trim());
    }
    if (tags.length === 0) return;
    onSubmit(`[SELECTED: ${tags.join(", ")}]`);
  };

  const canSubmit = selected.size > 0 || (showOther && otherText.trim());

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-2xl mx-auto space-y-4"
    >
      <div className="flex flex-wrap gap-2 justify-center">
        {options.map((option, i) => {
          const isActive = selected.has(option);
          return (
            <motion.button
              key={option}
              onClick={() => toggleOption(option)}
              disabled={disabled}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 400, damping: 25 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                px-4 py-2.5 rounded-full text-sm font-medium transition-colors
                ${isActive
                  ? "bg-[hsl(var(--terracotta-primary))] text-primary-foreground shadow-sm"
                  : "bg-muted hover:bg-muted/70 text-foreground border border-border/40"
                }
              `}
            >
              {option}
            </motion.button>
          );
        })}

        {allowOther && !showOther && (
          <motion.button
            onClick={() => setShowOther(true)}
            disabled={disabled}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: options.length * 0.05 }}
            whileHover={{ scale: 1.05 }}
            className="px-4 py-2.5 rounded-full text-sm font-medium bg-transparent border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
          >
            Something else…
          </motion.button>
        )}
      </div>

      {showOther && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="max-w-md mx-auto"
        >
          <Textarea
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            placeholder="Tell us…"
            className="min-h-[60px] text-sm resize-none rounded-xl"
            autoFocus
          />
        </motion.div>
      )}

      {canSubmit && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
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
