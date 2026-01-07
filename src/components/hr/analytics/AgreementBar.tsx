import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AgreementBarProps {
  percentage: number;
  sampleSize?: number;
  className?: string;
  showLabel?: boolean;
  animate?: boolean;
}

export function AgreementBar({
  percentage,
  sampleSize,
  className,
  showLabel = true,
  animate = true,
}: AgreementBarProps) {
  // Determine color based on percentage
  const getColor = () => {
    if (percentage >= 70) return "bg-emerald-500/80";
    if (percentage >= 50) return "bg-amber-500/80";
    return "bg-rose-500/70";
  };

  return (
    <div className={cn("space-y-2", className)}>
      {showLabel && (
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium text-foreground">
            {percentage}%
            <span className="font-normal text-muted-foreground ml-1.5">agree</span>
          </span>
          {sampleSize && (
            <span className="text-xs text-muted-foreground">
              Based on {sampleSize} responses
            </span>
          )}
        </div>
      )}
      
      {/* Progress bar container */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", getColor())}
          initial={animate ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{ 
            duration: 0.8, 
            ease: [0.25, 0.46, 0.45, 0.94],
            delay: 0.1 
          }}
        />
      </div>
    </div>
  );
}
