import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MoodOption {
  value: number;
  label: string;
  emoji: string;
}

const moods: MoodOption[] = [
  { value: 1, label: "Tough", emoji: "😔" },
  { value: 2, label: "Not great", emoji: "😟" },
  { value: 3, label: "Okay", emoji: "😐" },
  { value: 4, label: "Good", emoji: "🙂" },
  { value: 5, label: "Great!", emoji: "😊" },
];

interface MoodSelectorProps {
  onMoodSelect: (mood: number) => void;
  question?: string;
}

export const MoodSelector = ({ 
  onMoodSelect,
  question = "How's work been this week?"
}: MoodSelectorProps) => {
  const [hoveredMood, setHoveredMood] = useState<number | null>(null);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);

  const handleSelect = (mood: number) => {
    setSelectedMood(mood);
    // Small delay for visual feedback before transitioning
    setTimeout(() => {
      onMoodSelect(mood);
    }, 300);
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[50vh] px-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Intro text */}
      <motion.p
        className="text-lg text-muted-foreground mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Hi, I'm Spradley.
      </motion.p>

      {/* Question */}
      <motion.h2
        className="text-2xl md:text-3xl font-medium text-foreground text-center mb-10 max-w-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {question}
      </motion.h2>

      {/* Mood buttons */}
      <motion.div
        className="flex flex-wrap justify-center gap-3 md:gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {moods.map((mood, index) => (
          <motion.button
            key={mood.value}
            onClick={() => handleSelect(mood.value)}
            onMouseEnter={() => setHoveredMood(mood.value)}
            onMouseLeave={() => setHoveredMood(null)}
            className={cn(
              "flex flex-col items-center justify-center p-4 md:p-5 rounded-2xl",
              "bg-card border-2 transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              "min-w-[80px] md:min-w-[100px]",
              selectedMood === mood.value && "border-primary bg-primary/10 scale-105",
              selectedMood !== mood.value && hoveredMood === mood.value && "border-primary/50 bg-muted/50",
              selectedMood !== mood.value && hoveredMood !== mood.value && "border-border hover:border-primary/30"
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: selectedMood === mood.value ? 1.05 : 1
            }}
            transition={{ 
              delay: 0.4 + index * 0.08,
              scale: { duration: 0.2 }
            }}
            whileHover={{ scale: selectedMood ? 1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={selectedMood !== null}
            aria-label={`Select mood: ${mood.label}`}
          >
            <span 
              className={cn(
                "text-4xl md:text-5xl mb-2 transition-transform duration-200",
                (hoveredMood === mood.value || selectedMood === mood.value) && "scale-110"
              )}
              role="img" 
              aria-hidden="true"
            >
              {mood.emoji}
            </span>
            <span 
              className={cn(
                "text-sm font-medium transition-colors duration-200",
                selectedMood === mood.value ? "text-primary" : "text-muted-foreground"
              )}
            >
              {mood.label}
            </span>
          </motion.button>
        ))}
      </motion.div>

      {/* Hint */}
      <motion.p
        className="text-xs text-muted-foreground mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        Click to continue
      </motion.p>
    </motion.div>
  );
};
