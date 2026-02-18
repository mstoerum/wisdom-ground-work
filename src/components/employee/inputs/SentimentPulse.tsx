import { useState } from "react";
import { motion } from "framer-motion";

interface SentimentPulseProps {
  onSubmit: (value: string) => void;
  disabled?: boolean;
}

const sentiments = [
  { emoji: "😔", label: "Struggling", value: 1 },
  { emoji: "😐", label: "Neutral", value: 2 },
  { emoji: "🙂", label: "Okay", value: 3 },
  { emoji: "😊", label: "Good", value: 4 },
  { emoji: "✨", label: "Great", value: 5 },
];

export const SentimentPulse = ({ onSubmit, disabled }: SentimentPulseProps) => {
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (value: number, label: string) => {
    if (disabled || selected !== null) return;
    setSelected(value);
    setTimeout(() => onSubmit(`[SENTIMENT: ${label} (${value}/5)]`), 500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="flex gap-4 justify-center">
        {sentiments.map((s, i) => {
          const isSelected = selected === s.value;
          const isFaded = selected !== null && !isSelected;

          return (
            <motion.button
              key={s.value}
              onClick={() => handleSelect(s.value, s.label)}
              disabled={disabled || selected !== null}
              initial={{ opacity: 0, y: 12 }}
              animate={{
                opacity: isFaded ? 0.25 : 1,
                y: 0,
                scale: isSelected ? 1.2 : isFaded ? 0.9 : 1,
              }}
              transition={{
                delay: i * 0.06,
                type: "spring",
                stiffness: 400,
                damping: 25,
              }}
              whileHover={!selected ? { scale: 1.15, y: -4 } : undefined}
              whileTap={!selected ? { scale: 0.9 } : undefined}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-colors disabled:cursor-default"
            >
              <span className="text-3xl leading-none">{s.emoji}</span>
              <span className={`text-xs font-medium transition-colors ${
                isSelected ? "text-foreground" : "text-muted-foreground"
              }`}>
                {s.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};
