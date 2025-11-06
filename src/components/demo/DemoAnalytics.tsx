import { useState, useEffect } from "react";
import { HRLayout } from "@/components/hr/HRLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, BarChart3, Users, MessageSquare, TrendingUp, AlertTriangle, FileText, Clock, Shield, RefreshCw, Database, CheckCircle2 } from "lucide-react";
import { 
  generateMockParticipation, 
  generateMockSentiment, 
  generateMockThemes, 
  generateMockUrgencyFlags, 
  generateTimeSeriesData,
  generateDepartmentData,
  generateTrendData,
  generateMockQualityMetrics,
  generateMockQualityInsights,
  generateMockEnhancedThemes,
  generateMockQuotes,
  generateMockNarrative,
  generateMockPatterns,
  generateMockRootCauses,
  generateMockInterventions,
  generateMockQuickWins,
  generateMockImpactPredictions,
  generateMockNLPAnalysis,
  generateMockCulturalMap,
} from "@/utils/demoAnalyticsData";
import { toast } from "sonner";
import { EmployeeVoiceGallery } from "@/components/hr/analytics/EmployeeVoiceGallery";
import { EnhancedThemeAnalysis } from "@/components/hr/analytics/EnhancedThemeAnalysis";
import { ActionableIntelligenceCenter } from "@/components/hr/analytics/ActionableIntelligenceCenter";
import { ConversationQualityDashboard } from "@/components/hr/analytics/ConversationQualityDashboard";
import { NLPInsights } from "@/components/hr/analytics/NLPInsights";
import { CulturalPatterns } from "@/components/hr/analytics/CulturalPatterns";
import { ExecutiveDashboard } from "@/components/hr/analytics/ExecutiveDashboard";
import { ExportAuditLog } from "@/components/hr/analytics/ExportAuditLog";
import { useConversationAnalytics } from "@/hooks/useConversationAnalytics";
import { useAnalytics } from "@/hooks/useAnalytics";
import { MockDataGenerator } from "./MockDataGenerator";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";

interface DemoAnalyticsProps {
  onBackToMenu: () => void;
}

