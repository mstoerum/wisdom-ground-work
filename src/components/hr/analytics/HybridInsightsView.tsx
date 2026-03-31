import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Wand2, Sparkles } from "lucide-react";
import { PulseSummary } from "./PulseSummary";
import { ThemeGrid } from "./ThemeGrid";
import { AnalyticsEmptyState, getEmptyStateType } from "./AnalyticsEmptyState";
import { useThemeAnalytics } from "@/hooks/useThemeAnalytics";
import { useSurveyAnalytics } from "@/hooks/useSurveyAnalytics";
import { SurveyAnalyticsDashboard } from "./SurveyAnalyticsDashboard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
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

  const { data: surveyAnalytics, isLoading: isAnalyticsLoading, refetch: refetchSurveyAnalytics } = useSurveyAnalytics(surveyId || undefined);

  const runFullPipeline = async () => {
    if (!surveyId) return;
    setIsRunningPipeline(true);
    try {
      const { error } = await supabase.functions.invoke("interpret-survey", {
        body: { survey_id: surveyId },
      });
      if (error) throw error;
      toast.success("Full pipeline analysis complete");
      refetchSurveyAnalytics();
    } catch (err) {
      console.error("Pipeline error:", err);
      toast.error("Failed to run pipeline analysis");
    } finally {
      setIsRunningPipeline(false);
    }
  };


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

  // Extract top root causes from enriched theme data for headlines
  const topRootCauses = enrichedThemes
    .flatMap(t => (t.rootCauses || []).map(rc => ({ ...rc, themeName: t.themeName })))
    .sort((a, b) => {
      const impactOrder = { high: 0, medium: 1, low: 2 };
      return (impactOrder[a.impact_level] ?? 2) - (impactOrder[b.impact_level] ?? 2);
    })
    .slice(0, 3);

  const topStrengths = enrichedThemes
    .flatMap(t => (t.insights?.strengths || []).map(s => ({ ...s, themeName: t.themeName })))
    .sort((a, b) => b.voice_count - a.voice_count)
    .slice(0, 2);

  const hasHeadlines = topRootCauses.length > 0 || topStrengths.length > 0;

  return (
    <div className="space-y-6">
      {/* Section 0: Headlines — top findings from theme analytics */}
      {hasHeadlines && (
        <Card className="p-5 space-y-3 border-primary/20 bg-gradient-to-br from-card to-primary/5">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Top Findings
          </h3>
          <div className="space-y-2">
            {topRootCauses.map((rc, i) => (
              <div key={`rc-${i}`} className="flex items-start gap-3 text-sm">
                <Badge
                  variant="outline"
                  className={`shrink-0 mt-0.5 text-xs ${
                    rc.impact_level === 'high'
                      ? 'border-destructive/50 text-destructive'
                      : rc.impact_level === 'medium'
                      ? 'border-amber-500/50 text-amber-600 dark:text-amber-400'
                      : 'border-muted-foreground/30 text-muted-foreground'
                  }`}
                >
                  {rc.impact_level}
                </Badge>
                <div>
                  <p className="font-medium text-foreground">{rc.cause}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {rc.recommendation} <span className="italic">— {rc.themeName}</span>
                  </p>
                </div>
              </div>
            ))}
            {topStrengths.map((s, i) => (
              <div key={`str-${i}`} className="flex items-start gap-3 text-sm">
                <Badge variant="outline" className="shrink-0 mt-0.5 text-xs border-emerald-500/50 text-emerald-600 dark:text-emerald-400">
                  strength
                </Badge>
                <div>
                  <p className="font-medium text-foreground">{s.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {s.voice_count} voice{s.voice_count !== 1 ? 's' : ''} <span className="italic">— {s.themeName}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Section 1: Pulse Summary */}
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
          surveyId={surveyId || undefined}
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
