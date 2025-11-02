/**
 * Comprehensive mock analytics data for demo purposes
 * Shows the full potential of Spradley with realistic multi-employee data
 */

export interface MockParticipationMetrics {
  totalAssigned: number;
  completed: number;
  pending: number;
  completionRate: number;
  avgDuration: number;
}

export interface MockSentimentMetrics {
  positive: number;
  neutral: number;
  negative: number;
  avgScore: number;
  moodImprovement: number;
}

export interface MockThemeInsight {
  id: string;
  name: string;
  responseCount: number;
  avgSentiment: number;
  urgencyCount: number;
}

export interface MockUrgencyFlag {
  id: string;
  response_id: string;
  escalation_type: string;
  escalated_at: string;
  resolved_at: string | null;
  responses: {
    content: string;
    sentiment: string;
    survey_themes: {
      name: string;
    };
  };
}

export interface MockResponse {
  id: string;
  content: string;
  sentiment: string;
  sentiment_score: number;
  created_at: string;
  survey_themes: {
    name: string;
  };
}

// Generate realistic participation data
export const generateMockParticipation = (): MockParticipationMetrics => ({
  totalAssigned: 247,
  completed: 201,
  pending: 46,
  completionRate: 81.4,
  avgDuration: 12.3
});

// Generate realistic sentiment data
export const generateMockSentiment = (): MockSentimentMetrics => ({
  positive: 89,
  neutral: 67,
  negative: 45,
  avgScore: 68.2,
  moodImprovement: 12.4
});

// Generate comprehensive theme insights
export const generateMockThemes = (): MockThemeInsight[] => [
  {
    id: "theme-1",
    name: "Work-Life Balance",
    responseCount: 156,
    avgSentiment: 42.3,
    urgencyCount: 8
  },
  {
    id: "theme-2", 
    name: "Career Growth",
    responseCount: 134,
    avgSentiment: 78.9,
    urgencyCount: 2
  },
  {
    id: "theme-3",
    name: "Team Collaboration",
    responseCount: 142,
    avgSentiment: 71.2,
    urgencyCount: 1
  },
  {
    id: "theme-4",
    name: "Leadership",
    responseCount: 98,
    avgSentiment: 58.7,
    urgencyCount: 5
  },
  {
    id: "theme-5",
    name: "Compensation",
    responseCount: 87,
    avgSentiment: 45.1,
    urgencyCount: 6
  },
  {
    id: "theme-6",
    name: "Company Culture",
    responseCount: 123,
    avgSentiment: 65.8,
    urgencyCount: 3
  },
  {
    id: "theme-7",
    name: "Work Environment",
    responseCount: 76,
    avgSentiment: 72.4,
    urgencyCount: 1
  },
  {
    id: "theme-8",
    name: "Communication",
    responseCount: 89,
    avgSentiment: 61.3,
    urgencyCount: 4
  }
];

// Generate urgent flags with realistic scenarios
export const generateMockUrgencyFlags = (): MockUrgencyFlag[] => [
  {
    id: "urgency-1",
    response_id: "resp-1",
    escalation_type: "ai_detected",
    escalated_at: "2025-01-20T14:30:00Z",
    resolved_at: null,
    responses: {
      content: "I'm really struggling with the constant after-hours expectations. My manager keeps sending emails at 10pm expecting immediate responses, and I feel like I can never disconnect. It's affecting my mental health and family time.",
      sentiment: "negative",
      survey_themes: {
        name: "Work-Life Balance"
      }
    }
  },
  {
    id: "urgency-2",
    response_id: "resp-2", 
    escalation_type: "ai_detected",
    escalated_at: "2025-01-19T16:45:00Z",
    resolved_at: null,
    responses: {
      content: "There's a serious issue with discrimination in our department. I've witnessed multiple instances where certain employees are treated differently based on their background, and HR seems to ignore complaints.",
      sentiment: "negative",
      survey_themes: {
        name: "Company Culture"
      }
    }
  },
  {
    id: "urgency-3",
    response_id: "resp-3",
    escalation_type: "ai_detected", 
    escalated_at: "2025-01-18T11:20:00Z",
    resolved_at: "2025-01-22T09:15:00Z",
    responses: {
      content: "The workload is completely unsustainable. I'm regularly working 60+ hour weeks and still falling behind. My manager keeps adding more projects without considering capacity.",
      sentiment: "negative",
      survey_themes: {
        name: "Work-Life Balance"
      }
    }
  },
  {
    id: "urgency-4",
    response_id: "resp-4",
    escalation_type: "ai_detected",
    escalated_at: "2025-01-17T13:10:00Z", 
    resolved_at: null,
    responses: {
      content: "I'm concerned about safety in our office. The building has several maintenance issues that haven't been addressed, including faulty electrical outlets and broken emergency exits.",
      sentiment: "negative",
      survey_themes: {
        name: "Work Environment"
      }
    }
  }
];

