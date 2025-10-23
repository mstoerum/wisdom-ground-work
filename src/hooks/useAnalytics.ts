import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AnalyticsFilters {
  surveyId?: string;
  startDate?: Date;
  endDate?: Date;
  department?: string;
}

export interface ParticipationMetrics {
  totalAssigned: number;
  completed: number;
  pending: number;
  completionRate: number;
  avgDuration: number;
}

export interface SentimentMetrics {
  positive: number;
  neutral: number;
  negative: number;
  avgScore: number;
  moodImprovement: number;
}

export interface ThemeInsight {
  id: string;
  name: string;
  responseCount: number;
  avgSentiment: number;
  urgencyCount: number;
}

export const useAnalytics = (filters: AnalyticsFilters = {}) => {
  const participationQuery = useQuery({
    queryKey: ['analytics-participation', filters],
    queryFn: async () => {
      let query = supabase
        .from('survey_assignments')
        .select('*');

      if (filters.surveyId) {
        query = query.eq('survey_id', filters.surveyId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const filtered = data?.filter(item => {
        if (filters.startDate && new Date(item.assigned_at) < filters.startDate) {
          return false;
        }
        if (filters.endDate && new Date(item.assigned_at) > filters.endDate) {
          return false;
        }
        return true;
      }) || [];

      const totalAssigned = filtered.length;
      const completed = filtered.filter(a => a.status === 'completed').length;
      const pending = totalAssigned - completed;
      const completionRate = totalAssigned > 0 ? (completed / totalAssigned) * 100 : 0;

      return {
        totalAssigned,
        completed,
        pending,
        completionRate,
        avgDuration: 0,
      } as ParticipationMetrics;
    },
  });

  const sentimentQuery = useQuery({
    queryKey: ['analytics-sentiment', filters],
    queryFn: async () => {
      let query = supabase
        .from('responses')
        .select('*, conversation_sessions!inner(initial_mood, final_mood, survey_id)');

      if (filters.surveyId) {
        query = query.eq('conversation_sessions.survey_id', filters.surveyId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const responses = data || [];
      
      let positive = 0, neutral = 0, negative = 0;
      let totalScore = 0;
      let moodChanges = 0;

      responses.forEach(r => {
        if (r.sentiment === 'positive') positive++;
        else if (r.sentiment === 'negative') negative++;
        else neutral++;

        if (r.sentiment_score) totalScore += Number(r.sentiment_score);

        const session = r.conversation_sessions;
        if (session?.initial_mood && session?.final_mood) {
          moodChanges += (session.final_mood - session.initial_mood);
        }
      });

      return {
        positive,
        neutral,
        negative,
        avgScore: responses.length > 0 ? totalScore / responses.length : 0,
        moodImprovement: moodChanges,
      } as SentimentMetrics;
    },
  });

  const themesQuery = useQuery({
    queryKey: ['analytics-themes', filters],
    queryFn: async () => {
      let query = supabase
        .from('responses')
        .select('theme_id, sentiment_score, urgency_escalated, survey_themes(name)');

      if (filters.surveyId) {
        query = query.eq('survey_id', filters.surveyId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const themeMap = new Map<string, ThemeInsight>();

      data?.forEach(r => {
        if (!r.theme_id || !r.survey_themes) return;

        const existing = themeMap.get(r.theme_id) || {
          id: r.theme_id,
          name: r.survey_themes.name,
          responseCount: 0,
          avgSentiment: 0,
          urgencyCount: 0,
        };

        existing.responseCount++;
        existing.avgSentiment += Number(r.sentiment_score || 0);
        if (r.urgency_escalated) existing.urgencyCount++;

        themeMap.set(r.theme_id, existing);
      });

      return Array.from(themeMap.values()).map(theme => ({
        ...theme,
        avgSentiment: theme.responseCount > 0 ? theme.avgSentiment / theme.responseCount : 0,
      }));
    },
  });

  const urgencyQuery = useQuery({
    queryKey: ['analytics-urgency', filters],
    queryFn: async () => {
      let query = supabase
        .from('escalation_log')
        .select('*, responses(content, sentiment, survey_themes(name))')
        .order('escalated_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    },
  });

  return {
    participation: participationQuery.data,
    sentiment: sentimentQuery.data,
    themes: themesQuery.data || [],
    urgency: urgencyQuery.data || [],
    isLoading: participationQuery.isLoading || sentimentQuery.isLoading || themesQuery.isLoading,
  };
};
