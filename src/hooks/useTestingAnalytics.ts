import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TestingInteraction {
  id: string;
  method: string;
  duration_seconds: number;
  message_count: number;
  word_count: number;
  completed: boolean;
  sentiment_score: number;
  device_type: string;
}

interface TestingQuestionnaire {
  id: string;
  questionnaire_type: string;
  method_tested: string;
  ease_of_use_score: number;
  comfort_score: number;
  trust_score: number;
  privacy_confidence: number;
  overall_satisfaction: number;
}

interface TestingComparison {
  id: string;
  method_a: string;
  method_b: string;
  preference: string;
  time_comparison: string;
  depth_comparison: string;
  comfort_comparison: string;
}

export interface TestingAnalytics {
  sessions: {
    total: number;
    completed: number;
    byOrganizationType: Record<string, number>;
    byPersona: Record<string, number>;
  };
  interactions: {
    byMethod: Record<string, {
      count: number;
      avgDuration: number;
      avgMessageCount: number;
      avgWordCount: number;
      completionRate: number;
      avgSentiment: number;
    }>;
  };
  questionnaires: {
    byType: Record<string, {
      count: number;
      avgEaseOfUse: number;
      avgComfort: number;
      avgTrust: number;
      avgPrivacyConfidence: number;
      avgSatisfaction: number;
    }>;
  };
  comparisons: {
    preferenceDistribution: Record<string, number>;
    timeComparison: Record<string, number>;
    depthComparison: Record<string, number>;
    comfortComparison: Record<string, number>;
  };
}

export function useTestingAnalytics(filters?: {
  organizationType?: string;
  personaId?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['testing-analytics', filters],
    queryFn: async (): Promise<TestingAnalytics> => {
      // Fetch sessions
      let sessionsQuery = supabase
        .from('testing_sessions')
        .select('*');

      if (filters?.organizationType) {
        sessionsQuery = sessionsQuery.eq('organization_type', filters.organizationType);
      }
      if (filters?.personaId) {
        sessionsQuery = sessionsQuery.eq('persona_id', filters.personaId);
      }
      if (filters?.startDate) {
        sessionsQuery = sessionsQuery.gte('created_at', filters.startDate);
      }
      if (filters?.endDate) {
        sessionsQuery = sessionsQuery.lte('created_at', filters.endDate);
      }

      const { data: sessions } = await sessionsQuery;

      // Fetch interactions
      const sessionIds = sessions?.map(s => s.id) || [];
      const { data: interactions } = await supabase
        .from('testing_interactions')
        .select('*')
        .in('testing_session_id', sessionIds);

      // Fetch questionnaires
      const { data: questionnaires } = await supabase
        .from('testing_questionnaires')
        .select('*')
        .in('testing_session_id', sessionIds);

      // Fetch comparisons
      const { data: comparisons } = await supabase
        .from('testing_comparisons')
        .select('*')
        .in('testing_session_id', sessionIds);

      // Process analytics
      const analytics: TestingAnalytics = {
        sessions: {
          total: sessions?.length || 0,
          completed: sessions?.filter(s => s.status === 'completed').length || 0,
          byOrganizationType: {},
          byPersona: {},
        },
        interactions: {
          byMethod: {},
        },
        questionnaires: {
          byType: {},
        },
        comparisons: {
          preferenceDistribution: {},
          timeComparison: {},
          depthComparison: {},
          comfortComparison: {},
        },
      };

      // Process sessions
      sessions?.forEach(session => {
        analytics.sessions.byOrganizationType[session.organization_type] =
          (analytics.sessions.byOrganizationType[session.organization_type] || 0) + 1;
        analytics.sessions.byPersona[session.persona_id] =
          (analytics.sessions.byPersona[session.persona_id] || 0) + 1;
      });

      // Process interactions
      const methods = ['traditional_survey', 'chat', 'voice'];
      methods.forEach(method => {
        const methodInteractions = interactions?.filter(i => i.method === method) || [];
        if (methodInteractions.length > 0) {
          analytics.interactions.byMethod[method] = {
            count: methodInteractions.length,
            avgDuration: methodInteractions.reduce((sum, i) => sum + (i.duration_seconds || 0), 0) / methodInteractions.length,
            avgMessageCount: methodInteractions.reduce((sum, i) => sum + (i.message_count || 0), 0) / methodInteractions.length,
            avgWordCount: methodInteractions.reduce((sum, i) => sum + (i.word_count || 0), 0) / methodInteractions.length,
            completionRate: methodInteractions.filter(i => i.completed).length / methodInteractions.length * 100,
            avgSentiment: methodInteractions.reduce((sum, i) => sum + (i.sentiment_score || 0), 0) / methodInteractions.length,
          };
        }
      });

      // Process questionnaires
      const questionnaireTypes = ['pre_interaction', 'post_interaction', 'comparison', 'final_reflection'];
      questionnaireTypes.forEach(type => {
        const typeQuestionnaires = questionnaires?.filter(q => q.questionnaire_type === type) || [];
        if (typeQuestionnaires.length > 0) {
          analytics.questionnaires.byType[type] = {
            count: typeQuestionnaires.length,
            avgEaseOfUse: typeQuestionnaires.reduce((sum, q) => sum + (q.ease_of_use_score || 0), 0) / typeQuestionnaires.length,
            avgComfort: typeQuestionnaires.reduce((sum, q) => sum + (q.comfort_score || 0), 0) / typeQuestionnaires.length,
            avgTrust: typeQuestionnaires.reduce((sum, q) => sum + (q.trust_score || 0), 0) / typeQuestionnaires.length,
            avgPrivacyConfidence: typeQuestionnaires.reduce((sum, q) => sum + (q.privacy_confidence || 0), 0) / typeQuestionnaires.length,
            avgSatisfaction: typeQuestionnaires.reduce((sum, q) => sum + (q.overall_satisfaction || 0), 0) / typeQuestionnaires.length,
          };
        }
      });

      // Process comparisons
      comparisons?.forEach(comparison => {
        analytics.comparisons.preferenceDistribution[comparison.preference] =
          (analytics.comparisons.preferenceDistribution[comparison.preference] || 0) + 1;
        analytics.comparisons.timeComparison[comparison.time_comparison] =
          (analytics.comparisons.timeComparison[comparison.time_comparison] || 0) + 1;
        analytics.comparisons.depthComparison[comparison.depth_comparison] =
          (analytics.comparisons.depthComparison[comparison.depth_comparison] || 0) + 1;
        analytics.comparisons.comfortComparison[comparison.comfort_comparison] =
          (analytics.comparisons.comfortComparison[comparison.comfort_comparison] || 0) + 1;
      });

      return analytics;
    },
  });
}

