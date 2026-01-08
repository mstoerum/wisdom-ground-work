import { useMemo } from "react";

/**
 * Elegant flowing wave pattern SVG for hero background
 * Creates organic, parallel curved lines similar to topographic patterns
 */
export const WaveBackground = () => {
  // Generate flowing wave paths
  const wavePaths = useMemo(() => {
    const paths: string[] = [];
    const lineCount = 50;
    
    for (let i = 0; i < lineCount; i++) {
      // Each line has a slightly different vertical offset and amplitude
      const baseY = 100 + (i * 14);
      const amplitude = 80 + (i % 5) * 10;
      const frequency = 0.002 + (i % 3) * 0.0005;
      const phaseShift = (i * 0.3);
      
      // Create a flowing bezier curve path
      let path = `M -50 ${baseY}`;
      
      for (let x = 0; x <= 1300; x += 100) {
        const y = baseY + Math.sin(x * frequency + phaseShift) * amplitude;
        const cp1x = x + 30;
        const cp1y = y - amplitude * 0.3 * Math.cos(x * frequency + phaseShift);
        const cp2x = x + 70;
        const cp2y = y + amplitude * 0.3 * Math.sin(x * frequency + phaseShift + 0.5);
        const endX = x + 100;
        const endY = baseY + Math.sin((x + 100) * frequency + phaseShift) * amplitude;
        
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
      }
      
      paths.push(path);
    }
    
    return paths;
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg 
        className="absolute w-full h-full"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          {/* Gradient for subtle depth */}
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--tan-primary))" stopOpacity="0.15" />
            <stop offset="50%" stopColor="hsl(var(--secondary))" stopOpacity="0.12" />
            <stop offset="100%" stopColor="hsl(var(--tan-primary))" stopOpacity="0.08" />
          </linearGradient>
        </defs>
        
        {/* Wave lines */}
        {wavePaths.map((d, i) => (
          <path
            key={i}
            d={d}
            stroke="url(#waveGradient)"
            strokeWidth={0.8 + (i % 3) * 0.2}
            strokeOpacity={0.4 - (i * 0.005)}
            fill="none"
            style={{
              filter: i % 4 === 0 ? 'blur(0.5px)' : 'none'
            }}
          />
        ))}
      </svg>
    </div>
  );
};
