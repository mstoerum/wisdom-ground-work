import { motion } from "framer-motion";

/**
 * Animated flowing wave pattern with gradient lines
 * Creates organic, data-visualization inspired curves with continuous motion
 */
export const WaveBackground = () => {
  // Generate flowing wave paths with different characteristics
  const generateWavePath = (index: number, variant: 'primary' | 'secondary' | 'tertiary') => {
    const baseY = 150 + (index * 8);
    const amplitude = 120 + (index % 4) * 20;
    const frequency = 0.003 + (index % 3) * 0.001;
    const phaseShift = index * 0.4;
    
    let path = `M -100 ${baseY}`;
    
    for (let x = 0; x <= 1500; x += 50) {
      const y = baseY + 
        Math.sin(x * frequency + phaseShift) * amplitude +
        Math.sin(x * frequency * 2 + phaseShift * 1.5) * (amplitude * 0.3);
      
      const cp1x = x + 15;
      const cp1y = y - amplitude * 0.2 * Math.cos(x * frequency + phaseShift);
      const cp2x = x + 35;
      const cp2y = y + amplitude * 0.2 * Math.sin(x * frequency + phaseShift + 0.5);
      const endX = x + 50;
      const endY = baseY + 
        Math.sin((x + 50) * frequency + phaseShift) * amplitude +
        Math.sin((x + 50) * frequency * 2 + phaseShift * 1.5) * (amplitude * 0.3);
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
    }
    
    return path;
  };

  // Create three sets of waves with different gradients
  const waveGroups = [
    { variant: 'primary' as const, count: 25, delay: 0 },
    { variant: 'secondary' as const, count: 20, delay: 0.5 },
    { variant: 'tertiary' as const, count: 15, delay: 1 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Background gradient - muted blue-gray transitioning to off-white */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, hsl(200 30% 75% / 0.4) 0%, hsl(200 25% 85% / 0.3) 50%, hsl(var(--cream-bg)) 100%)'
        }}
      />
      
      <svg 
        className="absolute w-full h-full"
        viewBox="0 0 1400 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          {/* Primary gradient - Teal to Blue to Pink */}
          <linearGradient id="waveGradientPrimary" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--teal-primary))" stopOpacity="0.8" />
            <stop offset="40%" stopColor="hsl(200 40% 60%)" stopOpacity="0.6" />
            <stop offset="70%" stopColor="hsl(320 50% 70%)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(var(--hero-pink))" stopOpacity="0.3" />
          </linearGradient>
          
          {/* Secondary gradient - Tan to Teal */}
          <linearGradient id="waveGradientSecondary" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--tan-primary))" stopOpacity="0.6" />
            <stop offset="50%" stopColor="hsl(var(--teal-light))" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(var(--teal-primary))" stopOpacity="0.2" />
          </linearGradient>
          
          {/* Tertiary gradient - Light blue to lavender to pink */}
          <linearGradient id="waveGradientTertiary" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--hero-blue))" stopOpacity="0.4" />
            <stop offset="50%" stopColor="hsl(280 40% 70%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(var(--hero-pink))" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        
        {/* Animated wave groups with continuous floating motion */}
        {waveGroups.map((group, groupIndex) => (
          <motion.g 
            key={groupIndex}
            animate={{ 
              y: [0, -8, 0, 8, 0],
            }}
            transition={{
              duration: 12 + groupIndex * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: groupIndex * 0.5,
            }}
          >
            {Array.from({ length: group.count }).map((_, i) => (
              <motion.path
                key={`${group.variant}-${i}`}
                d={generateWavePath(i + groupIndex * 10, group.variant)}
                stroke={`url(#waveGradient${group.variant.charAt(0).toUpperCase() + group.variant.slice(1)})`}
                strokeWidth={0.8 + (i % 3) * 0.3}
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ 
                  pathLength: 1, 
                  opacity: 0.6 - (i * 0.015),
                }}
                transition={{
                  pathLength: { 
                    duration: 2.5 + (i * 0.1), 
                    delay: group.delay + (i * 0.05),
                    ease: "easeOut" 
                  },
                  opacity: { 
                    duration: 1.5, 
                    delay: group.delay + (i * 0.05) 
                  }
                }}
                style={{
                  filter: i % 5 === 0 ? 'blur(0.5px)' : 'none'
                }}
              />
            ))}
          </motion.g>
        ))}
        
        {/* Pulsing decorative nodes at wave intersections */}
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.circle
            key={`node-${i}`}
            cx={200 + (i * 100) + Math.sin(i) * 50}
            cy={300 + Math.cos(i * 0.8) * 150}
            r={2 + (i % 3)}
            fill="hsl(var(--teal-primary))"
            fillOpacity={0.3}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [1, 1.4, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ 
              duration: 3 + (i % 3),
              delay: 2 + (i * 0.1),
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </svg>
      
      {/* Bottom fade to blend with content */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-40"
        style={{
          background: 'linear-gradient(to top, hsl(var(--cream-bg)), transparent)'
        }}
      />
    </div>
  );
};
