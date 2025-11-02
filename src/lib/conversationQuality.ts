/**
 * Conversation Quality Metrics Library
 * 
 * Measures conversation effectiveness, depth, and quality.
 * Provides confidence scores for analytics based on conversation quality.
 * Critical insight: Analytics are only as good as the input quality.
 */

import {
  ConversationResponse,
  ConversationSession,
  ThemeInsight,
} from "./conversationAnalytics";

export interface ConversationQualityMetrics {
  session_id: string;
  survey_id: string;
  
  // Basic Metrics
  total_exchanges: number;
  conversation_duration_minutes: number;
  completion_status: 'completed' | 'abandoned' | 'active';
  
  // Depth Metrics
  average_response_length: number;
  longest_response_length: number;
  shortest_response_length: number;
  follow_up_count: number;
  themes_explored: number;
  
  // Engagement Metrics
  response_rate: number; // Responses / Expected responses
  elaboration_score: number; // 0-100, how detailed responses are
  openness_score: number; // 0-100, how open employee was
  
  // Quality Indicators
  has_initial_mood: boolean;
  has_final_mood: boolean;
  mood_improvement: number;
  sentiment_consistency: number; // How consistent sentiment is across responses
  
  // Follow-up Effectiveness
  follow_up_effectiveness: number; // 0-100, how well follow-ups worked
  ai_question_quality: number; // 0-100, quality of AI questions
  
  // Content Quality
  meaningful_responses: number; // Responses with substantial content
  generic_responses: number; // Short, generic responses
  content_richness: number; // 0-100, overall content quality
  
  // Overall Quality Score
  overall_quality_score: number; // 0-100, composite score
  confidence_level: 'high' | 'medium' | 'low'; // Analytics confidence
  confidence_score: number; // 0-100, specific confidence score
}

export interface AggregateQualityMetrics {
  total_sessions: number;
  completed_sessions: number;
  average_quality_score: number;
  average_confidence_score: number;
  
  // Distribution
  high_confidence_count: number;
  medium_confidence_count: number;
  low_confidence_count: number;
  
  // Quality Distribution
  excellent_quality: number; // 80-100
  good_quality: number; // 60-79
  fair_quality: number; // 40-59
  poor_quality: number; // 0-39
  
  // Key Metrics
  average_exchanges: number;
  average_duration: number;
  average_themes_explored: number;
  average_follow_up_effectiveness: number;
  
  // Confidence Indicators
  confidence_factors: {
    high_depth_sessions: number;
    high_engagement_sessions: number;
    completed_sessions: number;
    mood_tracked_sessions: number;
  };
}

export interface QualityInsight {
  type: 'strength' | 'concern' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  affected_sessions: number;
  recommendation?: string;
}

/**
 * Calculate quality metrics for a single conversation session
 */
