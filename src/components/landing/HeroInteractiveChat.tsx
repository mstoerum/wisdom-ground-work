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
        className="w-full max-w-lg px-4"
      >
        <div className="bg-background border border-border rounded-2xl p-4 shadow-sm">
          <p className="text-lg md:text-xl font-medium text-foreground leading-relaxed mb-4">
            {displayedText}
            {isTyping && (
              <span className="inline-block w-0.5 h-5 ml-1 bg-primary animate-pulse" />
            )}
          </p>
          <div className="flex justify-end">
            <a
              href="/demo"
              className="inline-flex items-center justify-center gap-2 bg-foreground text-background hover:bg-foreground/90 rounded-full px-6 py-2.5 text-sm font-semibold transition-colors"
            >
              Try the Demo
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
