/**
 * Advanced NLP and Topic Modeling Library
 * 
 * Uses natural language processing to extract deeper insights from conversations.
 * Identifies topics, emotions, and patterns that keyword matching might miss.
 */

import { ConversationResponse } from "./conversationAnalytics";

export interface TopicCluster {
  id: string;
  label: string;
  keywords: string[];
  frequency: number;
  avg_sentiment: number;
  representative_quotes: string[];
  related_clusters: string[];
  confidence: number; // 0-100
}

export interface EmotionAnalysis {
  response_id: string;
  emotion: EmotionType;
  confidence: number;
  intensity: number; // 0-100
  keywords: string[];
}

export type EmotionType = 
  | 'hopeful' | 'frustrated' | 'grateful' | 'anxious' 
  | 'satisfied' | 'disappointed' | 'excited' | 'concerned'
  | 'confident' | 'uncertain' | 'optimistic' | 'pessimistic'
  | 'appreciative' | 'burned_out' | 'motivated' | 'demotivated';

export interface SemanticPattern {
  pattern: string;
  semantic_variants: string[]; // Different ways of saying the same thing
  frequency: number;
  sentiment_impact: number;
  contexts: string[];
}

export interface NLPAnalysis {
  topics: TopicCluster[];
  emotions: EmotionAnalysis[];
  semantic_patterns: SemanticPattern[];
  emerging_topics: TopicCluster[];
  quality_score: number; // 0-100, quality of NLP analysis
}

/**
 * Emotion detection based on keywords and patterns
 */
const EMOTION_KEYWORDS: Record<EmotionType, string[]> = {
  hopeful: ['hope', 'looking forward', 'excited about', 'optimistic', 'bright future', 'potential'],
  frustrated: ['frustrated', 'annoyed', 'irritated', 'fed up', 'tired of', 'sick of'],
  grateful: ['grateful', 'thankful', 'appreciate', 'appreciative', 'blessed', 'lucky'],
  anxious: ['worried', 'anxious', 'concerned', 'nervous', 'uneasy', 'stress'],
  satisfied: ['satisfied', 'happy', 'pleased', 'content', 'fulfilled'],
  disappointed: ['disappointed', 'let down', 'dissatisfied', 'unhappy'],
  excited: ['excited', 'thrilled', 'enthusiastic', 'energized'],
  concerned: ['concerned', 'worried', 'troubled', 'bothered'],
  confident: ['confident', 'sure', 'certain', 'positive'],
  uncertain: ['uncertain', 'unsure', 'doubtful', 'confused'],
  optimistic: ['optimistic', 'positive', 'hopeful', 'upbeat'],
  pessimistic: ['pessimistic', 'negative', 'doubtful', 'down'],
  appreciative: ['appreciate', 'thankful', 'grateful', 'value'],
  burned_out: ['burnout', 'exhausted', 'drained', 'overwhelmed', 'burnt out'],
  motivated: ['motivated', 'inspired', 'energized', 'driven'],
  demotivated: ['demotivated', 'uninspired', 'disengaged', 'disinterested'],
};

/**
 * Detect emotions in a response
 */
export function detectEmotion(response: ConversationResponse): EmotionAnalysis {
  const content = response.content.toLowerCase();
  const detectedEmotions: Array<{ emotion: EmotionType; score: number }> = [];
  
  // Check for each emotion type
  Object.entries(EMOTION_KEYWORDS).forEach(([emotion, keywords]) => {
    const matches = keywords.filter(keyword => content.includes(keyword)).length;
    if (matches > 0) {
      detectedEmotions.push({
        emotion: emotion as EmotionType,
        score: matches / keywords.length, // Normalize by keyword count
      });
    }
  });
  
  // If no emotion detected, infer from sentiment
  if (detectedEmotions.length === 0) {
    // Convert sentiment_score from 0-1 range to 0-100 range if needed
    const rawScore = response.sentiment_score || 50;
    const sentimentScore = rawScore <= 1 ? rawScore * 100 : rawScore;
    if (sentimentScore >= 70) {
      detectedEmotions.push({ emotion: 'satisfied', score: 0.5 });
    } else if (sentimentScore <= 30) {
      detectedEmotions.push({ emotion: 'frustrated', score: 0.5 });
    } else {
      detectedEmotions.push({ emotion: 'concerned', score: 0.5 });
    }
  }
  
  // Get the highest scoring emotion
  const primaryEmotion = detectedEmotions.sort((a, b) => b.score - a.score)[0];
  
  // Calculate intensity based on sentiment score and keyword matches
  // Convert sentiment_score from 0-1 range to 0-100 range if needed
  const sentimentScore = response.sentiment_score !== null && response.sentiment_score !== undefined
    ? (response.sentiment_score <= 1 ? response.sentiment_score * 100 : response.sentiment_score)
    : 50;
  const intensity = primaryEmotion
    ? Math.min(100, (primaryEmotion.score * 100) + sentimentScore * 0.5)
    : 50;
  
  return {
    response_id: response.id,
    emotion: primaryEmotion?.emotion || 'concerned',
    confidence: Math.round(primaryEmotion?.score * 100 || 50),
    intensity: Math.round(intensity),
    keywords: EMOTION_KEYWORDS[primaryEmotion?.emotion || 'concerned'] || [],
  };
}

