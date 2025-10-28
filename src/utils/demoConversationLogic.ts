export interface DemoMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  theme?: string;
}

export interface ConversationState {
  messages: DemoMessage[];
  currentTheme: string | null;
  exchangeCount: number;
  detectedSentiment: "positive" | "negative" | "neutral" | null;
  mentionedTopics: Set<string>;
}

// Keyword detection helpers
const containsKeywords = (text: string, keywords: string[]): boolean => {
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword));
};

// Sentiment detection
export const detectSentiment = (text: string): "positive" | "negative" | "neutral" => {
  const positiveKeywords = ["good", "great", "happy", "satisfied", "fine", "excellent", "wonderful", "love", "enjoy"];
  const negativeKeywords = ["stressed", "overwhelmed", "tired", "frustrated", "challenging", "difficult", "bad", "poor", "hate", "struggle"];
  
  if (containsKeywords(text, positiveKeywords)) return "positive";
  if (containsKeywords(text, negativeKeywords)) return "negative";
  return "neutral";
};

// Topic detection
export const detectTopics = (text: string): string[] => {
  const topics: string[] = [];
  
  if (containsKeywords(text, ["time", "hours", "workload", "busy", "overtime"])) {
    topics.push("workload");
  }
  if (containsKeywords(text, ["team", "colleagues", "manager", "leadership", "coworker"])) {
    topics.push("team");
  }
  if (containsKeywords(text, ["growth", "learning", "career", "development", "promotion"])) {
    topics.push("growth");
  }
  if (containsKeywords(text, ["balance", "personal", "family", "life", "flexible"])) {
    topics.push("work-life-balance");
  }
  if (containsKeywords(text, ["culture", "values", "environment", "atmosphere"])) {
    topics.push("culture");
  }
  
  return topics;
};

// Response generation
export const generateResponse = (state: ConversationState, userMessage: string): DemoMessage => {
  const sentiment = detectSentiment(userMessage);
  const topics = detectTopics(userMessage);
  
  // Update mentioned topics
  topics.forEach(topic => state.mentionedTopics.add(topic));
  
  let response = "";
  let theme = "";
  
  // Opening greeting
  if (state.exchangeCount === 0) {
    response = "Hi! Thank you for trying Spradley. I'm here to understand your work experience. How are you feeling about work lately?";
    theme = "opening";
  }
  // First response based on sentiment
  else if (state.exchangeCount === 1) {
    if (sentiment === "positive") {
      response = "That's wonderful to hear! Even when things are going well, there's always room to grow. What aspect of your work brings you the most satisfaction right now?";
      theme = "satisfaction";
    } else if (sentiment === "negative") {
      response = "I appreciate you being honest. It takes courage to share challenges. Can you tell me more about what's been most difficult? I'm here to listen.";
      theme = "challenges";
    } else {
      response = "I understand - work can be a mixed bag. Let's explore both sides. What's one thing that's working well for you, and one area where you'd like to see improvement?";
      theme = "mixed-feelings";
    }
  }
  // Follow-up based on topics mentioned
  else if (state.exchangeCount === 2) {
    if (state.mentionedTopics.has("workload")) {
      response = "Work-life balance is so important. How do you feel about the boundaries between your work time and personal time? Are you able to disconnect when needed?";
      theme = "work-life-balance";
    } else if (state.mentionedTopics.has("team")) {
      response = "Team dynamics really shape our daily experience. How would you describe the collaboration and communication within your team?";
      theme = "team-collaboration";
    } else if (state.mentionedTopics.has("growth")) {
      response = "Career development is crucial for long-term satisfaction. Do you feel you have opportunities to learn and grow in your current role?";
      theme = "development";
    } else {
      response = "That's really insightful. Thinking about your day-to-day experience, how would you describe the overall workplace culture and environment?";
      theme = "culture";
    }
  }
  // Deeper follow-up
  else if (state.exchangeCount === 3) {
    if (sentiment === "negative") {
      response = "Thank you for sharing that. Understanding these challenges is the first step to meaningful change. If you could change one thing about your current situation, what would have the biggest positive impact?";
      theme = "improvement-priorities";
    } else {
      response = "I appreciate you taking the time to share these details. Your perspective helps paint a fuller picture. Is there anything else about your work experience that feels important to mention?";
      theme = "additional-thoughts";
    }
  }
  // Closing question
  else if (state.exchangeCount === 4) {
    response = "Thank you for sharing so openly with me. Before we finish, is there one thing you'd change about your work experience if you could?";
    theme = "final-wishes";
  }
  // Final thank you
  else {
    response = "I really appreciate your time and honesty. Your feedback will help create meaningful change. In a real survey, this conversation would be anonymously analyzed for themes and sentiment, and your HR team would receive actionable insights - never your individual responses.";
    theme = "closing";
  }
  
  return {
    role: "assistant",
    content: response,
    timestamp: new Date(),
    theme
  };
};

// Educational tips to show during conversation
export const getEducationalTip = (exchangeCount: number): string | null => {
  const tips = [
    null, // No tip on opening
    "💡 Traditional surveys would have moved on to the next question",
    "💡 Notice how the AI validates your feelings, not just collects data",
    "💡 The AI naturally explored a new theme based on your response",
    null,
    null
  ];
  
  return tips[exchangeCount] || null;
};
