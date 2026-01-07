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
import { useNarrativeReports } from "@/hooks/useNarrativeReports";
import { toast } from "sonner";

const Analytics = () => {
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  
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

            {/* Simplified View - Story Report + Theme Health */}
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
            />
          </div>
        </div>
      </div>
    </HRLayout>
  );
};

export default Analytics;
