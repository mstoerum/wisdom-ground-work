/**
 * Dynamic Evaluation Question Generation
 * 
 * This module provides context-aware question templates and generation logic
 * for the Spradley evaluation flow. Questions adapt based on:
 * - Quick rating (1-5 stars)
 * - Interview context (themes discussed, sentiment, duration)
 * - Previous answers (for empathy responses)
 */

// Types
export interface InterviewContext {
  themesDiscussed: string[];
  overallSentiment: 'positive' | 'neutral' | 'negative';
  exchangeCount: number;
  duration: number; // seconds
  initialMood: number | null;
  keyTopicsMentioned: string[];
}

export interface EvaluationDimension {
  id: string;
  name: string;
  templates: {
    default: string;
    positive?: string;
    negative?: string;
    withContext?: string;
    lowRating?: string;
    highRating?: string;
  };
  placeholder: string;
}

export interface GeneratedQuestion {
  question: string;
  empathy: string | null;
  placeholder: string;
  dimensionId: string;
  dimensionName: string;
}

// Evaluation Dimensions with adaptive templates
export const EVALUATION_DIMENSIONS: EvaluationDimension[] = [
  {
    id: "overall",
    name: "Overall Experience",
    templates: {
      default: "Overall, how did this conversation compare to traditional surveys you've taken?",
      positive: "You discussed {theme} with me. What made it feel natural to share your thoughts?",
      negative: "I noticed you had some experiences to share. Did the conversation let you express them fully?",
      lowRating: "I'd love to understand what didn't work well. Was it the questions, the pace, or the conversation style?",
      highRating: "Glad you had a good experience! What specifically felt different from traditional surveys?",
    },
    placeholder: "Share what stood out to you...",
  },
  {
    id: "ease",
    name: "Ease of Expression",
    templates: {
      default: "Was it easier to express yourself in conversation versus filling out a form?",
      withContext: "When talking about {theme}, did you feel you could express nuance better than in a typical survey?",
      positive: "You seemed comfortable sharing your perspective. What helped with that?",
      negative: "Sometimes conversations can feel limiting. Did you feel able to say what you needed to?",
    },
    placeholder: "What felt different about expressing yourself...",
  },
  {
    id: "understanding",
    name: "Understanding Quality",
    templates: {
      default: "Did I understand your responses well, or did you need to rephrase things?",
      withContext: "When you talked about {topic}, did my follow-up questions feel relevant?",
      positive: "It seemed like our exchange flowed well. Were there moments where you felt particularly understood?",
      negative: "Sometimes AI can miss the mark. Were there points where you felt misunderstood?",
    },
    placeholder: "How was the back-and-forth...",
  },
  {
    id: "value",
    name: "Future Value",
    templates: {
      default: "What would make you want to use Spradley again?",
      positive: "Based on your experience, what would you tell a colleague about Spradley?",
      negative: "What would need to change for you to have a better experience next time?",
      withContext: "For future conversations about {theme}, what would make them even more valuable?",
    },
    placeholder: "Any suggestions or thoughts...",
  },
];

// Empathy phrases categorized by detected sentiment
const EMPATHY_PHRASES = {
  positive: [
    "Great to hear!",
    "That's helpful feedback.",
    "Good to know.",
    "Thanks for sharing that.",
    "Appreciate the kind words.",
  ],
  negative: [
    "Thanks for being honest.",
    "I appreciate that perspective.",
    "That's valuable feedback.",
    "I hear you.",
    "Thanks for the candid input.",
  ],
  neutral: [
    "Thanks for sharing.",
    "Got it.",
    "Understood.",
    "Noted, thank you.",
    "I appreciate your thoughts.",
  ],
};

// Simple client-side sentiment detection
export function detectSimpleSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const lowerText = text.toLowerCase();
  
  const positiveWords = [
    "good", "great", "easy", "natural", "helpful", "better", "love", 
    "excellent", "comfortable", "nice", "enjoyed", "worked", "clear",
    "understood", "intuitive", "smooth", "pleasant", "appreciate"
  ];
  
  const negativeWords = [
    "hard", "difficult", "confusing", "bad", "worse", "awkward", 
    "frustrating", "unclear", "slow", "annoying", "limited",
    "didn't understand", "missed", "wrong", "problem", "issue"
  ];
  
  const positiveCount = positiveWords.filter(w => lowerText.includes(w)).length;
  const negativeCount = negativeWords.filter(w => lowerText.includes(w)).length;
  
  if (positiveCount > negativeCount + 1) return "positive";
  if (negativeCount > positiveCount + 1) return "negative";
  return "neutral";
}

// Generate empathy response based on previous answer
export function generateEmpathyResponse(previousAnswer: string): string {
  const sentiment = detectSimpleSentiment(previousAnswer);
  const phrases = EMPATHY_PHRASES[sentiment];
  return phrases[Math.floor(Math.random() * phrases.length)];
}

// Get formatted theme string for template injection
function formatThemeForDisplay(theme: string): string {
  // Clean up theme name for natural reading
  return theme
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .trim()
    .toLowerCase();
}