// Generate sample responses for the response list
export const generateMockResponses = (): MockResponse[] => [
  {
    id: "resp-1",
    content: "I love the collaborative environment here. My team is incredibly supportive and we work really well together on projects.",
    sentiment: "positive",
    sentiment_score: 85,
    created_at: "2025-01-20T14:30:00Z",
    survey_themes: {
      name: "Team Collaboration"
    }
  },
  {
    id: "resp-2", 
    content: "The career development opportunities have been amazing. I've learned so much in the past year and feel like I'm growing professionally.",
    sentiment: "positive",
    sentiment_score: 78,
    created_at: "2025-01-20T13:45:00Z",
    survey_themes: {
      name: "Career Growth"
    }
  },
  {
    id: "resp-3",
    content: "Work-life balance is a real challenge. I often find myself answering emails late at night and working weekends to meet deadlines.",
    sentiment: "negative", 
    sentiment_score: 25,
    created_at: "2025-01-20T12:20:00Z",
    survey_themes: {
      name: "Work-Life Balance"
    }
  },
  {
    id: "resp-4",
    content: "The leadership team is approachable and really listens to employee feedback. I feel heard and valued.",
    sentiment: "positive",
    sentiment_score: 72,
    created_at: "2025-01-20T11:15:00Z",
    survey_themes: {
      name: "Leadership"
    }
  },
  {
    id: "resp-5",
    content: "Compensation could be more competitive. I know I could earn more elsewhere, but I stay for the culture.",
    sentiment: "neutral",
    sentiment_score: 50,
    created_at: "2025-01-20T10:30:00Z",
    survey_themes: {
      name: "Compensation"
    }
  },
  {
    id: "resp-6",
    content: "The company culture is inclusive and welcoming. I feel comfortable being myself at work.",
    sentiment: "positive",
    sentiment_score: 88,
    created_at: "2025-01-20T09:45:00Z",
    survey_themes: {
      name: "Company Culture"
    }
  },
  {
    id: "resp-7",
    content: "Communication from leadership could be more transparent. Sometimes important decisions are made without much explanation.",
    sentiment: "negative",
    sentiment_score: 35,
    created_at: "2025-01-20T08:20:00Z",
    survey_themes: {
      name: "Communication"
    }
  },
  {
    id: "resp-8",
    content: "The office environment is modern and comfortable. Great facilities and amenities.",
    sentiment: "positive",
    sentiment_score: 82,
    created_at: "2025-01-19T17:30:00Z",
    survey_themes: {
      name: "Work Environment"
    }
  }
];

// Generate time-series data for charts
export const generateTimeSeriesData = () => {
  const data = [];
  const startDate = new Date('2025-01-01');
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    data.push({
      date: date.toISOString().split('T')[0],
      completed: Math.floor(Math.random() * 15) + 5,
      positive: Math.floor(Math.random() * 8) + 3,
      negative: Math.floor(Math.random() * 5) + 1,
      neutral: Math.floor(Math.random() * 4) + 2
    });
  }
  
  return data;
};

// Generate department-specific data
export const generateDepartmentData = () => [
  { department: "Engineering", participation: 95, avgSentiment: 72.3, responseCount: 45 },
  { department: "Marketing", participation: 88, avgSentiment: 68.7, responseCount: 38 },
  { department: "Sales", participation: 92, avgSentiment: 75.1, responseCount: 42 },
  { department: "HR", participation: 100, avgSentiment: 69.8, responseCount: 12 },
  { department: "Finance", participation: 85, avgSentiment: 64.2, responseCount: 28 },
  { department: "Operations", participation: 78, avgSentiment: 58.9, responseCount: 36 }
];

