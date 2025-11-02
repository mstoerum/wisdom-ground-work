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
import {
  analyzeRootCauses,
  generateInterventions,
  identifyQuickWins,
  predictImpact,
  type RootCause,
  type InterventionRecommendation,
  type QuickWin,
  type ImpactPrediction,
} from "@/lib/actionableIntelligence";
import {
  calculateAggregateQuality,
  calculateSessionQuality,
  generateQualityInsights,
  type AggregateQualityMetrics,
  type ConversationQualityMetrics,
  type QualityInsight,
} from "@/lib/conversationQuality";
import {
  performNLPAnalysis,
  type NLPAnalysis,
} from "@/lib/advancedNLP";
import {
  buildCulturalMap,
  type CulturalMap,
} from "@/lib/culturalPatterns";
import { useAnalytics, type AnalyticsFilters } from "./useAnalytics";
import { supabase } from "@/integrations/supabase/client";

export interface EnhancedAnalyticsData {
  responses: ConversationResponse[];
  sessions: ConversationSession[];
  quotes: ConversationQuote[];
  themes: ThemeInsight[];
  patterns: PatternInsight[];
  narrative: NarrativeSummary | null;
  rootCauses: RootCause[];
  interventions: InterventionRecommendation[];
  quickWins: QuickWin[];
  impactPredictions: ImpactPrediction[];
  qualityMetrics: AggregateQualityMetrics | null;
  qualityInsights: QualityInsight[];
  nlpAnalysis: NLPAnalysis | null;
  culturalMap: CulturalMap | null;
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
          rootCauses: [],
          interventions: [],
          quickWins: [],
          impactPredictions: [],
          qualityMetrics: null,
          qualityInsights: [],
          nlpAnalysis: null,
          culturalMap: null,
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

      // Analyze root causes
      const rootCauses = analyzeRootCauses(themes, responses, sessions);

      // Generate interventions
      const interventions = generateInterventions(rootCauses, themes, patterns);

      // Identify quick wins
      const quickWins = identifyQuickWins(interventions, themes);

      // Predict impact
      const impactPredictions = predictImpact(interventions, themes);

      // Calculate conversation quality metrics
      const qualityMetrics = calculateAggregateQuality(sessions, responses);
      const sessionQualityMetrics = sessions.map(s => 
        calculateSessionQuality(s, responses)
      );
      const qualityInsights = generateQualityInsights(qualityMetrics, sessionQualityMetrics);

      // Perform NLP analysis
      const nlpAnalysis = performNLPAnalysis(responses);

      // Build cultural map
      const culturalMap = buildCulturalMap(responses, sessions, themes);

      return {
        quotes,
        themes,
        patterns,
        narrative,
        rootCauses,
        interventions,
        quickWins,
        impactPredictions,
        qualityMetrics,
        qualityInsights,
        nlpAnalysis,
        culturalMap,
      };
    },
    enabled: !!responsesQuery.data && !!sessionsQuery.data,
  });

  const refetch = async () => {
    await Promise.all([
      responsesQuery.refetch(),
      sessionsQuery.refetch(),
      themesQuery.refetch(),
      enhancedDataQuery.refetch(),
    ]);
  };

  return {
    responses: responsesQuery.data || [],
    sessions: sessionsQuery.data || [],
    quotes: enhancedDataQuery.data?.quotes || [],
    themes: enhancedDataQuery.data?.themes || [],
    patterns: enhancedDataQuery.data?.patterns || [],
    narrative: enhancedDataQuery.data?.narrative || null,
    rootCauses: enhancedDataQuery.data?.rootCauses || [],
    interventions: enhancedDataQuery.data?.interventions || [],
    quickWins: enhancedDataQuery.data?.quickWins || [],
    impactPredictions: enhancedDataQuery.data?.impactPredictions || [],
    qualityMetrics: enhancedDataQuery.data?.qualityMetrics || null,
    qualityInsights: enhancedDataQuery.data?.qualityInsights || [],
    nlpAnalysis: enhancedDataQuery.data?.nlpAnalysis || null,
    culturalMap: enhancedDataQuery.data?.culturalMap || null,
    isLoading: responsesQuery.isLoading || sessionsQuery.isLoading || enhancedDataQuery.isLoading,
    refetch,
  };
}
