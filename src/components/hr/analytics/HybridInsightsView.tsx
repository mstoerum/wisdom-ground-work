import { Button } from "@/components/ui/button";
import { RefreshCw, Wand2 } from "lucide-react";
import { PulseSummary } from "./PulseSummary";
import { ThemeGrid } from "./ThemeGrid";
import { DataConfidenceBanner } from "./DataConfidenceBanner";
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
 * Story Report has been moved to its own dedicated tab
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
  // Response count from participation
  const responseCount = participation?.responseCount || participation?.completed || 0;
  const sessionCount = participation?.sessionCount || participation?.totalAssigned || 0;
  const activeSessionCount = participation?.activeSessionCount || participation?.pending || 0;
  
  // Theme analytics hook with auto-trigger
  const { 
    data: enrichedThemes, 
    isAnalyzing, 
    hasAnalysis, 
    analyzeThemes 
  } = useThemeAnalytics(surveyId, { 
    responseCount,
    autoAnalyze: true 
  });
  
  // Check for empty state
  const emptyStateType = getEmptyStateType(surveyId, responseCount, sessionCount, activeSessionCount);
  
  // Show empty state for truly empty cases
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
  
  // For few-responses state, show if we really have no data
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
      {/* Data Confidence Banner */}
      <DataConfidenceBanner
        responseCount={responseCount}
        surveyId={surveyId}
        onShareLink={onShareLink}
      />

      {/* Section 1: Pulse Summary - Key metrics at a glance */}
      <PulseSummary
        participation={participation}
        sentiment={sentiment}
        themes={themes}
        isLoading={isLoading}
      />

      {/* Section 2: Theme Grid - Full space for flip cards */}
      <div className="space-y-2">
        <ThemeGrid 
          themes={themes} 
          enrichedThemes={enrichedThemes}
          isLoading={isLoading || isAnalyzing} 
        />
        
        {/* Theme analysis button */}
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
