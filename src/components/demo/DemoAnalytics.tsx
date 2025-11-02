import { useState, useEffect } from "react";
import { HRLayout } from "@/components/hr/HRLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, BarChart3, Users, MessageSquare, TrendingUp, AlertTriangle, FileText, BarChart2, Clock, TrendingDown, Shield, Brain, Globe, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { DonutProgressRing } from "@/components/hr/analytics/DonutProgressRing";
import { RoundedBarChart } from "@/components/hr/analytics/RoundedBarChart";
import { ParticipationChart } from "@/components/hr/analytics/ParticipationChart";
import { SentimentChart } from "@/components/hr/analytics/SentimentChart";
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
import { NarrativeSummary } from "@/components/hr/analytics/NarrativeSummary";
import { EnhancedThemeAnalysis } from "@/components/hr/analytics/EnhancedThemeAnalysis";
import { PatternDiscovery } from "@/components/hr/analytics/PatternDiscovery";
import { ActionableIntelligenceCenter } from "@/components/hr/analytics/ActionableIntelligenceCenter";
import { ConversationQualityDashboard } from "@/components/hr/analytics/ConversationQualityDashboard";
import { NLPInsights } from "@/components/hr/analytics/NLPInsights";
import { CulturalPatterns } from "@/components/hr/analytics/CulturalPatterns";
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
  });

  // Fetch basic analytics (themes, urgency) for demo survey
  const basicAnalytics = useAnalytics({
    surveyId: DEMO_SURVEY_ID,
  });

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

  // Trend data - keep mock for now as we don't have historical quarterly data
  const trendData = generateTrendData();
  
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

  // Format time series data for display
  const formattedTimeSeriesData = (timeSeriesData || []).map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    completed: d.completed,
    positive: d.positive,
    negative: d.negative
  }));

  // Filter data based on selections
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
    // The MockDataGenerator already invalidated queries, but we'll invalidate again
    // to ensure everything is covered, including any queries specific to this component
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
          firstKey === 'time-series-data' ||
          firstKey === 'surveys-list'
        );
      }
    });
    
    // Force refetch of analytics data and wait for it to complete
    // This ensures the hooks pick up the new data
    try {
      await Promise.all([
        realAnalytics.refetch(),
        basicAnalytics.refetch(),
      ]);
      
      // Wait a moment for React Query to update all dependent queries
      // (e.g., enhanced-analytics depends on responses and sessions)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Force a re-render by updating the refresh key
      // This ensures the component re-evaluates useRealData with fresh data
      setDataRefreshKey(prev => prev + 1);
      
      toast.success("Analytics refreshed with new data!");
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
                  Using Real Data ({realAnalytics.sessions.length} conversations)
                </Badge>
              ) : (
                <Badge variant="secondary">Mock Data ? Q1 2025</Badge>
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
            {/* Mock Data Generator - Always visible */}
            <MockDataGenerator 
              surveyId={DEMO_SURVEY_ID_STRING} 
              onDataGenerated={handleDataGenerated}
            />

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
                      Comprehensive insights from {participation.completed} completed conversations
                      <span className="ml-2 text-xs text-muted-foreground">(Mock data - generate real data above)</span>
                    </>
                  )}
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

            <Tabs defaultValue="quality" className="space-y-6">
              <div className="overflow-x-auto">
                <TabsList className="h-auto inline-flex flex-wrap gap-1 p-1 min-w-full md:min-w-0">
                  <TabsTrigger value="quality" className="flex items-center gap-1.5 text-xs sm:text-sm">
                    <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Quality & Confidence</span>
                    <span className="sm:hidden">Quality</span>
                  </TabsTrigger>
                  <TabsTrigger value="overview" className="flex items-center gap-1.5 text-xs sm:text-sm">
                    <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="actionable" className="flex items-center gap-1.5 text-xs sm:text-sm">
                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Action Center</span>
                    <span className="sm:hidden">Actions</span>
                  </TabsTrigger>
                  <TabsTrigger value="insights" className="flex items-center gap-1.5 text-xs sm:text-sm">
                    <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Insights Hub</span>
                    <span className="sm:hidden">Insights</span>
                  </TabsTrigger>
                  <TabsTrigger value="themes" className="flex items-center gap-1.5 text-xs sm:text-sm">
                    <BarChart2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    Themes
                  </TabsTrigger>
                  <TabsTrigger value="voices" className="flex items-center gap-1.5 text-xs sm:text-sm">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    Voices
                  </TabsTrigger>
                  <TabsTrigger value="nlp" className="flex items-center gap-1.5 text-xs sm:text-sm">
                    <Brain className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden md:inline">NLP Insights</span>
                    <span className="md:hidden">NLP</span>
                  </TabsTrigger>
                  <TabsTrigger value="culture" className="flex items-center gap-1.5 text-xs sm:text-sm">
                    <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
                    Culture
                  </TabsTrigger>
                  <TabsTrigger value="patterns" className="flex items-center gap-1.5 text-xs sm:text-sm">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                    Patterns
                  </TabsTrigger>
                  <TabsTrigger value="sentiment" className="flex items-center gap-1.5 text-xs sm:text-sm">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                    Sentiment
                  </TabsTrigger>
                  <TabsTrigger value="departments" className="flex items-center gap-1.5 text-xs sm:text-sm">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Departments</span>
                    <span className="sm:hidden">Depts</span>
                  </TabsTrigger>
                  <TabsTrigger value="urgency" className="flex items-center gap-1.5 text-xs sm:text-sm">
                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                    Urgent
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Conversation Quality & Confidence Tab - MOST IMPORTANT */}
              <TabsContent value="quality" className="space-y-6">
                <ConversationQualityDashboard
                  qualityMetrics={qualityMetrics}
                  qualityInsights={qualityInsights}
                  isLoading={false}
                />
              </TabsContent>

              {/* Actionable Intelligence Center Tab */}
              <TabsContent value="actionable" className="space-y-6">
                <ActionableIntelligenceCenter
                  rootCauses={rootCauses}
                  interventions={interventions}
                  quickWins={quickWins}
                  impactPredictions={impactPredictions}
                  isLoading={false}
                />
              </TabsContent>

              {/* NLP Insights Tab */}
              <TabsContent value="nlp" className="space-y-6">
                <NLPInsights
                  nlpAnalysis={nlpAnalysis}
                  isLoading={false}
                />
              </TabsContent>

              {/* Cultural Patterns Tab */}
              <TabsContent value="culture" className="space-y-6">
                <CulturalPatterns
                  culturalMap={culturalMap}
                  isLoading={false}
                />
              </TabsContent>

              {/* New Insights Hub Tab */}
              <TabsContent value="insights" className="space-y-6">
                <NarrativeSummary 
                  narrative={narrative} 
                  isLoading={false}
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
                  isLoading={false}
                />
              </TabsContent>

              {/* Employee Voice Gallery Tab */}
              <TabsContent value="voices" className="space-y-6">
                <EmployeeVoiceGallery 
                  quotes={quotes} 
                  isLoading={false}
                />
              </TabsContent>

              {/* Pattern Discovery Tab */}
              <TabsContent value="patterns" className="space-y-6">
                <PatternDiscovery 
                  patterns={patterns} 
                  isLoading={false}
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
                        positive={sentiment.positive}
                        neutral={sentiment.neutral}
                        negative={sentiment.negative}
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
                        completed={participation.completed}
                        pending={participation.pending}
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
                        <AreaChart data={formattedTimeSeriesData}>
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
                              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${((sentiment.positive) / Math.max((sentiment.positive) + (sentiment.neutral) + (sentiment.negative), 1)) * 100}%` }} />
                            </div>
                            <span className="text-sm font-medium">{sentiment.positive}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Neutral</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-muted rounded-full h-2">
                              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${((sentiment.neutral) / Math.max((sentiment.positive) + (sentiment.neutral) + (sentiment.negative), 1)) * 100}%` }} />
                            </div>
                            <span className="text-sm font-medium">{sentiment.neutral}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Negative</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-muted rounded-full h-2">
                              <div className="bg-red-500 h-2 rounded-full" style={{ width: `${((sentiment.negative) / Math.max((sentiment.positive) + (sentiment.neutral) + (sentiment.negative), 1)) * 100}%` }} />
                            </div>
                            <span className="text-sm font-medium">{sentiment.negative}</span>
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
                        <div className="text-4xl font-bold text-green-600 mb-2">+{sentiment.moodImprovement}</div>
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
                  {filteredThemes.map((theme) => (
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
                  {filteredDepartmentData.map((dept) => (
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
