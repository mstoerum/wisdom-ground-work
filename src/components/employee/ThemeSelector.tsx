import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MessageCircle } from "lucide-react";

interface Theme {
  id: string;
  name: string;
}

interface ThemeSelectorProps {
  themes: Theme[];
  onSelect: (themeId: string) => void;
}

export const ThemeSelector = ({ themes, onSelect }: ThemeSelectorProps) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (themeId: string) => {
    setSelected(themeId);
    setTimeout(() => {
      onSelect(themeId);
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
        <MessageCircle className="h-5 w-5" />
      </motion.div>

      <motion.h2
        className="text-2xl md:text-3xl font-medium text-foreground text-center mb-3 max-w-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        What would you like to talk about more?
      </motion.h2>

      <motion.p
        className="text-sm text-muted-foreground text-center mb-8 max-w-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
      >
        We're about halfway through. Pick a topic you'd like to explore deeper.
      </motion.p>

      <motion.div
        className="flex flex-wrap justify-center gap-3 max-w-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {themes.map((theme, index) => (
          <motion.button
            key={theme.id}
            onClick={() => handleSelect(theme.id)}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-xl",
              "bg-card border-2 transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              selected === theme.id && "border-primary bg-primary/10 scale-105",
              selected !== theme.id && "border-border hover:border-primary/30"
            )}
            initial={{ opacity: 0, y: 15 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: selected === theme.id ? 1.05 : 1,
            }}
            transition={{
              delay: 0.4 + index * 0.08,
              scale: { duration: 0.2 },
            }}
            whileHover={{ scale: selected ? 1 : 1.03 }}
            whileTap={{ scale: 0.97 }}
            disabled={selected !== null}
          >
            <span
              className={cn(
                "text-base font-medium transition-colors duration-200",
                selected === theme.id ? "text-primary" : "text-foreground"
              )}
            >
              {theme.name}
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
        Click a topic to continue
      </motion.p>
    </motion.div>
  );
};
