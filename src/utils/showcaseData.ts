/**
 * Curated showcase dataset for the ACME Inc demo
 * This tells a compelling story about a 250-person tech company's Q1 2025 survey
 */

import type { ParticipationMetrics, SentimentMetrics, ThemeInsight as BasicThemeInsight } from "@/hooks/useAnalytics";
import type { 
  ThemeInsight as EnhancedThemeInsight, 
  ConversationQuote 
} from "@/lib/conversationAnalytics";
import type { 
  RootCause, 
  InterventionRecommendation, 
  QuickWin, 
  ImpactPrediction 
} from "@/lib/actionableIntelligence";
import type { AggregateQualityMetrics, QualityInsight } from "@/lib/conversationQuality";

// Company context
export const showcaseCompany = {
  name: "ACME Inc",
  employeeCount: 250,
  surveyName: "Q1 2025 Employee Pulse Survey",
  surveyPeriod: "January 15 - February 2, 2025",
};

// Participation metrics - 81% participation rate
export const showcaseParticipation: ParticipationMetrics = {
  totalAssigned: 247,
  completed: 201,
  pending: 46,
  completionRate: 81.4,
  avgDuration: 12.3,
};

// Sentiment with mood improvement story
export const showcaseSentiment: SentimentMetrics = {
  positive: 89,
  neutral: 67,
  negative: 45,
  avgScore: 68,
  moodImprovement: 12.4,
};

// Basic themes for ThemeHealthList (using BasicThemeInsight from useAnalytics)
export const showcaseThemes: BasicThemeInsight[] = [
  {
    id: "theme-wlb",
    name: "Work-Life Balance",
    responseCount: 156,
    avgSentiment: 38,
    urgencyCount: 8,
    keySignals: {
      concerns: [
        "Manager expects immediate responses to emails sent after 10pm, even on weekends...",
        "Working weekends has become the norm, not the exception anymore...",
        "No boundaries between work and personal life - I'm exhausted...",
      ],
      positives: [
        "Flexible hours policy has been helpful for doctor's appointments...",
      ],
      other: [
        "Would appreciate clearer guidelines on after-hours communication expectations...",
      ],
    },
  },
  {
    id: "theme-career",
    name: "Career Development",
    responseCount: 134,
    avgSentiment: 85,
    urgencyCount: 0,
    keySignals: {
      concerns: [
        "More clarity needed on promotion criteria...",
      ],
      positives: [
        "The new mentorship program has been incredible for my growth...",
        "My manager creates a clear development plan every quarter...",
        "Learning budget is generous and easy to use...",
      ],
      other: [
        "Would love more cross-team project opportunities...",
      ],
    },
  },
  {
    id: "theme-leadership",
    name: "Leadership & Management",
    responseCount: 98,
    avgSentiment: 52,
    urgencyCount: 2,
    keySignals: {
      concerns: [
        "Decisions are made without consulting the people who do the work...",
        "Communication from leadership feels inconsistent...",
      ],
      positives: [
        "Direct manager is supportive and advocates for the team...",
      ],
      other: [
        "Town halls are informative but Q&A time is too short...",
      ],
    },
  },
  {
    id: "theme-compensation",
    name: "Compensation & Benefits",
    responseCount: 87,
    avgSentiment: 71,
    urgencyCount: 1,
    keySignals: {
      concerns: [
        "Salary hasn't kept up with market rates for my role...",
      ],
      positives: [
        "Healthcare benefits are excellent compared to previous jobs...",
        "401k matching is very competitive...",
      ],
      other: [
        "Would appreciate more transparency about pay bands...",
      ],
    },
  },
  {
    id: "theme-communication",
    name: "Team Communication",
    responseCount: 112,
    avgSentiment: 74,
    urgencyCount: 0,
    keySignals: {
      concerns: [
        "Too many meetings that could have been emails...",
      ],
      positives: [
        "Slack channels keep everyone aligned on priorities...",
        "Weekly standups are actually useful and well-run...",
      ],
      other: [
        "Would be nice to have more async communication options...",
      ],
    },
  },
];

