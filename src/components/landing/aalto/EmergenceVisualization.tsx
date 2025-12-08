import { useState } from 'react';
import { motion, MotionValue, useTransform } from 'framer-motion';
import { SemanticCluster } from './SemanticCluster';
import { FloatingPhrase } from './FloatingPhrase';

interface EmergenceVisualizationProps {
  scrollProgress: MotionValue<number>;
}

// Semantic clusters with their phrases and source quotes - balanced positive and constructive
const clusters = [
  {
    id: 'connection',
    label: 'Team Connection',
    color: 'hsl(152, 50%, 45%)', // sage green - positive/healthy
    position: { x: 25, y: 35 },
    phrases: [
      { text: 'love my team', quote: 'I love my team, they always have my back when things get tough.', attribution: 'Anonymous, Engineering' },
      { text: 'great collaboration', quote: 'The collaboration here is unlike anywhere I\'ve worked before.', attribution: 'Anonymous, Product' },
      { text: 'supportive manager', quote: 'My manager is incredibly supportive and advocates for our growth.', attribution: 'Anonymous, Design' },
    ]
  },
  {
    id: 'meetings',
    label: 'Time & Meetings',
    color: 'hsl(12, 45%, 55%)', // terracotta - attention needed
    position: { x: 70, y: 40 },
    phrases: [
      { text: '4-5 hours daily', quote: 'I spend 4-5 hours daily in meetings with little time to execute.', attribution: 'Anonymous, Engineering' },
      { text: 'meeting overload', quote: 'The meeting overload is real. My calendar is a wall of color blocks.', attribution: 'Anonymous, Sales' },
      { text: 'could be an email', quote: 'Half of these meetings could have been an email or a quick Slack.', attribution: 'Anonymous, Marketing' },
    ]
  },
  {
    id: 'energy',
    label: 'Energy & Focus',
    color: 'hsl(10, 55%, 58%)', // coral - needs attention
    position: { x: 48, y: 70 },
    phrases: [
      { text: 'already exhausted', quote: 'By the time I can focus on actual work, I\'m already exhausted.', attribution: 'Anonymous, Product' },
      { text: 'no deep work', quote: 'I can\'t remember the last time I had 2 hours of uninterrupted focus.', attribution: 'Anonymous, Engineering' },
      { text: 'context switching', quote: 'The constant context switching is draining my creative energy.', attribution: 'Anonymous, Design' },
    ]
  }
];

// Connection lines between related clusters - showing how themes interrelate
const connections = [
  { from: 'connection', to: 'meetings', strength: 0.7 },  // Good teams still have meeting problems
  { from: 'meetings', to: 'energy', strength: 0.9 },      // Meetings → exhaustion (strong link)
  { from: 'energy', to: 'connection', strength: 0.5 },    // Energy affects team dynamics
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
