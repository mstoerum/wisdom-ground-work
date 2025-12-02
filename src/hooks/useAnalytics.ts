import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

/**
 * Custom hook for fetching and analyzing survey analytics with real-time updates
 * Provides participation metrics, sentiment analysis, theme insights, and urgency flags
 */

export interface AnalyticsFilters {
  surveyId?: string;
  startDate?: Date;
  endDate?: Date;
  department?: string;
  themeId?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
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
  keySignals: {
    concerns: string[];
    positives: string[];
    other: string[];
  };
}

/**
 * Filter assignment data by date range
 */
const filterByDateRange = (items: any[], filters: AnalyticsFilters) => {
  return items?.filter(item => {
    if (filters.startDate && new Date(item.assigned_at) < filters.startDate) {
      return false;
    }
    if (filters.endDate && new Date(item.assigned_at) > filters.endDate) {
      return false;
    }
    return true;
  }) || [];
};

/**
 * Calculate participation metrics from assignments
 */
const calculateParticipationMetrics = (assignments: any[]): ParticipationMetrics => {
  const totalAssigned = assignments.length;
  const completed = assignments.filter(a => a.status === 'completed').length;
  const pending = totalAssigned - completed;
  const completionRate = totalAssigned > 0 ? (completed / totalAssigned) * 100 : 0;

  return {
    totalAssigned,
    completed,
    pending,
    completionRate,
    avgDuration: 0, // Could be calculated from session data
  };
};

/**
 * Calculate sentiment metrics from responses
 */
const calculateSentimentMetrics = (responses: any[]): SentimentMetrics => {
  let positive = 0, neutral = 0, negative = 0;
  let totalScore = 0;
  let moodChanges = 0;

  responses.forEach(r => {
    // Count by sentiment type
    if (r.sentiment === 'positive') positive++;
    else if (r.sentiment === 'negative') negative++;
    else neutral++;

    // Aggregate scores - convert from 0-1 range to 0-100 range
    if (r.sentiment_score !== null && r.sentiment_score !== undefined) {
      const score = Number(r.sentiment_score);
      // If score is <= 1, it's in 0-1 range, convert to 0-100
      // If score is > 1, assume it's already in 0-100 range
      const normalizedScore = score <= 1 ? score * 100 : score;
      totalScore += normalizedScore;
    }

    // Calculate mood improvement
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
  };
};

/**
 * Truncate text to a maximum length with ellipsis
 */
const truncateText = (text: string, maxLength: number = 80): string => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Group responses by theme and calculate insights with key signals
 */
const calculateThemeInsights = (responses: any[]): ThemeInsight[] => {
  const themeMap = new Map<string, {
    id: string;
    name: string;
    responseCount: number;
    sentimentSum: number;
    urgencyCount: number;
    concerns: string[];
    positives: string[];
    other: string[];
  }>();

  responses?.forEach(r => {
    if (!r.theme_id || !r.survey_themes) return;

    const existing = themeMap.get(r.theme_id) || {
      id: r.theme_id,
      name: r.survey_themes.name,
      responseCount: 0,
      sentimentSum: 0,
      urgencyCount: 0,
      concerns: [],
      positives: [],
      other: [],
    };

    existing.responseCount++;
    
    // Convert sentiment score from 0-1 range to 0-100 range if needed
    const score = Number(r.sentiment_score || 0);
    const normalizedScore = score <= 1 ? score * 100 : score;
    existing.sentimentSum += normalizedScore;
    
    if (r.urgency_escalated) existing.urgencyCount++;

    // Group quotes by sentiment for key signals
    if (r.content && r.content.trim()) {
      const quote = truncateText(r.content);
      if (r.sentiment === 'negative') {
        existing.concerns.push(quote);
      } else if (r.sentiment === 'positive') {
        existing.positives.push(quote);
      } else {
        existing.other.push(quote);
      }
    }

    themeMap.set(r.theme_id, existing);
  });

  return Array.from(themeMap.values()).map(theme => ({
    id: theme.id,
    name: theme.name,
    responseCount: theme.responseCount,
    avgSentiment: theme.responseCount > 0 ? theme.sentimentSum / theme.responseCount : 0,
    urgencyCount: theme.urgencyCount,
    keySignals: {
      concerns: theme.concerns.slice(0, 3),
      positives: theme.positives.slice(0, 3),
      other: theme.other.slice(0, 3),
    },
  }));
};

export const useAnalytics = (filters: AnalyticsFilters = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Real-time updates subscription
  useEffect(() => {
    const channel = supabase
      .channel('analytics-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'responses' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['analytics-participation'] });
          queryClient.invalidateQueries({ queryKey: ['analytics-sentiment'] });
          queryClient.invalidateQueries({ queryKey: ['analytics-themes'] });
          toast({
            title: "New response received",
            description: "Analytics updated with latest data",
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversation_sessions' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['analytics-participation'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, toast]);

  // Fetch and calculate participation metrics
  const participationQuery = useQuery({
    queryKey: ['analytics-participation', filters],
    queryFn: async () => {
      let query = supabase
        .from('survey_assignments')
        .select('id, survey_id, status, assigned_at, completed_at');

      if (filters.surveyId) {
        query = query.eq('survey_id', filters.surveyId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const filtered = filterByDateRange(data || [], filters);
      return calculateParticipationMetrics(filtered);
    },
  });

  // Fetch and calculate sentiment metrics
  const sentimentQuery = useQuery({
    queryKey: ['analytics-sentiment', filters],
    queryFn: async () => {
      let query = supabase
        .from('responses')
        .select('sentiment, sentiment_score, conversation_sessions!inner(initial_mood, final_mood, survey_id)');

      if (filters.surveyId) {
        query = query.eq('conversation_sessions.survey_id', filters.surveyId);
      }

      if (filters.themeId) {
        query = query.eq('theme_id', filters.themeId);
      }

      if (filters.sentiment) {
        query = query.eq('sentiment', filters.sentiment);
      }

      const { data, error } = await query;
      if (error) throw error;

      return calculateSentimentMetrics(data || []);
    },
  });

  // Fetch and calculate theme insights with key signals
  const themesQuery = useQuery({
    queryKey: ['analytics-themes', filters],
    queryFn: async () => {
      let query = supabase
        .from('responses')
        .select('theme_id, sentiment_score, urgency_escalated, sentiment, content, survey_themes(name)');

      if (filters.surveyId) {
        query = query.eq('survey_id', filters.surveyId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return calculateThemeInsights(data || []);
    },
  });

  // Fetch urgency flags
  const urgencyQuery = useQuery({
    queryKey: ['analytics-urgency', filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('escalation_log')
        .select('*, responses(content, sentiment, survey_themes(name))')
        .order('escalated_at', { ascending: false });

      if (error) throw error;

      return data || [];
    },
  });

  // Refetch all analytics queries
  const refetch = async () => {
    await Promise.all([
      participationQuery.refetch(),
      sentimentQuery.refetch(),
      themesQuery.refetch(),
      urgencyQuery.refetch(),
    ]);
  };

  return {
    participation: participationQuery.data,
    sentiment: sentimentQuery.data,
    themes: themesQuery.data || [],
    urgency: urgencyQuery.data || [],
    isLoading: participationQuery.isLoading || sentimentQuery.isLoading || themesQuery.isLoading,
    refetch,
  };
};
