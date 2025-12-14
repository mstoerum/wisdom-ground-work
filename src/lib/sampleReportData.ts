import { CommitmentSignature, SprintAction } from './reportDesignSystem';

export interface SampleQuote {
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  agreementPercentage: number;
  theme?: string;
}

export interface SampleThemeHealth {
  id: string;
  name: string;
  healthScore: number;
  responseCount: number;
  trend: 'improving' | 'stable' | 'declining';
  keyInsight: string;
}

export const SAMPLE_QUOTES: SampleQuote[] = [
  {
    text: "I love my team, but I spend 4-5 hours daily in meetings. By the time I can focus on actual work, I'm already exhausted.",
    sentiment: 'negative',
    agreementPercentage: 73,
    theme: 'Work-Life Balance'
  },
  {
    text: "The new flexible work policy has been a game-changer for my productivity and mental health.",
    sentiment: 'positive',
    agreementPercentage: 81,
    theme: 'Work-Life Balance'
  },
  {
    text: "Career development conversations happen regularly and I feel supported in my growth path.",
    sentiment: 'positive',
    agreementPercentage: 68,
    theme: 'Career Development'
  },
  {
    text: "Recognition feels genuine here - my manager notices the small wins, not just the big projects.",
    sentiment: 'positive',
    agreementPercentage: 62,
    theme: 'Recognition'
  },
  {
    text: "Cross-team communication has improved significantly since we started weekly sync-ups.",
    sentiment: 'positive',
    agreementPercentage: 55,
    theme: 'Communication'
  },
  {
    text: "I'm unclear about how decisions are made at the leadership level - more transparency would help.",
    sentiment: 'neutral',
    agreementPercentage: 47,
    theme: 'Leadership'
  }
];

export const SAMPLE_THEME_HEALTH: SampleThemeHealth[] = [
  {
    id: '1',
    name: 'Work-Life Balance',
    healthScore: 38,
    responseCount: 47,
    trend: 'declining',
    keyInsight: 'Meeting overload is the primary concern'
  },
  {
    id: '2',
    name: 'Career Development',
    healthScore: 85,
    responseCount: 32,
    trend: 'improving',
    keyInsight: 'Mentorship programs driving satisfaction'
  },
  {
    id: '3',
    name: 'Team Collaboration',
    healthScore: 72,
    responseCount: 28,
    trend: 'stable',
    keyInsight: 'Strong within teams, cross-team needs work'
  },
  {
    id: '4',
    name: 'Recognition',
    healthScore: 65,
    responseCount: 24,
    trend: 'improving',
    keyInsight: 'Manager recognition strong, peer recognition growing'
  },
  {
    id: '5',
    name: 'Leadership Trust',
    healthScore: 52,
    responseCount: 19,
    trend: 'stable',
    keyInsight: 'Decision transparency requested'
  }
];

export const SAMPLE_SPRINT_ACTIONS: SprintAction[] = [
  {
    id: '1',
    text: 'Implement No-Meeting Wednesdays - Block all recurring meetings on Wednesdays to allow deep work time',
    timeline: 'immediate',
    impact: 'high',
    owner: 'Leadership Team',
  },
  {
    id: '2',
    text: 'Launch Peer Recognition Slack Channel - Create dedicated space for public peer appreciation',
    timeline: 'immediate',
    impact: 'medium',
    owner: 'HR Team',
  },
  {
    id: '3',
    text: 'Audit and Reduce Recurring Meetings - Review all recurring meetings and eliminate low-value ones',
    timeline: 'short',
    impact: 'high',
    owner: 'Department Heads',
  },
  {
    id: '4',
    text: 'Monthly Leadership Town Halls - Regular all-hands with Q&A to improve decision transparency',
    timeline: 'short',
    impact: 'high',
    owner: 'Executive Team',
  },
  {
    id: '5',
    text: 'Cross-Team Collaboration Framework - Define clear protocols for cross-departmental projects',
    timeline: 'medium',
    impact: 'medium',
    owner: 'Operations',
  }
];

export const SAMPLE_COMMITMENTS: CommitmentSignature[] = [
  {
    name: 'Sarah Chen',
    role: 'VP of People',
    date: new Date('2025-01-10'),
    pledges: [
      'We will implement No-Meeting Wednesdays by end of month',
      'We commit to sharing leadership decisions within 48 hours'
    ]
  }
];

export const SAMPLE_PULSE_METRICS = {
  participationRate: 78,
  participationTrend: 'up' as const,
  overallSentiment: 62,
  sentimentImprovement: 5,
  urgentFlags: 8,
  confidenceScore: 85,
  totalResponses: 156,
  totalVoices: 89
};

export const SAMPLE_CHAPTER_NARRATIVES = {
  voices: "89 colleagues shared their perspectives over the past 30 days. Their voices reveal a workforce that values connection but struggles with time. The most resonant theme? 'Meeting overload'—mentioned in 47 responses with 73% agreement.",
  landscape: "Five themes emerged from the collective voice. Work-Life Balance sits in the critical zone at 38%, driven primarily by meeting fatigue. Career Development, however, tells a thriving story at 85%—your mentorship investments are paying dividends.",
  journey: "The emotional trajectory shows morning energy dipping after 10am across the organization. Wednesday emerges as the most challenging day, while Thursday shows recovery. This temporal pattern directly correlates with meeting density.",
  why: "Digging deeper, the root cause crystallizes: it's not the meetings themselves, but their cascading effect. 4+ hours of meetings creates a 'focus debt' that pushes real work into personal time, eroding the boundary between office and home.",
  path: "Three intervention points emerge: immediate wins (No-Meeting Wednesdays), 30-day goals (meeting audits), and 90-day culture shifts (collaboration frameworks). The path forward is clear—and achievable."
};
