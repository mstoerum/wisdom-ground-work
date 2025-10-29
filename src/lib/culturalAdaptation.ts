export interface CulturalContext {
  region: 'US/UK' | 'Nordic' | 'East Asia' | 'Latin America';
  language: string;
  organizationType: 'Corporate' | 'Startup' | 'Nonprofit' | 'Government';
}

export interface CulturalTone {
  empathy: string;
  questions: string;
  responses: string;
  pacing: string;
  introduction: string;
  closure: string;
}

export const getCulturalTone = (context: CulturalContext): CulturalTone => {
  const toneMap: Record<CulturalContext['region'], CulturalTone> = {
    'US/UK': {
      empathy: "I understand that's challenging",
      questions: "What would help make this better?",
      responses: "Let's focus on solutions",
      pacing: "Direct and solution-oriented",
      introduction: "This might feel different from typical surveys, and that's okay. We're here to listen, not judge.",
      closure: "Thank you for sharing your perspective. Your input helps us build a better workplace."
    },
    'Nordic': {
      empathy: "I can see this is difficult",
      questions: "How does this affect you?",
      responses: "Take your time to reflect",
      pacing: "Reflective and supportive",
      introduction: "This conversation is designed to be a safe space for reflection. There's no pressure to share more than you're comfortable with.",
      closure: "Thank you for taking the time to reflect with us. Your thoughts are valued."
    },
    'East Asia': {
      empathy: "This must be affecting your team",
      questions: "How does this impact your group?",
      responses: "Consider the collective impact",
      pacing: "Group-focused and harmony-oriented",
      introduction: "We value your perspective on how this affects your team and our collective success. Your voice helps us all work better together.",
      closure: "Thank you for considering how this impacts our team. Together, we can create a better workplace for everyone."
    },
    'Latin America': {
      empathy: "I can feel this is important to you",
      questions: "What matters most to you about this?",
      responses: "Your perspective is valued",
      pacing: "Warm and relational",
      introduction: "We care about your experience and want to understand what matters most to you. This conversation is about building stronger connections.",
      closure: "Thank you for sharing what matters to you. Your voice strengthens our community."
    }
  };
  
  return toneMap[context.region];
};

export const adaptMessage = (message: string, context: CulturalContext): string => {
  const tone = getCulturalTone(context);
  
  // Simple adaptation logic - in production, this would be more sophisticated
  let adaptedMessage = message;
  
  // Adapt empathy expressions
  if (message.includes('I understand')) {
    adaptedMessage = adaptedMessage.replace('I understand', tone.empathy);
  }
  
  if (message.includes('I can see')) {
    adaptedMessage = adaptedMessage.replace('I can see', tone.empathy);
  }
  
  // Adapt questions
  if (message.includes('What would help')) {
    adaptedMessage = adaptedMessage.replace('What would help', tone.questions);
  }
  
  if (message.includes('How does this affect')) {
    adaptedMessage = adaptedMessage.replace('How does this affect', tone.questions);
  }
  
  return adaptedMessage;
};

export const getCulturalIntroduction = (context: CulturalContext): string => {
  const tone = getCulturalTone(context);
  return tone.introduction;
};

export const getCulturalClosure = (context: CulturalContext): string => {
  const tone = getCulturalTone(context);
  return tone.closure;
};

// Detect cultural context from user data or browser settings
export const detectCulturalContext = (): CulturalContext => {
  // In a real implementation, this would use:
  // - Browser language settings
  // - User profile data
  // - Organization settings
  // - IP geolocation (with user consent)
  
  const browserLanguage = navigator.language || 'en-US';
  
  // Simple detection based on language
  if (browserLanguage.startsWith('zh') || browserLanguage.startsWith('ja') || browserLanguage.startsWith('ko')) {
    return {
      region: 'East Asia',
      language: browserLanguage,
      organizationType: 'Corporate'
    };
  }
  
  if (browserLanguage.startsWith('sv') || browserLanguage.startsWith('no') || browserLanguage.startsWith('da')) {
    return {
      region: 'Nordic',
      language: browserLanguage,
      organizationType: 'Corporate'
    };
  }
  
  if (browserLanguage.startsWith('es') || browserLanguage.startsWith('pt')) {
    return {
      region: 'Latin America',
      language: browserLanguage,
      organizationType: 'Corporate'
    };
  }
  
  // Default to US/UK
  return {
    region: 'US/UK',
    language: browserLanguage,
    organizationType: 'Corporate'
  };
};