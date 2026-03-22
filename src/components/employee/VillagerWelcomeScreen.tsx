import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Home, ArrowRight } from "lucide-react";

interface VillagerWelcomeScreenProps {
  onProceed: () => void;
}

export const VillagerWelcomeScreen = ({ onProceed }: VillagerWelcomeScreenProps) => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6">
      {/* Icon */}
      <motion.div
        className="mb-6 w-16 h-16 rounded-full bg-[hsl(var(--terracotta-pale))] flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Home className="h-8 w-8 text-[hsl(var(--terracotta-primary))]" />
      </motion.div>

      {/* Title */}
      <motion.h1
        className="text-3xl md:text-4xl font-semibold text-foreground mb-4 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        Welcome, villager!
      </motion.h1>

      {/* Intro text */}
      <motion.p
        className="text-lg text-muted-foreground max-w-md mx-auto text-center leading-relaxed mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        This is a short conversation to get a better understanding of your experience as a villager. We're curious to hear about your experiences, what life is like here, and any ideas you might have for the community.
      </motion.p>

      {/* What we'll talk about */}
      <motion.div
        className="text-sm text-muted-foreground max-w-sm mx-auto text-center mb-10 space-y-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        <p className="font-medium text-foreground mb-2">We'll chat about things like:</p>
        <p>🏠 Shared spaces &amp; how you use them</p>
        <p>💡 Ideas &amp; things you'd love to see</p>
        <p>🤝 Community &amp; connection</p>
        <p>📢 Communication &amp; feeling heard</p>
      </motion.div>

      {/* Proceed button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.3 }}
      >
        <Button
          onClick={onProceed}
          size="lg"
          className="px-8 gap-2 bg-[hsl(var(--terracotta-primary))] hover:bg-[hsl(var(--terracotta-primary))]/90"
        >
          Let's go
          <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>

      {/* Privacy note */}
      <motion.p
        className="mt-6 text-xs text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.3 }}
      >
        Your responses are anonymous and confidential
      </motion.p>
    </div>
  );
};