// Enhanced themes for EnhancedThemeAnalysis (using EnhancedThemeInsight from conversationAnalytics)
export const showcaseEnhancedThemes: EnhancedThemeInsight[] = [
  {
    theme_id: "theme-wlb",
    theme_name: "Work-Life Balance",
    response_count: 156,
    avg_sentiment: 38,
    quotes: [],
    sub_themes: [
      { name: "After Hours Work", frequency: 47, avg_sentiment: 28, representative_quotes: ["Manager expects immediate responses to emails sent after 10pm..."] },
      { name: "Weekend Work", frequency: 38, avg_sentiment: 32, representative_quotes: ["Working weekends has become the norm..."] },
    ],
    sentiment_drivers: [
      { phrase: "after hours", frequency: 47, sentiment_impact: -35, context: ["Expected to respond to late night emails"] },
      { phrase: "burnout", frequency: 23, sentiment_impact: -42, context: ["Showing signs of burnout"] },
    ],
    follow_up_effectiveness: 0.78,
  },
  {
    theme_id: "theme-career",
    theme_name: "Career Development",
    response_count: 134,
    avg_sentiment: 85,
    quotes: [],
    sub_themes: [
      { name: "Mentorship Program", frequency: 67, avg_sentiment: 92, representative_quotes: ["The new mentorship program has been incredible..."] },
      { name: "Learning Budget", frequency: 45, avg_sentiment: 88, representative_quotes: ["Learning budget is generous..."] },
    ],
    sentiment_drivers: [
      { phrase: "mentorship", frequency: 67, sentiment_impact: 42, context: ["Incredible for my growth"] },
      { phrase: "development plan", frequency: 45, sentiment_impact: 35, context: ["Clear development plan every quarter"] },
    ],
    follow_up_effectiveness: 0.85,
  },
];

// Employee voice quotes (using ConversationQuote from conversationAnalytics)
export const showcaseQuotes: ConversationQuote[] = [
  {
    id: "quote-1",
    text: "The new mentorship program has been incredible for my growth. My mentor helped me navigate a difficult project and I learned so much.",
    sentiment: "positive",
    sentiment_score: 92,
    theme_id: "theme-career",
    theme_name: "Career Development",
    session_id: "session-1",
    created_at: "2025-01-28T10:30:00Z",
    department: "Product",
  },
  {
    id: "quote-2",
    text: "Manager expects immediate responses to emails sent after 10pm, even on weekends. It's affecting my family time and mental health.",
    sentiment: "negative",
    sentiment_score: 22,
    theme_id: "theme-wlb",
    theme_name: "Work-Life Balance",
    session_id: "session-2",
    created_at: "2025-01-25T14:15:00Z",
    department: "Engineering",
  },
  {
    id: "quote-3",
    text: "Healthcare benefits are excellent compared to previous jobs. The dental and vision coverage saved me thousands this year.",
    sentiment: "positive",
    sentiment_score: 88,
    theme_id: "theme-compensation",
    theme_name: "Compensation & Benefits",
    session_id: "session-3",
    created_at: "2025-01-26T09:45:00Z",
    department: "Sales",
  },
  {
    id: "quote-4",
    text: "Decisions are made without consulting the people who do the work. By the time we hear about changes, it's too late to provide input.",
    sentiment: "negative",
    sentiment_score: 28,
    theme_id: "theme-leadership",
    theme_name: "Leadership & Management",
    session_id: "session-4",
    created_at: "2025-01-27T11:20:00Z",
    department: "Engineering",
  },
  {
    id: "quote-5",
    text: "Weekly standups are actually useful and well-run. Our team lead keeps them focused and we finish on time.",
    sentiment: "positive",
    sentiment_score: 82,
    theme_id: "theme-communication",
    theme_name: "Team Communication",
    session_id: "session-5",
    created_at: "2025-01-29T08:30:00Z",
    department: "Marketing",
  },
];

