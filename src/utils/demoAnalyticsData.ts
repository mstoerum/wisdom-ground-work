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