/**
 * Theme-specific feeling-focused first questions
 * These replace open-ended and scale-based questions with specific, answerable prompts
 */

export type ThemeKey = 
  | "work-satisfaction" 
  | "work-life-balance" 
  | "team-collaboration" 
  | "career-growth" 
  | "leadership" 
  | "culture"
  | "compensation"
  | "communication"
  | "recognition"
  | "workload";

// Employee satisfaction themes - feeling-focused questions
export const THEME_FIRST_QUESTIONS: Record<ThemeKey, string[]> = {
  "work-satisfaction": [
    "When you think about heading to work, what's the first feeling that comes up?",
    "How has your energy been when you arrive at work this week?",
    "What's been taking up most of your mental space at work lately?"
  ],
  "work-life-balance": [
    "When you leave work at the end of the day, how easy is it to switch off?",
    "How have your evenings and weekends been feeling lately?",
    "Do you find yourself thinking about work during personal time?"
  ],
  "team-collaboration": [
    "How connected do you feel to the people you work with right now?",
    "When you need support at work, how does it feel to ask for help?",
    "What's it like when you collaborate with your team on a project?"
  ],
  "career-growth": [
    "When you imagine where you'll be in a year, how does that make you feel?",
    "How excited or stuck do you feel about your growth here?",
    "Do you feel like you're learning new things in your current role?"
  ],
  "leadership": [
    "How supported do you feel by those leading your team?",
    "When decisions are made that affect you, how heard do you feel?",
    "What's your relationship like with your direct manager?"
  ],
  "culture": [
    "How comfortable do you feel being yourself at work?",
    "What's the atmosphere like when you walk into the office or join a call?",
    "How would you describe the vibe of your workplace right now?"
  ],
  "compensation": [
    "How do you feel about the recognition you receive for your work?",
    "Do you feel fairly valued for what you contribute?",
    "What comes to mind when you think about your compensation?"
  ],
  "communication": [
    "How clear do things feel at work right now - do you know what's expected?",
    "When important news comes down, how well-informed do you feel?",
    "How easy is it to get the information you need to do your job?"
  ],
  "recognition": [
    "When was the last time you felt genuinely appreciated at work?",
    "How acknowledged do you feel for the effort you put in?",
    "Does good work get noticed around here?"
  ],
  "workload": [
    "How manageable does your workload feel right now?",
    "Do you feel like you have enough time to do your work well?",
    "What's your energy like by the end of most workdays?"
  ]
};

// Course evaluation themes - feeling-focused questions
export const COURSE_FIRST_QUESTIONS: Record<string, string[]> = {
  "teaching-effectiveness": [
    "How engaged did you feel during the lectures?",
    "When the instructor explains something, how clear does it feel?",
    "What's your experience been like in class sessions?"
  ],
  "learning-outcomes": [
    "How confident do you feel about what you've learned so far?",
    "When you think about applying this material, how prepared do you feel?",
    "Do you feel like you're genuinely learning and growing?"
  ],
  "course-materials": [
    "How helpful have the course materials been for your learning?",
    "Do the readings and resources feel relevant and useful?",
    "What's your experience been with the textbook or online materials?"
  ],
  "assessment": [
    "How fair do the assignments and exams feel?",
    "Do you feel like assessments reflect what you've actually learned?",
    "How useful has the feedback on your work been?"
  ],
  "engagement": [
    "How motivated do you feel to participate in this course?",
    "What's the energy like in class discussions?",
    "Do you look forward to this class, or does it feel like a chore?"
  ]
};

// Default fallback questions when no theme match
export const DEFAULT_FIRST_QUESTIONS = [
  "How have things been feeling at work lately?",
  "What's been on your mind about your work experience?",
  "How would you describe your current work situation?"
];

export const DEFAULT_COURSE_QUESTIONS = [
  "How has your learning experience been in this course?",
  "What stands out most about this course so far?",
  "How would you describe your experience as a student here?"
];

/**
 * Select a first question based on the primary theme
 */
export function selectFirstQuestion(
  themes: { name: string; description?: string }[],
  surveyType: "employee_satisfaction" | "course_evaluation" = "employee_satisfaction"
): string {
  if (!themes || themes.length === 0) {
    return surveyType === "course_evaluation" 
      ? DEFAULT_COURSE_QUESTIONS[0] 
      : DEFAULT_FIRST_QUESTIONS[0];
  }

  const primaryTheme = themes[0];
  const themeName = primaryTheme.name.toLowerCase().replace(/\s+/g, "-");

  // Try to find matching questions
  if (surveyType === "course_evaluation") {
    const questions = COURSE_FIRST_QUESTIONS[themeName];
    if (questions && questions.length > 0) {
      return questions[Math.floor(Math.random() * questions.length)];
    }
    return DEFAULT_COURSE_QUESTIONS[0];
  }

  // Employee satisfaction
  const questions = THEME_FIRST_QUESTIONS[themeName as ThemeKey];
  if (questions && questions.length > 0) {
    return questions[Math.floor(Math.random() * questions.length)];
  }

  // Try partial matching
  for (const [key, qs] of Object.entries(THEME_FIRST_QUESTIONS)) {
    if (themeName.includes(key) || key.includes(themeName)) {
      return qs[Math.floor(Math.random() * qs.length)];
    }
  }

  return DEFAULT_FIRST_QUESTIONS[0];
}

/**
 * Get a mood-adaptive follow-up response based on the user's initial mood selection
 * Returns an empathy phrase and a contextual follow-up question
 */
export function getMoodAdaptiveResponse(
  mood: number, 
  themes: { name: string; description?: string }[] = [],
  surveyType: "employee_satisfaction" | "course_evaluation" = "employee_satisfaction"
): { empathy: string | null; question: string } {
  const isCourse = surveyType === "course_evaluation";
  
  // Get theme context for more relevant questions
  const primaryTheme = themes[0]?.name?.toLowerCase() || "";
  
  switch(mood) {
    case 1: // Tough
      return {
        empathy: null, // First message after mood, no empathy needed
        question: isCourse 
          ? "I hear that. What's been the hardest part of this course?"
          : "I hear that. What's been the biggest challenge this week?"
      };
    case 2: // Not great
      return {
        empathy: null,
        question: isCourse
          ? "Thanks for being honest. What's been weighing on you about the course?"
          : "Thanks for being honest. What's been weighing on you?"
      };
    case 3: // Okay
      return {
        empathy: null,
        question: isCourse
          ? "Got it. Is there anything about the course that could be better?"
          : "Got it. Is there anything that could make things better right now?"
      };
    case 4: // Good
      return {
        empathy: null,
        question: isCourse
          ? "Nice! What's been working well for you in this course?"
          : "Nice! What's been going well for you lately?"
      };
    case 5: // Great!
      return {
        empathy: null,
        question: isCourse
          ? "Love to hear it! What's making this course work so well for you?"
          : "Love to hear it! What's making things feel good right now?"
      };
    default:
      return {
        empathy: null,
        question: isCourse
          ? "How has your learning experience been in this course?"
          : "How have things been feeling at work lately?"
      };
  }
}

/**
 * Build the warm, brief introduction with the first question
 */
export function buildWarmIntroduction(
  firstQuestion: string,
  surveyType: "employee_satisfaction" | "course_evaluation" = "employee_satisfaction"
): string {
  const context = surveyType === "course_evaluation" 
    ? "your learning experience"
    : "how things are going at work";

  return `Hi, I'm Spradley. Thanks for taking a few minutes to chat about ${context}.

${firstQuestion}`;
}
