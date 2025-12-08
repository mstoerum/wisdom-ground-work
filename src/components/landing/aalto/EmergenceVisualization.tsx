import { useState } from 'react';
import { motion, MotionValue, useTransform } from 'framer-motion';
import { SemanticCluster } from './SemanticCluster';
import { FloatingPhrase } from './FloatingPhrase';

interface EmergenceVisualizationProps {
  scrollProgress: MotionValue<number>;
}

// Semantic clusters with their phrases and source quotes
const clusters = [
  {
    id: 'safety',
    label: 'Psychological Safety',
    color: 'hsl(12, 45%, 55%)', // terracotta
    position: { x: 25, y: 35 },
    phrases: [
      { text: 'voice gets lost', quote: 'I feel like my voice gets lost in the noise.', attribution: 'Anonymous, Engineering' },
      { text: 'afraid to speak up', quote: 'I\'m afraid to speak up in meetings because my ideas get dismissed.', attribution: 'Anonymous, Product' },
      { text: 'dismissed in meetings', quote: 'Every time I share something, it feels dismissed in meetings.', attribution: 'Anonymous, Design' },
    ]
  },
  {
    id: 'recognition',
    label: 'Recognition',
    color: 'hsl(152, 50%, 45%)', // sage green
    position: { x: 70, y: 45 },
    phrases: [
      { text: 'nobody listens', quote: 'Nobody really listens anymore.', attribution: 'Anonymous, Sales' },
      { text: 'work goes unnoticed', quote: 'My work goes unnoticed most of the time.', attribution: 'Anonymous, Support' },
      { text: 'need acknowledgment', quote: 'Sometimes I just need acknowledgment that I exist.', attribution: 'Anonymous, Marketing' },
    ]
  },
  {
    id: 'workload',
    label: 'Workload',
    color: 'hsl(10, 55%, 58%)', // coral
    position: { x: 45, y: 70 },
    phrases: [
      { text: 'overwhelmed constantly', quote: 'I feel overwhelmed constantly with no end in sight.', attribution: 'Anonymous, Operations' },
      { text: 'no time to think', quote: 'There\'s no time to think, just react to the next fire.', attribution: 'Anonymous, Engineering' },
      { text: 'burning out', quote: 'I can feel myself burning out but can\'t stop.', attribution: 'Anonymous, Product' },
    ]
  }
];

// Connection lines between related clusters
const connections = [
  { from: 'safety', to: 'recognition', strength: 0.8 },
  { from: 'recognition', to: 'workload', strength: 0.5 },
  { from: 'workload', to: 'safety', strength: 0.6 },
];

export const EmergenceVisualization = ({ scrollProgress }: EmergenceVisualizationProps) => {
  const [hoveredCluster, setHoveredCluster] = useState<string | null>(null);
  const [hoveredPhrase, setHoveredPhrase] = useState<{ clusterId: string; phraseIndex: number } | null>(null);

  // Phase transitions based on scroll
  const clusterFormation = useTransform(scrollProgress, [0.45, 0.65], [0, 1]);
  const phrasesVisible = useTransform(scrollProgress, [0.55, 0.75], [0, 1]);
  const labelsVisible = useTransform(scrollProgress, [0.65, 0.8], [0, 1]);
  const connectionsVisible = useTransform(scrollProgress, [0.7, 0.85], [0, 1]);
  const backgroundTransition = useTransform(scrollProgress, [0.4, 0.6], [0, 1]);

  return (
    <div className="h-full w-full relative overflow-hidden">
      {/* Transitioning background */}
      <motion.div 
        className="absolute inset-0"
        style={{
          background: useTransform(
            backgroundTransition,
            [0, 1],
            ['hsl(25, 15%, 8%)', 'hsl(40, 20%, 97%)']
          )
        }}
      />

      {/* SVG layer for connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <linearGradient id="connection-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(30, 10%, 50%)" stopOpacity="0.3" />
            <stop offset="50%" stopColor="hsl(30, 10%, 50%)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(30, 10%, 50%)" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        
        {connections.map((conn, index) => {
          const fromCluster = clusters.find(c => c.id === conn.from);
          const toCluster = clusters.find(c => c.id === conn.to);
          if (!fromCluster || !toCluster) return null;

          const isHighlighted = hoveredCluster === conn.from || hoveredCluster === conn.to;

          return (
            <motion.line
              key={index}
              x1={`${fromCluster.position.x}%`}
              y1={`${fromCluster.position.y}%`}
              x2={`${toCluster.position.x}%`}
              y2={`${toCluster.position.y}%`}
              stroke={isHighlighted ? "hsl(var(--primary))" : "url(#connection-gradient)"}
              strokeWidth={isHighlighted ? 2 : 1}
              strokeDasharray="4 4"
              style={{
                opacity: useTransform(connectionsVisible, [0, 1], [0, conn.strength * (isHighlighted ? 1 : 0.5)]),
                pathLength: connectionsVisible
              }}
            />
          );
        })}
      </svg>

      {/* Floating phrases that drift toward clusters */}
      {clusters.map((cluster) => (
        cluster.phrases.map((phrase, phraseIndex) => (
          <FloatingPhrase
            key={`${cluster.id}-${phraseIndex}`}
            phrase={phrase}
            cluster={cluster}
            phraseIndex={phraseIndex}
            totalPhrases={cluster.phrases.length}
            formationProgress={clusterFormation}
            visibilityProgress={phrasesVisible}
            isHovered={hoveredPhrase?.clusterId === cluster.id && hoveredPhrase?.phraseIndex === phraseIndex}
            isClusterHovered={hoveredCluster === cluster.id}
            onHover={() => setHoveredPhrase({ clusterId: cluster.id, phraseIndex })}
            onLeave={() => setHoveredPhrase(null)}
          />
        ))
      ))}

      {/* Cluster labels */}
      {clusters.map((cluster) => (
        <SemanticCluster
          key={cluster.id}
          cluster={cluster}
          labelVisibility={labelsVisible}
          isHovered={hoveredCluster === cluster.id}
          onHover={() => setHoveredCluster(cluster.id)}
          onLeave={() => setHoveredCluster(null)}
        />
      ))}

      {/* Instruction text */}
      <motion.p
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sm text-muted-foreground/60 tracking-wide"
        style={{ opacity: useTransform(labelsVisible, [0.5, 1], [0, 1]) }}
      >
        Hover clusters to explore connections
      </motion.p>
    </div>
  );
};