// Generate trend data showing improvement over time
export const generateTrendData = () => [
  { period: "Q3 2024", participation: 67, avgSentiment: 58.2, urgentFlags: 12 },
  { period: "Q4 2024", participation: 73, avgSentiment: 62.1, urgentFlags: 8 },
  { period: "Q1 2025", participation: 81, avgSentiment: 68.2, urgentFlags: 4 }
];

// Generate mock quality metrics
export const generateMockQualityMetrics = () => ({
  total_sessions: 201,
  completed_sessions: 201,
  average_quality_score: 78.5,
  average_confidence_score: 82,
  high_confidence_count: 156,
  medium_confidence_count: 38,
  low_confidence_count: 7,
  excellent_quality: 89,
  good_quality: 87,
  fair_quality: 22,
  poor_quality: 3,
  average_exchanges: 12.3,
  average_duration: 12.3,
  average_themes_explored: 3.2,
  average_follow_up_effectiveness: 75.8,
  high_confidence_percentage: 77.6,
  medium_confidence_percentage: 18.9,
  low_confidence_percentage: 3.5
});

// Generate mock quality insights
export const generateMockQualityInsights = () => [
  {
    type: "strength",
    title: "High Engagement Quality",
    description: "Most conversations show strong engagement with detailed responses",
    metric: "78.5%",
    recommendation: "Continue current conversation approach"
  },
  {
    type: "opportunity",
    title: "Follow-up Effectiveness",
    description: "Follow-up questions could be more targeted to dive deeper",
    metric: "75.8%",
    recommendation: "Enhance AI follow-up questions based on response patterns"
  }
];

// Generate mock enhanced themes
export const generateMockEnhancedThemes = () => [
  {
    theme_id: "theme-1",
    theme_name: "Work-Life Balance",
    avg_sentiment: 42.3,
    response_count: 156,
    quotes: [],
    sub_themes: [
      { 
        name: "After-hours expectations", 
        avg_sentiment: 25, 
        frequency: 45,
        representative_quotes: [
          "Manager sends emails at 10pm expecting immediate responses",
          "Weekend work has become the norm"
        ]
      },
      { 
        name: "Weekend work", 
        avg_sentiment: 38, 
        frequency: 32,
        representative_quotes: [
          "Regularly working weekends to meet deadlines"
        ]
      }
    ],
    sentiment_drivers: [
      { 
        phrase: "Email expectations", 
        sentiment_impact: -25, 
        frequency: 45,
        context: ["After-hours communication", "Immediate response expectations"]
      }
    ],
    follow_up_effectiveness: 72.5
  },
  {
    theme_id: "theme-2",
    theme_name: "Career Growth",
    avg_sentiment: 78.9,
    response_count: 134,
    quotes: [],
    sub_themes: [
      { 
        name: "Development opportunities", 
        avg_sentiment: 82, 
        frequency: 89,
        representative_quotes: [
          "Career development workshops have been really helpful",
          "Great learning opportunities available"
        ]
      },
      { 
        name: "Promotion paths", 
        avg_sentiment: 72, 
        frequency: 45,
        representative_quotes: [
          "Clear promotion paths and opportunities"
        ]
      }
    ],
    sentiment_drivers: [
      { 
        phrase: "Workshop availability", 
        sentiment_impact: 15, 
        frequency: 67,
        context: ["Regular training sessions", "Skill development programs"]
      }
    ],
    follow_up_effectiveness: 81.2
  }
];

// Generate mock quotes
export const generateMockQuotes = () => [
  {
    id: "quote-1",
    text: "I love the collaborative environment here. My team is incredibly supportive.",
    sentiment: "positive" as const,
    sentiment_score: 85,
    theme_id: "theme-3",
    theme_name: "Team Collaboration",
    session_id: "session-1",
    created_at: "2025-01-20T14:30:00Z",
    department: "Engineering"
  },
  {
    id: "quote-2",
    text: "The constant after-hours expectations are really affecting my work-life balance.",
    sentiment: "negative" as const,
    sentiment_score: 25,
    theme_id: "theme-1",
    theme_name: "Work-Life Balance",
    session_id: "session-2",
    created_at: "2025-01-20T12:20:00Z",
    department: "Marketing"
  },
  {
    id: "quote-3",
    text: "The career development opportunities have been amazing. I've learned so much in the past year.",
    sentiment: "positive" as const,
    sentiment_score: 78,
    theme_id: "theme-2",
    theme_name: "Career Growth",
    session_id: "session-3",
    created_at: "2025-01-20T13:45:00Z",
    department: "Sales"
  },
  {
    id: "quote-4",
    text: "My manager keeps sending emails at 10pm expecting immediate responses. It's affecting my family time.",
    sentiment: "negative" as const,
    sentiment_score: 22,
    theme_id: "theme-1",
    theme_name: "Work-Life Balance",
    session_id: "session-4",
    created_at: "2025-01-19T16:30:00Z",
    department: "Operations"
  }
];

