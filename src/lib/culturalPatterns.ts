/**
 * Cultural Pattern Discovery Library
 * 
 * Identifies workplace culture patterns, norms, and dynamics through conversation analysis.
 * Reveals implicit cultural aspects that surveys can't capture.
 */

import {
  ConversationResponse,
  ConversationSession,
  ThemeInsight,
} from "./conversationAnalytics";

export interface CulturalPattern {
  id: string;
  pattern_name: string;
  description: string;
  category: 'strength' | 'weakness' | 'neutral' | 'risk';
  evidence: string[];
  frequency: number;
  affected_groups: string[]; // Departments, roles, etc.
  sentiment_impact: number; // -100 to 100
  confidence: number; // 0-100
  implications: string[];
}

export interface CulturalStrength {
  id: string;
  strength_name: string;
  description: string;
  evidence: string[];
  frequency: number;
  impact: 'high' | 'medium' | 'low';
  protective_factor: boolean; // Does this protect against negative sentiment?
}

export interface CulturalRisk {
  id: string;
  risk_name: string;
  description: string;
  evidence: string[];
  frequency: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  affected_groups: string[];
  recommended_actions: string[];
}

export interface GroupCultureProfile {
  group_name: string; // Department, role, etc.
  overall_sentiment: number;
  cultural_strengths: CulturalStrength[];
  cultural_risks: CulturalRisk[];
  unique_patterns: CulturalPattern[];
  comparison_to_average: {
    sentiment_diff: number;
    strengths_diff: number;
    risks_diff: number;
  };
}

export interface CulturalMap {
  overall_culture_score: number; // 0-100
  cultural_strengths: CulturalStrength[];
  cultural_risks: CulturalRisk[];
  patterns: CulturalPattern[];
  group_profiles: GroupCultureProfile[];
  cultural_evolution: {
    trend: 'improving' | 'declining' | 'stable';
    change_rate: number; // -100 to 100
    indicators: string[];
  };
}

/**
 * Cultural pattern keywords and indicators
 */
const CULTURAL_INDICATORS = {
  strengths: {
    'Supportive Environment': ['support', 'helpful', 'caring', 'team support', 'backed'],
    'Open Communication': ['transparent', 'open', 'honest', 'clear communication', 'forthright'],
    'Work-Life Balance': ['balance', 'flexible', 'respects time', 'reasonable hours'],
    'Recognition & Appreciation': ['appreciated', 'recognized', 'valued', 'acknowledged'],
    'Growth Opportunities': ['growth', 'development', 'learning', 'advancement', 'opportunity'],
    'Collaborative Culture': ['collaborative', 'teamwork', 'working together', 'cooperative'],
    'Innovation Encouraged': ['innovative', 'creative', 'new ideas', 'experimentation'],
    'Trust & Autonomy': ['trust', 'autonomy', 'independence', 'empowered', 'freedom'],
  },
  weaknesses: {
    'Lack of Communication': ['unclear', 'no communication', 'in the dark', 'lack of info'],
    'Micromanagement': ['micromanaged', 'controlled', 'no autonomy', 'monitored'],
    'Poor Work-Life Balance': ['always on', 'no balance', 'work-life', 'overtime'],
    'Lack of Recognition': ['not appreciated', 'unrecognized', 'no credit', 'taken for granted'],
    'Limited Growth': ['no growth', 'stuck', 'stagnant', 'dead end', 'no advancement'],
    'Silos & Isolation': ['silo', 'isolated', 'disconnected', 'separate'],
    'Resistance to Change': ['resistant', 'stuck in ways', 'no innovation', 'rigid'],
    'Lack of Trust': ['distrust', 'not trusted', 'micromanaged', 'controlled'],
  },
  risks: {
    'Burnout Culture': ['burnout', 'exhausted', 'overwhelmed', 'drained', 'too much'],
    'Toxic Environment': ['toxic', 'hostile', 'negative', 'unhealthy', 'bad atmosphere'],
    'High Turnover Risk': ['leaving', 'considering leaving', 'better elsewhere', 'retention'],
    'Low Engagement': ['disengaged', 'unmotivated', 'not invested', 'don\'t care'],
    'Communication Breakdown': ['communication', 'miscommunication', 'confusion', 'unclear'],
    'Leadership Issues': ['leadership', 'management', 'boss', 'supervisor', 'direction'],
  },
};

