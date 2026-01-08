import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BreathingCircle } from './BreathingCircle';

const QUESTION_TEXT = "Let's talk about your workload. How well can you handle the workload?";

export const HeroInteractiveChat: React.FC = () => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (displayedText.length < QUESTION_TEXT.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(QUESTION_TEXT.slice(0, displayedText.length + 1));
      }, 50);
      return () => clearTimeout(timeout);
    } else {
      setIsTyping(false);
    }
  }, [displayedText]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center gap-8"
    >
      <BreathingCircle size="xl" />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="max-w-md px-4"
      >
        <p className="text-xl md:text-2xl font-medium text-foreground text-center leading-relaxed">
          {displayedText}
          {isTyping && (
            <span className="inline-block w-0.5 h-6 ml-1 bg-primary animate-pulse" />
          )}
        </p>
      </motion.div>
    </motion.div>
  );
};
