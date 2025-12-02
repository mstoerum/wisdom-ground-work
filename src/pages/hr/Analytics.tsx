import { useState } from "react";
import { HRLayout } from "@/components/hr/HRLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Sparkles, FileText, Target, Search, Brain, RefreshCw } from "lucide-react";
import { useAnalytics, type AnalyticsFilters } from "@/hooks/useAnalytics";
import { useConversationAnalytics } from "@/hooks/useConversationAnalytics";
import { exportToCSV } from "@/lib/exportAnalytics";
import { exportAnalyticsToPDF } from "@/lib/exportAnalyticsPDF";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getTerminology } from "@/lib/contextualTerminology";
import type { Database } from "@/integrations/supabase/types";

// Components
import { HybridInsightsView } from "@/components/hr/analytics/HybridInsightsView";
import { ActionableIntelligenceCenter } from "@/components/hr/analytics/ActionableIntelligenceCenter";
import { UrgentResponsesPanel } from "@/components/hr/analytics/UrgentResponsesPanel";
import { EmployeeVoiceGallery } from "@/components/hr/analytics/EmployeeVoiceGallery";
import { EnhancedThemeAnalysis } from "@/components/hr/analytics/EnhancedThemeAnalysis";
import { ConversationQualityDashboard } from "@/components/hr/analytics/ConversationQualityDashboard";
import { ReportsExportTab } from "@/components/hr/analytics/ReportsExportTab";
import { useSessionInsights } from "@/hooks/useSessionInsights";
import { useSurveyAnalytics } from "@/hooks/useSurveyAnalytics";
import { useNarrativeReports } from "@/hooks/useNarrativeReports";

