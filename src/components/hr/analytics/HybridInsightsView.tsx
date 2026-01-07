import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, RefreshCw, Sparkles, Download } from "lucide-react";
import { ThemeHealthList } from "./ThemeHealthList";
import { NarrativeReportViewer } from "./NarrativeReportViewer";
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
      {/* Story Report Section - Now First */}
      {latestReport ? (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              Export as PDF
            </Button>
          </div>
          <NarrativeReportViewer
            report={latestReport}
            onRegenerateWithAudience={(audience) => onGenerateReport(audience)}
            isGenerating={isGenerating}
          />
        </div>
      ) : (
        <Card className="border-dashed border-2">
          <CardContent className="p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-2">Generate Your First Story Report</h3>
                <p className="text-muted-foreground">
                  Transform survey data into actionable insights with an AI-powered narrative that tells the story behind the numbers.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center text-sm text-muted-foreground">
                <Badge variant="outline" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI-Powered Analysis
                </Badge>
                <Badge variant="outline">Evidence-Based Insights</Badge>
                <Badge variant="outline">Actionable Recommendations</Badge>
              </div>

              <Button
                onClick={() => onGenerateReport()}
                disabled={isGenerating}
                size="lg"
                className="mt-4"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating Story...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Story Report
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Theme Health List - Now Second */}
      <ThemeHealthList themes={themes} isLoading={isLoading} />
    </div>
  );
}
