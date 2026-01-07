import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface ThemeJourneyPathProps {
  themes: Array<{
    id: string;
    name: string;
    discussed: boolean;
    current: boolean;
    depth?: number; // 0-100 exploration depth
  }>;
  coveragePercent: number;
  className?: string;
}

export const ThemeJourneyPath = ({ themes, coveragePercent, className = "" }: ThemeJourneyPathProps) => {
  const discussedCount = themes.filter(t => t.discussed).length;
  const totalCount = themes.length;
  
  // Spacing and dimensions
  const nodeSpacing = 80;
  const pathWidth = 200;
  const nodeRadius = 12;
  const depthRingRadius = 18;
  const curveOffset = 30;
  
  const height = (themes.length - 1) * nodeSpacing + 60;
  
  // Calculate circumference for depth ring
  const circumference = 2 * Math.PI * depthRingRadius;
  
  // Generate the winding path
  const generatePath = () => {
    if (themes.length === 0) return "";
    
    let path = `M ${pathWidth / 2} 30`;
    
    for (let i = 1; i < themes.length; i++) {
      const y = 30 + i * nodeSpacing;
      const prevY = 30 + (i - 1) * nodeSpacing;
      const midY = (y + prevY) / 2;
      
      // Alternate curves left and right
      const offset = i % 2 === 0 ? -curveOffset : curveOffset;
      
      path += ` C ${pathWidth / 2 + offset} ${midY}, ${pathWidth / 2 + offset} ${midY}, ${pathWidth / 2} ${y}`;
    }
    
    return path;
  };

  // Get the progress along the path (0-1)
  const getProgressPercent = () => {
    const currentIndex = themes.findIndex(t => t.current);
    if (currentIndex === -1) return discussedCount / totalCount;
    return currentIndex / Math.max(totalCount - 1, 1);
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Journey visualization */}
      <div className="flex-1 relative" style={{ minHeight: height }}>
        <svg
          width={pathWidth}
          height={height}
          viewBox={`0 0 ${pathWidth} ${height}`}
          className="absolute inset-0"
        >
          {/* Background path (unprogressed) */}
          <motion.path
            d={generatePath()}
            fill="none"
            stroke="hsl(var(--muted-foreground) / 0.2)"
            strokeWidth={3}
            strokeDasharray="6 4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          
          {/* Progressed path */}
          <motion.path
            d={generatePath()}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={3}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: getProgressPercent() }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          />
          
          {/* Theme waypoints with depth rings */}
          {themes.map((theme, index) => {
            const y = 30 + index * nodeSpacing;
            const x = pathWidth / 2;
            const depth = theme.depth || 0;
            const depthOffset = circumference * (1 - depth / 100);
            
            return (
              <g key={theme.id}>
                {/* Depth ring background (track) */}
                <circle
                  cx={x}
                  cy={y}
                  r={depthRingRadius}
                  fill="none"
                  stroke="hsl(var(--muted-foreground) / 0.15)"
                  strokeWidth={3}
                />
                
                {/* Depth ring progress */}
                <motion.circle
                  cx={x}
                  cy={y}
                  r={depthRingRadius}
                  fill="none"
                  stroke="hsl(var(--primary) / 0.4)"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: depthOffset }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 * index }}
                  style={{ 
                    transform: `rotate(-90deg)`,
                    transformOrigin: `${x}px ${y}px`
                  }}
                />
                
                {/* Pulsing glow for current theme */}
                {theme.current && (
                  <>
                    <motion.circle
                      cx={x}
                      cy={y}
                      r={depthRingRadius + 4}
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      initial={{ opacity: 0.6, scale: 1 }}
                      animate={{ 
                        opacity: [0.6, 0],
                        scale: [1, 1.3]
                      }}
                      transition={{ 
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeOut"
                      }}
                      style={{ transformOrigin: `${x}px ${y}px` }}
                    />
                    <motion.circle
                      cx={x}
                      cy={y}
                      r={depthRingRadius + 2}
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth={1.5}
                      initial={{ opacity: 0.4 }}
                      animate={{ 
                        opacity: [0.4, 0.8, 0.4]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </>
                )}
                
                {/* Inner node circle */}
                <motion.circle
                  cx={x}
                  cy={y}
                  r={nodeRadius}
                  fill={theme.current || theme.discussed 
                    ? "hsl(var(--primary))" 
                    : "hsl(var(--background))"
                  }
                  stroke={theme.current || theme.discussed 
                    ? "hsl(var(--primary))" 
                    : "hsl(var(--muted-foreground) / 0.3)"
                  }
                  strokeWidth={2}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 * index, duration: 0.3 }}
                />
                
                {/* Checkmark for discussed themes */}
                {theme.discussed && !theme.current && (
                  <motion.g
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 * index, duration: 0.2 }}
                  >
                    <path
                      d={`M ${x - 4} ${y} L ${x - 1} ${y + 3} L ${x + 4} ${y - 3}`}
                      fill="none"
                      stroke="hsl(var(--primary-foreground))"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </motion.g>
                )}
                
                {/* Current theme inner dot */}
                {theme.current && (
                  <motion.circle
                    cx={x}
                    cy={y}
                    r={4}
                    fill="hsl(var(--primary-foreground))"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.2 }}
                  />
                )}
              </g>
            );
          })}
        </svg>
        
        {/* Theme labels - positioned outside SVG for better text rendering */}
        {themes.map((theme, index) => {
          const y = 30 + index * nodeSpacing;
          
          return (
            <motion.div
              key={`label-${theme.id}`}
              className="absolute flex items-center"
              style={{
                top: y - 10,
                left: pathWidth / 2 + depthRingRadius + 10,
              }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 * index, duration: 0.3 }}
            >
              <span
                className={`
                  text-sm max-w-[120px] leading-tight
                  ${theme.current 
                    ? 'font-medium text-foreground' 
                    : theme.discussed 
                      ? 'text-foreground' 
                      : 'text-muted-foreground'
                  }
                `}
              >
                {theme.name}
              </span>
              {/* Depth percentage for explored themes */}
              {(theme.depth || 0) > 0 && (
                <span className="ml-2 text-xs text-muted-foreground/70">
                  {theme.depth}%
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
      
      {/* Progress summary */}
      <div className="pt-4 border-t border-border/50 mt-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium text-foreground">
            {discussedCount} of {totalCount}
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${coveragePercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
};
