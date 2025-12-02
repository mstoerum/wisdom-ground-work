import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, MessageSquare } from "lucide-react";
import type { ThemeInsight } from "@/hooks/useAnalytics";

interface ThemeSentimentBreakdownProps {
  themes: ThemeInsight[];
  isLoading?: boolean;
}

function getSentimentColor(score: number): string {
  if (score >= 70) return "text-green-600 dark:text-green-400";
  if (score >= 50) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

function getSentimentBg(score: number): string {
  if (score >= 70) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

function getSentimentLabel(score: number): string {
  if (score >= 70) return "Positive";
  if (score >= 50) return "Neutral";
  return "Needs Attention";
}

function getSentimentIcon(score: number) {
  if (score >= 70) return <TrendingUp className="h-3 w-3" />;
  if (score >= 50) return <Minus className="h-3 w-3" />;
  return <TrendingDown className="h-3 w-3" />;
}

export function ThemeSentimentBreakdown({ themes, isLoading }: ThemeSentimentBreakdownProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Theme Sentiment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!themes || themes.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Theme Sentiment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No theme data available yet. Generate responses to see sentiment breakdown by theme.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort themes by sentiment (lowest first to surface concerns)
  const sortedThemes = [...themes].sort((a, b) => a.avgSentiment - b.avgSentiment);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Theme Sentiment</CardTitle>
          <span className="text-xs text-muted-foreground">
            Sorted by priority (lowest first)
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedThemes.map((theme) => {
          const sentimentPercent = Math.round(theme.avgSentiment);
          
          return (
            <div key={theme.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{theme.name}</span>
                  <Badge 
                    variant="outline" 
                    className={`text-xs gap-1 ${getSentimentColor(sentimentPercent)}`}
                  >
                    {getSentimentIcon(sentimentPercent)}
                    {getSentimentLabel(sentimentPercent)}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold ${getSentimentColor(sentimentPercent)}`}>
                    {sentimentPercent}%
                  </span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageSquare className="h-3 w-3" />
                    {theme.responseCount}
                  </div>
                </div>
              </div>
              <Progress 
                value={sentimentPercent} 
                className="h-2"
                style={{
                  // Custom color for the progress indicator
                  ['--progress-background' as string]: sentimentPercent >= 70 
                    ? 'hsl(142, 76%, 36%)' 
                    : sentimentPercent >= 50 
                    ? 'hsl(48, 96%, 53%)' 
                    : 'hsl(0, 84%, 60%)'
                }}
              />
              {theme.urgencyCount > 0 && (
                <p className="text-xs text-destructive">
                  {theme.urgencyCount} urgent response{theme.urgencyCount > 1 ? 's' : ''} flagged
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
