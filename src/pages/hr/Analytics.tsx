import { useState } from "react";
import { HRLayout } from "@/components/hr/HRLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, BarChart3, Users, MessageSquare, TrendingUp, AlertTriangle, FileText, PlusCircle, BarChart2, Clock, TrendingDown, Shield, Brain, Globe, RefreshCw, Lightbulb } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { DonutProgressRing } from "@/components/hr/analytics/DonutProgressRing";
import { RoundedBarChart } from "@/components/hr/analytics/RoundedBarChart";
import { ParticipationChart } from "@/components/hr/analytics/ParticipationChart";
import { SentimentChart } from "@/components/hr/analytics/SentimentChart";
import { useAnalytics, type AnalyticsFilters } from "@/hooks/useAnalytics";
import { useConversationAnalytics } from "@/hooks/useConversationAnalytics";
import { exportToCSV } from "@/lib/exportAnalytics";
import { exportAnalyticsToPDF } from "@/lib/exportAnalyticsPDF";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { EmployeeVoiceGallery } from "@/components/hr/analytics/EmployeeVoiceGallery";
import { NarrativeSummary } from "@/components/hr/analytics/NarrativeSummary";
import { getTerminology } from "@/lib/contextualTerminology";
import type { Database } from "@/integrations/supabase/types";
import { EnhancedThemeAnalysis } from "@/components/hr/analytics/EnhancedThemeAnalysis";
import { PatternDiscovery } from "@/components/hr/analytics/PatternDiscovery";
import { ActionableIntelligenceCenter } from "@/components/hr/analytics/ActionableIntelligenceCenter";
import { ConversationQualityDashboard } from "@/components/hr/analytics/ConversationQualityDashboard";
import { NLPInsights } from "@/components/hr/analytics/NLPInsights";
import { CulturalPatterns } from "@/components/hr/analytics/CulturalPatterns";
import { ExecutiveDashboard } from "@/components/hr/analytics/ExecutiveDashboard";
import { ExportAuditLog } from "@/components/hr/analytics/ExportAuditLog";
import { ReportsExportTab } from "@/components/hr/analytics/ReportsExportTab";
import { UrgentResponsesPanel } from "@/components/hr/analytics/UrgentResponsesPanel";
import { SessionInsightsPanel } from "@/components/hr/analytics/SessionInsightsPanel";
import { SurveyAnalyticsDashboard } from "@/components/hr/analytics/SurveyAnalyticsDashboard";
import { useSessionInsights } from "@/hooks/useSessionInsights";
import { useSurveyAnalytics } from "@/hooks/useSurveyAnalytics";
import { useNarrativeReports } from "@/hooks/useNarrativeReports";
import { NarrativeReportViewer } from "@/components/hr/analytics/NarrativeReportViewer";
import { useState as useReactState } from "react";

