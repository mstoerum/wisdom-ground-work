import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSurveyAnalytics = (surveyId?: string) => {
  return useQuery({
    queryKey: ['survey-analytics', surveyId],
    queryFn: async () => {
      if (!surveyId) {
        return null;
      }

      // Fetch the most recent analytics for this survey
      const { data, error } = await supabase
        .from('survey_analytics')
        .select('*')
        .eq('survey_id', surveyId)
        .order('analyzed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching survey analytics:', error);
        throw error;
      }

      return data;
    },
    enabled: !!surveyId,
  });
};
