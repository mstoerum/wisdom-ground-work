import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface NarrativeInsight {
  text: string;
  confidence: number;
  evidence_ids: string[];
  category?: string;
}

export interface NarrativeChapter {
  title: string;
  key: 'pulse' | 'working' | 'warnings' | 'why' | 'forward';
  narrative: string;
  insights: NarrativeInsight[];
}

export interface NarrativeReport {
  id: string;
  survey_id: string;
  generated_at: string;
  generated_by: string;
  report_version: number;
  chapters: NarrativeChapter[];
  audience_config: { audience: 'executive' | 'manager' };
  data_snapshot: {
    total_sessions: number;
    total_responses: number;
    generated_from_analytics: boolean;
  };
  confidence_score: number;
  is_latest: boolean;
}

export const useNarrativeReports = (surveyId: string | null) => {
  const queryClient = useQueryClient();

  const { data: reports, isLoading, error } = useQuery({
    queryKey: ['narrative-reports', surveyId],
    queryFn: async () => {
      if (!surveyId) return null;

      const { data, error } = await supabase
        .from('narrative_reports')
        .select('*')
        .eq('survey_id', surveyId)
        .order('generated_at', { ascending: false });

      if (error) {
        console.error('Error fetching narrative reports:', error);
        throw error;
      }

      return data?.map(report => ({
        ...report,
        chapters: report.chapters as unknown as NarrativeChapter[],
        audience_config: report.audience_config as unknown as { audience: 'executive' | 'manager' },
        data_snapshot: report.data_snapshot as unknown as {
          total_sessions: number;
          total_responses: number;
          generated_from_analytics: boolean;
        },
        confidence_score: report.confidence_score ?? 3,
      })) as NarrativeReport[];
    },
    enabled: !!surveyId,
  });

  const generateReport = useMutation({
    mutationFn: async ({ 
      surveyId, 
      audience = 'executive' 
    }: { 
      surveyId: string; 
      audience?: 'executive' | 'manager' 
    }) => {
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'generate-narrative-report',
        {
          body: { survey_id: surveyId, audience }
        }
      );

      if (functionError) {
        throw functionError;
      }

      if (functionData?.error) {
        throw new Error(functionData.error);
      }

      return functionData;
    },
    onSuccess: (data, variables) => {
      toast.success('Story report generated successfully');
      queryClient.invalidateQueries({ queryKey: ['narrative-reports', variables.surveyId] });
    },
    onError: (error) => {
      console.error('Error generating narrative report:', error);
      toast.error('Failed to generate story report');
    },
  });

  const latestReport = reports?.find(r => r.is_latest);

  return {
    reports,
    latestReport,
    isLoading,
    error,
    generateReport: generateReport.mutate,
    isGenerating: generateReport.isPending,
  };
};
