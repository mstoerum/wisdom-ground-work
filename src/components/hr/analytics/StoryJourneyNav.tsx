import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Users, Mountain, AlertTriangle, Search, Target, Handshake } from "lucide-react";

interface Chapter {
  key: string;
  title: string;
}

interface StoryJourneyNavProps {
  chapters: Chapter[];
  activeIndex: number;
  onChapterSelect: (index: number) => void;
  completedIndices: number[];
}

// Chapter metadata with icons and descriptions
const CHAPTER_META: Record<string, { icon: typeof Users; label: string; description: string }> = {
  voices: { icon: Users, label: "Voices", description: "Who spoke and what they shared" },
  landscape: { icon: Mountain, label: "Landscape", description: "The terrain of team sentiment" },
  frictions: { icon: AlertTriangle, label: "Frictions", description: "Points of tension to address" },
  root_causes: { icon: Search, label: "Root Causes", description: "Understanding the why" },
  forward: { icon: Target, label: "Forward", description: "The path ahead" },
  commitment: { icon: Handshake, label: "Commitment", description: "Actions and accountability" },
};

// Fallback order for unknown chapter keys
const DEFAULT_ICONS = [Users, Mountain, AlertTriangle, Search, Target, Handshake];

export function StoryJourneyNav({
  chapters,
  activeIndex,
  onChapterSelect,
  completedIndices,
}: StoryJourneyNavProps) {
  const getChapterMeta = (chapter: Chapter, index: number) => {
    const key = chapter.key.toLowerCase().replace(/[^a-z_]/g, '');
    const meta = CHAPTER_META[key];
    if (meta) return meta;
    
    // Fallback based on index
    const FallbackIcon = DEFAULT_ICONS[index % DEFAULT_ICONS.length];
    return {
      icon: FallbackIcon,
      label: chapter.title.split(':')[0] || chapter.title,
      description: chapter.title,
    };
  };

  return (
    <div className="py-6 px-4">
      {/* Journey line with icons */}
      <div className="relative">
        {/* Background connecting line */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-muted" />
        
        {/* Progress line - animated */}
        <motion.div
          className="absolute top-6 left-0 h-0.5 bg-primary"
          initial={{ width: 0 }}
          animate={{ 
            width: `${(Math.max(...completedIndices, activeIndex) / (chapters.length - 1)) * 100}%` 
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />

        {/* Chapter nodes */}
        <div className="relative flex justify-between">
          {chapters.map((chapter, index) => {
            const meta = getChapterMeta(chapter, index);
            const Icon = meta.icon;
            const isActive = index === activeIndex;
            const isCompleted = completedIndices.includes(index);
            const isAccessible = isCompleted || index <= Math.max(...completedIndices, 0) + 1;

            return (
              <button
                key={chapter.key}
                onClick={() => isAccessible && onChapterSelect(index)}
                disabled={!isAccessible}
                className={cn(
                  "flex flex-col items-center gap-2 group transition-all duration-200",
                  isAccessible ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                )}
              >
                {/* Icon container */}
                <motion.div
                  className={cn(
                    "relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : isCompleted
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                  animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                  whileHover={isAccessible ? { scale: 1.05 } : {}}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <Icon className="h-5 w-5" />
                  
                  {/* Active pulse ring */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-primary"
                      initial={{ scale: 1, opacity: 1 }}
                      animate={{ scale: 1.4, opacity: 0 }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </motion.div>

                {/* Label - visible on larger screens */}
                <span
                  className={cn(
                    "text-xs font-medium hidden sm:block transition-colors",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {meta.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active chapter info */}
      <motion.div
        key={activeIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-6 text-center"
      >
        <h3 className="text-lg font-semibold">
          {chapters[activeIndex]?.title || "Chapter"}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {getChapterMeta(chapters[activeIndex], activeIndex).description}
        </p>
        <span className="text-xs text-muted-foreground mt-2 block">
          {activeIndex + 1} of {chapters.length}
        </span>
      </motion.div>
    </div>
  );
}
