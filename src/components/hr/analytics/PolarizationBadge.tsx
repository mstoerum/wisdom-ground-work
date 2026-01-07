import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Split } from "lucide-react";

interface PolarizationBadgeProps {
  level: 'low' | 'medium' | 'high';
  score?: number;
}

/**
 * Visual indicator for theme polarization (divided opinions)
 */
export function PolarizationBadge({ level, score }: PolarizationBadgeProps) {
  if (level === 'low') return null;

  const colors = {
    medium: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
    high: "bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  };

  const descriptions = {
    medium: "Opinions are moderately divided. Some respondents have opposing views on this theme.",
    high: "Strong division detected. Respondents are split between very positive and very negative views.",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${colors[level]}`}>
            <Split className="h-3 w-3" />
            {level === 'high' ? 'Divided' : 'Mixed'}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-xs">{descriptions[level]}</p>
          {score !== undefined && (
            <p className="text-xs text-muted-foreground mt-1">
              Polarization score: {Math.round(score * 100)}%
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
