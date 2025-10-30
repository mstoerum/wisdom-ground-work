import { cn } from "@/lib/utils";

interface DonutProgressRingProps {
  value: number;
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
  color?: "terracotta" | "yellow" | "lime" | "coral";
}

export function DonutProgressRing({ 
  value, 
  size = "md",
  label,
  className,
  color = "terracotta"
}: DonutProgressRingProps) {
  const sizeClasses = {
    sm: "w-24 h-24",
    md: "w-32 h-32",
    lg: "w-48 h-48"
  };

  const textSizeClasses = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-5xl"
  };

  const labelSizeClasses = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm"
  };

  const colorMap = {
    terracotta: "hsl(var(--terracotta-primary))",
    yellow: "hsl(var(--butter-yellow))",
    lime: "hsl(var(--lime-green))",
    coral: "hsl(var(--coral-accent))"
  };

  // Calculate circle properties
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        {/* Background ring - light greige */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="10"
        />
        
        {/* Progress ring - colored */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={colorMap[color]}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      
      {/* Center text - large, bold */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-bold", textSizeClasses[size])} style={{ color: colorMap[color] }}>
          {Math.round(value)}%
        </span>
        {label && (
          <span className={cn("text-muted-foreground mt-1", labelSizeClasses[size])}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