const Analytics = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedTheme, setSelectedTheme] = useState("all");
  const [isRunningAnalysis, setIsRunningAnalysis] = useReactState(false);
  
  const { participation, sentiment, themes, urgency, isLoading } = useAnalytics(filters);
  const { 
    quotes, 
    narrative, 
    themes: enhancedThemes, 
    patterns,
    rootCauses,
    interventions,
    quickWins,
    impactPredictions,
    qualityMetrics,
    qualityInsights,
    nlpAnalysis,
    culturalMap,
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

  // Fetch urgent responses for the Urgent tab
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

  // Fetch time series data
  const { data: timeSeriesData } = useQuery({
    queryKey: ['time-series-data', filters.surveyId],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);

      const { data: assignments, error } = await supabase
        .from('survey_assignments')
        .select(`
          completed_at,
          responses(sentiment)
        `)
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', endDate.toISOString())
        .eq('status', 'completed')
        .order('completed_at', { ascending: true });

      if (error) throw error;

      // Group by date
      const dateGroups = new Map<string, any[]>();
      assignments?.forEach(assignment => {
        if (assignment.completed_at) {
          const date = new Date(assignment.completed_at).toISOString().split('T')[0];
          if (!dateGroups.has(date)) {
            dateGroups.set(date, []);
          }
          dateGroups.get(date)!.push(assignment);
        }
      });

      return Array.from(dateGroups.entries())
        .map(([date, assignments]) => {
          const responses = assignments.flatMap(a => a.responses || []);
          return {
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            completed: assignments.length,
            positive: responses.filter(r => r.sentiment === 'positive').length,
            negative: responses.filter(r => r.sentiment === 'negative').length
          };
        })
        .sort((a, b) => a.date.localeCompare(b.date));
    },
  });

  // Generate trend data (quarterly)
  const trendData = [
    { period: 'Q3 2024', participation: 67, avgSentiment: 62.4, urgentFlags: 12 },
    { period: 'Q4 2024', participation: 73, avgSentiment: 67.2, urgentFlags: 8 },
    { period: 'Q1 2025', participation: 81, avgSentiment: 72.5, urgentFlags: 4 }
  ];

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

  // Filter data based on selections
  const filteredThemes = selectedTheme === "all" ? themes : themes?.filter(t => t.id === selectedTheme);
  const filteredDepartmentData = selectedDepartment === "all" ? departmentData : departmentData?.filter(d => d.department === selectedDepartment);

  return (
    <HRLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">{terminology.analyticsTitle}</h1>
                <p className="text-muted-foreground mt-1">
                  Comprehensive insights from {participation?.completed || 0} completed {terminology.completedCount}
                  {qualityMetrics && (
                    <span className="ml-2">
                      ? <span className={
                        qualityMetrics.average_confidence_score >= 75 ? 'text-green-600 font-medium' :
                        qualityMetrics.average_confidence_score >= 50 ? 'text-yellow-600 font-medium' : 'text-red-600 font-medium'
                      }>
                        {qualityMetrics.average_confidence_score >= 75 ? 'High' :
                         qualityMetrics.average_confidence_score >= 50 ? 'Medium' : 'Low'} Confidence
                      </span>
                    </span>
                  )}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button 
                  onClick={async () => {
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
                  }}
                  variant="default"
                  size="sm"
                  disabled={!filters.surveyId || isRunningAnalysis}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  {isRunningAnalysis ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : 'Run Deep Analysis'}
                </Button>
                <Button 
                  onClick={async () => {
                    if (!filters.surveyId) {
                      toast.error("Please select a survey first");
                      return;
                    }
                    generateReport({ surveyId: filters.surveyId });
                  }}
                  variant="default"
                  size="sm"
                  disabled={!filters.surveyId || isGenerating}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : 'Generate Story Report'}
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

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{terminology.participationRate}</p>
                      <p className="text-3xl font-bold text-green-600">{participation?.completionRate || 0}%</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {participation?.completed || 0} of {participation?.totalAssigned || 0} {terminology.completedCount}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{terminology.avgSentiment}</p>
                      <p className="text-3xl font-bold">{sentiment?.avgScore || 0}/100</p>
                      <p className="text-xs text-green-600 mt-1 flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +{sentiment?.moodImprovement || 0} improvement
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{terminology.avgDuration}</p>
                      <p className="text-3xl font-bold">{participation?.avgDuration || 0}m</p>
                      <p className="text-xs text-muted-foreground mt-1">per session</p>
                    </div>
                    <Clock className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Urgent Flags</p>
                      <p className="text-3xl font-bold text-orange-600">
                        {urgency?.filter(u => !u.resolved_at).length || 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">requiring attention</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              {/* Confidence Metric Card */}
              {qualityMetrics && (
                <Card className={`border-l-4 ${
                  qualityMetrics.average_confidence_score >= 75 ? 'border-green-500' :
                  qualityMetrics.average_confidence_score >= 50 ? 'border-yellow-500' : 'border-red-500'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Analytics Confidence</p>
                        <p className={`text-3xl font-bold ${
                          qualityMetrics.average_confidence_score >= 75 ? 'text-green-600' :
                          qualityMetrics.average_confidence_score >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {qualityMetrics.average_confidence_score}/100
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {qualityMetrics.average_confidence_score >= 75 ? 'High' :
                           qualityMetrics.average_confidence_score >= 50 ? 'Medium' : 'Low'} confidence
                        </p>
                      </div>
                      <Shield className={`h-8 w-8 ${
                        qualityMetrics.average_confidence_score >= 75 ? 'text-green-600' :
                        qualityMetrics.average_confidence_score >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`} />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              {surveys && surveys.length > 0 && (
                <Select 
                  value={filters.surveyId || "all"} 
                  onValueChange={(value) => setFilters({ ...filters, surveyId: value === "all" ? undefined : value })}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All surveys" />
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

              <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All themes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All themes</SelectItem>
                  {themes?.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Tabs defaultValue="dashboard" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-8">
                <TabsTrigger value="dashboard" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="story" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Story
                  {latestReport && (
                    <Badge variant="secondary" className="ml-1">New</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="ai-insights" className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI Insights
                  {surveyAnalytics && (
                    <Badge variant="secondary" className="ml-1">New</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="urgent" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Urgent
                  {urgentResponses && urgentResponses.filter(r => r.urgency_score >= 4).length > 0 && (
                    <Badge variant="destructive" className="ml-1">
                      {urgentResponses.filter(r => r.urgency_score >= 4).length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="insights" className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Sessions
                  {sessionInsights && sessionInsights.length > 0 && (
                    <Badge variant="secondary" className="ml-1">{sessionInsights.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="actions" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Actions
                  {urgency?.filter(u => !u.resolved_at).length > 0 && (
                    <Badge variant="destructive" className="ml-1">{urgency.filter(u => !u.resolved_at).length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="explore" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Explore
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Reports
                </TabsTrigger>
              </TabsList>

              {/* Dashboard Tab */}
              <TabsContent value="dashboard" className="space-y-6">
                <ExecutiveDashboard
                  participation={participation}
                  sentiment={sentiment}
                  themes={themes}
                  urgency={urgency}
                  quickWins={quickWins}
                  qualityMetrics={qualityMetrics}
                  onNavigateToActions={() => {
                    const tabs = document.querySelector('[value="actions"]') as HTMLElement;
                    tabs?.click();
                  }}
                />
              </TabsContent>

              {/* Story Report Tab */}
              <TabsContent value="story" className="space-y-6">
                {!filters.surveyId ? (
                  <Card className="p-12 text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Please select a survey to view or generate a story report
                    </p>
                  </Card>
                ) : latestReport ? (
                  <NarrativeReportViewer
                    report={latestReport}
                    onRegenerateWithAudience={(audience) => {
                      if (filters.surveyId) {
                        generateReport({ surveyId: filters.surveyId, audience });
                      }
                    }}
                    isGenerating={isGenerating}
                  />
                ) : (
                  <Card className="p-12 text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Story Report Yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Generate an AI-powered narrative report that tells the story of this survey
                    </p>
                    <Button
                      onClick={() => {
                        if (filters.surveyId) {
                          generateReport({ surveyId: filters.surveyId });
                        }
                      }}
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
                  </Card>
                )}
              </TabsContent>

              {/* AI Insights Tab - Sprint 3 */}
              <TabsContent value="ai-insights" className="space-y-6">
                <SurveyAnalyticsDashboard 
                  analytics={surveyAnalytics ? {
                    ...surveyAnalytics,
                    top_themes: surveyAnalytics.top_themes as any,
                    sentiment_trends: surveyAnalytics.sentiment_trends as any,
                    risk_factors: surveyAnalytics.risk_factors as any,
                    opportunities: surveyAnalytics.opportunities as any,
                    strategic_recommendations: surveyAnalytics.strategic_recommendations as any,
                  } : null}
                  isLoading={isAnalyticsLoading}
                />
              </TabsContent>

              {/* Urgent Tab - Sprint 1 */}
              <TabsContent value="urgent" className="space-y-6">
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
                <NarrativeSummary 
                  narrative={narrative} 
                  isLoading={isConversationLoading}
                />
              </TabsContent>

              {/* Session Insights Tab - Sprint 2 */}
              <TabsContent value="insights" className="space-y-6">
                <SessionInsightsPanel 
                  insights={(sessionInsights || []).map(insight => ({
                    ...insight,
                    sentiment_trajectory: insight.sentiment_trajectory as 'improving' | 'declining' | 'stable' | 'mixed' | null,
                    key_quotes: insight.key_quotes as string[],
                    recommended_actions: insight.recommended_actions as Array<{
                      action: string;
                      priority: 'high' | 'medium' | 'low';
                      timeframe: string;
                    }>
                  }))}
                  isLoading={isInsightsLoading}
                />
              </TabsContent>

              {/* Actions & Insights Tab */}
              <TabsContent value="actions" className="space-y-6">
                <ActionableIntelligenceCenter
                  rootCauses={rootCauses}
                  interventions={interventions}
                  quickWins={quickWins}
                  impactPredictions={impactPredictions}
                  isLoading={isConversationLoading}
                />
              </TabsContent>

              {/* Explore Data Tab */}
              <TabsContent value="explore" className="space-y-6">
                <Tabs defaultValue="themes" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="themes">Themes</TabsTrigger>
                    <TabsTrigger value="voices">Voices</TabsTrigger>
                    <TabsTrigger value="quality">Quality</TabsTrigger>
                    <TabsTrigger value="nlp">NLP</TabsTrigger>
                    <TabsTrigger value="culture">Culture</TabsTrigger>
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
                    <ConversationQualityDashboard qualityMetrics={qualityMetrics} qualityInsights={qualityInsights} isLoading={isConversationLoading} />
                  </TabsContent>
                  <TabsContent value="nlp">
                    <NLPInsights nlpAnalysis={nlpAnalysis} isLoading={isConversationLoading} />
                  </TabsContent>
                  <TabsContent value="culture">
                    <CulturalPatterns culturalMap={culturalMap} isLoading={isConversationLoading} />
                  </TabsContent>
                </Tabs>
              </TabsContent>

              {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-6">
              <ReportsExportTab 
                surveys={surveys} 
                departments={Array.from(new Set(departmentData?.map(d => d.department) || []))}
              />
            </TabsContent>

              {/* NLP Insights Tab */}
              <TabsContent value="nlp" className="space-y-6">
                <NLPInsights
                  nlpAnalysis={nlpAnalysis}
                  isLoading={isConversationLoading}
                />
              </TabsContent>

              {/* Cultural Patterns Tab */}
              <TabsContent value="culture" className="space-y-6">
                <CulturalPatterns
                  culturalMap={culturalMap}
                  isLoading={isConversationLoading}
                />
              </TabsContent>

              {/* New Insights Hub Tab */}
              <TabsContent value="insights" className="space-y-6">
                <NarrativeSummary 
                  narrative={narrative} 
                  isLoading={isConversationLoading}
                />
                
                {enhancedThemes.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Themes Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3">
                        {enhancedThemes.slice(0, 3).map(theme => (
                          <div key={theme.theme_id} className="p-4 rounded-lg border">
                            <h4 className="font-semibold mb-2">{theme.theme_name}</h4>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Sentiment</span>
                                <span className="font-medium">{theme.avg_sentiment.toFixed(1)}/100</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Responses</span>
                                <span className="font-medium">{theme.response_count}</span>
                              </div>
                              {theme.sub_themes.length > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Sub-themes</span>
                                  <span className="font-medium">{theme.sub_themes.length}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Enhanced Theme Analysis Tab */}
              <TabsContent value="themes" className="space-y-6">
                <EnhancedThemeAnalysis 
                  themes={enhancedThemes} 
                  isLoading={isConversationLoading}
                />
              </TabsContent>

              {/* Employee Voice Gallery Tab */}
              <TabsContent value="voices" className="space-y-6">
                <EmployeeVoiceGallery 
                  quotes={quotes} 
                  isLoading={isConversationLoading}
                />
              </TabsContent>

              {/* Pattern Discovery Tab */}
              <TabsContent value="patterns" className="space-y-6">
                <PatternDiscovery 
                  patterns={patterns} 
                  isLoading={isConversationLoading}
                />
              </TabsContent>

              <TabsContent value="overview" className="space-y-8">
                {/* Asymmetric 60-40 Layout */}
                <div className="grid gap-8 lg:grid-cols-5">
                  {/* Main chart area - 60% width (3 cols) */}
                  <Card className="lg:col-span-3 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-shadow duration-300">
                    <CardHeader>
                      <CardTitle>Sentiment Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <SentimentChart 
                        positive={sentiment?.positive || 0}
                        neutral={sentiment?.neutral || 0}
                        negative={sentiment?.negative || 0}
                      />
                    </CardContent>
                  </Card>

                  {/* Side metrics - 40% width (2 cols) */}
                  <Card className="lg:col-span-2 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-shadow duration-300">
                    <CardHeader>
                      <CardTitle>Survey Completion</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ParticipationChart 
                        completed={participation?.completed || 0}
                        pending={participation?.pending || 0}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Department Participation - Full Width Bar Chart */}
                <Card className="hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle>Participation by Department</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RoundedBarChart 
                      data={(filteredDepartmentData || []).map(d => ({
                        name: d.department,
                        value: d.participation,
                        count: d.responseCount
                      }))}
                      maxValue={100}
                      showHatching={false}
                    />
                  </CardContent>
                </Card>

                {/* Recent Activity Timeline */}
                <Card className="hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle>Response Activity Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{
                      completed: { label: "Responses", color: "hsl(var(--lime-green))" },
                      positive: { label: "Positive", color: "hsl(var(--butter-yellow))" },
                      negative: { label: "Negative", color: "hsl(var(--coral-pink))" }
                    }} className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={timeSeriesData || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                          <YAxis stroke="hsl(var(--muted-foreground))" />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Area type="monotone" dataKey="completed" stackId="1" stroke="hsl(var(--lime-green))" fill="hsl(var(--lime-green))" fillOpacity={0.6} />
                          <Area type="monotone" dataKey="positive" stackId="2" stroke="hsl(var(--butter-yellow))" fill="hsl(var(--butter-yellow))" fillOpacity={0.6} />
                          <Area type="monotone" dataKey="negative" stackId="2" stroke="hsl(var(--coral-pink))" fill="hsl(var(--coral-pink))" fillOpacity={0.6} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sentiment" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Sentiment Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Positive</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-muted rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${((sentiment?.positive || 0) / Math.max((sentiment?.positive || 0) + (sentiment?.neutral || 0) + (sentiment?.negative || 0), 1)) * 100}%` }} />
                            </div>
                            <span className="text-sm font-medium">{sentiment?.positive || 0}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Neutral</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-muted rounded-full h-2">
                              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${((sentiment?.neutral || 0) / Math.max((sentiment?.positive || 0) + (sentiment?.neutral || 0) + (sentiment?.negative || 0), 1)) * 100}%` }} />
                            </div>
                            <span className="text-sm font-medium">{sentiment?.neutral || 0}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Negative</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-muted rounded-full h-2">
                              <div className="bg-red-500 h-2 rounded-full" style={{ width: `${((sentiment?.negative || 0) / Math.max((sentiment?.positive || 0) + (sentiment?.neutral || 0) + (sentiment?.negative || 0), 1)) * 100}%` }} />
                            </div>
                            <span className="text-sm font-medium">{sentiment?.negative || 0}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Mood Improvement</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-green-600 mb-2">+{sentiment?.moodImprovement || 0}</div>
                        <p className="text-muted-foreground">Average mood improvement from start to end of conversations</p>
                        <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                          <p className="text-sm text-green-800 dark:text-green-200">
                            "The AI conversation helped me process my thoughts and feel more optimistic about work."
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-300 mt-1">? Anonymous Employee</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="themes" className="space-y-6">
                <div className="grid gap-4">
                  {filteredThemes?.map((theme) => (
                    <Card key={theme.id} className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{theme.name}</h3>
                          <p className="text-sm text-muted-foreground">{theme.responseCount} responses</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={theme.avgSentiment > 60 ? "default" : theme.avgSentiment > 40 ? "secondary" : "destructive"}>
                            {theme.avgSentiment > 60 ? "Positive" : theme.avgSentiment > 40 ? "Mixed" : "Needs Attention"}
                          </Badge>
                          {theme.urgencyCount > 0 && (
                            <Badge variant="destructive">
                              {theme.urgencyCount} urgent
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Average Sentiment</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-muted rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  theme.avgSentiment > 60 ? 'bg-green-500' : 
                                  theme.avgSentiment > 40 ? 'bg-yellow-500' : 'bg-red-500'
                                }`} 
                                style={{ width: `${theme.avgSentiment}%` }} 
                              />
                            </div>
                            <span className="text-sm font-medium">{theme.avgSentiment}/100</span>
                          </div>
                        </div>
                        
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-sm italic">
                            {theme.name === "Work-Life Balance" && "I often find myself answering emails late at night... feels like there's an expectation to always be available."}
                            {theme.name === "Career Growth" && "The new career development workshops have been really helpful for my growth."}
                            {theme.name === "Team Collaboration" && "My team is supportive and we work really well together."}
                            {theme.name === "Leadership" && "The leadership team is approachable and really listens to employee feedback."}
                            {theme.name === "Compensation" && "Compensation could be more competitive. I know I could earn more elsewhere, but I stay for the culture."}
                            {theme.name === "Company Culture" && "The company culture is inclusive and welcoming. I feel comfortable being myself at work."}
                            {theme.name === "Work Environment" && "The office environment is modern and comfortable. Great facilities and amenities."}
                            {theme.name === "Communication" && "Communication from leadership could be more transparent. Sometimes important decisions are made without much explanation."}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">? Anonymous Employee Response</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="trends" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quarterly Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{
                      participation: { label: "Participation %", color: "hsl(var(--chart-1))" },
                      avgSentiment: { label: "Avg Sentiment", color: "hsl(var(--chart-2))" },
                      urgentFlags: { label: "Urgent Flags", color: "hsl(var(--chart-3))" }
                    }} className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line type="monotone" dataKey="participation" stroke="hsl(var(--chart-1))" strokeWidth={3} />
                          <Line type="monotone" dataKey="avgSentiment" stroke="hsl(var(--chart-2))" strokeWidth={3} />
                          <Line type="monotone" dataKey="urgentFlags" stroke="hsl(var(--chart-3))" strokeWidth={3} />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Participation Growth</span>
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-600">+14%</div>
                    <p className="text-xs text-muted-foreground">Q3 2024 ? Q1 2025</p>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Sentiment Improvement</span>
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-600">+10.1</div>
                    <p className="text-xs text-muted-foreground">Q3 2024 ? Q1 2025</p>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Urgent Issues</span>
                      <TrendingDown className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-600">-8</div>
                    <p className="text-xs text-muted-foreground">Q3 2024 ? Q1 2025</p>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="departments" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredDepartmentData?.map((dept) => (
                    <Card key={dept.department} className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">{dept.department}</h3>
                        <Badge variant={dept.avgSentiment > 70 ? "default" : dept.avgSentiment > 50 ? "secondary" : "destructive"}>
                          {dept.avgSentiment}/100
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Participation</span>
                          <span className="text-sm font-medium">{dept.participation}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${dept.participation}%` }} 
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Responses</span>
                          <span className="text-sm font-medium">{dept.responseCount}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Avg Sentiment</span>
                          <div className="flex items-center gap-1">
                            <div className="w-16 bg-muted rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full ${
                                  dept.avgSentiment > 70 ? 'bg-green-500' : 
                                  dept.avgSentiment > 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`} 
                                style={{ width: `${dept.avgSentiment}%` }} 
                              />
                            </div>
                            <span className="text-xs">{dept.avgSentiment}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="urgency" className="space-y-6">
                {!urgency || urgency.length === 0 ? (
                  <Card className="p-8 text-center">
                    <AlertTriangle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Urgent Flags</h3>
                    <p className="text-muted-foreground">Great news! There are no urgent issues requiring immediate attention.</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                            {urgency.filter(u => !u.resolved_at).length} Issues Require Immediate Attention
                          </h3>
                          <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                            These themes show high negative sentiment and multiple employee concerns.
                          </p>
                        </div>
                      </div>
                    </div>

                    {urgency.map((flag) => (
                      <Card key={flag.id} className={`p-6 ${!flag.resolved_at ? 'border-l-4 border-orange-500' : 'border-l-4 border-green-500'}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={!flag.resolved_at ? "destructive" : "default"}>
                                {flag.responses?.survey_themes?.name || 'Theme'}
                              </Badge>
                              {!flag.resolved_at ? (
                                <Badge variant="outline">Urgent</Badge>
                              ) : (
                                <Badge variant="outline">Resolved</Badge>
                              )}
                            </div>
                            <h3 className="font-semibold text-lg mb-2">{flag.responses?.content || 'No content'}</h3>
                            <p className="text-sm text-muted-foreground">
                              Escalated on {new Date(flag.escalated_at).toLocaleDateString()}
                              {flag.resolved_at && ` ? Resolved on ${new Date(flag.resolved_at).toLocaleDateString()}`}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                          {!flag.resolved_at && (
                            <>
                              <Button size="sm">Create Action Plan</Button>
                              <Button size="sm" variant="outline">View Details</Button>
                            </>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </HRLayout>
  );
};

export default Analytics;
