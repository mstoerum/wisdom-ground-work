import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ArrowRight } from "lucide-react";
import { BookmarkedInsight } from "@/hooks/useBookmarkedInsights";
import { CHAPTER_LABELS } from "@/lib/reportDesignSystem";
import { cn } from "@/lib/utils";

interface BookmarkedInsightsSummaryProps {
  bookmarks: BookmarkedInsight[];
  onCreateCommitment?: (insightText: string) => void;
}

export function BookmarkedInsightsSummary({ 
  bookmarks, 
  onCreateCommitment 
}: BookmarkedInsightsSummaryProps) {
  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Star className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No insights bookmarked yet.</p>
        <p className="text-xs mt-1">Star insights in any chapter to flag them for action.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookmarks.map((bookmark) => (
        <Card key={bookmark.id} className="border-0 shadow-sm bg-accent/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Star className="h-4 w-4 mt-0.5 flex-shrink-0 fill-amber-400 text-amber-400" />
              <div className="flex-1 min-w-0 space-y-2">
                <p className="text-sm font-medium leading-relaxed">
                  {bookmark.insight_text}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {bookmark.chapter_key && (
                    <Badge variant="secondary" className="text-xs">
                      {CHAPTER_LABELS[bookmark.chapter_key] || bookmark.chapter_key}
                    </Badge>
                  )}
                  {bookmark.agreement_percentage && (
                    <span className={cn(
                      "text-xs font-medium tabular-nums",
                      bookmark.agreement_percentage >= 70 
                        ? "text-emerald-600 dark:text-emerald-400" 
                        : "text-amber-600 dark:text-amber-400"
                    )}>
                      {bookmark.agreement_percentage}% agree
                    </span>
                  )}
                </div>
              </div>
              {onCreateCommitment && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCreateCommitment(bookmark.insight_text)}
                  className="flex-shrink-0 text-xs gap-1 h-auto py-1.5"
                >
                  Act <ArrowRight className="h-3 w-3" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
