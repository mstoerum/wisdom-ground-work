import { useState } from "react";
import { HRLayout } from "@/components/hr/HRLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, BarChart3, Users, MessageSquare, TrendingUp, AlertTriangle, FileText, HelpCircle, PlusCircle, BarChart2, Frown } from "lucide-react";
import { useAnalytics, type AnalyticsFilters } from "@/hooks/useAnalytics";
import { MetricCard } from "@/components/hr/analytics/MetricCard";
import { SentimentChart } from "@/components/hr/analytics/SentimentChart";
import { ParticipationChart } from "@/components/hr/analytics/ParticipationChart";
import { ThemeInsights } from "@/components/hr/analytics/ThemeInsights";
import { ResponseList } from "@/components/hr/analytics/ResponseList";
import { UrgencyFlags } from "@/components/hr/analytics/UrgencyFlags";
import { DateRangePicker } from "@/components/hr/analytics/DateRangePicker";
import { exportToCSV } from "@/lib/exportAnalytics";
import { exportAnalyticsToPDF } from "@/lib/exportAnalyticsPDF";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EmptyState } from "@/components/hr/analytics/EmptyState";
import { useNavigate } from "react-router-dom";

const Analytics = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const { participation, sentiment, themes, urgency, isLoading, refetch } = useAnalytics(filters);

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

  return (
    <HRLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground mt-1">Track insights and sentiment trends</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={handlePDFExport} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <Select
            value={filters.surveyId || "all"}
            onValueChange={(value) => setFilters({ ...filters, surveyId: value === "all" ? undefined : value })}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All surveys" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All surveys</SelectItem>
              {surveys?.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.sentiment || "all"}
            onValueChange={(value) => setFilters({ ...filters, sentiment: value === "all" ? undefined : value as any })}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All sentiments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sentiments</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="negative">Negative</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.themeId || "all"}
            onValueChange={(value) => setFilters({ ...filters, themeId: value === "all" ? undefined : value })}
          >
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
          
          <DateRangePicker
            startDate={filters.startDate}
            endDate={filters.endDate}
            onDateChange={(start, end) => setFilters({ ...filters, startDate: start, endDate: end })}
          />
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
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="h-32 bg-muted/50 rounded-lg animate-pulse" />
                  <div className="h-32 bg-muted/50 rounded-lg animate-pulse" />
                  <div className="h-32 bg-muted/50 rounded-lg animate-pulse" />
                  <div className="h-32 bg-muted/50 rounded-lg animate-pulse" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="h-64 bg-muted/50 rounded-lg animate-pulse" />
                  <div className="h-64 bg-muted/50 rounded-lg animate-pulse" />
                </div>
              </>
            ) : !surveys || surveys.length === 0 ? (
              <EmptyState
                icon={PlusCircle}
                title="No Surveys Created Yet"
                description="Create your first survey to start collecting employee feedback and see analytics here."
                actionLabel="Create Survey"
                onAction={() => navigate('/hr/create-survey')}
              />
            ) : participation?.totalAssigned === 0 ? (
              <EmptyState
                icon={Users}
                title="No Survey Assignments Yet"
                description="Once you deploy surveys and assign them to employees, analytics will appear here."
                actionLabel="View Surveys"
                onAction={() => navigate('/hr/dashboard')}
              />
            ) : participation?.completed === 0 ? (
              <EmptyState
                icon={BarChart2}
                title="No Responses Yet"
                description="Employees haven't submitted responses yet. Once they do, you'll see detailed analytics and insights here."
              />
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
            {!urgency || urgency.length === 0 ? (
              <EmptyState
                icon={AlertTriangle}
                title="No Urgent Flags"
                description="Great news! There are no urgent issues requiring immediate attention. Urgent flags will appear here when employees report critical concerns."
              />
            ) : (
              <UrgencyFlags urgencies={urgency} onUpdate={refetch} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </HRLayout>
  );
};

export default Analytics;
