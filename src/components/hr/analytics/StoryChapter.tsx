import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { InsightCard } from "./InsightCard";
import { BookmarkedInsightsSummary } from "./BookmarkedInsightsSummary";
import { CommitmentSection } from "@/components/hr/reports/CommitmentSection";
import { NarrativeChapter } from "@/hooks/useNarrativeReports";
import { useBookmarkedInsights } from "@/hooks/useBookmarkedInsights";
import { CHAPTER_STRUCTURE, EMOTION_SPECTRUM, CHAPTER_LABELS } from "@/lib/reportDesignSystem";
import type { CommitmentSignature } from "@/lib/reportDesignSystem";
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
  surveyId?: string;
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

export function StoryChapter({ chapter, chapterNumber, surveyId }: StoryChapterProps) {
  const [localCommitments, setLocalCommitments] = useState<CommitmentSignature[]>([]);
  const { bookmarks } = useBookmarkedInsights(surveyId ?? null);
  
  // Defensive guard for undefined chapter
  if (!chapter) {
    return null;
  }
  
  const Icon = chapterIcons[chapter.key as keyof typeof chapterIcons] || MessageCircle;
  const style = getChapterStyle(chapter.key);
  const displayTitle = CHAPTER_LABELS[chapter.key] || chapter.title;
  const isCommitmentChapter = chapter.key === 'commitment';

  const handleAddCommitment = (commitment: CommitmentSignature) => {
    setLocalCommitments(prev => [...prev, commitment]);
  };

  return (
    <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
      {/* Subtle accent bar at top */}
      <div 
        className="h-1.5"
        style={{ backgroundColor: style.accentColor.primary }}
      />
      
      <CardHeader className="pb-4 pt-6 sm:pt-8 px-5 sm:px-8">
        <div className="space-y-4">
          {/* Chapter icon + title */}
          <div className="flex items-center gap-4">
            <div 
              className="p-3 rounded-xl"
              style={{ backgroundColor: style.accentColor.background }}
            >
              <Icon 
                className="h-5 w-5" 
                style={{ color: style.accentColor.primary }}
              />
            </div>
            <div className="space-y-1">
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
        </div>
      </CardHeader>
      
      <CardContent className="px-5 sm:px-8 pb-8 space-y-8">
        {/* Main Narrative */}
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <p className="text-[17px] leading-[1.65] font-light text-foreground/90 whitespace-pre-wrap">
            {chapter.narrative}
          </p>
        </div>

        {/* Insights */}
        {chapter.insights.length > 0 && (
          <div className="space-y-5">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              Key Insights
            </h3>
            <div className="space-y-4">
              {chapter.insights.map((insight, index) => (
                <div key={index}>
                  <InsightCard 
                    insight={insight}
                    accentColor={style.accentColor.primary}
                    surveyId={surveyId}
                    chapterKey={chapter.key}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Commitment chapter: bookmarked insights + pledges */}
        {isCommitmentChapter && surveyId && (
          <div className="space-y-8 pt-4 border-t">
            {/* Bookmarked insights summary */}
            <div className="space-y-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                Flagged for Action
              </h3>
              <BookmarkedInsightsSummary bookmarks={bookmarks} />
            </div>

            {/* Commitment signatures */}
            <div className="space-y-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                Leadership Commitments
              </h3>
              <CommitmentSection
                commitments={localCommitments}
                onAddCommitment={handleAddCommitment}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
