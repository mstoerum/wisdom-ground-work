import { HRLayout } from "@/components/hr/HRLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, TrendingUp, Clock, Users, ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { EvaluationMetrics } from "@/components/hr/evaluations/EvaluationMetrics";
import { EvaluationTrends } from "@/components/hr/evaluations/EvaluationTrends";
import { EvaluationInsights } from "@/components/hr/evaluations/EvaluationInsights";
import { EvaluationResponses } from "@/components/hr/evaluations/EvaluationResponses";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SpradleyEvaluations = () => {
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

  // Calculate aggregate metrics with zero-division protection
  const metrics = evaluations && evaluations.length > 0 ? {
    totalEvaluations: evaluations.length,
    averageDuration: evaluations.reduce((sum, e: any) => sum + (e.duration_seconds || 0), 0) / evaluations.length,
    averageQuestions: evaluations.reduce((sum, e: any) => {
      const insights = e.key_insights as any;
      return sum + (insights?.total_questions || 0);
    }, 0) / evaluations.length,
    positiveSentiment: evaluations.filter((e: any) => e.sentiment_score && e.sentiment_score > 0.6).length,
    neutralSentiment: evaluations.filter((e: any) => e.sentiment_score && e.sentiment_score >= 0.4 && e.sentiment_score <= 0.6).length,
    negativeSentiment: evaluations.filter((e: any) => e.sentiment_score && e.sentiment_score < 0.4).length,
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
        <div>
          <h1 className="text-3xl font-bold">Spradley Evaluations</h1>
          <p className="text-muted-foreground mt-1">
            Insights from user feedback about their Spradley experience
          </p>
        </div>

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
        {evaluations && evaluations.length > 0 ? (
          <Tabs defaultValue="insights" className="space-y-4">
            <TabsList>
              <TabsTrigger value="insights">Key Insights</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="responses">Responses</TabsTrigger>
              <TabsTrigger value="metrics">Detailed Metrics</TabsTrigger>
            </TabsList>

            <TabsContent value="insights" className="space-y-4">
              <EvaluationInsights evaluations={evaluations} />
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              <EvaluationTrends evaluations={evaluations} />
            </TabsContent>

            <TabsContent value="responses" className="space-y-4">
              <EvaluationResponses evaluations={evaluations} />
            </TabsContent>

            <TabsContent value="metrics" className="space-y-4">
              <EvaluationMetrics evaluations={evaluations} />
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