// Main question generation function
export function getContextualQuestion(
  dimensionIndex: number,
  context: InterviewContext | undefined,
  previousAnswers: Record<string, string>,
  quickRating: number | null
): GeneratedQuestion {
  const dimension = EVALUATION_DIMENSIONS[dimensionIndex];
  
  if (!dimension) {
    // Fallback for invalid index
    return {
      question: "Any other feedback you'd like to share?",
      empathy: null,
      placeholder: "Your thoughts...",
      dimensionId: "fallback",
      dimensionName: "Additional Feedback",
    };
  }
  
  // Get empathy from previous answer (if any)
  const previousAnswerKeys = Object.keys(previousAnswers);
  const lastAnswerKey = previousAnswerKeys[previousAnswerKeys.length - 1];
  const lastAnswer = lastAnswerKey ? previousAnswers[lastAnswerKey] : null;
  const empathy = lastAnswer ? generateEmpathyResponse(lastAnswer) : null;
  
  // Determine sentiment context
  const sentiment = context?.overallSentiment || 'neutral';
  const hasThemes = context?.themesDiscussed && context.themesDiscussed.length > 0;
  const primaryTheme = hasThemes ? formatThemeForDisplay(context!.themesDiscussed[0]) : null;
  
  let question: string;
  
  // First question (overall) adapts to quick rating
  if (dimension.id === "overall") {
    if (quickRating !== null) {
      if (quickRating <= 2 && dimension.templates.lowRating) {
        question = dimension.templates.lowRating;
      } else if (quickRating >= 4 && dimension.templates.highRating) {
        question = dimension.templates.highRating;
      } else if (quickRating >= 4 && primaryTheme && dimension.templates.positive) {
        question = dimension.templates.positive.replace("{theme}", primaryTheme);
      } else {
        question = dimension.templates.default;
      }
    } else if (primaryTheme && sentiment === 'positive' && dimension.templates.positive) {
      question = dimension.templates.positive.replace("{theme}", primaryTheme);
    } else if (sentiment === 'negative' && dimension.templates.negative) {
      question = dimension.templates.negative;
    } else {
      question = dimension.templates.default;
    }
  } else {
    // Other questions adapt to context and sentiment
    if (primaryTheme && dimension.templates.withContext) {
      question = dimension.templates.withContext
        .replace("{theme}", primaryTheme)
        .replace("{topic}", primaryTheme);
    } else if (sentiment === 'positive' && dimension.templates.positive) {
      question = dimension.templates.positive;
    } else if (sentiment === 'negative' && dimension.templates.negative) {
      question = dimension.templates.negative;
    } else {
      question = dimension.templates.default;
    }
  }
  
  return {
    question,
    empathy,
    placeholder: dimension.placeholder,
    dimensionId: dimension.id,
    dimensionName: dimension.name,
  };
}

// Build evaluation responses for database storage
export function buildEvaluationResponses(
  responses: Record<string, string>,
  questionsAsked: Record<string, string>
): Array<{
  dimension_id: string;
  dimension_name: string;
  question_asked: string;
  answer: string;
}> {
  return Object.entries(responses).map(([dimensionId, answer]) => {
    const dimension = EVALUATION_DIMENSIONS.find(d => d.id === dimensionId);
    return {
      dimension_id: dimensionId,
      dimension_name: dimension?.name || dimensionId,
      question_asked: questionsAsked[dimensionId] || dimension?.templates.default || "",
      answer,
    };
  });
}

// Calculate sentiment score from all responses
export function calculateEvaluationSentiment(
  responses: Record<string, string>,
  quickRating: number | null
): { sentiment: string; sentimentScore: number } {
  const allText = Object.values(responses).join(" ");
  const textSentiment = detectSimpleSentiment(allText);
  
  let sentimentScore = 0.5;
  let sentiment = "neutral";
  
  // Base score from text
  if (textSentiment === "positive") {
    sentiment = "positive";
    sentimentScore = 0.7;
  } else if (textSentiment === "negative") {
    sentiment = "negative";
    sentimentScore = 0.3;
  }
  
  // Adjust based on quick rating if provided
  if (quickRating !== null) {
    const ratingWeight = 0.4; // Rating contributes 40% to final score
    const textWeight = 0.6; // Text contributes 60%
    
    const ratingScore = quickRating / 5; // Normalize to 0-1
    sentimentScore = (sentimentScore * textWeight) + (ratingScore * ratingWeight);
    
    // Override sentiment based on strong rating
    if (quickRating >= 4) {
      sentiment = "positive";
      sentimentScore = Math.max(sentimentScore, 0.65);
    } else if (quickRating <= 2) {
      sentiment = "negative";
      sentimentScore = Math.min(sentimentScore, 0.35);
    }
  }
  
  // Clamp to valid range
  sentimentScore = Math.max(0, Math.min(1, sentimentScore));
  
  return { sentiment, sentimentScore };
}

// Default/fallback context when interview data unavailable
export function createDefaultContext(): InterviewContext {
  return {
    themesDiscussed: [],
    overallSentiment: 'neutral',
    exchangeCount: 0,
    duration: 0,
    initialMood: null,
    keyTopicsMentioned: [],
  };
}
