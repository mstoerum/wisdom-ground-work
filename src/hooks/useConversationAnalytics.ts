/**
 * Enhanced Conversation Analytics Hook
 * 
 * Provides rich analytics data from conversational feedback including:
 * - Quotes and narratives
 * - Sub-themes and sentiment drivers
 * - Cross-conversation patterns
 * - Narrative summaries
 */

import { useQuery } from "@tanstack/react-query";
import {
  fetchConversationResponses,
  fetchConversationSessions,
  extractQuotes,
  extractSubThemes,
  identifySentimentDrivers,
  findCrossConversationPatterns,
  generateNarrativeSummary,
  type ConversationResponse,
  type ConversationSession,
  type ConversationQuote,
  type ThemeInsight,
  type PatternInsight,
  type NarrativeSummary,
} from "@/lib/conversationAnalytics";
import { useAnalytics, type AnalyticsFilters } from "./useAnalytics";
import { supabase } from "@/integrations/supabase/client";

export interface EnhancedAnalyticsData {
  responses: ConversationResponse[];
  sessions: ConversationSession[];
  quotes: ConversationQuote[];
  themes: ThemeInsight[];
  patterns: PatternInsight[];
  narrative: NarrativeSummary | null;
  isLoading: boolean;
  refetch: () => void;
}

export function useConversationAnalytics(filters: AnalyticsFilters = {}): EnhancedAnalyticsData {
  // Fetch basic analytics for theme list
  const { themes: basicThemes } = useAnalytics(filters);

  // Fetch conversation responses
  const responsesQuery = useQuery({
    queryKey: ['conversation-responses', filters],
    queryFn: async () => {
      return fetchConversationResponses(
        filters.surveyId,
        filters.themeId,
        filters.startDate,
        filters.endDate
      );
    },
  });

  // Fetch conversation sessions
  const sessionsQuery = useQuery({
    queryKey: ['conversation-sessions', filters],
    queryFn: async () => {
      return fetchConversationSessions(
        filters.surveyId,
        filters.startDate,
        filters.endDate
      );
    },
  });

  // Fetch theme names
  const themesQuery = useQuery({
    queryKey: ['survey-themes', filters.surveyId],
    queryFn: async () => {
      if (!filters.surveyId) return [];
      const { data, error } = await supabase
        .from('survey_themes')
        .select('id, name')
        .eq('is_active', true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!filters.surveyId,
  });

  // Process enhanced analytics
  const enhancedDataQuery = useQuery({
    queryKey: ['enhanced-analytics', responsesQuery.data, sessionsQuery.data, basicThemes],
    queryFn: async () => {
      const responses = responsesQuery.data || [];
      const sessions = sessionsQuery.data || [];
      const themeNames = themesQuery.data || [];

      if (responses.length === 0 || sessions.length === 0) {
        return {
          quotes: [],
          themes: [],
          patterns: [],
          narrative: null,
        };
      }

      // Extract quotes
      const quotes = extractQuotes(responses, sessions);

      // Build enhanced theme insights
      const themes: ThemeInsight[] = (basicThemes || []).map(basicTheme => {
        const themeResponses = responses.filter(r => r.theme_id === basicTheme.id);
        const themeQuotes = quotes.filter(q => q.theme_id === basicTheme.id);
        
        const subThemes = extractSubThemes(responses, basicTheme.id);
        const sentimentDrivers = identifySentimentDrivers(themeResponses);
        
        // Calculate follow-up effectiveness (simplified - count responses with ai_response)
        const followUpCount = themeResponses.filter(r => r.ai_response).length;
        const followUpEffectiveness = themeResponses.length > 0 
          ? followUpCount / themeResponses.length 
          : 0;

        return {
          theme_id: basicTheme.id,
          theme_name: basicTheme.name,
          response_count: basicTheme.responseCount,
          avg_sentiment: basicTheme.avgSentiment,
          quotes: themeQuotes.slice(0, 10), // Top 10 quotes per theme
          sub_themes: subThemes,
          sentiment_drivers: sentimentDrivers.slice(0, 5), // Top 5 drivers
          follow_up_effectiveness: followUpEffectiveness,
        };
      });

      // Find cross-conversation patterns
      const patterns = findCrossConversationPatterns(responses, sessions);

      // Generate narrative summary
      const narrative = generateNarrativeSummary(responses, sessions, themes);

      return {
        quotes,
        themes,
        patterns,
        narrative,
      };
    },
    enabled: !!responsesQuery.data && !!sessionsQuery.data,
  });

  const refetch = () => {
    responsesQuery.refetch();
    sessionsQuery.refetch();
    themesQuery.refetch();
    enhancedDataQuery.refetch();
  };

  return {
    responses: responsesQuery.data || [],
    sessions: sessionsQuery.data || [],
    quotes: enhancedDataQuery.data?.quotes || [],
    themes: enhancedDataQuery.data?.themes || [],
    patterns: enhancedDataQuery.data?.patterns || [],
    narrative: enhancedDataQuery.data?.narrative || null,
    isLoading: responsesQuery.isLoading || sessionsQuery.isLoading || enhancedDataQuery.isLoading,
    refetch,
  };
}