/**
 * Extract topic clusters using keyword-based clustering
 * (In production, this would use LDA/LSA or transformer models)
 */
export function extractTopicClusters(responses: ConversationResponse[]): TopicCluster[] {
  // Common workplace topics and their keywords
  const TOPIC_KEYWORDS: Record<string, string[]> = {
    'Meeting Overload': ['meeting', 'too many meetings', 'meeting fatigue', 'calendar', 'sync'],
    'Remote Work Challenges': ['remote', 'wfh', 'work from home', 'isolation', 'distraction'],
    'Communication Gaps': ['communication', 'unclear', 'transparency', 'updates', 'information'],
    'Career Stagnation': ['stuck', 'stagnant', 'no growth', 'dead end', 'advancement'],
    'Work-Life Imbalance': ['work-life', 'balance', 'overtime', 'burnout', 'exhausted'],
    'Lack of Recognition': ['recognition', 'appreciated', 'valued', 'acknowledged', 'credit'],
    'Team Collaboration Issues': ['silo', 'collaboration', 'teamwork', 'isolated', 'together'],
    'Management Style': ['manager', 'leadership', 'boss', 'management', 'supervisor'],
    'Resource Constraints': ['resources', 'tools', 'budget', 'understaffed', 'equipment'],
    'Process Inefficiencies': ['process', 'inefficient', 'red tape', 'bureaucracy', 'slow'],
    'Compensation Concerns': ['salary', 'pay', 'compensation', 'underpaid', 'money'],
    'Company Culture': ['culture', 'values', 'environment', 'atmosphere', 'feeling'],
    'Training & Development': ['training', 'development', 'learning', 'skills', 'education'],
    'Workload Management': ['workload', 'too much', 'overwhelmed', 'balance', 'manage'],
    'Feedback & Reviews': ['feedback', 'review', 'evaluation', 'performance', 'assessment'],
  };
  
  const clusterMap = new Map<string, {
    responses: ConversationResponse[];
    keywords: string[];
    label: string;
  }>();
  
  // Cluster responses by topic
  responses.forEach(response => {
    const content = response.content.toLowerCase();
    
    Object.entries(TOPIC_KEYWORDS).forEach(([label, keywords]) => {
      const matches = keywords.filter(keyword => content.includes(keyword.toLowerCase()));
      if (matches.length > 0) {
        if (!clusterMap.has(label)) {
          clusterMap.set(label, {
            responses: [],
            keywords: keywords,
            label: label,
          });
        }
        clusterMap.get(label)!.responses.push(response);
      }
    });
  });
  
  // Convert to TopicCluster format
  return Array.from(clusterMap.entries())
    .map(([label, data]) => {
      const sentiments = data.responses
        .map(r => r.sentiment_score)
        .filter((s): s is number => s !== null);
      
      const avgSentiment = sentiments.length > 0
        ? sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length
        : 50;
      
      const representativeQuotes = data.responses
        .filter(r => r.content.length > 30 && r.content.length < 200)
        .slice(0, 5)
        .map(r => r.content);
      
      // Calculate confidence based on keyword matches and response count
      const confidence = Math.min(100, 
        (data.responses.length / responses.length) * 50 + // Frequency component
        (data.responses.length >= 3 ? 30 : data.responses.length * 10) + // Volume component
        20 // Base confidence
      );
      
      return {
        id: label.toLowerCase().replace(/\s+/g, '-'),
        label,
        keywords: data.keywords,
        frequency: data.responses.length,
        avg_sentiment: Math.round(avgSentiment),
        representative_quotes: representativeQuotes,
        related_clusters: [], // Would be calculated with semantic similarity
        confidence: Math.round(confidence),
      };
    })
    .sort((a, b) => b.frequency - a.frequency);
}

/**
 * Find semantic patterns - different ways of saying the same thing
 */
