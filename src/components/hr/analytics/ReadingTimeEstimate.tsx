import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { estimateReadingTime } from "@/lib/reportDesignSystem";

interface ReadingTimeEstimateProps {
  chapters: { narrative: string; insights: { text: string }[] }[];
  className?: string;
}

export function ReadingTimeEstimate({ chapters, className }: ReadingTimeEstimateProps) {
  const readingTime = estimateReadingTime(chapters);
  
  return (
    <div className={cn("flex items-center gap-1.5 text-sm text-muted-foreground", className)}>
      <Clock className="h-4 w-4" />
      <span>{readingTime} min read</span>
    </div>
  );
}
