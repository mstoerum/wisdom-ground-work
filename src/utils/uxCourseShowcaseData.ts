/**
 * Curated showcase dataset for the UX Design & Prototyping F25 course evaluation
 * Based on real course evaluation data from DTU
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

// Course context
export const showcaseCourse = {
  name: "DTU",
  courseName: "UX Design & Prototyping",
  semester: "Fall 2025",
  studentCount: 52,
  surveyName: "UX Design & Prototyping F25 Evaluation",
  surveyPeriod: "December 2-15, 2025",
};

// Participation metrics - 81% participation rate
export const showcaseParticipation: ParticipationMetrics = {
  totalAssigned: 52,
  completed: 42,
  pending: 10,
  completionRate: 80.8,
  avgDuration: 8.5,
  responseCount: 42,
  sessionCount: 42,
  activeSessionCount: 0,
};

// Sentiment with learning outcomes
export const showcaseSentiment: SentimentMetrics = {
  positive: 34,
  neutral: 5,
  negative: 3,
  avgScore: 78,
  moodImprovement: 8.2,
};

// Basic themes for ThemeHealthList (using BasicThemeInsight from useAnalytics)
export const showcaseThemes: BasicThemeInsight[] = [
  {
    id: "theme-learning",
    name: "Learning & Achievement",
    responseCount: 38,
    avgSentiment: 85,
    urgencyCount: 0,
    keySignals: {
      concerns: [
        "Would appreciate more guidance on transitioning prototypes to production...",
      ],
      positives: [
        "I really like the fast iterations in the course program. It allowed us to create and test a lot which worked very efficiently...",
        "The hands-on approach helped me understand UX concepts much better than reading alone...",
        "Building actual prototypes gave me confidence in my design skills...",
      ],
      other: [
        "Would love to see more advanced prototyping techniques in future sessions...",
      ],
    },
  },
  {
    id: "theme-instructor",
    name: "Instructor Effectiveness",
    responseCount: 35,
    avgSentiment: 82,
    urgencyCount: 0,
    keySignals: {
      concerns: [
        "Sometimes examples moved too quickly to follow along...",
      ],
      positives: [
        "The material he was teaching about was very applicable. He used a lot of examples which was great...",
        "Professor was always available for questions and provided constructive feedback...",
        "Clear explanations of complex UX principles with real-world context...",
      ],
      other: [
        "More time for individual Q&A sessions would be helpful...",
      ],
    },
  },
  {
    id: "theme-course-design",
    name: "Course Design & Materials",
    responseCount: 32,
    avgSentiment: 72,
    urgencyCount: 1,
    keySignals: {
      concerns: [
        "Some materials felt outdated compared to current industry practices...",
        "Lecture slides could use more visual examples...",
      ],
      positives: [
        "Well-structured curriculum that builds skills progressively...",
        "Good balance between theory and practice...",
      ],
      other: [
        "Would appreciate supplementary reading lists for deeper exploration...",
      ],
    },
  },
  {
    id: "theme-engagement",
    name: "Engagement & Interaction",
    responseCount: 28,
    avgSentiment: 78,
    urgencyCount: 0,
    keySignals: {
      concerns: [
        "Group work logistics were sometimes challenging...",
      ],
      positives: [
        "Peer feedback sessions were incredibly valuable for improving my designs...",
        "Collaborative atmosphere encouraged experimentation...",
      ],
      other: [
        "More structured peer review guidelines would help...",
      ],
    },
  },
  {
    id: "theme-assessment",
    name: "Assessment & Feedback",
    responseCount: 25,
    avgSentiment: 65,
    urgencyCount: 2,
    keySignals: {
      concerns: [
        "Grading criteria could be more transparent and detailed...",
        "Feedback turnaround time was sometimes slow...",
      ],
      positives: [
        "Portfolio-based assessment felt authentic to real design work...",
      ],
      other: [
        "Would appreciate rubrics shared at the start of each assignment...",
      ],
    },
  },
  {
    id: "theme-practical",
    name: "Practical Application",
    responseCount: 36,
    avgSentiment: 88,
    urgencyCount: 0,
    keySignals: {
      concerns: [],
      positives: [
        "I feel like this is a skill that is very useful for myself as a tech student...",
        "The prototyping exercises directly apply to my thesis project...",
        "Industry guest speakers provided excellent real-world perspective...",
      ],
      other: [
        "Would love more opportunities to work with real clients...",
      ],
    },
  },
];

// Enhanced themes for EnhancedThemeAnalysis (using EnhancedThemeInsight from conversationAnalytics)
export const showcaseEnhancedThemes: EnhancedThemeInsight[] = [
  {
    theme_id: "theme-learning",
    theme_name: "Learning & Achievement",
    response_count: 38,
    avg_sentiment: 85,
    quotes: [],
    sub_themes: [
      { name: "Fast Iterations", frequency: 28, avg_sentiment: 92, representative_quotes: ["Fast iterations allowed us to create and test a lot..."] },
      { name: "Hands-on Learning", frequency: 24, avg_sentiment: 88, representative_quotes: ["Building actual prototypes gave me confidence..."] },
    ],
    sentiment_drivers: [
      { phrase: "iterations", frequency: 28, sentiment_impact: 42, context: ["Fast feedback loops"] },
      { phrase: "practical skills", frequency: 22, sentiment_impact: 38, context: ["Real-world application"] },
    ],
    follow_up_effectiveness: 0.82,
  },
  {
    theme_id: "theme-instructor",
    theme_name: "Instructor Effectiveness",
    response_count: 35,
    avg_sentiment: 82,
    quotes: [],
    sub_themes: [
      { name: "Real Examples", frequency: 25, avg_sentiment: 88, representative_quotes: ["He used a lot of examples which was great..."] },
      { name: "Applicability", frequency: 22, avg_sentiment: 85, representative_quotes: ["Material was very applicable..."] },
    ],
    sentiment_drivers: [
      { phrase: "examples", frequency: 25, sentiment_impact: 35, context: ["Clear practical demonstrations"] },
      { phrase: "applicable", frequency: 22, sentiment_impact: 32, context: ["Relevant to real work"] },
    ],
    follow_up_effectiveness: 0.79,
  },
  {
    theme_id: "theme-practical",
    theme_name: "Practical Application",
    response_count: 36,
    avg_sentiment: 88,
    quotes: [],
    sub_themes: [
      { name: "Career Relevance", frequency: 30, avg_sentiment: 90, representative_quotes: ["Very useful skill for tech students..."] },
      { name: "Industry Connection", frequency: 18, avg_sentiment: 85, representative_quotes: ["Guest speakers provided real-world perspective..."] },
    ],
    sentiment_drivers: [
      { phrase: "useful skill", frequency: 30, sentiment_impact: 40, context: ["Direct career benefit"] },
      { phrase: "real-world", frequency: 18, sentiment_impact: 32, context: ["Industry applicability"] },
    ],
    follow_up_effectiveness: 0.85,
  },
];

// Student voice quotes (using ConversationQuote from conversationAnalytics)
export const showcaseQuotes: ConversationQuote[] = [
  {
    id: "quote-1",
    text: "I really like the fast iterations in the course program. It allowed us to create and test a lot which worked very efficiently.",
    sentiment: "positive",
    sentiment_score: 92,
    theme_id: "theme-learning",
    theme_name: "Learning & Achievement",
    session_id: "session-1",
    created_at: "2025-12-08T10:30:00Z",
    department: "Computer Science",
  },
  {
    id: "quote-2",
    text: "The material he was teaching about was very applicable. He used a lot of examples which was great.",
    sentiment: "positive",
    sentiment_score: 88,
    theme_id: "theme-instructor",
    theme_name: "Instructor Effectiveness",
    session_id: "session-2",
    created_at: "2025-12-09T14:15:00Z",
    department: "Design",
  },
  {
    id: "quote-3",
    text: "I feel like this is a skill that is very useful for myself as a tech student. It directly applies to my thesis work.",
    sentiment: "positive",
    sentiment_score: 90,
    theme_id: "theme-practical",
    theme_name: "Practical Application",
    session_id: "session-3",
    created_at: "2025-12-10T09:45:00Z",
    department: "Computer Science",
  },
  {
    id: "quote-4",
    text: "Grading criteria could be more transparent. I wasn't always sure what would earn a higher grade on assignments.",
    sentiment: "negative",
    sentiment_score: 35,
    theme_id: "theme-assessment",
    theme_name: "Assessment & Feedback",
    session_id: "session-4",
    created_at: "2025-12-11T11:20:00Z",
    department: "Informatics",
  },
  {
    id: "quote-5",
    text: "Peer feedback sessions were incredibly valuable. Getting perspectives from classmates improved my designs significantly.",
    sentiment: "positive",
    sentiment_score: 86,
    theme_id: "theme-engagement",
    theme_name: "Engagement & Interaction",
    session_id: "session-5",
    created_at: "2025-12-12T08:30:00Z",
    department: "Design",
  },
];

// Root causes (using RootCause from actionableIntelligence)
export const showcaseRootCauses: RootCause[] = [
  {
    id: "rc-1",
    theme_id: "theme-assessment",
    theme_name: "Assessment & Feedback",
    cause: "Unclear Grading Criteria",
    evidence: [
      "Students uncertain about what differentiates grade levels",
      "Rubrics not always shared at assignment start",
      "Feedback focused on outcomes, not improvement areas",
    ],
    frequency: 18,
    impact_score: 72,
    affected_employees: 15,
    representative_quotes: [
      "Grading criteria could be more transparent...",
      "I wasn't always sure what would earn a higher grade...",
    ],
  },
  {
    id: "rc-2",
    theme_id: "theme-course-design",
    theme_name: "Course Design & Materials",
    cause: "Material Currency Gap",
    evidence: [
      "Some slides reference older design tools",
      "Industry practices have evolved since material creation",
      "Students want exposure to latest prototyping tools",
    ],
    frequency: 12,
    impact_score: 58,
    affected_employees: 10,
    representative_quotes: [
      "Some materials felt outdated compared to current industry practices...",
    ],
  },
];

// Interventions (using InterventionRecommendation from actionableIntelligence)
export const showcaseInterventions: InterventionRecommendation[] = [
  {
    id: "int-1",
    title: "Publish Detailed Rubrics with Each Assignment",
    description: "Create and share comprehensive grading rubrics at the start of each assignment.",
    rationale: "65% of assessment concerns mention unclear grading criteria.",
    root_causes: ["Unclear Grading Criteria"],
    estimated_impact: 18,
    effort_level: "low",
    timeline: "1-2 weeks",
    priority: "high",
    quick_win: true,
    related_themes: ["Assessment & Feedback"],
    action_steps: [
      "Draft rubrics for all assignments",
      "Review with TAs for clarity",
      "Publish in course materials before each assignment",
      "Reference rubric during feedback sessions",
    ],
    success_metrics: [
      "Increase in assessment satisfaction scores",
      "Reduction in grading-related questions",
    ],
  },
  {
    id: "int-2",
    title: "Update Course Materials with Current Tools",
    description: "Refresh lecture slides and examples to include latest industry-standard tools.",
    rationale: "Students want exposure to current design practices and modern prototyping tools.",
    root_causes: ["Material Currency Gap"],
    estimated_impact: 14,
    effort_level: "medium",
    timeline: "4-6 weeks",
    priority: "medium",
    quick_win: false,
    related_themes: ["Course Design & Materials"],
    action_steps: [
      "Audit current materials for outdated references",
      "Research current industry tool preferences",
      "Update key slides with modern examples",
      "Add supplementary resources for new tools",
    ],
    success_metrics: [
      "Course design satisfaction improvement",
      "Student feedback on material relevance",
    ],
  },
  {
    id: "int-3",
    title: "Expand Industry Guest Speaker Series",
    description: "Increase guest speaker sessions to provide more real-world UX perspectives.",
    rationale: "Guest speakers rated highly (88% positive) - expand what's working.",
    root_causes: [],
    estimated_impact: 10,
    effort_level: "medium",
    timeline: "Next semester",
    priority: "medium",
    quick_win: false,
    related_themes: ["Practical Application"],
    action_steps: [
      "Identify 3-4 additional industry contacts",
      "Schedule sessions throughout semester",
      "Coordinate topics with course curriculum",
      "Collect student feedback after each session",
    ],
    success_metrics: [
      "Practical application scores",
      "Student engagement in sessions",
    ],
  },
];

// Quick wins (using QuickWin from actionableIntelligence)
export const showcaseQuickWins: QuickWin[] = [
  {
    id: "qw-1",
    title: "Share Rubrics in Next Week's Lecture",
    description: "Announce and distribute grading rubrics for remaining assignments immediately.",
    effort: "very_low",
    impact: "high",
    implementation_time: "1 day",
    affected_theme: "Assessment & Feedback",
    evidence: ["65% of assessment concerns mention unclear criteria"],
  },
  {
    id: "qw-2",
    title: "Add Modern Tool Resources to Course Page",
    description: "Create a 'Current Tools' section linking to Figma, Framer, and other modern resources.",
    effort: "very_low",
    impact: "medium",
    implementation_time: "2 hours",
    affected_theme: "Course Design & Materials",
    evidence: ["Students want exposure to industry-current tools"],
  },
  {
    id: "qw-3",
    title: "Celebrate Iteration Success in Course Wrap-up",
    description: "Highlight the positive feedback on fast iterations as a course strength.",
    effort: "low",
    impact: "medium",
    implementation_time: "30 minutes",
    affected_theme: "Learning & Achievement",
    evidence: ["92% positive sentiment on iteration approach"],
  },
];

// Impact predictions (using ImpactPrediction from actionableIntelligence)
export const showcaseImpactPredictions: ImpactPrediction[] = [
  {
    theme_id: "theme-assessment",
    theme_name: "Assessment & Feedback",
    current_sentiment: 65,
    predicted_sentiment: 80,
    improvement: 15,
    confidence: 85,
    interventions: ["Publish Detailed Rubrics with Each Assignment"],
  },
  {
    theme_id: "theme-course-design",
    theme_name: "Course Design & Materials",
    current_sentiment: 72,
    predicted_sentiment: 82,
    improvement: 10,
    confidence: 78,
    interventions: ["Update Course Materials with Current Tools"],
  },
  {
    theme_id: "theme-practical",
    theme_name: "Practical Application",
    current_sentiment: 88,
    predicted_sentiment: 92,
    improvement: 4,
    confidence: 90,
    interventions: ["Expand Industry Guest Speaker Series"],
  },
];

// Quality metrics (using AggregateQualityMetrics from conversationQuality)
export const showcaseQualityMetrics: AggregateQualityMetrics = {
  total_sessions: 42,
  completed_sessions: 40,
  average_quality_score: 79,
  average_confidence_score: 88,
  high_confidence_count: 35,
  medium_confidence_count: 5,
  low_confidence_count: 2,
  excellent_quality: 22,
  good_quality: 15,
  fair_quality: 4,
  poor_quality: 1,
  average_exchanges: 3.8,
  average_duration: 8.5,
  average_themes_explored: 2.8,
  average_follow_up_effectiveness: 81,
  confidence_factors: {
    high_depth_sessions: 38,
    high_engagement_sessions: 36,
    completed_sessions: 40,
    mood_tracked_sessions: 42,
  },
};

// Quality insights (using QualityInsight from conversationQuality)
export const showcaseQualityInsights: QualityInsight[] = [
  {
    type: "strength",
    title: "High Student Engagement",
    description: "88% confidence score indicates students provided thoughtful, detailed feedback.",
    impact: "high",
    affected_sessions: 42,
  },
  {
    type: "strength",
    title: "Comprehensive Theme Coverage",
    description: "95% of evaluation themes were discussed with an average of 2.8 themes per conversation.",
    impact: "medium",
    affected_sessions: 42,
  },
  {
    type: "concern",
    title: "Assessment Depth Limited",
    description: "Assessment & Feedback received shorter responses - consider targeted follow-up questions.",
    impact: "low",
    affected_sessions: 25,
    recommendation: "Add specific prompts about grading expectations in future evaluations.",
  },
];

// Pre-generated narrative report (matching NarrativeReport type)
export const showcaseNarrativeReport = {
  id: "narrative-ux-f25",
  survey_id: "demo-ux-survey",
  generated_at: "2025-12-16T10:30:00Z",
  generated_by: "demo-user",
  confidence_score: 85,
  report_version: 1,
  is_latest: true,
  audience_config: { audience: "executive" as const },
  data_snapshot: {
    total_sessions: 42,
    total_responses: 194,
  },
  chapters: [
    {
      key: "voices",
      title: "The Voices",
      narrative: "The UX Design & Prototyping F25 course evaluation captured feedback from 42 of 52 enrolled students—an impressive 81% participation rate. Students were eager to share their experiences, with an average conversation lasting 8.5 minutes and covering nearly 3 themes each. The overall sentiment of 78% positive signals a course that's connecting well with its audience, though specific areas warrant attention.",
      insights: [
        { text: "Students overwhelmingly value the fast iteration approach to learning", agreement_percentage: 92, sample_size: 38, confidence: 94 },
        { text: "Practical application scores highest among all course aspects", agreement_percentage: 88, sample_size: 36, confidence: 91 },
        { text: "Assessment clarity emerged as the primary improvement opportunity", agreement_percentage: 65, sample_size: 25, confidence: 85 },
      ],
    },
    {
      key: "landscape",
      title: "The Landscape",
      narrative: "The course excels in hands-on learning. Students consistently praised the iterative prototyping approach, calling it 'efficient' and 'confidence-building.' The instructor's use of real-world examples resonated strongly, with 82% positive sentiment. The connection between coursework and career applicability stands out—students see direct value in what they're learning.",
      insights: [
        { text: "Iterative prototyping method is a standout strength", agreement_percentage: 92, sample_size: 38, confidence: 94 },
        { text: "Instructor examples effectively bridge theory and practice", agreement_percentage: 85, sample_size: 35, confidence: 88 },
        { text: "Peer feedback sessions highly valued for design improvement", agreement_percentage: 86, sample_size: 28, confidence: 86 },
      ],
    },
    {
      key: "frictions",
      title: "Frictions",
      narrative: "While the learning experience is strong, friction points cluster around assessment transparency. Students express uncertainty about grading criteria and what differentiates grade levels. Additionally, some course materials reference older tools, creating a perception gap with current industry practices. These are addressable issues that don't diminish the core course value.",
      insights: [
        { text: "Grading criteria need clearer communication", agreement_percentage: 65, sample_size: 25, confidence: 85 },
        { text: "Some materials perceived as outdated vs industry practices", agreement_percentage: 58, sample_size: 32, confidence: 78 },
        { text: "Feedback turnaround time occasionally slow", agreement_percentage: 55, sample_size: 25, confidence: 72 },
      ],
    },
    {
      key: "root_causes",
      title: "Root Causes",
      narrative: "The assessment clarity issue traces to rubrics not being shared at assignment start. Students are uncertain about expectations, leading to anxiety about grades despite strong learning outcomes. The material currency gap reflects the rapid evolution of UX tools—slides created two years ago reference tools that have since been superseded by Figma and modern alternatives.",
      insights: [
        { text: "Rubrics available but not proactively shared with students", agreement_percentage: 72, sample_size: 25, confidence: 82 },
        { text: "Course materials haven't kept pace with tool evolution", agreement_percentage: 58, sample_size: 32, confidence: 75 },
        { text: "Focus on teaching fundamentals may obscure tool-specific guidance", agreement_percentage: 45, sample_size: 32, confidence: 68 },
      ],
    },
    {
      key: "path_forward",
      title: "The Path Forward",
      narrative: "The path forward builds on exceptional strengths while addressing specific gaps. Immediate action: publish rubrics at assignment start. Medium-term: refresh materials with current tools. Long-term: expand the successful guest speaker series. The course's core approach—fast iterations, practical application, real examples—should remain unchanged. These are refinements, not overhauls.",
      insights: [
        { text: "Publish rubrics immediately for remaining assignments", agreement_percentage: 72, sample_size: 25, confidence: 85 },
        { text: "Add 'Current Tools' supplementary resources", agreement_percentage: 58, sample_size: 32, confidence: 78 },
        { text: "Expand industry guest speaker series next semester", agreement_percentage: 88, sample_size: 36, confidence: 90 },
      ],
    },
  ],
};
