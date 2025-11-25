import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Response {
  id: string;
  content: string;
  sentiment: string | null;
  sentiment_score: number | null;
  urgency_score: number | null;
  created_at: string | null;
}

interface QuoteCarouselProps {
  responses: Response[];
}

export function QuoteCarousel({ responses }: QuoteCarouselProps) {
  const getSentimentColor = (sentiment: string | null) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/40';
      case 'negative':
        return 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/40';
      case 'neutral':
        return 'bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/40';
      default:
        return 'bg-muted border-border';
    }
  };

  const getUrgencyBadge = (score: number | null) => {
    if (!score) return null;
    if (score >= 4) return { label: 'High Urgency', color: 'bg-red-500/20 text-red-700 dark:text-red-300' };
    if (score >= 3) return { label: 'Medium Urgency', color: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300' };
    return null;
  };

  return (
    <div className="space-y-2">
      {responses.map((response) => {
        const urgencyBadge = getUrgencyBadge(response.urgency_score);
        
        return (
          <Card 
            key={response.id}
            className={cn(
              "p-3 border-l-4 transition-all hover:shadow-sm",
              getSentimentColor(response.sentiment)
            )}
          >
            <div className="space-y-2">
              <p className="text-sm leading-relaxed">
                "{response.content}"
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {response.sentiment && (
                  <Badge variant="outline" className="text-xs">
                    {response.sentiment}
                  </Badge>
                )}
                {urgencyBadge && (
                  <Badge variant="outline" className={cn("text-xs", urgencyBadge.color)}>
                    {urgencyBadge.label}
                  </Badge>
                )}
                {response.sentiment_score !== null && (
                  <span className="text-xs text-muted-foreground">
                    Score: {response.sentiment_score.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
