import { useState } from "react";
import { HRLayout } from "@/components/hr/HRLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, BarChart3, Users, MessageSquare, TrendingUp, AlertTriangle } from "lucide-react";
import { useAnalytics, type AnalyticsFilters } from "@/hooks/useAnalytics";
import { MetricCard } from "@/components/hr/analytics/MetricCard";
import { SentimentChart } from "@/components/hr/analytics/SentimentChart";
import { ParticipationChart } from "@/components/hr/analytics/ParticipationChart";
import { ThemeInsights } from "@/components/hr/analytics/ThemeInsights";
import { ResponseList } from "@/components/hr/analytics/ResponseList";
import { UrgencyFlags } from "@/components/hr/analytics/UrgencyFlags";
import { exportToCSV } from "@/lib/exportAnalytics";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Analytics = () => {
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const { participation, sentiment, themes, urgency, isLoading } = useAnalytics(filters);

  const { data: surveys } = useQuery({
    queryKey: ['surveys-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('surveys')
        .select('id, title')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleExport = () => {
    exportToCSV(participation, sentiment, themes);
  };

  return (
    <HRLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground mt-1">Track insights and sentiment trends</p>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <div className="flex gap-4">
          <Select
            value={filters.surveyId || "all"}
            onValueChange={(value) => setFilters({ ...filters, surveyId: value === "all" ? undefined : value })}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="All surveys" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All surveys</SelectItem>
              {surveys?.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="participation">Participation</TabsTrigger>
            <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
            <TabsTrigger value="themes">Themes</TabsTrigger>
            <TabsTrigger value="responses">Responses</TabsTrigger>
            <TabsTrigger value="urgency">Urgent Flags</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {isLoading ? (
              <p className="text-muted-foreground">Loading analytics...</p>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <MetricCard
                    title="Total Responses"
                    value={participation?.completed || 0}
                    icon={MessageSquare}
                  />
                  <MetricCard
                    title="Completion Rate"
                    value={participation?.completionRate || 0}
                    icon={BarChart3}
                    suffix="%"
                  />
                  <MetricCard
                    title="Avg Sentiment"
                    value={sentiment?.avgScore || 0}
                    icon={TrendingUp}
                  />
                  <MetricCard
                    title="Urgent Flags"
                    value={urgency?.filter(u => !u.resolved_at).length || 0}
                    icon={AlertTriangle}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {sentiment && (
                    <SentimentChart
                      positive={sentiment.positive}
                      neutral={sentiment.neutral}
                      negative={sentiment.negative}
                    />
                  )}
                  {participation && (
                    <ParticipationChart
                      completed={participation.completed}
                      pending={participation.pending}
                    />
                  )}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="participation">
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard title="Total Assigned" value={participation?.totalAssigned || 0} icon={Users} />
              <MetricCard title="Completed" value={participation?.completed || 0} icon={BarChart3} />
              <MetricCard title="Pending" value={participation?.pending || 0} icon={MessageSquare} />
            </div>
          </TabsContent>

          <TabsContent value="sentiment">
            {sentiment && (
              <div className="space-y-6">
                <SentimentChart
                  positive={sentiment.positive}
                  neutral={sentiment.neutral}
                  negative={sentiment.negative}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <MetricCard title="Average Score" value={sentiment.avgScore} icon={TrendingUp} />
                  <MetricCard title="Mood Improvement" value={sentiment.moodImprovement} icon={TrendingUp} />
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="themes">
            <ThemeInsights themes={themes} />
          </TabsContent>

          <TabsContent value="responses">
            <ResponseList surveyId={filters.surveyId} />
          </TabsContent>

          <TabsContent value="urgency">
            <UrgencyFlags urgencies={urgency} />
          </TabsContent>
        </Tabs>
      </div>
    </HRLayout>
  );
};

export default Analytics;
