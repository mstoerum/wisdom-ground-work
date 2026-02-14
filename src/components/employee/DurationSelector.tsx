import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface DurationOption {
  minutes: number;
  label: string;
  description: string;
}

const durations: DurationOption[] = [
  { minutes: 5, label: "5 min", description: "Quick check-in" },
  { minutes: 10, label: "10 min", description: "Standard" },
  { minutes: 15, label: "15 min", description: "In-depth" },
];

interface DurationSelectorProps {
  onSelect: (minutes: number) => void;
}

export const DurationSelector = ({ onSelect }: DurationSelectorProps) => {
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (minutes: number) => {
    setSelected(minutes);
    setTimeout(() => {
      onSelect(minutes);
    }, 150);
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[50vh] px-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="flex items-center gap-2 text-muted-foreground mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Clock className="h-5 w-5" />
      </motion.div>

      <motion.h2
        className="text-2xl md:text-3xl font-medium text-foreground text-center mb-10 max-w-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        How much time do you have?
      </motion.h2>

      <motion.div
        className="flex flex-wrap justify-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {durations.map((option, index) => (
          <motion.button
            key={option.minutes}
            onClick={() => handleSelect(option.minutes)}
            className={cn(
              "flex flex-col items-center justify-center p-6 rounded-2xl",
              "bg-card border-2 transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              "min-w-[120px]",
              selected === option.minutes && "border-primary bg-primary/10 scale-105",
              selected !== option.minutes && "border-border hover:border-primary/30"
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: selected === option.minutes ? 1.05 : 1,
            }}
            transition={{
              delay: 0.4 + index * 0.1,
              scale: { duration: 0.2 },
            }}
            whileHover={{ scale: selected ? 1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={selected !== null}
          >
            <span
              className={cn(
                "text-3xl md:text-4xl font-bold mb-1 transition-colors duration-200",
                selected === option.minutes ? "text-primary" : "text-foreground"
              )}
            >
              {option.label}
            </span>
            <span
              className={cn(
                "text-sm transition-colors duration-200",
                selected === option.minutes ? "text-primary" : "text-muted-foreground"
              )}
            >
              {option.description}
            </span>
          </motion.button>
        ))}
      </motion.div>

      <motion.p
        className="text-xs text-muted-foreground mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        Choose how long you'd like to chat
      </motion.p>
    </motion.div>
  );
};
