import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { HybridInsightsView } from "@/components/hr/analytics/HybridInsightsView";
import { NarrativeReportViewer } from "@/components/hr/analytics/NarrativeReportViewer";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Share2, Shield, BookOpen, BarChart3 } from "lucide-react";
import type { NarrativeReport } from "@/hooks/useNarrativeReports";

const PublicAnalytics = () => {
  const { shareToken } = useParams<{ shareToken: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-analytics", shareToken],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-public-analytics", {
        body: { shareToken },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    enabled: !!shareToken,
  });

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Link Unavailable</h1>
          <p className="text-muted-foreground">
            This analytics link may have expired, been deactivated, or doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Loading shared analytics...</p>
        </div>
      </div>
    );
  }

  const mappedThemes = (data?.themes || []).map((t: any) => ({
    id: t.themeId,
    name: t.themeName,
    responseCount: t.responseCount || 0,
    avgSentiment: t.healthIndex ?? 50,
    urgencyCount: 0,
    keySignals: { concerns: [], positives: [], other: [] },
  }));

  const mappedSentiment = data?.sentiment
    ? { ...data.sentiment, avgScore: data.sentiment.averageScore || 0, moodImprovement: 0 }
    : null;

  // Map narrative report to NarrativeReport interface
  const narrativeReport: NarrativeReport | null = data?.narrativeReport
    ? {
        id: data.narrativeReport.id,
        survey_id: data.narrativeReport.survey_id,
        generated_at: data.narrativeReport.generated_at,
        generated_by: data.narrativeReport.generated_by,
        report_version: data.narrativeReport.report_version,
        chapters: data.narrativeReport.chapters || [],
        audience_config: data.narrativeReport.audience_config || { audience: 'executive' },
        data_snapshot: data.narrativeReport.data_snapshot || { total_sessions: 0, total_responses: 0, generated_from_analytics: false },
        confidence_score: data.narrativeReport.confidence_score ?? 3,
        is_latest: data.narrativeReport.is_latest,
      }
    : null;

  const hasStoryReport = narrativeReport && narrativeReport.chapters.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{data?.survey?.title || "Survey Analytics"}</h1>
              <Badge variant="secondary" className="gap-1">
                <Share2 className="h-3 w-3" />
                Shared View
              </Badge>
            </div>
          </div>

          {/* Tabbed Analytics */}
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="story" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Story Report
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <HybridInsightsView
                participation={data?.participation || null}
                sentiment={mappedSentiment}
                themes={mappedThemes}
                surveyId={data?.survey?.id || null}
                surveyTitle={data?.survey?.title}
                isLoading={false}
              />
            </TabsContent>

            <TabsContent value="story">
              {hasStoryReport ? (
                <NarrativeReportViewer
                  report={narrativeReport}
                  surveyId={data?.survey?.id || ""}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                  <BookOpen className="h-12 w-12 text-muted-foreground/40" />
                  <div>
                    <h3 className="text-lg font-medium">No Story Report Available</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      A story report hasn't been generated for this survey yet.
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PublicAnalytics;
