import { useState, useEffect, useCallback } from "react";
import { HRLayout } from "@/components/hr/HRLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAnalytics, type AnalyticsFilters } from "@/hooks/useAnalytics";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getTerminology } from "@/lib/contextualTerminology";
import type { Database } from "@/integrations/supabase/types";

// Components
import { HybridInsightsView } from "@/components/hr/analytics/HybridInsightsView";
import { SurveyComparison } from "@/components/hr/analytics/SurveyComparison";
import { AnalyticsRefreshInline } from "@/components/hr/analytics/AnalyticsRefreshInline";
import { NarrativeReportViewer } from "@/components/hr/analytics/NarrativeReportViewer";
import { DriversTab } from "@/components/hr/analytics/DriversTab";
import { useNarrativeReports } from "@/hooks/useNarrativeReports";
import { useThemeAnalytics } from "@/hooks/useThemeAnalytics";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, BookOpen, LayoutGrid, FileText, RefreshCw, Sparkles, Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { exportStoryReport } from "@/lib/exportStoryReport";

const Analytics = () => {
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(new Date());
  const [newResponseCount, setNewResponseCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  
  const { participation, sentiment, themes, isLoading, refetch: refetchAnalytics } = useAnalytics(filters);

  // Fetch narrative reports
  const { 
    latestReport, 
    isLoading: isReportLoading, 
    generateReport,
    isGenerating,
    refetch: refetchNarrativeReports,
  } = useNarrativeReports(filters.surveyId || null);

  // Theme analytics for re-analysis capability
  const { refetch: refetchThemeAnalytics } = useThemeAnalytics(filters.surveyId || null, {
    responseCount: participation?.responseCount || 0,
  });

  const { data: surveys } = useQuery({
    queryKey: ['surveys-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('surveys')
        .select('id, title, survey_type')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Detect survey type from selected survey
  const selectedSurvey = surveys?.find(s => s.id === filters.surveyId);
  const surveyType = selectedSurvey?.survey_type || 'employee_satisfaction';
  const terminology = getTerminology(surveyType as Database['public']['Enums']['survey_type']);

  const handleGenerateReport = (audience?: 'executive' | 'manager') => {
    if (!filters.surveyId) {
      toast.error("Please select a survey first");
      return;
    }
    generateReport({ surveyId: filters.surveyId, audience });
  };

  const handleExportPDF = async () => {
    if (!participation || !sentiment || !latestReport) {
      toast.error("Generate a story report first before exporting");
      return;
    }

    toast.info("Generating PDF...");
    try {
      await exportStoryReport({
        surveyName: selectedSurvey?.title || 'Survey Report',
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

  const handleShareLink = () => {
    toast.info("Share link feature coming soon");
  };

  // Unified refresh function
  const refreshAllAnalytics = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchAnalytics(),
        refetchThemeAnalytics(),
        refetchNarrativeReports(),
      ]);
      setLastUpdated(new Date());
      setNewResponseCount(0);
      toast.success("Analytics refreshed");
    } catch (error) {
      console.error("Refresh error:", error);
      toast.error("Failed to refresh analytics");
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchAnalytics, refetchThemeAnalytics, refetchNarrativeReports]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefreshInterval) return;

    const timer = setInterval(() => {
      refreshAllAnalytics();
    }, autoRefreshInterval * 60 * 1000);

    return () => clearInterval(timer);
  }, [autoRefreshInterval, refreshAllAnalytics]);

  // Real-time subscription for new responses
  useEffect(() => {
    if (!filters.surveyId) {
      setIsLiveConnected(false);
      return;
    }

    const channel = supabase
      .channel(`analytics-responses-${filters.surveyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'responses',
          filter: `survey_id=eq.${filters.surveyId}`,
        },
        () => {
          setNewResponseCount(prev => prev + 1);
        }
      )
      .subscribe((status) => {
        setIsLiveConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filters.surveyId]);

  // Format surveys for comparison component
  const surveysForComparison = surveys?.map(s => ({
    id: s.id,
    title: s.title,
  })) || [];

  return (
    <HRLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="space-y-6">
            {/* Collapsed Header: Title + Survey Selector + Refresh — one row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h1 className="text-2xl font-bold shrink-0">{terminology.analyticsTitle}</h1>

              {surveys && surveys.length > 0 && (
                <Select 
                  value={filters.surveyId || "all"} 
                  onValueChange={(value) => setFilters({ ...filters, surveyId: value === "all" ? undefined : value })}
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Select a survey" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All surveys</SelectItem>
                    {surveys.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Spacer */}
              <div className="flex-1" />

              {/* Inline refresh controls */}
              {filters.surveyId && (
                <AnalyticsRefreshInline
                  lastUpdated={lastUpdated}
                  newResponseCount={newResponseCount}
                  isRefreshing={isRefreshing}
                  isLiveConnected={isLiveConnected}
                  onRefresh={refreshAllAnalytics}
                  autoRefreshInterval={autoRefreshInterval}
                  onAutoRefreshChange={setAutoRefreshInterval}
                />
              )}
            </div>

            {/* 4-Tab Layout: Overview, Drivers (employee only), Story Report, Compare */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList>
                <TabsTrigger value="overview" className="gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                {surveyType === 'employee_satisfaction' && (
                  <TabsTrigger value="drivers" className="gap-2">
                    <Brain className="h-4 w-4" />
                    Drivers
                  </TabsTrigger>
                )}
                <TabsTrigger value="story" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Story Report
                </TabsTrigger>
                <TabsTrigger value="comparison" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Compare
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab - Metrics + Theme Grid */}
              <TabsContent value="overview" className="mt-6">
                <HybridInsightsView
                  participation={participation}
                  sentiment={sentiment}
                  themes={themes}
                  surveyId={filters.surveyId || null}
                  surveyTitle={selectedSurvey?.title}
                  isLoading={isLoading}
                  onShareLink={handleShareLink}
                  onRefresh={refreshAllAnalytics}
                  isRefreshing={isRefreshing}
                />
              </TabsContent>

              {/* Drivers Tab - Employee Satisfaction Only */}
              {surveyType === 'employee_satisfaction' && filters.surveyId && (
                <TabsContent value="drivers" className="mt-6">
                  <DriversTab surveyId={filters.surveyId} />
                </TabsContent>
              )}

              {/* Story Report Tab - Immersive Reading Experience */}
              <TabsContent value="story" className="mt-6">
                {latestReport ? (
                  <NarrativeReportViewer
                    report={latestReport}
                    onRegenerateWithAudience={(audience) => handleGenerateReport(audience)}
                    isGenerating={isGenerating}
                    onExport={handleExportPDF}
                  />
                ) : (
                  <Card className="border-dashed border-2">
                    <CardContent className="p-12 text-center">
                      <div className="max-w-md mx-auto space-y-6">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                          <BookOpen className="h-8 w-8 text-primary" />
                        </div>
                        
                        <div>
                          <h3 className="text-xl font-semibold mb-2">Generate Your Story Report</h3>
                          <p className="text-muted-foreground">
                            Transform survey data into an immersive narrative experience with AI-powered insights, 
                            evidence-backed findings, and actionable recommendations.
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 justify-center">
                          <Badge variant="outline" className="gap-1">
                            <Sparkles className="h-3 w-3" />
                            AI-Powered Analysis
                          </Badge>
                          <Badge variant="outline">Evidence Trail</Badge>
                          <Badge variant="outline">Actionable Insights</Badge>
                        </div>

                        {!filters.surveyId ? (
                          <p className="text-sm text-muted-foreground">
                            Select a survey above to generate a report
                          </p>
                        ) : (
                          <Button
                            onClick={() => handleGenerateReport()}
                            disabled={isGenerating}
                            size="lg"
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
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Compare Tab */}
              <TabsContent value="comparison" className="mt-6">
                <SurveyComparison
                  surveys={surveysForComparison}
                  currentSurveyId={filters.surveyId}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </HRLayout>
  );
};

export default Analytics;
