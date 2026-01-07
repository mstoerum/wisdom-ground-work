import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CHAPTER_LABELS } from "@/lib/reportDesignSystem";

interface ChapterProgressNavProps {
  chapters: { key: string; title: string }[];
  activeIndex: number;
  onChapterSelect: (index: number) => void;
  completedIndices?: number[];
}

export function ChapterProgressNav({
  chapters,
  activeIndex,
  onChapterSelect,
  completedIndices = [],
}: ChapterProgressNavProps) {
  return (
    <div className="relative">
      {/* Progress line container */}
      <div className="flex items-center justify-between px-4 py-6">
        {chapters.map((chapter, index) => {
          const isActive = index === activeIndex;
          const isCompleted = completedIndices.includes(index) || index < activeIndex;
          const displayTitle = CHAPTER_LABELS[chapter.key] || chapter.title;
          
          return (
            <div key={chapter.key} className="flex-1 flex flex-col items-center relative">
              {/* Connecting line */}
              {index < chapters.length - 1 && (
                <div className="absolute top-3 left-1/2 w-full h-0.5">
                  <div className="w-full h-full bg-muted" />
                  {(isCompleted || isActive) && (
                    <motion.div
                      className="absolute inset-0 bg-primary/60"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: isCompleted ? 1 : 0.5 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      style={{ transformOrigin: "left" }}
                    />
                  )}
                </div>
              )}
              
              {/* Node button */}
              <button
                onClick={() => onChapterSelect(index)}
                className={cn(
                  "relative z-10 w-6 h-6 rounded-full transition-all duration-200",
                  "flex items-center justify-center text-xs font-medium",
                  "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2",
                  isActive && "bg-primary text-primary-foreground scale-110 shadow-md",
                  isCompleted && !isActive && "bg-primary/80 text-primary-foreground",
                  !isActive && !isCompleted && "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {isCompleted && !isActive ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </button>
              
              {/* Chapter label */}
              <motion.span
                className={cn(
                  "mt-3 text-xs text-center px-1 max-w-[80px] truncate transition-colors",
                  isActive ? "text-foreground font-medium" : "text-muted-foreground"
                )}
                animate={{ opacity: 1 }}
              >
                {displayTitle}
              </motion.span>
              
              {/* Active indicator underline */}
              {isActive && (
                <motion.div
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-0.5 bg-primary rounded-full"
                  layoutId="chapter-indicator"
                  initial={{ width: 0 }}
                  animate={{ width: 40 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
