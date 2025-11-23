import { useState } from "react";
import { HRLayout } from "@/components/hr/HRLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, GraduationCap, BarChart3, MessageSquare, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CourseMetricCards } from "@/components/hr/analytics/CourseMetricCards";
import { CourseThemeBreakdown } from "@/components/hr/analytics/CourseThemeBreakdown";
import { StudentVoiceGallery } from "@/components/hr/analytics/StudentVoiceGallery";
import { InstructorInsights } from "@/components/hr/analytics/InstructorInsights";
import { CourseTrends } from "@/components/hr/analytics/CourseTrends";
import { EmptyState } from "@/components/hr/analytics/EmptyState";

const CourseAnalytics = () => {
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>("all");

  // Fetch course evaluation surveys
  const { data: courseEvaluations, isLoading } = useQuery({
    queryKey: ['course-evaluations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('surveys')
        .select(`
          *,
          responses(*),
          conversation_sessions(*)
        `)
        .eq('survey_type', 'course_evaluation')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch responses for selected survey
  const { data: responses } = useQuery({
    queryKey: ['course-responses', selectedSurveyId],
    queryFn: async () => {
      let query = supabase
        .from('responses')
        .select(`
          *,
          conversation_sessions!inner(*),
          survey_themes(*)
        `);
      
      if (selectedSurveyId !== "all") {
        query = query.eq('survey_id', selectedSurveyId);
      } else {
        // Only include course evaluation surveys
        const surveyIds = courseEvaluations?.map(s => s.id) || [];
        if (surveyIds.length > 0) {
          query = query.in('survey_id', surveyIds);
        }
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!courseEvaluations,
  });

  const handleExportCSV = () => {
    if (!responses || responses.length === 0) {
      toast.error("No data to export");
      return;
    }

    const csvContent = [
      ['Date', 'Theme', 'Student Feedback', 'Sentiment', 'Sentiment Score'],
      ...responses.map(r => [
        new Date(r.created_at || '').toLocaleDateString(),
        (r.survey_themes as any)?.name || 'N/A',
        `"${r.content.replace(/"/g, '""')}"`,
        r.sentiment || 'N/A',
        r.sentiment_score?.toString() || 'N/A',
      ]),
    ];

    const csv = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `course-evaluation-analytics-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Course analytics exported successfully");
  };

  if (isLoading) {
    return (
      <HRLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading course analytics...</p>
          </div>
        </div>
      </HRLayout>
    );
  }

  if (!courseEvaluations || courseEvaluations.length === 0) {
    return (
      <HRLayout>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <EmptyState
            icon={GraduationCap}
            title="No Course Evaluations Yet"
            description="Create your first course evaluation survey to start gathering student feedback and insights."
            actionLabel="Create Course Evaluation"
            onAction={() => window.location.href = '/hr/create-survey'}
          />
        </div>
      </HRLayout>
    );
  }

  return (
    <HRLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <GraduationCap className="h-8 w-8 text-primary" />
                  <h1 className="text-3xl font-bold">Course Evaluation Analytics</h1>
                </div>
                <p className="text-muted-foreground">
                  Student feedback insights from {courseEvaluations.length} course evaluation{courseEvaluations.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button onClick={handleExportCSV} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>

            {/* Survey Filter */}
            <div className="flex gap-4">
              <Select value={selectedSurveyId} onValueChange={setSelectedSurveyId}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="All course evaluations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All course evaluations</SelectItem>
                  {courseEvaluations.map(survey => (
                    <SelectItem key={survey.id} value={survey.id}>
                      {survey.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Metrics Overview */}
            <CourseMetricCards 
              responses={responses || []}
              courseEvaluations={courseEvaluations}
            />

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="feedback" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Student Feedback
                </TabsTrigger>
                <TabsTrigger value="insights" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Instructor Insights
                </TabsTrigger>
                <TabsTrigger value="trends" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Trends
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <CourseThemeBreakdown responses={responses || []} />
              </TabsContent>

              <TabsContent value="feedback" className="space-y-6">
                <StudentVoiceGallery responses={responses || []} />
              </TabsContent>

              <TabsContent value="insights" className="space-y-6">
                <InstructorInsights responses={responses || []} />
              </TabsContent>

              <TabsContent value="trends" className="space-y-6">
                <CourseTrends 
                  responses={responses || []}
                  courseEvaluations={courseEvaluations}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </HRLayout>
  );
};

export default CourseAnalytics;
