import { Button } from "@/components/ui/button";
import { RefreshCw, Wand2 } from "lucide-react";
import { PulseSummary } from "./PulseSummary";
import { ThemeGrid } from "./ThemeGrid";
import { AnalyticsEmptyState, getEmptyStateType } from "./AnalyticsEmptyState";
import { useThemeAnalytics } from "@/hooks/useThemeAnalytics";
import type { ParticipationMetrics, SentimentMetrics, ThemeInsight } from "@/hooks/useAnalytics";

interface HybridInsightsViewProps {
  participation: ParticipationMetrics | null;
  sentiment: SentimentMetrics | null;
  themes: ThemeInsight[];
  surveyId: string | null;
  surveyTitle?: string;
  isLoading?: boolean;
  onShareLink?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

/**
 * HybridInsightsView - Overview tab content
 * Shows Pulse Summary metrics + Theme Grid (flip cards)
 * DataConfidenceBanner merged into PulseSummary as 5th metric
 */
export function HybridInsightsView({
  participation,
  sentiment,
  themes,
  surveyId,
  surveyTitle,
  isLoading,
  onShareLink,
}: HybridInsightsViewProps) {
  const responseCount = participation?.responseCount || participation?.completed || 0;
  const sessionCount = participation?.sessionCount || participation?.totalAssigned || 0;
  const activeSessionCount = participation?.activeSessionCount || participation?.pending || 0;
  
  const { 
    data: enrichedThemes, 
    isAnalyzing, 
    hasAnalysis, 
    analyzeThemes 
  } = useThemeAnalytics(surveyId, { 
    responseCount,
    autoAnalyze: true 
  });
  
  const emptyStateType = getEmptyStateType(surveyId, responseCount, sessionCount, activeSessionCount);
  
  if (emptyStateType === 'no-survey' || emptyStateType === 'no-responses') {
    return (
      <AnalyticsEmptyState
        type={emptyStateType}
        responseCount={responseCount}
        sessionCount={sessionCount}
        activeSessionCount={activeSessionCount}
        surveyTitle={surveyTitle}
        onShareLink={onShareLink}
      />
    );
  }
  
  if (emptyStateType === 'few-responses' && themes.length === 0) {
    return (
      <AnalyticsEmptyState
        type={emptyStateType}
        responseCount={responseCount}
        sessionCount={sessionCount}
        activeSessionCount={activeSessionCount}
        surveyTitle={surveyTitle}
        onShareLink={onShareLink}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Pulse Summary - Key metrics + confidence (5th card) */}
      <PulseSummary
        participation={participation}
        sentiment={sentiment}
        themes={themes}
        responseCount={responseCount}
        isLoading={isLoading}
      />

      {/* Section 2: Theme Grid */}
      <div className="space-y-2">
        <ThemeGrid 
          themes={themes} 
          enrichedThemes={enrichedThemes}
          isLoading={isLoading || isAnalyzing} 
        />
        
        {themes.length > 0 && responseCount >= 3 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => analyzeThemes()}
            disabled={isAnalyzing}
            className="mt-2"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analyzing themes...
              </>
            ) : hasAnalysis ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Re-analyze Themes
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Theme Insights
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
