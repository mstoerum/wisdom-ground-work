import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ConfidenceIndicator } from "./ConfidenceIndicator";
import type { ThemeInsight } from "@/hooks/useAnalytics";

interface ThemePreviewCardProps {
  theme: ThemeInsight;
  onClick: () => void;
  qualityMetrics?: {
    average_confidence_score: number;
  };
}

export function ThemePreviewCard({ theme, onClick, qualityMetrics }: ThemePreviewCardProps) {
  // Generate simple sparkline data (7-day trend simulation)
  const generateSparkline = () => {
    const baseValue = theme.avgSentiment;
    const variance = 5;
    return Array.from({ length: 7 }, (_, i) => {
      const randomOffset = (Math.random() - 0.5) * variance;
      return Math.max(0, Math.min(100, baseValue + randomOffset + (i - 3)));
    });
  };

  const sparklineData = generateSparkline();
  const trend = sparklineData[6] - sparklineData[0]; // Compare last vs first

  const getSentimentColor = (score: number) => {
    if (score >= 60) return 'text-green-600 dark:text-green-500';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-500';
    return 'text-red-600 dark:text-red-500';
  };

  const getSentimentBg = (score: number) => {
    if (score >= 60) return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900';
    if (score >= 40) return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900';
    return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900';
  };

  const hasUrgency = theme.urgencyCount > 0;
  const sentimentScore = Math.round(theme.avgSentiment);

  return (
    <button
      onClick={onClick}
      className={`
        p-4 rounded-xl border transition-all
        hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        text-left w-full
        ${getSentimentBg(sentimentScore)}
      `}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${theme.name}. Sentiment: ${sentimentScore} out of 100. ${theme.responseCount} responses.`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm line-clamp-2">{theme.name}</h3>
          <ConfidenceIndicator 
            level={theme.responseCount >= 30 ? 'high' : theme.responseCount >= 15 ? 'medium' : 'low'}
            sampleSize={theme.responseCount}
          />
        </div>

        {/* Sentiment Score */}
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold tabular-nums ${getSentimentColor(sentimentScore)}`}>
            {sentimentScore}
          </span>
          <span className="text-sm text-muted-foreground">/100</span>
        </div>

        {/* Sparkline (Minimal SVG) */}
        <div className="h-8" aria-label={`Sentiment trend: ${trend > 0 ? 'improving' : trend < 0 ? 'declining' : 'stable'}`}>
          <svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 100 30" 
            preserveAspectRatio="none"
            className="opacity-60"
          >
            <polyline
              points={sparklineData.map((val, i) => `${(i / 6) * 100},${30 - (val / 100) * 30}`).join(' ')}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={getSentimentColor(sentimentScore)}
            />
          </svg>
        </div>

        {/* Metrics & Badges */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {theme.responseCount} {theme.responseCount === 1 ? 'response' : 'responses'}
            </span>
            
            {/* Trend Indicator */}
            {Math.abs(trend) > 2 && (
              <div className={`flex items-center gap-1 text-xs ${
                trend > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend > 0 ? <TrendingUp className="h-3 w-3" /> : 
                 trend < 0 ? <TrendingDown className="h-3 w-3" /> : 
                 <Minus className="h-3 w-3" />}
                <span>{Math.abs(Math.round(trend))}</span>
              </div>
            )}
          </div>

          {/* Urgency Badge */}
          {hasUrgency && (
            <Badge variant="destructive" className="text-xs gap-1">
              <AlertTriangle className="h-3 w-3" />
              {theme.urgencyCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}
