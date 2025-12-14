import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InsightCard } from "./InsightCard";
import { NarrativeChapter } from "@/hooks/useNarrativeReports";
import { CHAPTER_STRUCTURE, EMOTION_SPECTRUM } from "@/lib/reportDesignSystem";
import { 
  MessageCircle, 
  Mountain, 
  TrendingUp, 
  Lightbulb, 
  ArrowRight, 
  Handshake,
  BarChart3,
  Sparkles,
  AlertTriangle,
  Search,
  Target
} from "lucide-react";

interface StoryChapterProps {
  chapter: NarrativeChapter;
  chapterNumber: number;
}

// Map old chapter keys to new design system
const chapterIcons = {
  pulse: BarChart3,
  voices: MessageCircle,
  working: Sparkles,
  landscape: Mountain,
  warnings: AlertTriangle,
  journey: TrendingUp,
  why: Lightbulb,
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
    working: 'thriving',
    warnings: 'challenged',
    why: 'emerging',
    forward: 'thriving',
  };
  
  const colorKey = fallbackMap[key] || 'growing';
  return { 
    accentColor: EMOTION_SPECTRUM[colorKey], 
    subtitle: '' 
  };
};

export function StoryChapter({ chapter, chapterNumber }: StoryChapterProps) {
  const Icon = chapterIcons[chapter.key as keyof typeof chapterIcons] || MessageCircle;
  const style = getChapterStyle(chapter.key);

  return (
    <Card 
      className="border-l-4 transition-all"
      style={{ borderLeftColor: style.accentColor.primary }}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: style.accentColor.background }}
              >
                <Icon 
                  className="h-5 w-5" 
                  style={{ color: style.accentColor.primary }}
                />
              </div>
              <Badge 
                variant="secondary" 
                className="text-xs"
                style={{ 
                  backgroundColor: style.accentColor.background,
                  color: style.accentColor.text
                }}
              >
                Chapter {chapterNumber}
              </Badge>
            </div>
            <CardTitle className="text-2xl">{chapter.title}</CardTitle>
            {style.subtitle && (
              <p className="text-sm text-muted-foreground">{style.subtitle}</p>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Main Narrative */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-base leading-relaxed whitespace-pre-wrap">
            {chapter.narrative}
          </p>
        </div>

        {/* Insights */}
        {chapter.insights.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Key Insights
            </h3>
            <div className="space-y-3">
              {chapter.insights.map((insight, index) => (
                <InsightCard 
                  key={index}
                  insight={insight}
                  colorClass=""
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
