import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EnhancedAnalytics {
  emotionalInsights: {
    dominantTones: Array<{ tone: string; count: number; percentage: number }>;
    emotionalJourney: Array<{ date: string; avgScore: number; dominantTone: string }>;
    urgencyTrends: Array<{ level: string; count: number; trend: 'up' | 'down' | 'stable' }>;
  };
  conversationQuality: {
    avgDepth: number;
    completionRate: number;
    engagementScore: number;
    responseQuality: 'high' | 'medium' | 'low';
  };
  culturalInsights: {
    trustIndicators: Array<{ indicator: string; score: number; trend: string }>;
    psychologicalSafety: number;
    communicationPatterns: Array<{ pattern: string; frequency: number }>;
  };
  predictiveInsights: {
    retentionRisk: number;
    engagementForecast: 'improving' | 'stable' | 'declining';
    interventionNeeded: boolean;
    recommendedActions: string[];
  };
}

export const useEnhancedAnalytics = (filters: {
  surveyId?: string;
  startDate?: Date;
  endDate?: Date;
  department?: string;
} = {}) => {
  return useQuery({
    queryKey: ['enhanced-analytics', filters],
    queryFn: async (): Promise<EnhancedAnalytics> => {
      // Build query filters
      let query = supabase
        .from('responses')
        .select(`
          *,
          conversation_sessions!inner(
            surveys!inner(*),
            profiles!inner(department, full_name)
          )
        `);

      if (filters.surveyId) {
        query = query.eq('survey_id', filters.surveyId);
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }

      if (filters.department) {
        query = query.eq('conversation_sessions.profiles.department', filters.department);
      }

      const { data: responses, error } = await query;

      if (error) throw error;

      // Process emotional insights
      const emotionalTones = responses?.map(r => r.ai_analysis?.emotionalTone).filter(Boolean) || [];
      const toneCounts = emotionalTones.reduce((acc, tone) => {
        acc[tone] = (acc[tone] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const totalResponses = emotionalTones.length;
      const dominantTones = Object.entries(toneCounts)
        .map(([tone, count]) => ({
          tone,
          count,
          percentage: Math.round((count / totalResponses) * 100)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate emotional journey over time
      const responsesByDate = responses?.reduce((acc, response) => {
        const date = new Date(response.created_at).toISOString().split('T')[0];
        if (!acc[date]) acc[date] = [];
        acc[date].push(response);
        return acc;
      }, {} as Record<string, any[]>) || {};

      const emotionalJourney = Object.entries(responsesByDate)
        .map(([date, dayResponses]) => {
          const avgScore = dayResponses.reduce((sum, r) => sum + (r.sentiment_score || 50), 0) / dayResponses.length;
          const tones = dayResponses.map(r => r.ai_analysis?.emotionalTone).filter(Boolean);
          const dominantTone = tones.reduce((acc, tone) => {
            acc[tone] = (acc[tone] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          const mostCommonTone = Object.entries(dominantTone).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
          
          return {
            date,
            avgScore: Math.round(avgScore),
            dominantTone: mostCommonTone
          };
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Analyze urgency trends
      const urgencyLevels = responses?.map(r => r.ai_analysis?.urgencyLevel).filter(Boolean) || [];
      const urgencyCounts = urgencyLevels.reduce((acc, level) => {
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const urgencyTrends = Object.entries(urgencyCounts)
        .map(([level, count]) => ({
          level,
          count,
          trend: 'stable' as const // Could be enhanced with historical comparison
        }))
        .sort((a, b) => b.count - a.count);

      // Calculate conversation quality metrics
      const conversationDepths = responses?.map(r => r.ai_analysis?.conversationDepth || 0) || [];
      const avgDepth = conversationDepths.length > 0 
        ? conversationDepths.reduce((sum, depth) => sum + depth, 0) / conversationDepths.length 
        : 0;

      const completionRate = responses?.filter(r => r.ai_analysis?.responseQuality === 'high').length || 0;
      const totalResponses = responses?.length || 1;
      const qualityPercentage = Math.round((completionRate / totalResponses) * 100);

      const engagementScore = Math.round(
        (avgDepth * 0.4) + 
        (qualityPercentage * 0.3) + 
        (dominantTones.find(t => t.tone === 'excited' || t.tone === 'satisfied')?.percentage || 0) * 0.3
      );

      // Calculate cultural insights
      const trustIndicators = [
        {
          indicator: 'Open Communication',
          score: Math.min(100, engagementScore + 10),
          trend: 'improving'
        },
        {
          indicator: 'Psychological Safety',
          score: Math.min(100, 85 - (urgencyTrends.find(u => u.level === 'high' || u.level === 'critical')?.count || 0) * 5),
          trend: 'stable'
        },
        {
          indicator: 'Feedback Quality',
          score: qualityPercentage,
          trend: 'improving'
        }
      ];

      const psychologicalSafety = Math.max(0, 100 - (urgencyTrends.find(u => u.level === 'critical')?.count || 0) * 20);

      // Generate predictive insights
      const avgSentiment = responses?.reduce((sum, r) => sum + (r.sentiment_score || 50), 0) / (responses?.length || 1) || 50;
      const retentionRisk = Math.max(0, 100 - avgSentiment - (psychologicalSafety * 0.3));
      
      const engagementForecast = avgSentiment > 70 ? 'improving' : 
                                avgSentiment > 50 ? 'stable' : 'declining';

      const interventionNeeded = retentionRisk > 60 || psychologicalSafety < 40 || urgencyTrends.some(u => u.level === 'critical');

      const recommendedActions = [];
      if (retentionRisk > 60) recommendedActions.push('Conduct retention interviews with at-risk employees');
      if (psychologicalSafety < 40) recommendedActions.push('Implement psychological safety training');
      if (urgencyTrends.some(u => u.level === 'critical')) recommendedActions.push('Address urgent employee concerns immediately');
      if (engagementScore < 60) recommendedActions.push('Enhance employee engagement initiatives');

      return {
        emotionalInsights: {
          dominantTones,
          emotionalJourney,
          urgencyTrends
        },
        conversationQuality: {
          avgDepth: Math.round(avgDepth * 10) / 10,
          completionRate: qualityPercentage,
          engagementScore,
          responseQuality: qualityPercentage > 80 ? 'high' : qualityPercentage > 60 ? 'medium' : 'low'
        },
        culturalInsights: {
          trustIndicators,
          psychologicalSafety: Math.round(psychologicalSafety),
          communicationPatterns: [
            { pattern: 'Direct Communication', frequency: Math.round(avgDepth * 10) },
            { pattern: 'Emotional Expression', frequency: dominantTones.length },
            { pattern: 'Constructive Feedback', frequency: qualityPercentage }
          ]
        },
        predictiveInsights: {
          retentionRisk: Math.round(retentionRisk),
          engagementForecast,
          interventionNeeded,
          recommendedActions
        }
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};