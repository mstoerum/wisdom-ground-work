import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSpradleyAnalytics = (surveyId: string | null) => {
  return useQuery({
    queryKey: ["spradley-analytics", surveyId],
    queryFn: async () => {
      if (!surveyId) return null;

      const { data, error } = await supabase
        .from("spradley_analytics")
        .select("*")
        .eq("survey_id", surveyId)
        .order("analyzed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!surveyId,
  });
};
