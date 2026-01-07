import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, RefreshCw, Sparkles, Download, ChevronDown, ChevronUp } from "lucide-react";
import { PulseSummary } from "./PulseSummary";
import { ThemeTerrain } from "./ThemeTerrain";
import { QuickInsightBadges } from "./QuickInsightBadges";
import { NarrativeReportViewer } from "./NarrativeReportViewer";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { exportStoryReport } from "@/lib/exportStoryReport";
import { toast } from "sonner";
import type { NarrativeReport } from "@/hooks/useNarrativeReports";
import type { ParticipationMetrics, SentimentMetrics, ThemeInsight } from "@/hooks/useAnalytics";

interface HybridInsightsViewProps {
  // Metrics data
  participation: ParticipationMetrics | null;
  sentiment: SentimentMetrics | null;
  themes: ThemeInsight[];
  
  // Narrative report
  latestReport: NarrativeReport | null;
  isReportLoading: boolean;
  isGenerating: boolean;
  onGenerateReport: (audience?: 'executive' | 'manager') => void;
  
  // Survey info
  surveyId: string | null;
  surveyTitle?: string;
  
  isLoading?: boolean;
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
}: HybridInsightsViewProps) {
  const [storyExpanded, setStoryExpanded] = useState(true);
  
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
  
  // Show empty state when no survey selected
  if (!surveyId) {
    return (
      <Card className="p-12 text-center">
        <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Select a Survey</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Choose a survey from the dropdown above to view detailed insights and generate AI-powered story reports.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Section 1: Pulse Summary - Key metrics at a glance */}
      <PulseSummary
        participation={participation}
        sentiment={sentiment}
        themes={themes}
        isLoading={isLoading}
      />

      {/* Section 2: Quick Insight Badges - Top strength & friction at a glance */}
      <QuickInsightBadges themes={themes} isLoading={isLoading} />

      {/* Section 3: Theme Terrain - Visual health landscape */}
      <ThemeTerrain themes={themes} isLoading={isLoading} />

      {/* Section 3: Story Report - Collapsible narrative deep-dive */}
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
