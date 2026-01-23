import { useState } from "react";
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
import { useNarrativeReports } from "@/hooks/useNarrativeReports";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Sparkles } from "lucide-react";

const Analytics = () => {
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [activeTab, setActiveTab] = useState<string>("insights");
  
  const { participation, sentiment, themes, isLoading } = useAnalytics(filters);

  // Fetch narrative reports
  const { 
    latestReport, 
    isLoading: isReportLoading, 
    generateReport,
    isGenerating 
  } = useNarrativeReports(filters.surveyId || null);

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

  const handleShareLink = () => {
    // TODO: Implement share link modal/functionality
    toast.info("Share link feature coming soon");
  };

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
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">{terminology.analyticsTitle}</h1>
                <p className="text-muted-foreground mt-1">
                  Comprehensive insights from {participation?.completed || 0} completed {terminology.completedCount}
                </p>
              </div>
            </div>

            {/* Survey Selector */}
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
            </div>

            {/* Tabs for Insights vs Comparison */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList>
                <TabsTrigger value="insights" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Insights
                </TabsTrigger>
                <TabsTrigger value="comparison" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Compare Surveys
                </TabsTrigger>
              </TabsList>

              <TabsContent value="insights" className="mt-6">
                <HybridInsightsView
                  participation={participation}
                  sentiment={sentiment}
                  themes={themes}
                  latestReport={latestReport}
                  isReportLoading={isReportLoading}
                  isGenerating={isGenerating}
                  onGenerateReport={handleGenerateReport}
                  surveyId={filters.surveyId || null}
                  surveyTitle={selectedSurvey?.title}
                  isLoading={isLoading}
                  onShareLink={handleShareLink}
                />
              </TabsContent>

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