export function calculateSessionQuality(
  session: ConversationSession,
  responses: ConversationResponse[]
): ConversationQualityMetrics {
  const sessionResponses = responses.filter(r => r.conversation_session_id === session.id);
  
  // Basic Metrics
  const totalExchanges = sessionResponses.length;
  const duration = session.ended_at && session.started_at
    ? (new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / (1000 * 60)
    : 0;
  
  // Depth Metrics
  const responseLengths = sessionResponses
    .map(r => r.content.length)
    .filter(len => len > 0);
  
  const averageResponseLength = responseLengths.length > 0
    ? responseLengths.reduce((sum, len) => sum + len, 0) / responseLengths.length
    : 0;
  
  const longestResponse = Math.max(...responseLengths, 0);
  const shortestResponse = Math.min(...responseLengths, Infinity) || 0;
  
  const followUpCount = sessionResponses.filter(r => r.ai_response).length;
  const themesExplored = new Set(sessionResponses.map(r => r.theme_id).filter(Boolean)).size;
  
  // Engagement Metrics
  const expectedResponses = themesExplored * 2 + 2; // Estimate based on themes
  const responseRate = expectedResponses > 0 ? (totalExchanges / expectedResponses) * 100 : 0;
  
  // Elaboration Score: Based on response length and detail
  const elaborationScore = Math.min(100, (averageResponseLength / 200) * 100); // 200 chars = 100 score
  
  // Openness Score: Based on sentiment variance and response depth
  // Convert sentiment scores from 0-1 range to 0-100 range if needed
  const sentimentScores = sessionResponses
    .map(r => r.sentiment_score)
    .filter((s): s is number => s !== null)
    .map(s => s <= 1 ? s * 100 : s); // Normalize to 0-100 range
  
  const sentimentVariance = sentimentScores.length > 1
    ? Math.sqrt(
        sentimentScores.reduce((sum, s) => {
          const avg = sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length;
          return sum + Math.pow(s - avg, 2);
        }, 0) / sentimentScores.length
      )
    : 0;
  
  const opennessScore = Math.min(100, sentimentVariance * 2 + elaborationScore * 0.5);
  
  // Quality Indicators
  const hasInitialMood = session.initial_mood !== null;
  const hasFinalMood = session.final_mood !== null;
  const moodImprovement = hasInitialMood && hasFinalMood
    ? (session.final_mood || 0) - (session.initial_mood || 0)
    : 0;
  
  // Sentiment Consistency: Lower variance = more consistent
  const sentimentConsistency = sentimentScores.length > 1
    ? Math.max(0, 100 - (sentimentVariance * 10))
    : 50; // Neutral if no data
  
  // Follow-up Effectiveness
  // Measured by: Do follow-up questions lead to longer/more detailed responses?
  const responsesWithFollowUp = sessionResponses.filter((r, idx) => {
    if (idx === 0) return false;
    return sessionResponses[idx - 1].ai_response !== null;
  });
  
  const avgResponseAfterFollowUp = responsesWithFollowUp.length > 0
    ? responsesWithFollowUp.reduce((sum, r) => sum + r.content.length, 0) / responsesWithFollowUp.length
    : 0;
  
  const avgResponseWithoutFollowUp = sessionResponses.length > responsesWithFollowUp.length
    ? sessionResponses
        .filter((r, idx) => {
          if (idx === 0) return true;
          return sessionResponses[idx - 1].ai_response === null;
        })
        .reduce((sum, r) => sum + r.content.length, 0) / 
      Math.max(1, sessionResponses.length - responsesWithFollowUp.length)
    : 0;
  
  const followUpEffectiveness = avgResponseWithoutFollowUp > 0
    ? Math.min(100, (avgResponseAfterFollowUp / avgResponseWithoutFollowUp) * 100)
    : avgResponseAfterFollowUp > 50 ? 75 : 50;
  
  // AI Question Quality: Based on whether questions led to substantial responses
  const aiQuestionQuality = followUpEffectiveness; // Simplified
  
  // Content Quality
  const meaningfulThreshold = 50; // Characters
  const meaningfulResponses = sessionResponses.filter(r => r.content.length >= meaningfulThreshold).length;
  const genericResponses = sessionResponses.filter(r => r.content.length < meaningfulThreshold).length;
  
  const contentRichness = totalExchanges > 0
    ? (meaningfulResponses / totalExchanges) * 100
    : 0;
  
  // Overall Quality Score (weighted composite)
  const qualityComponents = {
    depth: (themesExplored / 5) * 20, // Max 5 themes = 20 points
    engagement: (responseRate / 100) * 20, // Max 100% = 20 points
    elaboration: (elaborationScore / 100) * 20, // Max 100 = 20 points
    followUp: (followUpEffectiveness / 100) * 15, // Max 100 = 15 points
    content: (contentRichness / 100) * 15, // Max 100 = 15 points
    moodTracking: (hasInitialMood && hasFinalMood ? 10 : 0), // 10 points
  };
  
  const overallQualityScore = Math.min(100,
    qualityComponents.depth +
    qualityComponents.engagement +
    qualityComponents.elaboration +
    qualityComponents.followUp +
    qualityComponents.content +
    qualityComponents.moodTracking
  );
  
  // Confidence Score
  // Based on: quality score, completion, depth, engagement
  const confidenceFactors = {
    quality: overallQualityScore * 0.4, // 40% weight
    completion: session.status === 'completed' ? 20 : 0, // 20% weight
    depth: (themesExplored >= 3 ? 20 : themesExplored * 6.67), // 20% weight
    engagement: Math.min(20, (totalExchanges / 10) * 20), // 20% weight (10+ exchanges = full points)
  };
  
  const confidenceScore = Math.min(100,
    confidenceFactors.quality +
    confidenceFactors.completion +
    confidenceFactors.depth +
    confidenceFactors.engagement
  );
  
  const confidenceLevel: 'high' | 'medium' | 'low' =
    confidenceScore >= 75 ? 'high' :
    confidenceScore >= 50 ? 'medium' : 'low';
  
  return {
    session_id: session.id,
    survey_id: session.survey_id,
    total_exchanges: totalExchanges,
    conversation_duration_minutes: Math.round(duration),
    completion_status: session.status as 'completed' | 'abandoned' | 'active',
    average_response_length: Math.round(averageResponseLength),
    longest_response_length: longestResponse,
    shortest_response_length: shortestResponse,
    follow_up_count: followUpCount,
    themes_explored: themesExplored,
    response_rate: Math.round(responseRate),
    elaboration_score: Math.round(elaborationScore),
    openness_score: Math.round(opennessScore),
    has_initial_mood: hasInitialMood,
    has_final_mood: hasFinalMood,
    mood_improvement: moodImprovement,
    sentiment_consistency: Math.round(sentimentConsistency),
    follow_up_effectiveness: Math.round(followUpEffectiveness),
    ai_question_quality: Math.round(aiQuestionQuality),
    meaningful_responses: meaningfulResponses,
    generic_responses: genericResponses,
    content_richness: Math.round(contentRichness),
    overall_quality_score: Math.round(overallQualityScore),
    confidence_level: confidenceLevel,
    confidence_score: Math.round(confidenceScore),
  };
}

/**
 * Calculate aggregate quality metrics across all sessions
 */
export function calculateAggregateQuality(
  sessions: ConversationSession[],
  responses: ConversationResponse[]
): AggregateQualityMetrics {
  const qualityMetrics = sessions.map(session =>
    calculateSessionQuality(session, responses)
  );
  
  const completedSessions = qualityMetrics.filter(m => m.completion_status === 'completed');
  
  const averageQualityScore = qualityMetrics.length > 0
    ? qualityMetrics.reduce((sum, m) => sum + m.overall_quality_score, 0) / qualityMetrics.length
    : 0;
  
  const averageConfidenceScore = qualityMetrics.length > 0
    ? qualityMetrics.reduce((sum, m) => sum + m.confidence_score, 0) / qualityMetrics.length
    : 0;
  
  const highConfidenceCount = qualityMetrics.filter(m => m.confidence_level === 'high').length;
  const mediumConfidenceCount = qualityMetrics.filter(m => m.confidence_level === 'medium').length;
  const lowConfidenceCount = qualityMetrics.filter(m => m.confidence_level === 'low').length;
  
  const excellentQuality = qualityMetrics.filter(m => m.overall_quality_score >= 80).length;
  const goodQuality = qualityMetrics.filter(m => m.overall_quality_score >= 60 && m.overall_quality_score < 80).length;
  const fairQuality = qualityMetrics.filter(m => m.overall_quality_score >= 40 && m.overall_quality_score < 60).length;
  const poorQuality = qualityMetrics.filter(m => m.overall_quality_score < 40).length;
  
  const averageExchanges = qualityMetrics.length > 0
    ? qualityMetrics.reduce((sum, m) => sum + m.total_exchanges, 0) / qualityMetrics.length
    : 0;
  
  const averageDuration = qualityMetrics.length > 0
    ? qualityMetrics.reduce((sum, m) => sum + m.conversation_duration_minutes, 0) / qualityMetrics.length
    : 0;
  
  const averageThemesExplored = qualityMetrics.length > 0
    ? qualityMetrics.reduce((sum, m) => sum + m.themes_explored, 0) / qualityMetrics.length
    : 0;
  
  const averageFollowUpEffectiveness = qualityMetrics.length > 0
    ? qualityMetrics.reduce((sum, m) => sum + m.follow_up_effectiveness, 0) / qualityMetrics.length
    : 0;
  
  return {
    total_sessions: sessions.length,
    completed_sessions: completedSessions.length,
    average_quality_score: Math.round(averageQualityScore),
    average_confidence_score: Math.round(averageConfidenceScore),
    high_confidence_count: highConfidenceCount,
    medium_confidence_count: mediumConfidenceCount,
    low_confidence_count: lowConfidenceCount,
    excellent_quality: excellentQuality,
    good_quality: goodQuality,
    fair_quality: fairQuality,
    poor_quality: poorQuality,
    average_exchanges: Math.round(averageExchanges * 10) / 10,
    average_duration: Math.round(averageDuration * 10) / 10,
    average_themes_explored: Math.round(averageThemesExplored * 10) / 10,
    average_follow_up_effectiveness: Math.round(averageFollowUpEffectiveness),
    confidence_factors: {
      high_depth_sessions: qualityMetrics.filter(m => m.themes_explored >= 3).length,
      high_engagement_sessions: qualityMetrics.filter(m => m.total_exchanges >= 8).length,
      completed_sessions: completedSessions.length,
      mood_tracked_sessions: qualityMetrics.filter(m => m.has_initial_mood && m.has_final_mood).length,
    },
  };
}

/**
 * Generate quality insights and recommendations
 */
export function generateQualityInsights(
  aggregateMetrics: AggregateQualityMetrics,
  qualityMetrics: ConversationQualityMetrics[]
): QualityInsight[] {
  const insights: QualityInsight[] = [];
  
  // Confidence Analysis
  const lowConfidencePercentage = (aggregateMetrics.low_confidence_count / aggregateMetrics.total_sessions) * 100;
  
  if (lowConfidencePercentage > 30) {
    insights.push({
      type: 'concern',
      title: 'Low Confidence in Analytics',
      description: `${Math.round(lowConfidencePercentage)}% of conversations have low confidence scores. Analytics may not be reliable.`,
      impact: 'high',
      affected_sessions: aggregateMetrics.low_confidence_count,
      recommendation: 'Focus on improving conversation quality: encourage longer responses, ensure completion, explore more themes.',
    });
  } else if (aggregateMetrics.average_confidence_score >= 75) {
    insights.push({
      type: 'strength',
      title: 'High Confidence Analytics',
      description: `Average confidence score of ${aggregateMetrics.average_confidence_score}/100 indicates reliable analytics.`,
      impact: 'high',
      affected_sessions: aggregateMetrics.total_sessions,
    });
  }
  
  // Completion Rate
  const completionRate = (aggregateMetrics.completed_sessions / aggregateMetrics.total_sessions) * 100;
  
  if (completionRate < 70) {
    insights.push({
      type: 'concern',
      title: 'Low Completion Rate',
      description: `Only ${Math.round(completionRate)}% of conversations were completed. This reduces data quality.`,
      impact: 'medium',
      affected_sessions: aggregateMetrics.total_sessions - aggregateMetrics.completed_sessions,
      recommendation: 'Consider shorter conversations, better engagement strategies, or reminder systems.',
    });
  }
  
  // Depth Analysis
  if (aggregateMetrics.average_themes_explored < 2) {
    insights.push({
      type: 'concern',
      title: 'Shallow Conversations',
      description: `Average of ${aggregateMetrics.average_themes_explored.toFixed(1)} themes explored per conversation. Deeper exploration provides better insights.`,
      impact: 'medium',
      affected_sessions: aggregateMetrics.total_sessions,
      recommendation: 'Improve AI follow-up questions to explore more themes naturally.',
    });
  }
  
  // Follow-up Effectiveness
  if (aggregateMetrics.average_follow_up_effectiveness < 60) {
    insights.push({
      type: 'concern',
      title: 'Follow-up Questions Need Improvement',
      description: `Follow-up effectiveness of ${aggregateMetrics.average_follow_up_effectiveness}% suggests questions aren't uncovering deeper insights.`,
      impact: 'medium',
      affected_sessions: aggregateMetrics.total_sessions,
      recommendation: 'Review and improve AI follow-up question prompts to encourage elaboration.',
    });
  } else if (aggregateMetrics.average_follow_up_effectiveness >= 80) {
    insights.push({
      type: 'strength',
      title: 'Excellent Follow-up Effectiveness',
      description: `Follow-up questions are highly effective (${aggregateMetrics.average_follow_up_effectiveness}%), uncovering deep insights.`,
      impact: 'medium',
      affected_sessions: aggregateMetrics.total_sessions,
    });
  }
  
  // Quality Distribution
  const poorQualityPercentage = (aggregateMetrics.poor_quality / aggregateMetrics.total_sessions) * 100;
  
  if (poorQualityPercentage > 20) {
    insights.push({
      type: 'concern',
      title: 'Many Low-Quality Conversations',
      description: `${Math.round(poorQualityPercentage)}% of conversations have poor quality scores.`,
      impact: 'high',
      affected_sessions: aggregateMetrics.poor_quality,
      recommendation: 'Focus on improving conversation engagement, response length, and completion rates.',
    });
  }
  
  return insights;
}
