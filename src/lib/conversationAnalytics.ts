/**
 * Conversation Analytics Library
 * 
 * Extracts and analyzes rich conversational data from employee feedback conversations.
 * Transforms raw conversation data into actionable insights.
 */

import { supabase } from "@/integrations/supabase/client";

export interface ConversationResponse {
  id: string;
  content: string;
  ai_response: string | null;
  ai_analysis: any;
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  sentiment_score: number | null;
  theme_id: string | null;
  theme_name?: string;
  created_at: string;
  conversation_session_id: string;
}

export interface ConversationSession {
  id: string;
  survey_id: string;
  employee_id: string | null;
  initial_mood: number | null;
  final_mood: number | null;
  started_at: string;
  ended_at: string | null;
  anonymization_level: 'anonymous' | 'partial' | 'identified';
  status: 'active' | 'completed' | 'abandoned';
  department?: string;
}

export interface ConversationQuote {
  id: string;
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  sentiment_score: number | null;
  theme_id: string | null;
  theme_name?: string;
  session_id: string;
  created_at: string;
  department?: string;
}

export interface ThemeInsight {
  theme_id: string;
  theme_name: string;
  response_count: number;
  avg_sentiment: number;
  quotes: ConversationQuote[];
  sub_themes: SubTheme[];
  sentiment_drivers: SentimentDriver[];
  follow_up_effectiveness: number;
}

export interface SubTheme {
  name: string;
  frequency: number;
  avg_sentiment: number;
  representative_quotes: string[];
}

export interface SentimentDriver {
  phrase: string;
  frequency: number;
  sentiment_impact: number; // positive or negative impact on sentiment
  context: string[];
}

export interface PatternInsight {
  pattern: string;
  frequency: number;
  affected_themes: string[];
  representative_quotes: ConversationQuote[];
  correlation_strength: number;
}

export interface NarrativeSummary {
  overview: string;
  key_insights: string[];
  top_concerns: string[];
  positive_aspects: string[];
  recommended_actions: string[];
}

/**
 * Fetch all conversation responses with full context
 */
