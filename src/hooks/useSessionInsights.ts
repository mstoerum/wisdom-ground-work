import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSessionInsights = (surveyId?: string) => {
  return useQuery({
    queryKey: ['session-insights', surveyId],
    queryFn: async () => {
      if (!surveyId) {
        return [];
      }

      // Fetch insights joined with sessions
      const { data, error } = await supabase
        .from('session_insights')
        .select(`
          *,
          conversation_sessions!inner (
            id,
            survey_id,
            started_at,
            ended_at,
            initial_mood,
            final_mood
          )
        `)
        .eq('conversation_sessions.survey_id', surveyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching session insights:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!surveyId,
  });
};