// Root causes (using RootCause from actionableIntelligence)
export const showcaseRootCauses: RootCause[] = [
  {
    id: "rc-1",
    theme_id: "theme-wlb",
    theme_name: "Work-Life Balance",
    cause: "Q4 Product Launch Pressure",
    evidence: [
      "The aggressive Q4 2024 product launch timeline created unsustainable work patterns",
      "Engineering team absorbed pressure without additional resources",
      "Weekend work became normalized during crunch period",
    ],
    frequency: 47,
    impact_score: 85,
    affected_employees: 62,
    representative_quotes: [
      "Working weekends has become the norm, not the exception anymore...",
      "No boundaries between work and personal life - I'm exhausted...",
    ],
  },
  {
    id: "rc-2",
    theme_id: "theme-wlb",
    theme_name: "Work-Life Balance",
    cause: "Unclear After-Hours Expectations",
    evidence: [
      "No formal policy on after-hours communication",
      "Implicit expectations of 24/7 availability have taken hold",
      "Manager expectations vary widely across teams",
    ],
    frequency: 38,
    impact_score: 78,
    affected_employees: 45,
    representative_quotes: [
      "Manager expects immediate responses to emails sent after 10pm...",
    ],
  },
];

// Interventions (using InterventionRecommendation from actionableIntelligence)
export const showcaseInterventions: InterventionRecommendation[] = [
  {
    id: "int-1",
    title: "Establish After-Hours Communication Policy",
    description: "Create and communicate clear guidelines for when employees are expected to respond outside work hours.",
    rationale: "73% of Work-Life Balance concerns mention after-hours communication expectations.",
    root_causes: ["Unclear After-Hours Expectations"],
    estimated_impact: 15,
    effort_level: "low",
    timeline: "1-2 weeks",
    priority: "critical",
    quick_win: true,
    related_themes: ["Work-Life Balance"],
    action_steps: [
      "Draft communication policy document",
      "Get leadership buy-in",
      "Communicate via all-hands and email",
      "Set expectation with managers",
    ],
    success_metrics: [
      "Reduction in after-hours Slack messages",
      "Employee feedback improvement in next pulse",
    ],
  },
  {
    id: "int-2",
    title: "Engineering Workload Audit & Hiring",
    description: "Conduct comprehensive review of Engineering capacity vs commitments and hire if needed.",
    rationale: "Engineering shows 23% lower sentiment than company average with systemic overwork patterns.",
    root_causes: ["Q4 Product Launch Pressure"],
    estimated_impact: 22,
    effort_level: "high",
    timeline: "3-4 months",
    priority: "high",
    quick_win: false,
    related_themes: ["Work-Life Balance", "Leadership & Management"],
    action_steps: [
      "Audit current Engineering workload",
      "Review upcoming roadmap commitments",
      "Identify hiring needs",
      "Begin recruitment process",
    ],
    success_metrics: [
      "Engineering sentiment improvement",
      "Reduction in overtime hours",
      "Improved sprint completion rates",
    ],
  },
  {
    id: "int-3",
    title: "Expand Mentorship Program",
    description: "Extend the successful mentorship program model to other departments.",
    rationale: "Mentorship program shows 89% positive sentiment - a proven success to replicate.",
    root_causes: [],
    estimated_impact: 12,
    effort_level: "medium",
    timeline: "6-8 weeks",
    priority: "medium",
    quick_win: false,
    related_themes: ["Career Development"],
    action_steps: [
      "Document current program best practices",
      "Identify mentors in other departments",
      "Develop training materials",
      "Launch pilot in Sales and Marketing",
    ],
    success_metrics: [
      "Program enrollment rate",
      "Participant satisfaction scores",
      "Career development sentiment",
    ],
  },
];

