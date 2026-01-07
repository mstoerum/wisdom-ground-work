import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface ThemeJourneyPathProps {
  themes: Array<{
    id: string;
    name: string;
    discussed: boolean;
    current: boolean;
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
  const curveOffset = 30;
  
  const height = (themes.length - 1) * nodeSpacing + 60;
  
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
        </svg>
        
        {/* Theme waypoints */}
        {themes.map((theme, index) => {
          const y = 30 + index * nodeSpacing;
          const isLeft = index % 2 === 0;
          
          return (
            <motion.div
              key={theme.id}
              className="absolute flex items-center gap-3"
              style={{
                top: y - nodeRadius,
                left: isLeft ? pathWidth / 2 - nodeRadius : pathWidth / 2 - nodeRadius,
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index, duration: 0.3 }}
            >
              {/* Node circle */}
              <div className="relative">
                <motion.div
                  className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center
                    transition-colors duration-300
                    ${theme.current 
                      ? 'bg-primary border-primary' 
                      : theme.discussed 
                        ? 'bg-primary border-primary' 
                        : 'bg-background border-muted-foreground/30'
                    }
                  `}
                  animate={theme.current ? {
                    boxShadow: [
                      "0 0 0 0 hsl(var(--primary) / 0.4)",
                      "0 0 0 8px hsl(var(--primary) / 0)",
                    ]
                  } : {}}
                  transition={theme.current ? {
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeOut"
                  } : {}}
                >
                  {theme.discussed && !theme.current && (
                    <Check className="w-3 h-3 text-primary-foreground" />
                  )}
                  {theme.current && (
                    <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                  )}
                </motion.div>
                
                {/* "You are here" indicator */}
                {theme.current && (
                  <motion.div
                    className="absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                  >
                    <div className="flex items-center gap-1 ml-2">
                      <div className="w-0 h-0 border-t-4 border-b-4 border-r-6 border-transparent border-r-primary" />
                      <span className="text-xs font-medium text-primary whitespace-nowrap">
                        You're here
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
              
              {/* Theme label */}
              <motion.span
                className={`
                  text-sm max-w-[140px] leading-tight
                  ${theme.current 
                    ? 'font-medium text-foreground' 
                    : theme.discussed 
                      ? 'text-foreground' 
                      : 'text-muted-foreground'
                  }
                `}
                style={{
                  position: 'absolute',
                  left: nodeRadius * 2 + 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              >
                {theme.name}
              </motion.span>
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