export const DemoAnalytics = ({ onBackToMenu }: DemoAnalyticsProps) => {
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedTheme, setSelectedTheme] = useState("all");
  const [dataRefreshKey, setDataRefreshKey] = useState(0);
  const queryClient = useQueryClient();

  // Demo survey ID - convert to UUID format if needed (same logic as generateMockConversations)
  const DEMO_SURVEY_ID_STRING = 'demo-survey-001';
  const DEMO_SURVEY_UUID = '00000000-0000-0000-0000-000000000001';
  
  // Check if string is valid UUID
  const isValidUUID = (value: string): boolean => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  };
  
  // Use UUID format (same as what generateMockConversations uses internally)
  const DEMO_SURVEY_ID = isValidUUID(DEMO_SURVEY_ID_STRING) ? DEMO_SURVEY_ID_STRING : DEMO_SURVEY_UUID;

  // Always fetch analytics for demo survey (hook will return empty arrays if no data)
  // Include dataRefreshKey to force re-fetch when it changes
  const realAnalytics = useConversationAnalytics({
    surveyId: DEMO_SURVEY_ID,
    // Force refetch by including key in dependency (hack to ensure fresh data)
    _refreshKey: dataRefreshKey,
  } as any);

  // Fetch basic analytics (themes, urgency) for demo survey
  const basicAnalytics = useAnalytics({
    surveyId: DEMO_SURVEY_ID,
    _refreshKey: dataRefreshKey,
  } as any);

  // Check if we have real data based on actual responses/sessions from the hook
  // This will re-evaluate after refetch when dataRefreshKey changes
  const useRealData = realAnalytics.responses.length > 0 && realAnalytics.sessions.length > 0;

  // Generate comprehensive mock data (as fallback)
  const participation = useRealData && basicAnalytics.participation
    ? {
        ...basicAnalytics.participation,
        avgDuration: realAnalytics.sessions.reduce((sum, s) => {
          if (s.started_at && s.ended_at) {
            const duration = (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 60000;
            return sum + duration;
          }
          return sum;
        }, 0) / realAnalytics.sessions.length || basicAnalytics.participation.avgDuration || 12.3
      }
    : useRealData
    ? {
        totalAssigned: 45,
        completed: realAnalytics.sessions.length,
        pending: 0,
        completionRate: Math.round((realAnalytics.sessions.length / 45) * 100),
        avgDuration: realAnalytics.sessions.reduce((sum, s) => {
          if (s.started_at && s.ended_at) {
            const duration = (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 60000;
            return sum + duration;
          }
          return sum;
        }, 0) / realAnalytics.sessions.length || 12.3
      }
    : generateMockParticipation();

  const sentiment = useRealData && basicAnalytics.sentiment
    ? basicAnalytics.sentiment
    : useRealData && realAnalytics.responses.length > 0
    ? {
        positive: realAnalytics.responses.filter(r => r.sentiment === 'positive').length,
        neutral: realAnalytics.responses.filter(r => r.sentiment === 'neutral').length,
        negative: realAnalytics.responses.filter(r => r.sentiment === 'negative').length,
        avgScore: realAnalytics.responses.reduce((sum, r) => {
          const score = r.sentiment_score !== null && r.sentiment_score !== undefined
            ? (r.sentiment_score <= 1 ? r.sentiment_score * 100 : r.sentiment_score)
            : 50;
          return sum + score;
        }, 0) / realAnalytics.responses.length || 50,
        moodImprovement: realAnalytics.sessions.reduce((sum, s) => {
          if (s.initial_mood !== null && s.final_mood !== null) {
            return sum + (s.final_mood - s.initial_mood);
          }
          return sum;
        }, 0) / realAnalytics.sessions.length || 0
      }
    : generateMockSentiment();

  // Use real themes and urgency when available, otherwise use mock data
  const themes = useRealData && basicAnalytics.themes.length > 0 
    ? basicAnalytics.themes.map(t => ({
        id: t.id,
        name: t.name,
        responseCount: t.responseCount,
        avgSentiment: Math.round(t.avgSentiment),
        urgencyCount: t.urgencyCount,
      }))
    : generateMockThemes();
  
  const urgency = useRealData && basicAnalytics.urgency.length > 0
    ? basicAnalytics.urgency
    : generateMockUrgencyFlags();

  // Calculate time series data from real sessions/responses
  const timeSeriesData = useRealData && realAnalytics.sessions.length > 0
    ? (() => {
        // Group sessions by date
        const dateGroups = new Map<string, { sessions: typeof realAnalytics.sessions, responses: typeof realAnalytics.responses }>();
        
        realAnalytics.sessions.forEach(session => {
          if (session.started_at) {
            const date = new Date(session.started_at).toISOString().split('T')[0];
            if (!dateGroups.has(date)) {
              dateGroups.set(date, { sessions: [], responses: [] });
            }
            dateGroups.get(date)!.sessions.push(session);
          }
        });

        realAnalytics.responses.forEach(response => {
          const session = realAnalytics.sessions.find(s => s.id === response.conversation_session_id);
          if (session?.started_at) {
            const date = new Date(session.started_at).toISOString().split('T')[0];
            if (dateGroups.has(date)) {
              dateGroups.get(date)!.responses.push(response);
            }
          }
        });

        return Array.from(dateGroups.entries())
          .map(([date, data]) => ({
            date: new Date(date),
            completed: data.sessions.length,
            positive: data.responses.filter(r => r.sentiment === 'positive').length,
            negative: data.responses.filter(r => r.sentiment === 'negative').length,
          }))
          .sort((a, b) => a.date.getTime() - b.date.getTime());
      })()
    : generateTimeSeriesData();

  // Calculate department data from real responses
  const { data: realDepartmentData } = useQuery({
    queryKey: ['demo-department-data', DEMO_SURVEY_ID, useRealData],
    queryFn: async () => {
      if (!useRealData) return null;

      const { data: responses, error } = await supabase
        .from('responses')
        .select(`
          sentiment_score,
          conversation_sessions!inner(
            employee_id,
            profiles!inner(department)
          )
        `)
        .eq('survey_id', DEMO_SURVEY_ID);

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
      return Array.from(deptMap.entries()).map(([department, deptResponses]) => ({
        department,
        participation: Math.round((deptResponses.length / Math.max(realAnalytics.responses.length, 1)) * 100),
        avgSentiment: deptResponses.length > 0 
          ? Math.round(deptResponses.reduce((sum, r) => {
              const score = r.sentiment_score !== null && r.sentiment_score !== undefined
                ? (r.sentiment_score <= 1 ? r.sentiment_score * 100 : r.sentiment_score)
                : 50;
              return sum + score;
            }, 0) / deptResponses.length)
          : 0,
        responseCount: deptResponses.length
      }));
    },
    enabled: useRealData,
  });

  const departmentData = useRealData && realDepartmentData && realDepartmentData.length > 0
    ? realDepartmentData
    : generateDepartmentData();

  // Use real analytics data when available
  const qualityMetrics = useRealData ? realAnalytics.qualityMetrics : generateMockQualityMetrics();
  const qualityInsights = useRealData ? realAnalytics.qualityInsights : generateMockQualityInsights();
  const enhancedThemes = useRealData ? realAnalytics.themes : generateMockEnhancedThemes();
  const quotes = useRealData ? realAnalytics.quotes : generateMockQuotes();
  const narrative = useRealData ? realAnalytics.narrative : generateMockNarrative();
  const patterns = useRealData ? realAnalytics.patterns : generateMockPatterns();
  const rootCauses = useRealData ? realAnalytics.rootCauses : generateMockRootCauses();
  const interventions = useRealData ? realAnalytics.interventions : generateMockInterventions();
  const quickWins = useRealData ? realAnalytics.quickWins : generateMockQuickWins();
  const impactPredictions = useRealData ? realAnalytics.impactPredictions : generateMockImpactPredictions();
  const nlpAnalysis = useRealData ? realAnalytics.nlpAnalysis : generateMockNLPAnalysis();
  const culturalMap = useRealData ? realAnalytics.culturalMap : generateMockCulturalMap();

  // Filter data based on selections (kept for potential future use)
  const filteredThemes = selectedTheme === "all" ? themes : themes.filter(t => t.id === selectedTheme);
  const filteredDepartmentData = selectedDepartment === "all" ? departmentData : departmentData.filter(d => d.department === selectedDepartment);

  const handleExport = () => {
    toast.success("CSV export started (Demo)");
    console.log("Exporting demo data...");
  };

  const handlePDFExport = () => {
    toast.success("PDF export started (Demo)");
    console.log("Exporting PDF...");
  };

  const handleDataGenerated = async () => {
    console.log('[DemoAnalytics] handleDataGenerated called - refreshing analytics');
    console.log('[DemoAnalytics] Using survey ID:', DEMO_SURVEY_ID);
    
    // Step 1: Invalidate ALL related queries to clear cache
    await queryClient.invalidateQueries({ 
      predicate: (query) => {
        const key = query.queryKey;
        if (!Array.isArray(key)) return false;
        const firstKey = key[0];
        return (
          firstKey === 'conversation-responses' ||
          firstKey === 'conversation-sessions' ||
          firstKey === 'enhanced-analytics' ||
          firstKey === 'survey-themes' ||
          firstKey === 'analytics-participation' ||
          firstKey === 'analytics-sentiment' ||
          firstKey === 'analytics-themes' ||
          firstKey === 'analytics-urgency' ||
          firstKey === 'department-data' ||
          firstKey === 'demo-department-data' ||
          firstKey === 'time-series-data' ||
          firstKey === 'surveys-list'
        );
      }
    });
    
    // Step 2: Wait a moment for cache to clear
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Step 3: Verify data was actually created in database
    try {
      const { count: sessionCount, error: sessionError } = await supabase
        .from('conversation_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('survey_id', DEMO_SURVEY_ID);
      
      const { count: responseCount, error: responseError } = await supabase
        .from('responses')
        .select('*', { count: 'exact', head: true })
        .eq('survey_id', DEMO_SURVEY_ID);
      
      console.log('[DemoAnalytics] Database verification - sessions:', sessionCount, 'responses:', responseCount);
      
      if (sessionError || responseError) {
        console.error('[DemoAnalytics] Error verifying data:', sessionError || responseError);
      }
      
      if (!sessionCount || sessionCount === 0) {
        toast.error("Mock data was not created correctly. Please try again.");
        return;
      }
    } catch (error) {
      console.error('[DemoAnalytics] Error verifying database:', error);
    }
    
    // Step 4: Force re-render to create new hook instances with fresh queries
    setDataRefreshKey(prev => prev + 1);
    
    // Step 5: Wait for queries to refetch
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Step 6: Explicitly refetch analytics
    try {
      const results = await Promise.all([
        realAnalytics.refetch(),
        basicAnalytics.refetch(),
      ]);
      
      console.log('[DemoAnalytics] Analytics refreshed - sessions:', realAnalytics.sessions.length, 'responses:', realAnalytics.responses.length);
      console.log('[DemoAnalytics] Refetch results:', results);
      
      // Verify we actually got data
      if (realAnalytics.sessions.length === 0 || realAnalytics.responses.length === 0) {
        console.warn('[DemoAnalytics] WARNING: Analytics hooks returned empty arrays after refetch!');
        toast.warning("Data was generated but analytics are not showing it. Refreshing page...");
        
        // Force a page refresh as last resort
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.success(`Analytics refreshed with ${realAnalytics.sessions.length} conversations!`);
      }
    } catch (error) {
      console.error("Error refreshing analytics:", error);
      toast.error("Failed to refresh analytics. Please refresh the page.");
    }
  };

  return (
    <HRLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Demo Banner */}
        <div className="bg-primary/10 border-b -mx-6 -mt-6 mb-6">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Demo Mode - HR Analytics</span>
              {useRealData ? (
                <Badge variant="default" className="bg-green-600">
                  Analyzing Generated Mock Data ({realAnalytics.sessions.length} conversations)
                </Badge>
              ) : (
                <Badge variant="secondary">Placeholder Data</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {useRealData && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={async () => {
                    await queryClient.invalidateQueries({ 
                      predicate: (query) => {
                        const key = query.queryKey;
                        return (
                          (Array.isArray(key) && key[0] === 'conversation-responses') ||
                          (Array.isArray(key) && key[0] === 'conversation-sessions') ||
                          (Array.isArray(key) && key[0] === 'enhanced-analytics') ||
                          (Array.isArray(key) && key[0] === 'survey-themes') ||
                          (Array.isArray(key) && key[0] === 'analytics-participation') ||
                          (Array.isArray(key) && key[0] === 'analytics-sentiment') ||
                          (Array.isArray(key) && key[0] === 'analytics-themes') ||
                          (Array.isArray(key) && key[0] === 'analytics-urgency') ||
                          (Array.isArray(key) && key[0] === 'demo-department-data')
                        );
                      }
                    });
                    await Promise.all([
                      realAnalytics.refetch(),
                      basicAnalytics.refetch(),
                    ]);
                    setDataRefreshKey(prev => prev + 1);
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onBackToMenu}>
                Back to Demo Menu
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="space-y-6">
            {/* Mock Data Generator - Always visible but style changes based on data state */}
            <Card className={`${!useRealData ? 'border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10' : 'border-2 border-dashed'}`}>
              <CardContent className={!useRealData ? "p-8" : "p-6"}>
                {!useRealData ? (
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="rounded-full bg-primary/10 p-4">
                      <Database className="h-12 w-12 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Generate Mock Data to See the System in Action</h2>
                      <p className="text-muted-foreground max-w-2xl">
                        The analytics below are currently showing placeholder data. Generate realistic mock conversations to see how the HR Analytics dashboard processes and analyzes actual employee feedback data.
                      </p>
                    </div>
                    <div className="w-full max-w-2xl pt-2">
                      <MockDataGenerator 
                        surveyId={DEMO_SURVEY_ID_STRING} 
                        onDataGenerated={handleDataGenerated}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-900 dark:text-green-100">
                            Analyzing Generated Mock Data
                          </p>
                          <p className="text-sm text-green-800 dark:text-green-200">
                            Analytics computed from {realAnalytics.sessions.length} generated conversation sessions with {realAnalytics.responses.length} responses
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={async () => {
                          await queryClient.invalidateQueries({ 
                            predicate: (query) => {
                              const key = query.queryKey;
                              return (
                                (Array.isArray(key) && key[0] === 'conversation-responses') ||
                                (Array.isArray(key) && key[0] === 'conversation-sessions') ||
                                (Array.isArray(key) && key[0] === 'enhanced-analytics')
                              );
                            }
                          });
                          await Promise.all([
                            realAnalytics.refetch(),
                            basicAnalytics.refetch(),
                          ]);
                          setDataRefreshKey(prev => prev + 1);
                          toast.success("Analytics refreshed!");
                        }}
                        className="border-green-300 hover:bg-green-100"
                      >
                        <RefreshCw className="h-3 w-3 mr-2" />
                        Refresh Analytics
                      </Button>
                    </div>
                    <MockDataGenerator 
                      surveyId={DEMO_SURVEY_ID} 
                      onDataGenerated={handleDataGenerated}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">Employee Feedback Analytics</h1>
                <p className="text-muted-foreground mt-1">
                  {useRealData ? (
                    <>
                      Real insights from {participation.completed} completed conversations
                      {realAnalytics.isLoading && <span className="ml-2 text-xs">(Loading...)</span>}
                    </>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Placeholder Data</Badge>
                        Preview showing {participation.completed} sample conversations
                      </span>
                    </>
                  )}
                  {qualityMetrics && useRealData && (
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
            <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-5 ${!useRealData ? 'opacity-60' : ''}`}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Participation Rate</p>
                      <p className="text-3xl font-bold text-green-600">{participation.completionRate}%</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {participation.completed} of {participation.totalAssigned} employees
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
                      <p className="text-sm text-muted-foreground">Avg Sentiment</p>
                      <p className="text-3xl font-bold">{sentiment.avgScore}/100</p>
                      <p className="text-xs text-green-600 mt-1 flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +{sentiment.moodImprovement} improvement
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
                      <p className="text-sm text-muted-foreground">Avg Duration</p>
                      <p className="text-3xl font-bold">{participation.avgDuration}m</p>
                      <p className="text-xs text-muted-foreground mt-1">per conversation</p>
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
                        {urgency.filter(u => !u.resolved_at).length}
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
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {departmentData.map(d => (
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
                  {themes.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Placeholder Data Warning */}
            {!useRealData && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-900 dark:text-amber-100">
                      Currently Viewing Placeholder Analytics
                    </p>
                    <p className="text-amber-800 dark:text-amber-200">
                      These charts show sample data for demonstration purposes. Generate mock data above to see real analytics computed from actual conversation data.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Tabs defaultValue="dashboard" className={`space-y-6 ${!useRealData ? 'opacity-60' : ''}`}>
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                <TabsTrigger value="dashboard" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="actions" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Actions & Insights
                  {urgency?.filter(u => !u.resolved_at).length > 0 && (
                    <Badge variant="destructive" className="ml-1">{urgency.filter(u => !u.resolved_at).length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="explore" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Explore Data
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

              {/* Actions & Insights Tab */}
              <TabsContent value="actions" className="space-y-6">
                <ActionableIntelligenceCenter
                  rootCauses={rootCauses}
                  interventions={interventions}
                  quickWins={quickWins}
                  impactPredictions={impactPredictions}
                  isLoading={false}
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
                    <EnhancedThemeAnalysis themes={enhancedThemes} isLoading={false} />
                  </TabsContent>
                  <TabsContent value="voices">
                    <EmployeeVoiceGallery quotes={quotes} isLoading={false} />
                  </TabsContent>
                  <TabsContent value="quality">
                    <ConversationQualityDashboard qualityMetrics={qualityMetrics} qualityInsights={qualityInsights} isLoading={false} />
                  </TabsContent>
                  <TabsContent value="nlp">
                    <NLPInsights nlpAnalysis={nlpAnalysis} isLoading={false} />
                  </TabsContent>
                  <TabsContent value="culture">
                    <CulturalPatterns culturalMap={culturalMap} isLoading={false} />
                  </TabsContent>
                </Tabs>
              </TabsContent>

              {/* Reports Tab */}
              <TabsContent value="reports" className="space-y-6">
                <ExportAuditLog />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </HRLayout>
  );
};