// Quick wins (using QuickWin from actionableIntelligence)
export const showcaseQuickWins: QuickWin[] = [
  {
    id: "qw-1",
    title: "Send All-Hands Email on After-Hours Expectations",
    description: "CEO sends immediate communication setting expectation that off-hours responses are not required.",
    effort: "very_low",
    impact: "high",
    implementation_time: "1 day",
    affected_theme: "Work-Life Balance",
    evidence: ["73% of WLB concerns mention after-hours expectations"],
  },
  {
    id: "qw-2",
    title: "Enable Slack Do Not Disturb by Default",
    description: "Configure Slack to automatically enable DND after 6pm for all employees.",
    effort: "very_low",
    impact: "medium",
    implementation_time: "30 minutes",
    affected_theme: "Work-Life Balance",
    evidence: ["Technical enforcement of communication boundaries"],
  },
  {
    id: "qw-3",
    title: "Share Mentorship Success Stories",
    description: "Feature mentorship program wins in company newsletter to encourage participation.",
    effort: "low",
    impact: "medium",
    implementation_time: "2 hours",
    affected_theme: "Career Development",
    evidence: ["Program has 89% positive sentiment - worth celebrating"],
  },
];

// Impact predictions (using ImpactPrediction from actionableIntelligence)
export const showcaseImpactPredictions: ImpactPrediction[] = [
  {
    theme_id: "theme-wlb",
    theme_name: "Work-Life Balance",
    current_sentiment: 38,
    predicted_sentiment: 58,
    improvement: 20,
    confidence: 82,
    interventions: ["Establish After-Hours Communication Policy", "Engineering Workload Audit & Hiring"],
  },
  {
    theme_id: "theme-career",
    theme_name: "Career Development",
    current_sentiment: 85,
    predicted_sentiment: 90,
    improvement: 5,
    confidence: 88,
    interventions: ["Expand Mentorship Program"],
  },
  {
    theme_id: "theme-leadership",
    theme_name: "Leadership & Management",
    current_sentiment: 52,
    predicted_sentiment: 65,
    improvement: 13,
    confidence: 72,
    interventions: ["Engineering Workload Audit & Hiring"],
  },
];

// Quality metrics (using AggregateQualityMetrics from conversationQuality)
export const showcaseQualityMetrics: AggregateQualityMetrics = {
  total_sessions: 201,
  completed_sessions: 187,
  average_quality_score: 76,
  average_confidence_score: 91,
  high_confidence_count: 156,
  medium_confidence_count: 38,
  low_confidence_count: 7,
  excellent_quality: 89,
  good_quality: 78,
  fair_quality: 27,
  poor_quality: 7,
  average_exchanges: 4.2,
  average_duration: 12.3,
  average_themes_explored: 3.1,
  average_follow_up_effectiveness: 78,
  confidence_factors: {
    high_depth_sessions: 167,
    high_engagement_sessions: 178,
    completed_sessions: 187,
    mood_tracked_sessions: 195,
  },
};

// Quality insights (using QualityInsight from conversationQuality)
export const showcaseQualityInsights: QualityInsight[] = [
  {
    type: "strength",
    title: "High Confidence Analytics",
    description: "Average confidence score of 91/100 indicates highly reliable analytics.",
    impact: "high",
    affected_sessions: 201,
  },
  {
    type: "strength",
    title: "Strong Topic Coverage",
    description: "94% of survey themes were discussed with an average of 3.1 themes per conversation.",
    impact: "medium",
    affected_sessions: 201,
  },
  {
    type: "concern",
    title: "Engineering Brevity",
    description: "Engineering responses are 23% shorter than average - consider targeted follow-ups.",
    impact: "low",
    affected_sessions: 62,
    recommendation: "Review Engineering AI prompts to encourage more detailed responses.",
  },
];

