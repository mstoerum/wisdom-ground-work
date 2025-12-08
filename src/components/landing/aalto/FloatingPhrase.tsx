import { useMemo } from 'react';
import { motion, MotionValue, useTransform } from 'framer-motion';

interface Phrase {
  text: string;
  quote: string;
  attribution: string;
}

interface Cluster {
  id: string;
  label: string;
  color: string;
  position: { x: number; y: number };
}

interface FloatingPhraseProps {
  phrase: Phrase;
  cluster: Cluster;
  phraseIndex: number;
  totalPhrases: number;
  formationProgress: MotionValue<number>;
  visibilityProgress: MotionValue<number>;
  isHovered: boolean;
  isClusterHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}

export const FloatingPhrase = ({
  phrase,
  cluster,
  phraseIndex,
  totalPhrases,
  formationProgress,
  visibilityProgress,
  isHovered,
  isClusterHovered,
  onHover,
  onLeave
}: FloatingPhraseProps) => {
  // Generate random starting position (scattered)
  const startPosition = useMemo(() => ({
    x: 10 + Math.random() * 80, // Random x across viewport
    y: 10 + Math.random() * 80, // Random y across viewport
    rotate: (Math.random() - 0.5) * 30,
  }), []);

  // Calculate end position (orbiting around cluster center)
  const endPosition = useMemo(() => {
    const angle = (phraseIndex / totalPhrases) * Math.PI * 2 - Math.PI / 2;
    const radius = 12 + phraseIndex * 3; // Staggered orbital distance
    return {
      x: cluster.position.x + Math.cos(angle) * radius,
      y: cluster.position.y + Math.sin(angle) * radius,
      rotate: 0,
    };
  }, [cluster.position, phraseIndex, totalPhrases]);

  // Interpolate position based on formation progress
  const x = useTransform(formationProgress, [0, 1], [startPosition.x, endPosition.x]);
  const y = useTransform(formationProgress, [0, 1], [startPosition.y, endPosition.y]);
  const rotate = useTransform(formationProgress, [0, 1], [startPosition.rotate, endPosition.rotate]);

  return (
    <motion.div
      className="absolute cursor-pointer z-10"
      style={{
        left: useTransform(x, v => `${v}%`),
        top: useTransform(y, v => `${v}%`),
        rotate,
        transform: 'translate(-50%, -50%)',
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* Phrase text */}
      <motion.span
        className="text-sm md:text-base font-medium whitespace-nowrap px-3 py-1.5 rounded-full transition-colors duration-300"
        style={{
          opacity: visibilityProgress,
          color: isHovered || isClusterHovered ? cluster.color : 'hsl(var(--foreground) / 0.7)',
          background: isHovered 
            ? `${cluster.color}15` 
            : isClusterHovered 
              ? `${cluster.color}08`
              : 'transparent',
          border: isHovered ? `1px solid ${cluster.color}40` : '1px solid transparent',
        }}
        animate={{
          scale: isHovered ? 1.1 : isClusterHovered ? 1.02 : 1,
          y: isHovered ? -2 : 0,
        }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        {phrase.text}
      </motion.span>

      {/* Tooltip with full quote */}
      {isHovered && (
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 z-50"
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div 
            className="bg-card border border-border rounded-lg shadow-xl p-4 max-w-xs text-left"
            style={{ borderLeftColor: cluster.color, borderLeftWidth: 3 }}
          >
            <p className="text-sm text-foreground italic mb-2">
              "{phrase.quote}"
            </p>
            <p className="text-xs text-muted-foreground">
              {phrase.attribution}
            </p>
          </div>
          {/* Arrow */}
          <div 
            className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
            style={{
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '8px solid hsl(var(--border))',
            }}
          />
        </motion.div>
      )}

      {/* Connection line to cluster center when hovered */}
      {isHovered && (
        <svg
          className="absolute pointer-events-none"
          style={{
            width: '200%',
            height: '200%',
            left: '-50%',
            top: '-50%',
            overflow: 'visible',
          }}
        >
          <motion.line
            x1="50%"
            y1="50%"
            x2={`${50 + (cluster.position.x - endPosition.x) * 2}%`}
            y2={`${50 + (cluster.position.y - endPosition.y) * 2}%`}
            stroke={cluster.color}
            strokeWidth={1.5}
            strokeDasharray="4 4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.6 }}
            transition={{ duration: 0.3 }}
          />
        </svg>
      )}
    </motion.div>
  );
};
