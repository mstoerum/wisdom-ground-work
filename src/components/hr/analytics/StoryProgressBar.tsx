import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { estimateReadingTime } from "@/lib/reportDesignSystem";

interface StoryProgressBarProps {
  chapters: { narrative: string; insights: { text: string }[] }[];
  currentChapterIndex: number;
  className?: string;
}

export function StoryProgressBar({ 
  chapters, 
  currentChapterIndex, 
  className 
}: StoryProgressBarProps) {
  const totalReadingTime = estimateReadingTime(chapters);
  
  // Estimate time for remaining chapters
  const remainingChapters = chapters.slice(currentChapterIndex + 1);
  const remainingTime = remainingChapters.length > 0 
    ? estimateReadingTime(remainingChapters)
    : 0;
  
  // Progress percentage (0-100)
  const progressPercent = chapters.length > 0 
    ? ((currentChapterIndex + 1) / chapters.length) * 100 
    : 0;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Progress bar */}
      <div className="relative h-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
        
        {/* Glow effect at progress point */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.5)]"
          initial={{ left: 0 }}
          animate={{ left: `calc(${progressPercent}% - 4px)` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
      
      {/* Time indicator */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Chapter {currentChapterIndex + 1} of {chapters.length}
        </span>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          <span>
            {remainingTime > 0 
              ? `~${remainingTime} min left` 
              : currentChapterIndex === chapters.length - 1 
                ? "Final chapter" 
                : `${totalReadingTime} min total`
            }
          </span>
        </div>
      </div>
    </div>
  );
}
