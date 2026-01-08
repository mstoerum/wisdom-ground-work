import { motion } from "framer-motion";

interface Bubble {
  id: number;
  quote: string;
  x: number;
  y: number;
  scale: number;
  delay: number;
  rotation: number;
}

// Curated employee quotes that tell a story
const BUBBLES: Bubble[] = [
  {
    id: 1,
    quote: "I love my team, but meetings consume my entire day",
    x: 15,
    y: 20,
    scale: 1,
    delay: 0,
    rotation: -3,
  },
  {
    id: 2,
    quote: "Finally got the promotion I was working towards",
    x: 60,
    y: 8,
    scale: 0.9,
    delay: 0.2,
    rotation: 2,
  },
  {
    id: 3,
    quote: "The new tools have made everything so much easier",
    x: 35,
    y: 45,
    scale: 0.95,
    delay: 0.4,
    rotation: -1,
  },
  {
    id: 4,
    quote: "I wish we had clearer career paths here",
    x: 75,
    y: 35,
    scale: 0.85,
    delay: 0.6,
    rotation: 3,
  },
  {
    id: 5,
    quote: "Remote work has been a game changer for my family",
    x: 10,
    y: 60,
    scale: 0.9,
    delay: 0.8,
    rotation: -2,
  },
  {
    id: 6,
    quote: "Cross-team collaboration could be so much better",
    x: 50,
    y: 70,
    scale: 0.88,
    delay: 1,
    rotation: 1,
  },
  {
    id: 7,
    quote: "My manager really listens and supports my growth",
    x: 80,
    y: 60,
    scale: 0.92,
    delay: 1.2,
    rotation: -3,
  },
  {
    id: 8,
    quote: "We need better onboarding for new hires",
    x: 25,
    y: 82,
    scale: 0.8,
    delay: 1.4,
    rotation: 2,
  },
  {
    id: 9,
    quote: "The culture here is genuinely supportive",
    x: 65,
    y: 88,
    scale: 0.85,
    delay: 1.6,
    rotation: -1,
  },
];

export const FloatingBubbles = () => {
  return (
    <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden">
      {/* Connection lines - subtle constellation effect */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--teal-primary))" stopOpacity="0.15" />
            <stop offset="100%" stopColor="hsl(var(--tan-primary))" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {/* Draw subtle lines between nearby bubbles */}
        {BUBBLES.map((bubble, i) => {
          const nextBubble = BUBBLES[(i + 1) % BUBBLES.length];
          return (
            <motion.line
              key={`line-${i}`}
              x1={`${bubble.x}%`}
              y1={`${bubble.y}%`}
              x2={`${nextBubble.x}%`}
              y2={`${nextBubble.y}%`}
              stroke="url(#lineGradient)"
              strokeWidth="1"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, delay: bubble.delay + 0.5 }}
            />
          );
        })}
      </svg>

      {/* Floating bubbles */}
      {BUBBLES.map((bubble) => (
        <motion.div
          key={bubble.id}
          className="absolute"
          style={{
            left: `${bubble.x}%`,
            top: `${bubble.y}%`,
            transform: `translate(-50%, -50%) rotate(${bubble.rotation}deg)`,
          }}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ 
            opacity: 1, 
            scale: bubble.scale,
            y: [0, -8, 0, 8, 0],
          }}
          transition={{
            opacity: { duration: 0.6, delay: bubble.delay },
            scale: { duration: 0.6, delay: bubble.delay },
            y: { 
              duration: 8 + bubble.id * 0.5, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: bubble.delay + 1,
            },
          }}
        >
          <div 
            className="bg-card/90 backdrop-blur-sm border border-border/40 rounded-2xl px-4 py-3 shadow-lg max-w-[200px] md:max-w-[240px] hover:shadow-xl hover:border-primary/30 transition-all duration-300 cursor-default"
            style={{ transform: `rotate(${bubble.rotation}deg)` }}
          >
            <p className="text-sm md:text-base text-foreground/90 leading-relaxed">
              "{bubble.quote}"
            </p>
          </div>
        </motion.div>
      ))}

      {/* Central glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[hsl(var(--teal-primary))] rounded-full opacity-10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-[hsl(var(--tan-primary))] rounded-full opacity-10 blur-3xl pointer-events-none" />
    </div>
  );
};