export function findSemanticPatterns(responses: ConversationResponse[]): SemanticPattern[] {
  // Common semantic variants
  const SEMANTIC_VARIANTS: Record<string, string[]> = {
    'too many meetings': ['meeting overload', 'meeting fatigue', 'too many calls', 'calendar full'],
    'work-life balance': ['work life balance', 'work-life', 'balance', 'personal time'],
    'career growth': ['career development', 'advancement', 'growth', 'progression', 'opportunity'],
    'burnout': ['burned out', 'exhausted', 'overwhelmed', 'drained', 'tired'],
    'communication': ['transparency', 'updates', 'information', 'clarity', 'messaging'],
    'recognition': ['appreciation', 'acknowledgment', 'credit', 'valued', 'recognized'],
    'team collaboration': ['working together', 'teamwork', 'cooperation', 'collaboration'],
    'remote work': ['work from home', 'wfh', 'remote', 'hybrid', 'distributed'],
  };
  
  const patternMap = new Map<string, {
    variants: string[];
    responses: ConversationResponse[];
    contexts: string[];
  }>();
  
  responses.forEach(response => {
    const content = response.content.toLowerCase();
    
    Object.entries(SEMANTIC_VARIANTS).forEach(([pattern, variants]) => {
      const foundVariants = variants.filter(variant => content.includes(variant.toLowerCase()));
      if (foundVariants.length > 0 || content.includes(pattern.toLowerCase())) {
        if (!patternMap.has(pattern)) {
          patternMap.set(pattern, {
            variants: variants,
            responses: [],
            contexts: [],
          });
        }
        const entry = patternMap.get(pattern)!;
        entry.responses.push(response);
        if (response.content.length < 150) {
          entry.contexts.push(response.content);
        }
      }
    });
  });
  
  return Array.from(patternMap.entries())
    .map(([pattern, data]) => {
      const sentiments = data.responses
        .map(r => r.sentiment_score)
        .filter((s): s is number => s !== null);
      
      const avgSentiment = sentiments.length > 0
        ? sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length
        : 50;
      
      const sentimentImpact = avgSentiment - 50; // Deviation from neutral
      
      return {
        pattern,
        semantic_variants: data.variants,
        frequency: data.responses.length,
        sentiment_impact: Math.round(sentimentImpact),
        contexts: data.contexts.slice(0, 5),
      };
    })
    .sort((a, b) => b.frequency - a.frequency);
}

/**
 * Identify emerging topics (new topics appearing recently)
 */
export function identifyEmergingTopics(
  allResponses: ConversationResponse[],
  recentDays: number = 14
): TopicCluster[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - recentDays);
  
  const recentResponses = allResponses.filter(r => 
    new Date(r.created_at) >= cutoffDate
  );
  
  const allTopics = extractTopicClusters(allResponses);
  const recentTopics = extractTopicClusters(recentResponses);
  
  // Find topics that appear more frequently in recent data
  const emergingTopics: TopicCluster[] = [];
  
  recentTopics.forEach(recentTopic => {
    const allTopic = allTopics.find(t => t.id === recentTopic.id);
    if (allTopic) {
      const recentFrequency = recentTopic.frequency / Math.max(recentResponses.length, 1);
      const allFrequency = allTopic.frequency / Math.max(allResponses.length, 1);
      
      // If recent frequency is significantly higher, it's emerging
      if (recentFrequency > allFrequency * 1.5 && recentTopic.frequency >= 3) {
        emergingTopics.push({
          ...recentTopic,
          confidence: Math.min(100, recentTopic.confidence + 20), // Boost confidence for emerging
        });
      }
    } else if (recentTopic.frequency >= 3) {
      // Brand new topic
      emergingTopics.push(recentTopic);
    }
  });
  
  return emergingTopics.sort((a, b) => b.frequency - a.frequency);
}

/**
 * Perform comprehensive NLP analysis
 */
export function performNLPAnalysis(responses: ConversationResponse[]): NLPAnalysis {
  // Extract topics
  const topics = extractTopicClusters(responses);
  
  // Detect emotions
  const emotions = responses.map(detectEmotion);
  
  // Find semantic patterns
  const semanticPatterns = findSemanticPatterns(responses);
  
  // Identify emerging topics
  const emergingTopics = identifyEmergingTopics(responses);
  
  // Calculate quality score based on data richness
  const qualityScore = Math.min(100,
    (topics.length / 10) * 30 + // Topic diversity
    (responses.length / 50) * 30 + // Response volume
    (semanticPatterns.length / 5) * 20 + // Pattern richness
    (emotions.filter(e => e.confidence > 60).length / responses.length) * 20 // Emotion detection quality
  );
  
  return {
    topics: topics.slice(0, 15), // Top 15 topics
    emotions: emotions,
    semantic_patterns: semanticPatterns.slice(0, 10), // Top 10 patterns
    emerging_topics: emergingTopics.slice(0, 5), // Top 5 emerging
    quality_score: Math.round(qualityScore),
  };
}
