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
  const clusterFormation = useTransform(scrollProgress, [0.25, 0.4], [0, 1]);
  const phrasesVisible = useTransform(scrollProgress, [0.3, 0.45], [0, 1]);
  const labelsVisible = useTransform(scrollProgress, [0.35, 0.45], [0, 1]);
  const connectionsVisible = useTransform(scrollProgress, [0.4, 0.5], [0, 1]);
  const backgroundTransition = useTransform(scrollProgress, [0.25, 0.4], [0, 1]);
  
  // Compression phase - clusters compress into dots before transitioning to InsightsEmergence
  const compressionProgress = useTransform(scrollProgress, [0.48, 0.58], [0, 1]);
  const clusterScale = useTransform(compressionProgress, [0, 1], [1, 0.15]);
  const clusterOpacity = useTransform(compressionProgress, [0.7, 1], [1, 0]);
  const phraseOpacity = useTransform(compressionProgress, [0, 0.4], [1, 0]);
  const labelOpacity = useTransform(compressionProgress, [0, 0.3], [1, 0]);
  const connectionOpacity = useTransform(compressionProgress, [0, 0.2], [1, 0]);
  
  // Move clusters toward center positions that map to metric cards
  const connectionCenterX = useTransform(compressionProgress, [0, 1], [25, 20]);
  const connectionCenterY = useTransform(compressionProgress, [0, 1], [35, 50]);
  const meetingsCenterX = useTransform(compressionProgress, [0, 1], [70, 50]);
  const meetingsCenterY = useTransform(compressionProgress, [0, 1], [40, 50]);
  const energyCenterX = useTransform(compressionProgress, [0, 1], [48, 80]);
  const energyCenterY = useTransform(compressionProgress, [0, 1], [70, 50]);

  const getClusterPosition = (clusterId: string) => {
    switch(clusterId) {
      case 'connection': return { x: connectionCenterX, y: connectionCenterY };
      case 'meetings': return { x: meetingsCenterX, y: meetingsCenterY };
      case 'energy': return { x: energyCenterX, y: energyCenterY };
      default: return { x: 50, y: 50 };
    }
  };

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
      <motion.svg 
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ opacity: connectionOpacity }}
      >
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
      </motion.svg>

      {/* Floating phrases that drift toward clusters */}
      <motion.div style={{ opacity: phraseOpacity }}>
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
      </motion.div>

      {/* Cluster labels with compression animation */}
      {clusters.map((cluster) => {
        const pos = getClusterPosition(cluster.id);
        return (
          <motion.div
            key={cluster.id}
            className="absolute"
            style={{
              left: pos.x,
              top: pos.y,
              x: '-50%',
              y: '-50%',
              scale: clusterScale,
            }}
          >
            {/* Compressed dot visualization */}
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: 80,
                height: 80,
                backgroundColor: cluster.color,
                opacity: useTransform(compressionProgress, [0.3, 0.8], [0, 0.9]),
                boxShadow: `0 0 40px ${cluster.color}`,
              }}
            />
            
            {/* Original cluster label */}
            <motion.div style={{ opacity: labelOpacity }}>
              <SemanticCluster
                cluster={cluster}
                labelVisibility={labelsVisible}
                isHovered={hoveredCluster === cluster.id}
                onHover={() => setHoveredCluster(cluster.id)}
                onLeave={() => setHoveredCluster(null)}
                isStatic
              />
            </motion.div>
          </motion.div>
        );
      })}

      {/* Instruction text */}
      <motion.p
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sm text-muted-foreground/60 tracking-wide"
        style={{ opacity: useTransform(labelsVisible, [0.5, 1], [0, 1]) }}
      >
        Hover clusters to explore connections
      </motion.p>
      
      {/* Compression phase text */}
      <motion.p
        className="absolute top-1/4 left-1/2 -translate-x-1/2 text-center font-display text-2xl md:text-3xl text-foreground/80"
        style={{ 
          opacity: useTransform(compressionProgress, [0.3, 0.5, 0.8, 1], [0, 1, 1, 0])
        }}
      >
        Patterns crystallize...
      </motion.p>
    </div>
  );
};