/**
 * Detect cultural patterns from responses
 */
export function detectCulturalPatterns(
  responses: ConversationResponse[],
  sessions: ConversationSession[]
): CulturalPattern[] {
  const patterns: CulturalPattern[] = [];
  
  // Build department/group map
  const groupMap = new Map<string, ConversationResponse[]>();
  sessions.forEach(session => {
    // For now, we'll use session ID as group - in production, use department/role
    const group = session.department || 'Unknown';
    if (!groupMap.has(group)) {
      groupMap.set(group, []);
    }
    const sessionResponses = responses.filter(r => r.conversation_session_id === session.id);
    groupMap.get(group)!.push(...sessionResponses);
  });
  
  // Detect strength patterns
  Object.entries(CULTURAL_INDICATORS.strengths).forEach(([name, keywords]) => {
    const matchingResponses = responses.filter(r => {
      const content = r.content.toLowerCase();
      return keywords.some(keyword => content.includes(keyword.toLowerCase()));
    });
    
    if (matchingResponses.length > 0) {
      const sentiments = matchingResponses
        .map(r => r.sentiment_score)
        .filter((s): s is number => s !== null);
      
      const avgSentiment = sentiments.length > 0
        ? sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length
        : 50;
      
      const affectedGroups = Array.from(groupMap.entries())
        .filter(([_, groupResponses]) => 
          groupResponses.some(r => matchingResponses.includes(r))
        )
        .map(([group]) => group);
      
      patterns.push({
        id: `strength-${name.toLowerCase().replace(/\s+/g, '-')}`,
        pattern_name: name,
        description: `Employees express ${name.toLowerCase()} as a positive aspect of the workplace.`,
        category: 'strength',
        evidence: matchingResponses
          .filter(r => r.content.length < 200)
          .slice(0, 5)
          .map(r => r.content),
        frequency: matchingResponses.length,
        affected_groups: affectedGroups,
        sentiment_impact: Math.round(avgSentiment - 50), // Positive impact
        confidence: Math.min(100, matchingResponses.length * 10 + 30),
        implications: [
          `This cultural strength supports employee satisfaction`,
          `Consider leveraging this strength in other areas`,
        ],
      });
    }
  });
  
  // Detect weakness patterns
  Object.entries(CULTURAL_INDICATORS.weaknesses).forEach(([name, keywords]) => {
    const matchingResponses = responses.filter(r => {
      const content = r.content.toLowerCase();
      return keywords.some(keyword => content.includes(keyword.toLowerCase()));
    });
    
    if (matchingResponses.length > 0) {
      const sentiments = matchingResponses
        .map(r => r.sentiment_score)
        .filter((s): s is number => s !== null);
      
      const avgSentiment = sentiments.length > 0
        ? sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length
        : 50;
      
      const affectedGroups = Array.from(groupMap.entries())
        .filter(([_, groupResponses]) => 
          groupResponses.some(r => matchingResponses.includes(r))
        )
        .map(([group]) => group);
      
      patterns.push({
        id: `weakness-${name.toLowerCase().replace(/\s+/g, '-')}`,
        pattern_name: name,
        description: `Employees identify ${name.toLowerCase()} as a cultural weakness.`,
        category: 'weakness',
        evidence: matchingResponses
          .filter(r => r.content.length < 200)
          .slice(0, 5)
          .map(r => r.content),
        frequency: matchingResponses.length,
        affected_groups: affectedGroups,
        sentiment_impact: Math.round(avgSentiment - 50), // Negative impact
        confidence: Math.min(100, matchingResponses.length * 10 + 30),
        implications: [
          `This cultural weakness negatively impacts employee satisfaction`,
          `Addressing this could significantly improve workplace culture`,
        ],
      });
    }
  });
  
  // Detect risk patterns
  Object.entries(CULTURAL_INDICATORS.risks).forEach(([name, keywords]) => {
    const matchingResponses = responses.filter(r => {
      const content = r.content.toLowerCase();
      return keywords.some(keyword => content.includes(keyword.toLowerCase()));
    });
    
    if (matchingResponses.length >= 3) { // Require minimum threshold for risks
      const sentiments = matchingResponses
        .map(r => r.sentiment_score)
        .filter((s): s is number => s !== null);
      
      const avgSentiment = sentiments.length > 0
        ? sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length
        : 30; // Default low for risks
      
      const affectedGroups = Array.from(groupMap.entries())
        .filter(([_, groupResponses]) => 
          groupResponses.some(r => matchingResponses.includes(r))
        )
        .map(([group]) => group);
      
      const severity: 'critical' | 'high' | 'medium' | 'low' =
        matchingResponses.length >= 10 ? 'critical' :
        matchingResponses.length >= 5 ? 'high' :
        matchingResponses.length >= 3 ? 'medium' : 'low';
      
      patterns.push({
        id: `risk-${name.toLowerCase().replace(/\s+/g, '-')}`,
        pattern_name: name,
        description: `Cultural risk identified: ${name.toLowerCase()} may be affecting workplace health.`,
        category: 'risk',
        evidence: matchingResponses
          .filter(r => r.content.length < 200)
          .slice(0, 5)
          .map(r => r.content),
        frequency: matchingResponses.length,
        affected_groups: affectedGroups,
        sentiment_impact: Math.round(avgSentiment - 50), // Strong negative impact
        confidence: Math.min(100, matchingResponses.length * 15 + 40),
        implications: [
          `This cultural risk requires immediate attention`,
          `May lead to increased turnover and decreased engagement`,
        ],
      });
    }
  });
  
  return patterns.sort((a, b) => {
    // Sort by category priority: risk > weakness > strength
    const categoryOrder = { risk: 3, weakness: 2, strength: 1, neutral: 0 };
    const categoryDiff = categoryOrder[b.category] - categoryOrder[a.category];
    if (categoryDiff !== 0) return categoryDiff;
    return b.frequency - a.frequency;
  });
}

