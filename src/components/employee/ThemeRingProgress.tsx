import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Theme {
  id: string;
  name: string;
  discussed: boolean;
  current: boolean;
}

interface ThemeRingProgressProps {
  themes: Theme[];
  coveragePercent: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const ThemeRingProgress = ({
  themes,
  coveragePercent,
  size = "md",
  className,
}: ThemeRingProgressProps) => {
  const sizeConfig = {
    sm: { viewBox: 200, radius: 70, strokeWidth: 10, fontSize: 9, labelRadius: 90 },
    md: { viewBox: 280, radius: 100, strokeWidth: 14, fontSize: 11, labelRadius: 130 },
    lg: { viewBox: 360, radius: 130, strokeWidth: 18, fontSize: 13, labelRadius: 170 },
  };

  const config = sizeConfig[size];
  const center = config.viewBox / 2;
  const circumference = 2 * Math.PI * config.radius;
  const gapAngle = 4; // degrees between segments
  const totalGap = gapAngle * themes.length;
  const availableAngle = 360 - totalGap;
  const segmentAngle = themes.length > 0 ? availableAngle / themes.length : 0;

  // Calculate start and end angles for each segment
  const getSegmentPath = (index: number) => {
    const startAngle = index * (segmentAngle + gapAngle) - 90; // Start from top
    const endAngle = startAngle + segmentAngle;
    
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const x1 = center + config.radius * Math.cos(startRad);
    const y1 = center + config.radius * Math.sin(startRad);
    const x2 = center + config.radius * Math.cos(endRad);
    const y2 = center + config.radius * Math.sin(endRad);
    
    const largeArc = segmentAngle > 180 ? 1 : 0;
    
    return `M ${x1} ${y1} A ${config.radius} ${config.radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  // Calculate label position for each theme
  const getLabelPosition = (index: number) => {
    const startAngle = index * (segmentAngle + gapAngle) - 90;
    const midAngle = startAngle + segmentAngle / 2;
    const rad = (midAngle * Math.PI) / 180;
    
    return {
      x: center + config.labelRadius * Math.cos(rad),
      y: center + config.labelRadius * Math.sin(rad),
      rotation: midAngle > 90 && midAngle < 270 ? midAngle + 180 : midAngle,
      anchor: midAngle > 90 && midAngle < 270 ? "end" : "start",
    };
  };

  const discussedCount = themes.filter(t => t.discussed).length;

  return (
    <div className={cn("relative flex flex-col items-center gap-3", className)}>
      <svg
        viewBox={`0 0 ${config.viewBox} ${config.viewBox}`}
        className={cn(
          "transform -rotate-0",
          size === "sm" && "w-40 h-40",
          size === "md" && "w-56 h-56",
          size === "lg" && "w-72 h-72"
        )}
      >
        {/* Background circle for subtle reference */}
        <circle
          cx={center}
          cy={center}
          r={config.radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={config.strokeWidth - 4}
          opacity={0.2}
        />

        {/* Theme segments */}
        {themes.map((theme, index) => {
          const path = getSegmentPath(index);
          const labelPos = getLabelPosition(index);
          
          return (
            <g key={theme.id}>
              {/* Segment arc */}
              <motion.path
                d={path}
                fill="none"
                stroke={theme.discussed 
                  ? "hsl(var(--primary))" 
                  : "hsl(var(--muted-foreground) / 0.25)"
                }
                strokeWidth={config.strokeWidth}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ 
                  pathLength: 1, 
                  opacity: 1,
                }}
                transition={{ 
                  duration: 0.6,
                  delay: index * 0.1,
                  ease: "easeOut"
                }}
              />
              
              {/* Current theme pulse effect */}
              {theme.current && (
                <motion.path
                  d={path}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth={config.strokeWidth + 6}
                  strokeLinecap="round"
                  opacity={0.3}
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: [0.2, 0.5, 0.2],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              )}
              
              {/* Theme name label */}
              <motion.text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={theme.discussed 
                  ? "hsl(var(--foreground))" 
                  : "hsl(var(--muted-foreground))"
                }
                fontSize={config.fontSize}
                fontWeight={theme.current ? 600 : 400}
                className="select-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.3 }}
              >
                {/* Truncate long names */}
                {theme.name.length > 14 
                  ? theme.name.slice(0, 12) + "…" 
                  : theme.name}
              </motion.text>
              
              {/* Status indicator dot */}
              <motion.circle
                cx={labelPos.x + (labelPos.anchor === "end" ? 8 : -8) * (theme.name.length > 14 ? 0.8 : 1)}
                cy={labelPos.y - config.fontSize - 2}
                r={3}
                fill={theme.discussed 
                  ? "hsl(var(--primary))" 
                  : "hsl(var(--muted-foreground) / 0.3)"
                }
                initial={{ scale: 0 }}
                animate={{ scale: theme.current ? [1, 1.3, 1] : 1 }}
                transition={theme.current ? { duration: 1.5, repeat: Infinity } : { delay: index * 0.1 + 0.4 }}
              />
            </g>
          );
        })}

        {/* Center content */}
        <motion.g
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <text
            x={center}
            y={center - 8}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="hsl(var(--foreground))"
            fontSize={size === "sm" ? 20 : size === "md" ? 28 : 36}
            fontWeight={600}
          >
            {discussedCount}/{themes.length}
          </text>
          <text
            x={center}
            y={center + 14}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="hsl(var(--muted-foreground))"
            fontSize={size === "sm" ? 9 : size === "md" ? 10 : 12}
          >
            topics covered
          </text>
        </motion.g>
      </svg>

      {/* Coverage percentage below */}
      <motion.div
        className="flex items-center gap-2 text-sm text-muted-foreground"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(coveragePercent, 100)}%` }}
            transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
          />
        </div>
        <span className="text-xs font-medium">{Math.round(coveragePercent)}%</span>
      </motion.div>
    </div>
  );
};