const Analytics = () => {
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false);
  
  const { participation, sentiment, themes, urgency, isLoading } = useAnalytics(filters);
  const { 
    quotes, 
    themes: enhancedThemes, 
    rootCauses,
    interventions,
    quickWins,
    impactPredictions,
    qualityMetrics,
    qualityInsights,
    isLoading: isConversationLoading
  } = useConversationAnalytics(filters);

  // Fetch session insights
  const { data: sessionInsights, isLoading: isInsightsLoading } = useSessionInsights(filters.surveyId);

  // Fetch survey-wide deep analytics
  const { data: surveyAnalytics, isLoading: isAnalyticsLoading, refetch: refetchAnalytics } = useSurveyAnalytics(filters.surveyId);

  // Fetch narrative reports
  const { 
    latestReport, 
    isLoading: isReportLoading, 
    generateReport,
    isGenerating 
  } = useNarrativeReports(filters.surveyId || null);

  // Fetch urgent responses
  const { data: urgentResponses } = useQuery({
    queryKey: ['urgent-responses', filters.surveyId],
    queryFn: async () => {
      if (!filters.surveyId) return [];
      
      const { data, error } = await supabase
        .from('responses')
        .select('*')
        .eq('survey_id', filters.surveyId)
        .gte('urgency_score', 3)
        .order('urgency_score', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!filters.surveyId,
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

  // Fetch department data
  const { data: departmentData } = useQuery({
    queryKey: ['department-data', filters.surveyId],
    queryFn: async () => {
      const { data: responses, error } = await supabase
        .from('responses')
        .select(`
          sentiment_score,
          conversation_sessions!inner(
            employee_id,
            profiles!inner(department)
          )
        `);

      if (error) throw error;

      // Group by department
      const deptMap = new Map<string, any[]>();
      responses?.forEach(response => {
        const dept = (response as any).conversation_sessions?.profiles?.department || 'Unknown';
        if (!deptMap.has(dept)) {
          deptMap.set(dept, []);
        }
        deptMap.get(dept)!.push(response);
      });

      // Calculate metrics for each department
      return Array.from(deptMap.entries()).map(([department, responses]) => ({
        department,
        participation: Math.round((responses.length / Math.max(responses.length, 1)) * 100),
        avgSentiment: responses.length > 0 
          ? Math.round(responses.reduce((sum, r) => sum + (r.sentiment_score || 0), 0) / responses.length)
          : 0,
        responseCount: responses.length
      }));
    },
  });

  const handleExport = () => {
    exportToCSV(participation, sentiment, themes);
  };

  const handlePDFExport = async () => {
    if (!participation || !sentiment) {
      toast.error("Analytics data not loaded yet");
      return;
    }

    const surveyName = surveys?.find(s => s.id === filters.surveyId)?.title || "All Surveys";
    
    try {
      await exportAnalyticsToPDF(surveyName, participation, sentiment, themes, urgency);
      toast.success("PDF report generated successfully");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to generate PDF report");
    }
  };

  const handleRunDeepAnalysis = async () => {
    if (!filters.surveyId) {
      toast.error("Please select a survey first");
      return;
    }
    setIsRunningAnalysis(true);
    try {
      const { error } = await supabase.functions.invoke('deep-analytics', {
        body: { survey_id: filters.surveyId }
      });
      if (error) throw error;
      toast.success("Deep analysis completed successfully");
      await refetchAnalytics();
    } catch (error) {
      console.error("Deep analysis error:", error);
      toast.error("Failed to run deep analysis");
    } finally {
      setIsRunningAnalysis(false);
    }
  };

  const handleGenerateReport = (audience?: 'executive' | 'manager') => {
    if (!filters.surveyId) {
      toast.error("Please select a survey first");
      return;
    }
    generateReport({ surveyId: filters.surveyId, audience });
  };

  // Calculate urgent count
  const urgentCount = urgentResponses?.filter(r => r.urgency_score >= 4).length || 
    urgency?.filter(u => !u.resolved_at).length || 0;

  return (
    <HRLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">{terminology.analyticsTitle}</h1>
                <p className="text-muted-foreground mt-1">
                  Comprehensive insights from {participation?.completed || 0} completed {terminology.completedCount}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button 
                  onClick={handleRunDeepAnalysis}
                  variant="default"
                  size="sm"
                  disabled={!filters.surveyId || isRunningAnalysis}
                >
                  {isRunningAnalysis ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Run Deep Analysis
                    </>
                  )}
                </Button>
                <Button onClick={handleExport} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button onClick={handlePDFExport} variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              {surveys && surveys.length > 0 && (
                <Select 
                  value={filters.surveyId || "all"} 
                  onValueChange={(value) => setFilters({ ...filters, surveyId: value === "all" ? undefined : value })}
                >
                  <SelectTrigger className="w-[250px]">
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

              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {departmentData?.map(d => (
                    <SelectItem key={d.department} value={d.department}>{d.department}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Simplified 4-Tab Navigation */}
            <Tabs defaultValue="insights" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 max-w-xl">
                <TabsTrigger value="insights" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Insights
                </TabsTrigger>
                <TabsTrigger value="actions" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Actions
                  {urgentCount > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {urgentCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="explore" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Explore
                </TabsTrigger>
                <TabsTrigger value="export" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Export
                </TabsTrigger>
              </TabsList>

              {/* INSIGHTS TAB - Hybrid View with Metrics + Story */}
              <TabsContent value="insights" className="space-y-6">
                <HybridInsightsView
                  participation={participation}
                  sentiment={sentiment}
                  urgentCount={urgentCount}
                  confidenceScore={qualityMetrics?.average_confidence_score}
                  themes={themes}
                  latestReport={latestReport}
                  isReportLoading={isReportLoading}
                  isGenerating={isGenerating}
                  onGenerateReport={handleGenerateReport}
                  surveyId={filters.surveyId || null}
                  surveyTitle={selectedSurvey?.title}
                  isLoading={isLoading}
                />
              </TabsContent>

              {/* ACTIONS TAB - Urgent Issues + Quick Wins + Recommendations */}
              <TabsContent value="actions" className="space-y-6">
                {/* Urgent Responses Section */}
                {urgentCount > 0 && (
                  <UrgentResponsesPanel 
                    responses={urgentResponses?.map(r => ({
                      id: r.id,
                      content: r.content,
                      urgency_score: r.urgency_score || 0,
                      ai_analysis: r.ai_analysis as any,
                      created_at: r.created_at || new Date().toISOString()
                    })) || []}
                    isLoading={isLoading}
                  />
                )}

                {/* Actionable Intelligence */}
                <ActionableIntelligenceCenter
                  rootCauses={rootCauses}
                  interventions={interventions}
                  quickWins={quickWins}
                  impactPredictions={impactPredictions}
                  isLoading={isConversationLoading}
                />
              </TabsContent>

              {/* EXPLORE TAB - Deep Dive into Data */}
              <TabsContent value="explore" className="space-y-6">
                <Tabs defaultValue="themes" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="themes">Themes</TabsTrigger>
                    <TabsTrigger value="voices">Voices</TabsTrigger>
                    <TabsTrigger value="quality">Quality</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="themes">
                    <EnhancedThemeAnalysis themes={enhancedThemes} isLoading={isConversationLoading} />
                  </TabsContent>
                  
                  <TabsContent value="voices">
                    <EmployeeVoiceGallery 
                      quotes={quotes} 
                      isLoading={isConversationLoading}
                      surveyType={surveyType as Database['public']['Enums']['survey_type']}
                    />
                  </TabsContent>
                  
                  <TabsContent value="quality">
                    <ConversationQualityDashboard 
                      qualityMetrics={qualityMetrics} 
                      qualityInsights={qualityInsights} 
                      isLoading={isConversationLoading} 
                    />
                  </TabsContent>
                </Tabs>
              </TabsContent>

              {/* EXPORT TAB - Reports & Downloads */}
              <TabsContent value="export" className="space-y-6">
                <ReportsExportTab 
                  surveys={surveys} 
                  departments={Array.from(new Set(departmentData?.map(d => d.department) || []))}
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
