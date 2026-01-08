import React from 'react';
import { motion } from 'framer-motion';
import { BreathingCircle } from './BreathingCircle';

export const HeroInteractiveChat: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center justify-center"
    >
      <BreathingCircle size="xl" />
    </motion.div>
  );
};
