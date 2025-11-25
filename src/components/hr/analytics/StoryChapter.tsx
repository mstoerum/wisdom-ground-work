import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InsightCard } from "./InsightCard";
import { NarrativeChapter } from "@/hooks/useNarrativeReports";

interface StoryChapterProps {
  chapter: NarrativeChapter;
  chapterNumber: number;
}

const chapterIcons = {
  pulse: "📊",
  working: "✨",
  warnings: "⚠️",
  why: "🔍",
  forward: "🎯"
};

const chapterColors = {
  pulse: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  working: "bg-green-500/10 text-green-700 dark:text-green-300",
  warnings: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
  why: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
  forward: "bg-primary/10 text-primary"
};

export function StoryChapter({ chapter, chapterNumber }: StoryChapterProps) {
  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{chapterIcons[chapter.key]}</span>
              <Badge variant="outline" className="text-xs">
                Chapter {chapterNumber}
              </Badge>
            </div>
            <CardTitle className="text-2xl">{chapter.title}</CardTitle>
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
            <h3 className="text-sm font-semibold text-muted-foreground uppercase">
              Key Insights
            </h3>
            <div className="space-y-3">
              {chapter.insights.map((insight, index) => (
                <InsightCard 
                  key={index}
                  insight={insight}
                  colorClass={chapterColors[chapter.key]}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