// Generate mock narrative summary
export const generateMockNarrative = () => ({
  overview: "Overall employee sentiment shows improvement, with strong collaboration and career growth themes. Work-life balance remains a key concern requiring attention.",
  key_insights: [
    "Team collaboration is highly valued",
    "Career development opportunities are appreciated",
    "Work-life balance needs improvement"
  ],
  top_concerns: [
    "After-hours communication expectations",
    "Work-life balance boundaries"
  ],
  positive_aspects: [
    "Strong team collaboration",
    "Career development opportunities"
  ],
  recommended_actions: [
    "Establish after-hours communication policy",
    "Improve work-life balance boundaries"
  ]
});

// Generate mock patterns
export const generateMockPatterns = () => [
  {
    pattern: "Work-life balance and communication correlation",
    frequency: 89,
    affected_themes: ["Work-Life Balance", "Communication"],
    representative_quotes: [],
    correlation_strength: 0.78
  }
];

// Generate mock root causes
export const generateMockRootCauses = () => [
  {
    id: "rc-1",
    theme_id: "theme-1",
    theme_name: "Work-Life Balance",
    cause: "Unclear boundaries around after-hours communication",
    evidence: ["45 responses mention late-night emails", "32 mention weekend work expectations"],
    frequency: 77,
    impact_score: 85,
    affected_employees: 77,
    representative_quotes: [
      "Manager sends emails at 10pm expecting immediate responses",
      "Weekend work has become the norm"
    ]
  }
];

// Generate mock interventions
export const generateMockInterventions = () => [
  {
    id: "int-1",
    title: "Establish After-Hours Communication Policy",
    description: "Create clear guidelines for when employees are expected to respond to communications",
    rationale: "Addresses root cause of work-life balance concerns",
    root_causes: ["rc-1"],
    estimated_impact: 15,
    effort_level: "low",
    timeline: "2-3 weeks",
    priority: "high",
    quick_win: true,
    related_themes: ["Work-Life Balance", "Communication"],
    action_steps: [
      "Draft communication policy",
      "Get leadership approval",
      "Communicate to all employees"
    ],
    success_metrics: ["Reduction in after-hours email mentions", "Improved work-life balance sentiment"]
  }
];

// Generate mock quick wins
export const generateMockQuickWins = () => [
  {
    id: "qw-1",
    title: "Weekly Team Check-ins",
    description: "Add brief weekly check-ins to improve communication",
    effort: "very_low",
    impact: "medium",
    implementation_time: "1 week",
    affected_theme: "Communication",
    evidence: ["Employees want more regular updates"]
  }
];

// Generate mock impact predictions
export const generateMockImpactPredictions = () => [
  {
    theme_id: "theme-1",
    theme_name: "Work-Life Balance",
    current_sentiment: 42.3,
    predicted_sentiment: 58.5,
    improvement: 16.2,
    confidence: 82,
    interventions: ["int-1"]
  }
];

// Generate mock NLP analysis
export const generateMockNLPAnalysis = () => ({
  key_phrases: [
    { phrase: "work-life balance", frequency: 156, sentiment: -0.35 },
    { phrase: "career growth", frequency: 134, sentiment: 0.78 }
  ],
  topics: [
    { topic: "Collaboration", weight: 0.32 },
    { topic: "Work-life balance", weight: 0.28 }
  ],
  emotion_distribution: {
    joy: 0.35,
    concern: 0.28,
    satisfaction: 0.25,
    frustration: 0.12
  }
});

// Generate mock cultural map
export const generateMockCulturalMap = () => ({
  values: [
    { value: "Collaboration", strength: 0.85, mentions: 142 },
    { value: "Innovation", strength: 0.72, mentions: 98 }
  ],
  concerns: [
    { concern: "Work-life balance", severity: 0.65, mentions: 156 }
  ]
});