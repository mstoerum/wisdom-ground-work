import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Mountain, 
  TrendingUp, 
  Lightbulb, 
  ArrowRight, 
  Handshake 
} from "lucide-react";
import { 
  CHAPTER_STRUCTURE, 
  EMOTION_SPECTRUM, 
  type ChapterDefinition 
} from "@/lib/reportDesignSystem";
import { cn } from "@/lib/utils";

const chapterIcons = {
  MessageCircle,
  Mountain,
  TrendingUp,
  Lightbulb,
  ArrowRight,
  Handshake,
};

interface ChapterCardProps {
  chapter: ChapterDefinition;
  chapterNumber: number;
  narrative?: string;
  insights?: Array<{
    text: string;
    confidence: number;
    agreement_percentage?: number;
    sample_size?: number;
  }>;
  isActive?: boolean;
  onClick?: () => void;
}

export function ChapterCard({ 
  chapter, 
  chapterNumber, 
  narrative, 
  insights = [],
  isActive,
  onClick 
}: ChapterCardProps) {
  const Icon = chapterIcons[chapter.icon as keyof typeof chapterIcons] || MessageCircle;
  const accentColor = EMOTION_SPECTRUM[chapter.accentColor];

  return (
    <Card 
      className={cn(
        "transition-all cursor-pointer border-l-4",
        isActive ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md",
      )}
      style={{ 
        borderLeftColor: accentColor.primary,
        backgroundColor: isActive ? accentColor.background : undefined
      }}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: accentColor.background }}
            >
              <Icon 
                className="h-5 w-5" 
                style={{ color: accentColor.primary }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="secondary" 
                  className="text-xs"
                  style={{ 
                    backgroundColor: accentColor.background,
                    color: accentColor.text
                  }}
                >
                  Chapter {chapterNumber}
                </Badge>
              </div>
              <CardTitle className="text-lg mt-1">{chapter.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {chapter.subtitle}
              </p>
            </div>
          </div>
          
          {insights.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {insights.length} insights
            </Badge>
          )}
        </div>
      </CardHeader>

      {narrative && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {narrative}
          </p>
        </CardContent>
      )}
    </Card>
  );
}

// Chapter navigation sidebar component
export function ChapterNavigation({
  activeChapter,
  onChapterSelect,
  chapters,
}: {
  activeChapter: number;
  onChapterSelect: (index: number) => void;
  chapters: Array<{ key: string; insights?: unknown[] }>;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Chapters
      </h3>
      {CHAPTER_STRUCTURE.map((chapter, index) => {
        const chapterData = chapters.find(c => c.key === chapter.key);
        const Icon = chapterIcons[chapter.icon as keyof typeof chapterIcons] || MessageCircle;
        const isActive = activeChapter === index;
        const accentColor = EMOTION_SPECTRUM[chapter.accentColor];

        return (
          <button
            key={chapter.key}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all",
              isActive 
                ? "bg-primary/10 border border-primary/20" 
                : "hover:bg-muted"
            )}
            onClick={() => onChapterSelect(index)}
          >
            <div 
              className="p-1.5 rounded-md"
              style={{ 
                backgroundColor: isActive ? accentColor.background : 'transparent' 
              }}
            >
              <Icon 
                className="h-4 w-4" 
                style={{ 
                  color: isActive ? accentColor.primary : 'hsl(var(--muted-foreground))' 
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-xs",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {index + 1}.
                </span>
                <span className={cn(
                  "font-medium text-sm truncate",
                  isActive && "text-primary"
                )}>
                  {chapter.title}
                </span>
              </div>
              {chapterData?.insights && Array.isArray(chapterData.insights) && (
                <span className="text-xs text-muted-foreground">
                  {chapterData.insights.length} insights
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
