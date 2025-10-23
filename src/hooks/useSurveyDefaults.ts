import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSurveyDefaults = () => {
  return useQuery({
    queryKey: ['survey-defaults'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('survey_defaults')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      // Return defaults if found, otherwise return fallback values
      return data || {
        consent_message: 'Your responses will be kept confidential and used to improve our workplace. We take your privacy seriously and follow strict data protection guidelines.',
        anonymization_level: 'anonymous',
        first_message: 'Hello! Thank you for taking the time to share your feedback with us. This conversation is confidential and will help us create a better workplace for everyone.',
        data_retention_days: 60,
      };
    },
  });
};
