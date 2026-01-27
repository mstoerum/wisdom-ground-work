import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, RefreshCw, Sparkles, Download, ChevronDown, ChevronUp, Wand2 } from "lucide-react";
import { PulseSummary } from "./PulseSummary";
import { ThemeTerrain } from "./ThemeTerrain";
import { QuickInsightBadges } from "./QuickInsightBadges";
import { NarrativeReportViewer } from "./NarrativeReportViewer";
import { DataConfidenceBanner } from "./DataConfidenceBanner";
import { ActionSummaryCard } from "./ActionSummaryCard";
import { AnalyticsEmptyState, getEmptyStateType } from "./AnalyticsEmptyState";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { exportStoryReport } from "@/lib/exportStoryReport";
import { toast } from "sonner";
import { useThemeAnalytics } from "@/hooks/useThemeAnalytics";
import { useConversationAnalytics } from "@/hooks/useConversationAnalytics";
import type { NarrativeReport } from "@/hooks/useNarrativeReports";
import type { ParticipationMetrics, SentimentMetrics, ThemeInsight } from "@/hooks/useAnalytics";

interface HybridInsightsViewProps {
  participation: ParticipationMetrics | null;
  sentiment: SentimentMetrics | null;
  themes: ThemeInsight[];
  latestReport: NarrativeReport | null;
  isReportLoading: boolean;
  isGenerating: boolean;
  onGenerateReport: (audience?: 'executive' | 'manager') => void;
  surveyId: string | null;
  surveyTitle?: string;
  isLoading?: boolean;
  onShareLink?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function HybridInsightsView({
  participation,
  sentiment,
  themes,
  latestReport,
  isReportLoading,
  isGenerating,
  onGenerateReport,
  surveyId,
  surveyTitle,
  isLoading,
  onShareLink,
  onRefresh,
  isRefreshing,
}: HybridInsightsViewProps) {
  const [storyExpanded, setStoryExpanded] = useState(true);
  
  // NEW: Use responseCount from participation (actual answers), not just completed sessions
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
  
  // Actionable intelligence from conversation analytics
  const {
    quickWins,
    interventions,
    isLoading: isActionableLoading,
  } = useConversationAnalytics({ surveyId: surveyId || undefined });
  
  const handleExportPDF = async () => {
    if (!participation || !sentiment || !latestReport) {
      toast.error("Generate a story report first before exporting");
      return;
    }

    toast.info("Generating PDF...");
    try {
      await exportStoryReport({
        surveyName: surveyTitle || 'Survey Report',
        generatedAt: new Date(),
        participation,
        sentiment,
        themes,
        narrativeReport: latestReport,
        urgentCount: 0,
      });
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export PDF");
    }
  };
  
  // Check for empty state - now response-aware
  const emptyStateType = getEmptyStateType(surveyId, responseCount, sessionCount, activeSessionCount);
  
  // Show empty state only for truly empty cases
  // If we have responses (even without completed sessions), show the data!
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
  
  // For few-responses state, show if we really have no data to show
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

      {/* Section 2: Quick Insight Badges - Top strength & friction at a glance */}
      <QuickInsightBadges themes={themes} isLoading={isLoading} />

      {/* Section 3: Actionable Intelligence Summary */}
      <ActionSummaryCard
        quickWins={quickWins}
        criticalIssues={interventions}
        isLoading={isActionableLoading}
      />

      {/* Section 4: Theme Terrain - Visual health landscape */}
      <div className="space-y-2">
        <ThemeTerrain 
          themes={themes} 
          enrichedThemes={enrichedThemes}
          isLoading={isLoading || isAnalyzing} 
        />
        
        {/* Manual Generate Theme Insights button - only show when auto-trigger hasn't run */}
        {!hasAnalysis && themes.length > 0 && responseCount >= 5 && (
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
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Theme Insights
              </>
            )}
          </Button>
        )}
      </div>

      {/* Section 5: Story Report - Collapsible narrative deep-dive */}
      <div className="space-y-3">
        {latestReport ? (
          <Collapsible open={storyExpanded} onOpenChange={setStoryExpanded}>
            <div className="flex items-center justify-between">
              <CollapsibleTrigger className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                <h3 className="text-xs font-medium text-muted-foreground tracking-wide">
                  Story report
                </h3>
                {storyExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </CollapsibleTrigger>
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
            <CollapsibleContent className="mt-3">
              <NarrativeReportViewer
                report={latestReport}
                onRegenerateWithAudience={(audience) => onGenerateReport(audience)}
                isGenerating={isGenerating}
              />
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <Card className="border-dashed border-2">
            <CardContent className="p-8 text-center">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-1">Generate Story Report</h3>
                  <p className="text-sm text-muted-foreground">
                    Transform data into actionable insights with AI-powered narrative analysis.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
                  <Badge variant="outline" className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI Analysis
                  </Badge>
                  <Badge variant="outline">Evidence-Based</Badge>
                  <Badge variant="outline">Actionable</Badge>
                </div>

                <Button
                  onClick={() => onGenerateReport()}
                  disabled={isGenerating}
                  size="default"
                  className="mt-2"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
