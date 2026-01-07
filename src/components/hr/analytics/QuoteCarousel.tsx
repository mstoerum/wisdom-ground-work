import { cn } from "@/lib/utils";
import { AgreementBar } from "./AgreementBar";

interface Response {
  id: string;
  content: string;
  sentiment: string | null;
  sentiment_score: number | null;
  urgency_score: number | null;
  created_at: string | null;
  agreementPercentage?: number;
  voiceCount?: number;
}

interface QuoteCarouselProps {
  responses: Response[];
}

/**
 * QuoteCarousel: Tufte-inspired quote display
 * - Text size scales by agreement (importance)
 * - Left border indicates sentiment
 * - Minimal attribution styling
 */
export function QuoteCarousel({ responses }: QuoteCarouselProps) {
  const getSentimentBorderColor = (sentiment: string | null) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return 'border-l-emerald-400';
      case 'negative':
        return 'border-l-rose-400';
      case 'neutral':
        return 'border-l-slate-300 dark:border-l-slate-600';
      default:
        return 'border-l-muted';
    }
  };

  const getTextSize = (agreementPercentage?: number) => {
    // Scale text size by agreement - Tufte: data is the decoration
    if (!agreementPercentage) return 'text-sm';
    if (agreementPercentage >= 70) return 'text-base font-medium';
    if (agreementPercentage >= 50) return 'text-sm';
    return 'text-sm';
  };

  const getUrgencyIndicator = (score: number | null) => {
    if (!score || score < 4) return null;
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
        urgent
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {responses.map((response) => {
        const urgencyIndicator = getUrgencyIndicator(response.urgency_score);
        
        return (
          <div 
            key={response.id}
            className={cn(
              "border-l-4 pl-4 py-2 transition-all hover:bg-muted/30 rounded-r-lg",
              getSentimentBorderColor(response.sentiment)
            )}
          >
            {/* Quote text - sized by importance */}
            <p className={cn(
              "leading-relaxed text-foreground/90 italic",
              getTextSize(response.agreementPercentage)
            )}>
              "{response.content}"
            </p>
            
            {/* Attribution row - minimal */}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {/* Anonymous attribution */}
              <span className="text-[11px] text-muted-foreground/50">
                — Anonymous
              </span>
              
              {/* Agreement bar - if available */}
              {response.agreementPercentage !== undefined && (
                <div className="flex items-center gap-2">
                  <AgreementBar percentage={response.agreementPercentage} />
                  {response.voiceCount !== undefined && (
                    <span className="text-[10px] text-muted-foreground">
                      {response.voiceCount} voices agree
                    </span>
                  )}
                </div>
              )}
              
              {/* Urgency indicator */}
              {urgencyIndicator}
            </div>
          </div>
        );
      })}
    </div>
  );
}
