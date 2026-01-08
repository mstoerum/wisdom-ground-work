import React from 'react';
import { motion } from 'framer-motion';
import { BreathingCircle } from './BreathingCircle';

export const HeroInteractiveChat: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center gap-8"
    >
      <BreathingCircle size="xl" />
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 shadow-lg px-6 py-4 max-w-sm"
      >
        <p className="text-lg md:text-xl font-medium text-foreground text-center leading-relaxed">
          Did you feel energized this morning at work?
        </p>
      </motion.div>
    </motion.div>
  );
};