export async function fetchConversationResponses(
  surveyId?: string,
  themeId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<ConversationResponse[]> {
  let query = supabase
    .from('responses')
    .select(`
      id,
      content,
      ai_response,
      ai_analysis,
      sentiment,
      sentiment_score,
      theme_id,
      created_at,
      conversation_session_id,
      survey_themes(name)
    `)
    .order('created_at', { ascending: true });

  if (surveyId) {
    query = query.eq('survey_id', surveyId);
  }

  if (themeId) {
    query = query.eq('theme_id', themeId);
  }

  if (startDate) {
    query = query.gte('created_at', startDate.toISOString());
  }

  if (endDate) {
    query = query.lte('created_at', endDate.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching conversation responses:', error);
    throw error;
  }

  return (data || []).map((r: any) => ({
    id: r.id,
    content: r.content || '',
    ai_response: r.ai_response,
    ai_analysis: r.ai_analysis,
    sentiment: r.sentiment,
    sentiment_score: r.sentiment_score,
    theme_id: r.theme_id,
    theme_name: r.survey_themes?.name,
    created_at: r.created_at,
    conversation_session_id: r.conversation_session_id,
  }));
}

/**
 * Fetch conversation sessions with employee context
 */
export async function fetchConversationSessions(
  surveyId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<ConversationSession[]> {
  let query = supabase
    .from('conversation_sessions')
    .select(`
      id,
      survey_id,
      employee_id,
      initial_mood,
      final_mood,
      started_at,
      ended_at,
      anonymization_level,
      status,
      profiles(department)
    `)
    .order('started_at', { ascending: false });

  if (surveyId) {
    query = query.eq('survey_id', surveyId);
  }

  if (startDate) {
    query = query.gte('started_at', startDate.toISOString());
  }

  if (endDate) {
    query = query.lte('started_at', endDate.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching conversation sessions:', error);
    throw error;
  }

  return (data || []).map((s: any) => ({
    id: s.id,
    survey_id: s.survey_id,
    employee_id: s.employee_id,
    initial_mood: s.initial_mood,
    final_mood: s.final_mood,
    started_at: s.started_at,
    ended_at: s.ended_at,
    anonymization_level: s.anonymization_level,
    status: s.status,
    department: s.profiles?.department || null,
  }));
}

/**
 * Extract quotes from responses
 */
export function extractQuotes(
  responses: ConversationResponse[],
  sessions: ConversationSession[]
): ConversationQuote[] {
  const sessionMap = new Map<string, ConversationSession>();
  sessions.forEach(s => sessionMap.set(s.id, s));

  return responses
    .filter(r => r.content && r.content.trim().length > 20) // Only meaningful quotes
    .map(r => {
      const session = sessionMap.get(r.conversation_session_id);
      return {
        id: r.id,
        text: r.content,
        sentiment: r.sentiment,
        sentiment_score: r.sentiment_score,
        theme_id: r.theme_id,
        theme_name: r.theme_name,
        session_id: r.conversation_session_id,
        created_at: r.created_at,
        department: session?.department,
      };
    });
}

/**
 * Extract sub-themes from responses using keyword analysis
 */
export function extractSubThemes(
  responses: ConversationResponse[],
  themeId: string
): SubTheme[] {
  const themeResponses = responses.filter(r => r.theme_id === themeId);
  
  // Common keywords/phrases for different themes
  // This is a simplified version - in production, use NLP/topic modeling
  const keywordPatterns: Record<string, string[]> = {
    'work-life-balance': [
      'work life balance', 'work-life', 'hours', 'overtime', 'weekend',
      'evening', 'after hours', 'time off', 'vacation', 'burnout',
      'exhausted', 'tired', 'overwhelmed'
    ],
    'career-growth': [
      'career', 'growth', 'development', 'promotion', 'advancement',
      'opportunity', 'learning', 'skills', 'training', 'mentor',
      'stuck', 'stagnant', 'dead end'
    ],
    'team-collaboration': [
      'team', 'collaboration', 'working together', 'communication',
      'cooperation', 'silo', 'isolation', 'support', 'help'
    ],
    'leadership': [
      'manager', 'leadership', 'boss', 'supervisor', 'director',
      'decision', 'guidance', 'direction', 'support', 'trust'
    ],
    'compensation': [
      'salary', 'pay', 'compensation', 'benefits', 'raise',
      'bonus', 'equity', 'money', 'paid', 'underpaid'
    ],
    'company-culture': [
      'culture', 'values', 'environment', 'atmosphere', 'feel',
      'welcoming', 'inclusive', 'toxic', 'positive', 'negative'
    ],
    'work-environment': [
      'office', 'workspace', 'facilities', 'equipment', 'tools',
      'remote', 'hybrid', 'space', 'noise', 'distraction'
    ],
    'communication': [
      'communication', 'transparency', 'information', 'updates',
      'announcements', 'meetings', 'email', 'messaging', 'clarity'
    ],
  };

  // Group responses by sentiment and analyze content
  const subThemeMap = new Map<string, {
    responses: ConversationResponse[];
    quotes: string[];
  }>();

  themeResponses.forEach(response => {
    const content = response.content.toLowerCase();
    
    // Find matching keywords
    for (const [subTheme, keywords] of Object.entries(keywordPatterns)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        if (!subThemeMap.has(subTheme)) {
          subThemeMap.set(subTheme, { responses: [], quotes: [] });
        }
        const entry = subThemeMap.get(subTheme)!;
        entry.responses.push(response);
        if (response.content.length < 200) {
          entry.quotes.push(response.content);
        }
      }
    }
  });

  // Convert to SubTheme format
  return Array.from(subThemeMap.entries()).map(([name, data]) => {
    const sentiments = data.responses
      .map(r => r.sentiment_score)
      .filter((s): s is number => s !== null);
    
    // Convert sentiment scores from 0-1 range to 0-100 range if needed
    const normalizedSentiments = sentiments.map(s => s <= 1 ? s * 100 : s);
    const avgSentiment = normalizedSentiments.length > 0
      ? normalizedSentiments.reduce((sum, s) => sum + s, 0) / normalizedSentiments.length
      : 50;

    return {
      name: name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      frequency: data.responses.length,
      avg_sentiment: avgSentiment,
      representative_quotes: data.quotes.slice(0, 3),
    };
  });
}

/**
 * Identify sentiment drivers (phrases that strongly correlate with sentiment)
 */
export function identifySentimentDrivers(
  responses: ConversationResponse[]
): SentimentDriver[] {
  // Common positive and negative phrases
  const positivePhrases = [
    'love', 'great', 'excellent', 'amazing', 'wonderful', 'supportive',
    'helpful', 'appreciate', 'enjoy', 'happy', 'satisfied', 'valued'
  ];
  
  const negativePhrases = [
    'frustrated', 'disappointed', 'concerned', 'worried', 'stressed',
    'overwhelmed', 'burnout', 'exhausted', 'unfair', 'unsatisfied',
    'problem', 'issue', 'difficult', 'challenging', 'struggle'
  ];

  const driverMap = new Map<string, {
    count: number;
    sentimentSum: number;
    contexts: string[];
  }>();

  responses.forEach(response => {
    const content = response.content.toLowerCase();
    // Convert sentiment_score from 0-1 range to 0-100 range if needed
    const rawScore = response.sentiment_score || 50;
    const sentimentScore = rawScore <= 1 ? rawScore * 100 : rawScore;

    [...positivePhrases, ...negativePhrases].forEach(phrase => {
      if (content.includes(phrase)) {
        if (!driverMap.has(phrase)) {
          driverMap.set(phrase, { count: 0, sentimentSum: 0, contexts: [] });
        }
        const entry = driverMap.get(phrase)!;
        entry.count++;
        entry.sentimentSum += sentimentScore;
        if (response.content.length < 150) {
          entry.contexts.push(response.content);
        }
      }
    });
  });

  return Array.from(driverMap.entries())
    .map(([phrase, data]) => {
      const avgSentiment = data.sentimentSum / data.count;
      const sentimentImpact = avgSentiment - 50; // Deviation from neutral

      return {
        phrase,
        frequency: data.count,
        sentiment_impact: sentimentImpact,
        context: data.contexts.slice(0, 3),
      };
    })
    .sort((a, b) => Math.abs(b.sentiment_impact) - Math.abs(a.sentiment_impact))
    .slice(0, 10);
}

/**
 * Find patterns across conversations
 */
export function findCrossConversationPatterns(
  responses: ConversationResponse[],
  sessions: ConversationSession[]
): PatternInsight[] {
  const patterns: PatternInsight[] = [];
  
  // Group responses by session
  const sessionResponses = new Map<string, ConversationResponse[]>();
  responses.forEach(r => {
    if (!sessionResponses.has(r.conversation_session_id)) {
      sessionResponses.set(r.conversation_session_id, []);
    }
    sessionResponses.get(r.conversation_session_id)!.push(r);
  });

  // Look for common phrases across multiple sessions
  const phraseFrequency = new Map<string, {
    sessions: Set<string>;
    responses: ConversationResponse[];
  }>();

  responses.forEach(response => {
    const words = response.content.toLowerCase().split(/\s+/);
    // Look for 2-3 word phrases
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = `${words[i]} ${words[i + 1]}`;
      if (phrase.length > 5 && !['the', 'and', 'but', 'for', 'with'].includes(words[i])) {
        if (!phraseFrequency.has(phrase)) {
          phraseFrequency.set(phrase, { sessions: new Set(), responses: [] });
        }
        const entry = phraseFrequency.get(phrase)!;
        entry.sessions.add(response.conversation_session_id);
        entry.responses.push(response);
      }
    }
  });

  // Convert to patterns (phrases mentioned in 3+ sessions)
  phraseFrequency.forEach((data, phrase) => {
    if (data.sessions.size >= 3) {
      const themes = new Set(
        data.responses
          .map(r => r.theme_id)
          .filter((id): id is string => id !== null)
      );

      patterns.push({
        pattern: phrase,
        frequency: data.sessions.size,
        affected_themes: Array.from(themes),
        representative_quotes: extractQuotes(data.responses, sessions).slice(0, 3),
        correlation_strength: data.sessions.size / sessionResponses.size,
      });
    }
  });

  return patterns
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);
}

/**
 * Generate narrative summary of insights
 */
export function generateNarrativeSummary(
  responses: ConversationResponse[],
  sessions: ConversationSession[],
  themes: ThemeInsight[]
): NarrativeSummary {
  const totalResponses = responses.length;
  const totalSessions = sessions.length;
  
  const positiveResponses = responses.filter(r => r.sentiment === 'positive').length;
  const negativeResponses = responses.filter(r => r.sentiment === 'negative').length;
  // Convert sentiment scores from 0-1 range to 0-100 range if needed
  const normalizedSentiments = responses
    .map(r => {
      const score = r.sentiment_score || 50;
      return score <= 1 ? score * 100 : score;
    });
  const avgSentiment = normalizedSentiments.reduce((sum, s) => sum + s, 0) / totalResponses;

  const topConcernThemes = themes
    .filter(t => t.avg_sentiment < 50)
    .sort((a, b) => a.avg_sentiment - b.avg_sentiment)
    .slice(0, 3);

  const topPositiveThemes = themes
    .filter(t => t.avg_sentiment > 70)
    .sort((a, b) => b.avg_sentiment - a.avg_sentiment)
    .slice(0, 3);

  const overview = `Based on ${totalSessions} employee conversations with ${totalResponses} total responses, 
    employees show ${avgSentiment >= 70 ? 'strong' : avgSentiment >= 50 ? 'moderate' : 'low'} 
    overall satisfaction (${avgSentiment.toFixed(1)}/100). 
    ${positiveResponses > negativeResponses ? 'Positive feedback' : 'Concerns'} 
    ${positiveResponses > negativeResponses ? 'outweigh' : 'outweigh'} 
    ${positiveResponses > negativeResponses ? 'concerns' : 'positive feedback'} 
    (${positiveResponses} positive vs ${negativeResponses} negative responses).`;

  const keyInsights = [
    `${topConcernThemes.length > 0 ? `Top concern: ${topConcernThemes[0].theme_name} (${topConcernThemes[0].avg_sentiment.toFixed(1)}/100)` : 'No major concerns identified'}`,
    `Average conversation depth: ${(totalResponses / totalSessions).toFixed(1)} exchanges per session`,
    `${themes.filter(t => t.follow_up_effectiveness > 0.5).length} themes showed strong follow-up question effectiveness`,
  ];

  const topConcerns = topConcernThemes.map(t => 
    `${t.theme_name}: ${t.response_count} mentions, ${t.sentiment_drivers.length} key concerns identified`
  );

  const positiveAspects = topPositiveThemes.map(t => 
    `${t.theme_name}: ${t.response_count} positive mentions`
  );

  const recommendedActions = [
    topConcernThemes.length > 0 ? `Address ${topConcernThemes[0].theme_name} concerns through targeted initiatives` : 'Maintain current positive trends',
    `Leverage insights from ${topPositiveThemes.length > 0 ? topPositiveThemes[0].theme_name : 'successful areas'} to improve other areas`,
    `Continue conversational approach - ${themes.reduce((sum, t) => sum + t.follow_up_effectiveness, 0) / themes.length > 0.5 ? 'effective' : 'could be improved'} follow-up questions`,
  ];

  return {
    overview,
    key_insights: keyInsights,
    top_concerns: topConcerns,
    positive_aspects: positiveAspects,
    recommended_actions: recommendedActions,
  };
}