// Pre-generated narrative report (matching NarrativeReport type)
export const showcaseNarrativeReport = {
  id: "narrative-acme-q1-2025",
  survey_id: "demo-survey",
  generated_at: "2025-02-03T10:30:00Z",
  generated_by: "demo-user",
  confidence_score: 87,
  report_version: 1,
  is_latest: true,
  audience_config: { type: "executive" },
  data_snapshot: {},
  chapters: [
    {
      key: "pulse",
      title: "The Pulse",
      narrative: "ACME Inc's Q1 2025 survey reveals a company at a crossroads. With 81% participation—well above the industry average of 65%—employees are clearly eager to share their experiences. The overall sentiment of 68 suggests cautious optimism, but this headline number masks significant variation across themes. Most notably, Work-Life Balance has emerged as a critical concern requiring immediate attention, while Career Development programs are resonating strongly.",
      insights: [
        { text: "Work-Life Balance is in critical condition requiring immediate intervention", agreement_percentage: 73, sample_size: 156, confidence: 91 },
        { text: "Career Development programs are resonating strongly with employees", agreement_percentage: 89, sample_size: 134, confidence: 94 },
        { text: "Engineering department shows significantly lower sentiment than company average", agreement_percentage: 68, sample_size: 62, confidence: 87 },
      ],
    },
    {
      key: "working",
      title: "What's Working",
      narrative: "The standout success story is Career Development. Employees consistently praise the new mentorship program launched in Q4 2024, with 89% expressing positive sentiment. The learning budget and manager support for growth are frequently cited as reasons people choose to stay at ACME. Team Communication also scores well, with employees appreciating the balance of synchronous and asynchronous tools.",
      insights: [
        { text: "Mentorship program has significantly improved employee satisfaction and retention intent", agreement_percentage: 89, sample_size: 134, confidence: 94 },
        { text: "Manager 1:1s and career conversations are highly valued by employees", agreement_percentage: 82, sample_size: 98, confidence: 88 },
        { text: "Learning budget utilization correlates strongly with engagement scores", agreement_percentage: 76, sample_size: 87, confidence: 82 },
      ],
    },
    {
      key: "warnings",
      title: "Warning Signs",
      narrative: "Work-Life Balance has emerged as the most critical concern, with a health score of just 38 out of 100. Engineering is particularly affected, with multiple reports of after-hours expectations and weekend work becoming normalized. Three responses were flagged as urgent, including one potential burnout case that requires immediate follow-up.",
      insights: [
        { text: "After-hours communication expectations need clear boundaries", agreement_percentage: 73, sample_size: 156, confidence: 91 },
        { text: "Engineering department shows signs of systemic overwork and burnout risk", agreement_percentage: 68, sample_size: 62, confidence: 85 },
        { text: "Leadership transparency around decisions needs improvement", agreement_percentage: 61, sample_size: 98, confidence: 79 },
      ],
    },
    {
      key: "why",
      title: "The Why",
      narrative: "Root cause analysis reveals that the Work-Life Balance crisis stems primarily from Q4's aggressive product launch timeline. Engineering absorbed the pressure without additional resources, and those patterns have persisted into Q1. The lack of a formal after-hours communication policy has allowed implicit expectations to take hold.",
      insights: [
        { text: "Q4 product launch created unsustainable work patterns that persisted into Q1", agreement_percentage: 71, sample_size: 62, confidence: 85 },
        { text: "Structured programs outperform informal approaches for employee satisfaction", agreement_percentage: 84, sample_size: 134, confidence: 90 },
        { text: "Engineering headcount hasn't kept pace with product roadmap expansion", agreement_percentage: 65, sample_size: 62, confidence: 78 },
      ],
    },
    {
      key: "forward",
      title: "The Path Forward",
      narrative: "Three immediate actions emerge from this analysis: (1) Establish clear after-hours communication policies within 2 weeks, (2) Conduct an Engineering workload audit and consider hiring within 4 weeks, and (3) Extend the successful mentorship program model to other areas. The mood improvement data (+12.4 points average) suggests employees feel heard—now they need to see action.",
      insights: [
        { text: "Clear communication policies would address 73% of Work-Life Balance concerns", agreement_percentage: 73, sample_size: 156, confidence: 88 },
        { text: "Employees expect visible action within 30 days of survey results", agreement_percentage: 67, sample_size: 201, confidence: 82 },
        { text: "Engineering hiring should be prioritized to prevent further burnout", agreement_percentage: 71, sample_size: 62, confidence: 80 },
      ],
    },
  ],
};
