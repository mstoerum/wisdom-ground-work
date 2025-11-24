import { HRLayout } from "@/components/hr/HRLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, TrendingUp, Clock, Users, ThumbsUp, ThumbsDown, Minus, Download, RefreshCw, Sparkles } from "lucide-react";
import { EvaluationMetrics } from "@/components/hr/evaluations/EvaluationMetrics";
import { EvaluationTrends } from "@/components/hr/evaluations/EvaluationTrends";
import { EvaluationInsights } from "@/components/hr/evaluations/EvaluationInsights";
import { EvaluationResponses } from "@/components/hr/evaluations/EvaluationResponses";
import { EvaluationFilters } from "@/components/hr/evaluations/EvaluationFilters";
import { SpradleyInsightsPanel } from "@/components/hr/evaluations/SpradleyInsightsPanel";
import { UsabilityIssuesPanel } from "@/components/hr/evaluations/UsabilityIssuesPanel";
import { ActionableRecommendationsPanel } from "@/components/hr/evaluations/ActionableRecommendationsPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { exportEvaluationsToCSV } from "@/lib/exportEvaluations";
import { useSpradleyAnalytics } from "@/hooks/useSpradleyAnalytics";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { isAfter, isBefore, parseISO } from "date-fns";

const SpradleyEvaluations = () => {
  const queryClient = useQueryClient();
  const [sentimentFilter, setSentimentFilter] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch AI analytics for selected survey
  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useSpradleyAnalytics(selectedSurveyId);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch all evaluations
  const { data: evaluations, isLoading } = useQuery({
    queryKey: ['spradley-evaluations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spradley_evaluations' as any)
        .select(`
          *,
          survey:surveys(id, title, created_at),
          employee:profiles(id, full_name, email)
        `)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('spradley-evaluations-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'spradley_evaluations'
        },
        (payload) => {
          console.log('🔴 New evaluation received:', payload);
          queryClient.invalidateQueries({ queryKey: ['spradley-evaluations'] });
          toast.success('New evaluation received', {
            description: 'Fresh feedback from a user'
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['spradley-evaluations'] });
    toast.success('Evaluations refreshed');
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Export to CSV
  const handleExport = () => {
    if (!filteredEvaluations || filteredEvaluations.length === 0) {
      toast.error('No evaluations to export');
      return;
    }
    exportEvaluationsToCSV(filteredEvaluations);
    toast.success('Evaluations exported to CSV');
  };

  const handleRunAnalysis = async () => {
    if (!selectedSurveyId) {
      toast.error("Please select a survey first");
      return;
    }

    setIsAnalyzing(true);
    try {
      const { error } = await supabase.functions.invoke("spradley-deep-analytics", {
        body: { survey_id: selectedSurveyId },
      });

      if (error) throw error;

      toast.success("Analysis complete! Insights are now available.");
      refetchAnalytics();
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to run analysis. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Filter evaluations
  const filteredEvaluations = evaluations?.filter((e: any) => {
    // Sentiment filter
    if (sentimentFilter) {
      const score = e.sentiment_score || 0;
      if (sentimentFilter === 'positive' && score <= 0.6) return false;
      if (sentimentFilter === 'neutral' && (score < 0.4 || score > 0.6)) return false;
      if (sentimentFilter === 'negative' && score >= 0.4) return false;
    }

    // Date range filter
    if (startDate && e.completed_at) {
      const completedAt = parseISO(e.completed_at);
      if (isBefore(completedAt, startDate)) return false;
    }
    if (endDate && e.completed_at) {
      const completedAt = parseISO(e.completed_at);
      if (isAfter(completedAt, endDate)) return false;
    }

    return true;
  });

  // Count active filters
  const activeFilterCount = [
    sentimentFilter,
    startDate,
    endDate
  ].filter(Boolean).length;

  // Clear all filters
  const handleClearFilters = () => {
    setSentimentFilter(null);
    setStartDate(undefined);
    setEndDate(undefined);
  };

  // Calculate aggregate metrics with zero-division protection (using filtered data)
  const metrics = filteredEvaluations && filteredEvaluations.length > 0 ? {
    totalEvaluations: filteredEvaluations.length,
    averageDuration: filteredEvaluations.reduce((sum, e: any) => sum + (e.duration_seconds || 0), 0) / filteredEvaluations.length,
    averageQuestions: filteredEvaluations.reduce((sum, e: any) => {
      const insights = e.key_insights as any;
      return sum + (insights?.total_questions || 0);
    }, 0) / filteredEvaluations.length,
    positiveSentiment: filteredEvaluations.filter((e: any) => e.sentiment_score && e.sentiment_score > 0.6).length,
    neutralSentiment: filteredEvaluations.filter((e: any) => e.sentiment_score && e.sentiment_score >= 0.4 && e.sentiment_score <= 0.6).length,
    negativeSentiment: filteredEvaluations.filter((e: any) => e.sentiment_score && e.sentiment_score < 0.4).length,
    completionRate: 100, // Simplified - could calculate from survey completions
  } : {
    totalEvaluations: 0,
    averageDuration: 0,
    averageQuestions: 0,
    positiveSentiment: 0,
    neutralSentiment: 0,
    negativeSentiment: 0,
    completionRate: 0,
  };

  if (isLoading) {
    return (
      <HRLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </HRLayout>
    );
  }

  return (
    <HRLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">Spradley Evaluations</h1>
              <Badge variant="outline" className="text-green-600 border-green-600">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Live
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              Insights from user feedback about their Spradley experience
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleRunAnalysis} 
              variant="default" 
              size="sm"
              disabled={isAnalyzing || !selectedSurveyId}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isAnalyzing ? "Analyzing..." : "Run AI Analysis"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={!filteredEvaluations || filteredEvaluations.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <EvaluationFilters
          sentimentFilter={sentimentFilter}
          setSentimentFilter={setSentimentFilter}
          startDate={startDate}
          endDate={endDate}
          onDateChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
          }}
          activeFilterCount={activeFilterCount}
          onClearAll={handleClearFilters}
          selectedSurveyId={selectedSurveyId}
          setSelectedSurveyId={setSelectedSurveyId}
        />

        {/* Key Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Evaluations</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalEvaluations}</div>
                <p className="text-xs text-muted-foreground">
                  User feedback sessions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(metrics.averageDuration)}s
                </div>
                <p className="text-xs text-muted-foreground">
                  ~{Math.round(metrics.averageDuration / 60)} minutes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Questions</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.averageQuestions.toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Questions per evaluation
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sentiment</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <ThumbsUp className="h-3 w-3 mr-1" />
                    {metrics.positiveSentiment}
                  </Badge>
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    <Minus className="h-3 w-3 mr-1" />
                    {metrics.neutralSentiment}
                  </Badge>
                  <Badge variant="outline" className="text-red-600 border-red-600">
                    <ThumbsDown className="h-3 w-3 mr-1" />
                    {metrics.negativeSentiment}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Overall feedback sentiment
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Detailed Insights */}
        {filteredEvaluations && filteredEvaluations.length > 0 ? (
          <Tabs defaultValue="ai-insights" className="space-y-4">
            <TabsList>
              <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
              <TabsTrigger value="insights">Key Insights</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="responses">Responses</TabsTrigger>
              <TabsTrigger value="metrics">Detailed Metrics</TabsTrigger>
            </TabsList>

            <TabsContent value="ai-insights" className="space-y-6">
              <SpradleyInsightsPanel analytics={analytics as any} isLoading={analyticsLoading} />
              <div className="grid gap-6 md:grid-cols-2">
                <UsabilityIssuesPanel analytics={analytics as any} isLoading={analyticsLoading} />
                <ActionableRecommendationsPanel analytics={analytics as any} isLoading={analyticsLoading} />
              </div>
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <EvaluationInsights evaluations={filteredEvaluations} />
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              <EvaluationTrends evaluations={filteredEvaluations} />
            </TabsContent>

            <TabsContent value="responses" className="space-y-4">
              <EvaluationResponses evaluations={filteredEvaluations} />
            </TabsContent>

            <TabsContent value="metrics" className="space-y-4">
              <EvaluationMetrics evaluations={filteredEvaluations} />
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Evaluations Yet</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Once users complete surveys with evaluation enabled, their feedback will appear here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </HRLayout>
  );
};

export default SpradleyEvaluations;