/**
 * Extract cultural strengths
 */
export function extractCulturalStrengths(patterns: CulturalPattern[]): CulturalStrength[] {
  return patterns
    .filter(p => p.category === 'strength')
    .map(pattern => ({
      id: pattern.id,
      strength_name: pattern.pattern_name,
      description: pattern.description,
      evidence: pattern.evidence,
      frequency: pattern.frequency,
      impact: pattern.sentiment_impact > 20 ? 'high' : pattern.sentiment_impact > 10 ? 'medium' : 'low',
      protective_factor: pattern.sentiment_impact > 15, // Protects against negative sentiment
    }))
    .sort((a, b) => b.frequency - a.frequency);
}

/**
 * Extract cultural risks
 */
export function extractCulturalRisks(patterns: CulturalPattern[]): CulturalRisk[] {
  return patterns
    .filter(p => p.category === 'risk')
    .map(pattern => {
      const severity: 'critical' | 'high' | 'medium' | 'low' =
        pattern.frequency >= 10 ? 'critical' :
        pattern.frequency >= 5 ? 'high' :
        pattern.frequency >= 3 ? 'medium' : 'low';
      
      return {
        id: pattern.id,
        risk_name: pattern.pattern_name,
        description: pattern.description,
        evidence: pattern.evidence,
        frequency: pattern.frequency,
        severity,
        affected_groups: pattern.affected_groups,
        recommended_actions: [
          `Address ${pattern.pattern_name.toLowerCase()} through targeted interventions`,
          `Monitor affected groups closely`,
          `Implement prevention measures`,
        ],
      };
    })
    .sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
}

/**
 * Build group culture profiles
 */