export function useTestingInteractionTracker(sessionId: string, method: string) {
  return useMutation({
    mutationFn: async (data: {
      startedAt?: Date;
      completedAt?: Date;
      messageCount?: number;
      wordCount?: number;
      completed?: boolean;
      errorCount?: number;
      deviceType?: string;
      browser?: string;
      location?: string;
      conversationSessionId?: string;
    }) => {
      const { data: interaction, error: fetchError } = await supabase
        .from('testing_interactions')
        .select('*')
        .eq('testing_session_id', sessionId)
        .eq('method', method)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "not found" - that's okay, we'll create
        throw fetchError;
      }

      if (interaction) {
        // Update existing
        const { error } = await supabase
          .from('testing_interactions')
          .update({
            ...data,
            started_at: data.startedAt?.toISOString(),
            completed_at: data.completedAt?.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', interaction.id);

        if (error) throw error;
        return interaction.id;
      } else {
        // Create new
        const { data: newInteraction, error } = await supabase
          .from('testing_interactions')
          .insert({
            testing_session_id: sessionId,
            method,
            started_at: data.startedAt?.toISOString(),
            completed_at: data.completedAt?.toISOString(),
            message_count: data.messageCount || 0,
            word_count: data.wordCount || 0,
            completed: data.completed || false,
            error_count: data.errorCount || 0,
            device_type: data.deviceType || 'desktop',
            browser: data.browser || 'unknown',
            location: data.location || 'unknown',
            conversation_session_id: data.conversationSessionId || null,
          })
          .select()
          .single();

        if (error) throw error;
        return newInteraction.id;
      }
    },
  });
}
