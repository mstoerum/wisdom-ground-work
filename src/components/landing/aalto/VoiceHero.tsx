import { useEffect, useState } from 'react';
import { motion, MotionValue, useTransform } from 'framer-motion';

interface VoiceHeroProps {
  scrollProgress: MotionValue<number>;
}

const quote = "I feel like my voice gets lost in the noise. Nobody really listens anymore.";
const words = quote.split(' ');

// Define semantic groupings that should stay together during fragmentation
const semanticGroups = [
  { words: ['voice', 'gets', 'lost'], cluster: 'safety' },
  { words: ['Nobody', 'really', 'listens'], cluster: 'recognition' },
];

const getWordCluster = (word: string): string | null => {
  for (const group of semanticGroups) {
    if (group.words.includes(word.replace(/[.,!?]/g, ''))) {
      return group.cluster;
    }
  }
  return null;
};

// Generate fragmentation positions for each word
const fragmentPositions = words.map((word, index) => {
  const cluster = getWordCluster(word);
  
  // Words in semantic groups drift together
  if (cluster === 'safety') {
    return { x: -30 + (index % 3) * 5, y: -20 + (index % 2) * 10, rotate: -5 + Math.random() * 10, scale: 1.1 };
  }
  if (cluster === 'recognition') {
    return { x: 25 + (index % 3) * 5, y: 15 + (index % 2) * 10, rotate: -3 + Math.random() * 6, scale: 1.1 };
  }
  
  // Other words scatter more randomly
  return {
    x: (Math.random() - 0.5) * 80,
    y: (Math.random() - 0.5) * 60,
    rotate: (Math.random() - 0.5) * 30,
    scale: 0.8 + Math.random() * 0.3
  };
});

export const VoiceHero = ({ scrollProgress }: VoiceHeroProps) => {
  const [revealedWords, setRevealedWords] = useState(0);
  const [isRevealing, setIsRevealing] = useState(true);

  // Word reveal animation
  useEffect(() => {
    if (!isRevealing) return;
    
    const interval = setInterval(() => {
      setRevealedWords(prev => {
        if (prev >= words.length) {
          setIsRevealing(false);
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [isRevealing]);

  // Transform scroll into fragmentation progress (starts at 0.3)
  const fragmentProgress = useTransform(scrollProgress, [0.25, 0.45], [0, 1]);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-aalto-dark px-6 md:px-12">
      {/* The Quote */}
      <div className="max-w-4xl mx-auto text-center relative">
        <div className="relative">
          {/* Opening quote mark */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: revealedWords > 0 ? 0.2 : 0 }}
            className="absolute -left-8 md:-left-16 -top-8 md:-top-12 text-6xl md:text-8xl font-display text-aalto-warm-white/20 select-none"
          >
            "
          </motion.span>

          {/* Words */}
          <p className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-tight tracking-tight text-aalto-warm-white">
            {words.map((word, index) => {
              const cluster = getWordCluster(word);
              const isSemanticWord = cluster !== null;
              
              return (
                <motion.span
                  key={index}
                  className={`inline-block mr-[0.25em] ${isSemanticWord ? 'text-primary/90' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: index < revealedWords ? 1 : 0,
                    y: index < revealedWords ? 0 : 20
                  }}
                  style={{
                    x: useTransform(fragmentProgress, [0, 1], [0, fragmentPositions[index].x * 10]),
                    y: useTransform(fragmentProgress, [0, 1], [0, fragmentPositions[index].y * 10]),
                    rotate: useTransform(fragmentProgress, [0, 1], [0, fragmentPositions[index].rotate]),
                    scale: useTransform(fragmentProgress, [0, 1], [1, fragmentPositions[index].scale]),
                    opacity: useTransform(
                      fragmentProgress, 
                      [0, 0.3, 1], 
                      [index < revealedWords ? 1 : 0, 1, isSemanticWord ? 0.9 : 0.3]
                    ),
                  }}
                  transition={{ 
                    duration: 0.5, 
                    ease: [0.16, 1, 0.3, 1],
                    delay: index * 0.08 
                  }}
                >
                  {word}
                </motion.span>
              );
            })}
          </p>

          {/* Closing quote mark */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: revealedWords >= words.length ? 0.2 : 0 }}
            transition={{ delay: 0.3 }}
            className="absolute -right-4 md:-right-12 -bottom-4 md:-bottom-8 text-6xl md:text-8xl font-display text-aalto-warm-white/20 select-none"
          >
            "
          </motion.span>
        </div>

        {/* Attribution */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ 
            opacity: revealedWords >= words.length ? 1 : 0,
            y: revealedWords >= words.length ? 0 : 10
          }}
          style={{
            opacity: useTransform(fragmentProgress, [0, 0.3], [revealedWords >= words.length ? 1 : 0, 0])
          }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-8 md:mt-12 text-aalto-warm-white/50 text-sm md:text-base tracking-wide"
        >
          — Anonymous Employee, Q1 2025
        </motion.p>
      </div>

      {/* Subtle glow effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(var(--primary) / 0.05) 0%, transparent 70%)',
          opacity: useTransform(fragmentProgress, [0, 0.5], [0.5, 0])
        }}
      />
    </div>
  );
};