export function buildGroupProfiles(
  responses: ConversationResponse[],
  sessions: ConversationSession[],
  patterns: CulturalPattern[]
): GroupCultureProfile[] {
  const groupMap = new Map<string, ConversationSession[]>();
  
  sessions.forEach(session => {
    const group = session.department || 'Unknown';
    if (!groupMap.has(group)) {
      groupMap.set(group, []);
    }
    groupMap.get(group)!.push(session);
  });
  
  // Calculate overall sentiment
  const allSentiments = responses
    .map(r => r.sentiment_score)
    .filter((s): s is number => s !== null);
  const overallAvgSentiment = allSentiments.length > 0
    ? allSentiments.reduce((sum, s) => sum + s, 0) / allSentiments.length
    : 50;
  
  return Array.from(groupMap.entries()).map(([groupName, groupSessions]) => {
    const groupResponseIds = new Set(groupSessions.map(s => s.id));
    const groupResponses = responses.filter(r => 
      groupResponseIds.has(r.conversation_session_id)
    );
    
    const groupSentiments = groupResponses
      .map(r => r.sentiment_score)
      .filter((s): s is number => s !== null);
    
    const groupAvgSentiment = groupSentiments.length > 0
      ? groupSentiments.reduce((sum, s) => sum + s, 0) / groupSentiments.length
      : 50;
    
    const groupPatterns = patterns.filter(p =>
      p.affected_groups.includes(groupName)
    );
    
    const strengths = extractCulturalStrengths(groupPatterns);
    const risks = extractCulturalRisks(groupPatterns);
    
    return {
      group_name: groupName,
      overall_sentiment: Math.round(groupAvgSentiment),
      cultural_strengths: strengths,
      cultural_risks: risks,
      unique_patterns: groupPatterns.filter(p => p.affected_groups.length === 1),
      comparison_to_average: {
        sentiment_diff: Math.round(groupAvgSentiment - overallAvgSentiment),
        strengths_diff: strengths.length - extractCulturalStrengths(patterns).length / groupMap.size,
        risks_diff: risks.length - extractCulturalRisks(patterns).length / groupMap.size,
      },
    };
  });
}

/**
 * Build comprehensive cultural map
 */
export function buildCulturalMap(
  responses: ConversationResponse[],
  sessions: ConversationSession[],
  themes: ThemeInsight[]
): CulturalMap {
  const patterns = detectCulturalPatterns(responses, sessions);
  const strengths = extractCulturalStrengths(patterns);
  const risks = extractCulturalRisks(patterns);
  const groupProfiles = buildGroupProfiles(responses, sessions, patterns);
  
  // Calculate overall culture score
  // Based on: sentiment, strengths vs risks, pattern distribution
  const avgSentiment = themes.length > 0
    ? themes.reduce((sum, t) => sum + t.avg_sentiment, 0) / themes.length
    : 50;
  
  const strengthScore = Math.min(50, strengths.length * 5);
  const riskPenalty = Math.max(0, risks.length * -10);
  
  const overallCultureScore = Math.max(0, Math.min(100,
    (avgSentiment / 100) * 50 + // Sentiment component (50%)
    strengthScore + // Strengths component
    riskPenalty + // Risk penalty
    25 // Base score
  ));
  
  // Determine cultural evolution trend
  // Simplified: would compare to historical data in production
  const trend: 'improving' | 'declining' | 'stable' = 
    avgSentiment >= 70 ? 'improving' :
    avgSentiment <= 40 ? 'declining' : 'stable';
  
  const changeRate = avgSentiment - 50; // Deviation from neutral
  
  return {
    overall_culture_score: Math.round(overallCultureScore),
    cultural_strengths: strengths.slice(0, 10),
    cultural_risks: risks.slice(0, 10),
    patterns: patterns.slice(0, 20),
    group_profiles: groupProfiles,
    cultural_evolution: {
      trend,
      change_rate: Math.round(changeRate),
      indicators: [
        strengths.length > risks.length ? 'More strengths than risks' : 'More risks than strengths',
        avgSentiment >= 70 ? 'Strong positive sentiment' : avgSentiment <= 40 ? 'Low sentiment' : 'Mixed sentiment',
      ],
    },
  };
}
