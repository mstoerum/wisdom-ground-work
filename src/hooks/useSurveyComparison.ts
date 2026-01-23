import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SurveyMetrics {
  surveyId: string;
  surveyTitle: string;
  participationRate: number;
  completedCount: number;
  totalAssigned: number;
  avgSentiment: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  responseCount: number;
  createdAt: Date;
}

interface ComparisonMetric {
  label: string;
  values: { surveyId: string; value: number; formatted: string }[];
  change?: number; // Delta between first two surveys
  trend?: 'up' | 'down' | 'stable';
}

interface SurveyComparisonData {
  surveys: SurveyMetrics[];
  metrics: ComparisonMetric[];
  isLoading: boolean;
  error: Error | null;
}

export function useSurveyComparison(surveyIds: string[]): SurveyComparisonData {
  const query = useQuery({
    queryKey: ['survey-comparison', surveyIds],
    queryFn: async () => {
      if (surveyIds.length === 0) return [];

      // Fetch survey details
      const { data: surveys, error: surveysError } = await supabase
        .from('surveys')
        .select('id, title, created_at')
        .in('id', surveyIds);

      if (surveysError) throw surveysError;

      // Fetch responses for sentiment analysis
      const { data: responses, error: responsesError } = await supabase
        .from('responses')
        .select('survey_id, sentiment, sentiment_score')
        .in('survey_id', surveyIds);

      if (responsesError) throw responsesError;

      // Fetch assignments for participation
      const { data: assignments, error: assignmentsError } = await supabase
        .from('survey_assignments')
        .select('survey_id, status')
        .in('survey_id', surveyIds);

      if (assignmentsError) throw assignmentsError;

      // Fetch session counts
      const { data: sessions, error: sessionsError } = await supabase
        .from('conversation_sessions')
        .select('survey_id, status')
        .in('survey_id', surveyIds);

      if (sessionsError) throw sessionsError;

      // Calculate metrics for each survey
      const metricsMap: Record<string, SurveyMetrics> = {};

      surveys?.forEach(survey => {
        const surveyResponses = responses?.filter(r => r.survey_id === survey.id) || [];
        const surveyAssignments = assignments?.filter(a => a.survey_id === survey.id) || [];
        const surveySessions = sessions?.filter(s => s.survey_id === survey.id) || [];

        const completedAssignments = surveyAssignments.filter(a => a.status === 'completed').length;
        const completedSessions = surveySessions.filter(s => s.status === 'completed').length;
        const totalAssigned = surveyAssignments.length || completedSessions || 1;

        const sentimentScores = surveyResponses
          .map(r => r.sentiment_score)
          .filter((s): s is number => s !== null);

        const avgSentiment = sentimentScores.length > 0
          ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length
          : 0;

        // Normalize sentiment to 0-100 scale
        const normalizedSentiment = avgSentiment <= 1 ? avgSentiment * 100 : avgSentiment;

        metricsMap[survey.id] = {
          surveyId: survey.id,
          surveyTitle: survey.title,
          participationRate: (completedSessions / totalAssigned) * 100,
          completedCount: completedSessions,
          totalAssigned,
          avgSentiment: normalizedSentiment,
          positiveCount: surveyResponses.filter(r => r.sentiment === 'positive').length,
          negativeCount: surveyResponses.filter(r => r.sentiment === 'negative').length,
          neutralCount: surveyResponses.filter(r => r.sentiment === 'neutral').length,
          responseCount: surveyResponses.length,
          createdAt: new Date(survey.created_at!),
        };
      });

      return surveyIds.map(id => metricsMap[id]).filter(Boolean);
    },
    enabled: surveyIds.length > 0,
  });

  // Calculate comparison metrics
  const metrics: ComparisonMetric[] = [];
  const surveys = query.data || [];

  if (surveys.length >= 1) {
    // Participation Rate
    metrics.push({
      label: 'Participation Rate',
      values: surveys.map(s => ({
        surveyId: s.surveyId,
        value: s.participationRate,
        formatted: `${Math.round(s.participationRate)}%`,
      })),
      change: surveys.length >= 2 
        ? surveys[0].participationRate - surveys[1].participationRate 
        : undefined,
      trend: surveys.length >= 2
        ? surveys[0].participationRate > surveys[1].participationRate ? 'up'
          : surveys[0].participationRate < surveys[1].participationRate ? 'down'
          : 'stable'
        : undefined,
    });

    // Sentiment Score
    metrics.push({
      label: 'Sentiment Score',
      values: surveys.map(s => ({
        surveyId: s.surveyId,
        value: s.avgSentiment,
        formatted: Math.round(s.avgSentiment).toString(),
      })),
      change: surveys.length >= 2
        ? surveys[0].avgSentiment - surveys[1].avgSentiment
        : undefined,
      trend: surveys.length >= 2
        ? surveys[0].avgSentiment > surveys[1].avgSentiment ? 'up'
          : surveys[0].avgSentiment < surveys[1].avgSentiment ? 'down'
          : 'stable'
        : undefined,
    });

    // Response Count
    metrics.push({
      label: 'Responses',
      values: surveys.map(s => ({
        surveyId: s.surveyId,
        value: s.responseCount,
        formatted: s.responseCount.toString(),
      })),
      change: surveys.length >= 2
        ? surveys[0].responseCount - surveys[1].responseCount
        : undefined,
      trend: surveys.length >= 2
        ? surveys[0].responseCount > surveys[1].responseCount ? 'up'
          : surveys[0].responseCount < surveys[1].responseCount ? 'down'
          : 'stable'
        : undefined,
    });

    // Completed Sessions
    metrics.push({
      label: 'Completed',
      values: surveys.map(s => ({
        surveyId: s.surveyId,
        value: s.completedCount,
        formatted: s.completedCount.toString(),
      })),
      change: surveys.length >= 2
        ? surveys[0].completedCount - surveys[1].completedCount
        : undefined,
      trend: surveys.length >= 2
        ? surveys[0].completedCount > surveys[1].completedCount ? 'up'
          : surveys[0].completedCount < surveys[1].completedCount ? 'down'
          : 'stable'
        : undefined,
    });
  }

  return {
    surveys,
    metrics,
    isLoading: query.isLoading,
    error: query.error as Error | null,
  };
}
