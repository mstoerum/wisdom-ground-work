import { motion, MotionValue, useTransform } from 'framer-motion';

interface Cluster {
  id: string;
  label: string;
  color: string;
  position: { x: number; y: number };
  phrases: { text: string; quote: string; attribution: string }[];
}

interface SemanticClusterProps {
  cluster: Cluster;
  labelVisibility: MotionValue<number>;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}

export const SemanticCluster = ({
  cluster,
  labelVisibility,
  isHovered,
  onHover,
  onLeave
}: SemanticClusterProps) => {
  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{
        left: `${cluster.position.x}%`,
        top: `${cluster.position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* Glow effect on hover */}
      <motion.div
        className="absolute inset-0 rounded-full blur-xl"
        style={{
          background: cluster.color,
          width: isHovered ? 120 : 80,
          height: isHovered ? 120 : 80,
          left: '50%',
          top: '50%',
          x: '-50%',
          y: '-50%',
        }}
        animate={{
          opacity: isHovered ? 0.4 : 0.15,
          scale: isHovered ? 1.2 : 1,
        }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Central dot */}
      <motion.div
        className="relative rounded-full"
        style={{
          background: cluster.color,
          width: 16,
          height: 16,
        }}
        animate={{
          scale: isHovered ? 1.5 : 1,
          boxShadow: isHovered 
            ? `0 0 30px ${cluster.color}` 
            : `0 0 10px ${cluster.color}`,
        }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Label */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap"
        style={{
          top: 'calc(100% + 12px)',
          opacity: labelVisibility,
        }}
      >
        <motion.span
          className="text-xs md:text-sm uppercase tracking-[0.15em] font-medium"
          style={{ color: cluster.color }}
          animate={{
            opacity: isHovered ? 1 : 0.7,
            y: isHovered ? -2 : 0,
          }}
          transition={{ duration: 0.3 }}
        >
          {cluster.label}
        </motion.span>

        {/* Phrase count badge */}
        <motion.span
          className="ml-2 text-xs opacity-50"
          style={{ color: cluster.color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 0.7 : 0 }}
        >
          {cluster.phrases.length} voices
        </motion.span>
      </motion.div>

      {/* Pulse animation rings */}
      {isHovered && (
        <>
          {[1, 2, 3].map((ring) => (
            <motion.div
              key={ring}
              className="absolute rounded-full border"
              style={{
                borderColor: cluster.color,
                width: 16,
                height: 16,
                left: '50%',
                top: '50%',
                x: '-50%',
                y: '-50%',
              }}
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ 
                scale: 2 + ring * 0.8, 
                opacity: 0 
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: ring * 0.3,
                ease: "easeOut"
              }}
            />
          ))}
        </>
      )}
    </motion.div>
  );
};
