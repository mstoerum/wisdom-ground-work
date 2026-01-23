import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InsightCard } from "./InsightCard";
import { NarrativeChapter } from "@/hooks/useNarrativeReports";
import { CHAPTER_STRUCTURE, EMOTION_SPECTRUM, CHAPTER_LABELS } from "@/lib/reportDesignSystem";
import { motion } from "framer-motion";
import { 
  MessageCircle, 
  Mountain, 
  TrendingUp, 
  Lightbulb, 
  Target,
  Handshake,
  BarChart3,
  Sparkles,
  AlertTriangle,
  Search,
} from "lucide-react";

interface StoryChapterProps {
  chapter: NarrativeChapter;
  chapterNumber: number;
  totalChapters?: number;
}

// Map chapter keys to icons
const chapterIcons = {
  pulse: BarChart3,
  voices: MessageCircle,
  working: Sparkles,
  landscape: Mountain,
  warnings: AlertTriangle,
  frictions: AlertTriangle,
  journey: TrendingUp,
  why: Lightbulb,
  root_causes: Search,
  forward: Target,
  commitment: Handshake,
};

// Get chapter styling from design system or fallback
const getChapterStyle = (key: string) => {
  const designChapter = CHAPTER_STRUCTURE.find(c => c.key === key);
  if (designChapter) {
    return {
      accentColor: EMOTION_SPECTRUM[designChapter.accentColor],
      subtitle: designChapter.subtitle,
    };
  }
  
  // Fallbacks for old chapter keys
  const fallbackMap: Record<string, keyof typeof EMOTION_SPECTRUM> = {
    pulse: 'growing',
    voices: 'growing',
    working: 'thriving',
    landscape: 'emerging',
    warnings: 'challenged',
    frictions: 'challenged',
    journey: 'growing',
    why: 'emerging',
    root_causes: 'emerging',
    forward: 'thriving',
    commitment: 'thriving',
  };
  
  const colorKey = fallbackMap[key] || 'growing';
  return { 
    accentColor: EMOTION_SPECTRUM[colorKey], 
    subtitle: '' 
  };
};

export function StoryChapter({ chapter, chapterNumber, totalChapters }: StoryChapterProps) {
  // Defensive guard for undefined chapter
  if (!chapter) {
    return null;
  }
  
  const Icon = chapterIcons[chapter.key as keyof typeof chapterIcons] || MessageCircle;
  const style = getChapterStyle(chapter.key);
  const displayTitle = CHAPTER_LABELS[chapter.key] || chapter.title;

  return (
    <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
      {/* Subtle accent bar at top */}
      <div 
        className="h-1"
        style={{ backgroundColor: style.accentColor.primary }}
      />
      
      <CardHeader className="pb-4 pt-8 px-8">
        <div className="space-y-4">
          {/* Chapter indicator & icon */}
          <div className="flex items-center gap-4">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="p-3 rounded-xl"
              style={{ backgroundColor: style.accentColor.background }}
            >
              <Icon 
                className="h-5 w-5" 
                style={{ color: style.accentColor.primary }}
              />
            </motion.div>
            <Badge 
              variant="secondary" 
              className="text-xs font-medium tracking-wide uppercase px-3 py-1"
            >
              Chapter {chapterNumber}{totalChapters ? ` of ${totalChapters}` : ''}
            </Badge>
          </div>
          
          {/* Title & subtitle */}
          <div className="space-y-2">
            <h2 className="text-2xl font-medium tracking-tight">
              {displayTitle}
            </h2>
            {style.subtitle && (
              <p className="text-sm text-muted-foreground/80">
                {style.subtitle}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-8 pb-8 space-y-8">
        {/* Main Narrative - Apple-style typography */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="prose prose-neutral dark:prose-invert max-w-none"
        >
          <p className="text-[17px] leading-[1.65] font-light text-foreground/90 whitespace-pre-wrap">
            {chapter.narrative}
          </p>
        </motion.div>

        {/* Insights - staggered reveal */}
        {chapter.insights.length > 0 && (
          <div className="space-y-5">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              Key Insights
            </h3>
            <div className="space-y-4">
              {chapter.insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + index * 0.05, duration: 0.3 }}
                >
                  <InsightCard 
                    insight={insight}
                    accentColor={style.accentColor.primary}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
