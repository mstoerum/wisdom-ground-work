import { REPORT_TIERS, CHAPTER_STRUCTURE, EMOTION_SPECTRUM } from './reportDesignSystem';

// Re-export from design system for backward compatibility
export { REPORT_TIERS, CHAPTER_STRUCTURE, EMOTION_SPECTRUM };

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  audience: string;
  pageCount: number;
  defaultMetrics: string[];
  includesCharts: boolean;
  includesQuotes: boolean;
  interactive?: boolean;
  icon: string;
  tier?: 'spark' | 'story' | 'strategy';
}

export const REPORT_TEMPLATES: Record<string, ReportTemplate> = {
  spark: {
    id: 'spark',
    name: 'Spark Summary',
    description: 'One-page visual snapshot with key metrics, top themes, and headline insight for quick sharing',
    audience: 'All Stakeholders',
    pageCount: 1,
    defaultMetrics: ['participation', 'sentiment', 'themes'],
    includesCharts: false,
    includesQuotes: true,
    icon: 'Zap',
    tier: 'spark',
  },
  storyReport: {
    id: 'storyReport',
    name: 'Story Report',
    description: 'Comprehensive 6-chapter narrative journey from voices to commitment with emotion timeline and action sprints',
    audience: 'Leadership & HR',
    pageCount: 8,
    defaultMetrics: ['participation', 'sentiment', 'urgent', 'themes', 'actions'],
    includesCharts: true,
    includesQuotes: true,
    icon: 'BookOpen',
    tier: 'story',
  },
  executive: {
    id: 'executive',
    name: 'Executive Summary',
    description: 'Professional 4-page report for senior leadership with traffic lights, trends, and priority actions',
    audience: 'Senior Leadership',
    pageCount: 4,
    defaultMetrics: ['participation', 'sentiment', 'urgent', 'themes'],
    includesCharts: true,
    includesQuotes: false,
    icon: 'FileText',
  },
  departmentReview: {
    id: 'departmentReview',
    name: 'Department After-Action Review',
    description: 'Meeting-friendly 5-page discussion guide with quotes, root causes, and action planning worksheets',
    audience: 'Team Meeting',
    pageCount: 5,
    defaultMetrics: ['all'],
    includesCharts: true,
    includesQuotes: true,
    interactive: true,
    icon: 'Users',
  },
  managerBriefing: {
    id: 'managerBriefing',
    name: 'Manager Briefing',
    description: 'Quick 2-page summary for line managers with team-specific insights and actionable recommendations',
    audience: 'Line Managers',
    pageCount: 2,
    defaultMetrics: ['sentiment', 'themes', 'actions'],
    includesCharts: true,
    includesQuotes: false,
    icon: 'TrendingUp',
  },
  compliance: {
    id: 'compliance',
    name: 'Compliance Report',
    description: 'Detailed audit trail showing anonymization, consent tracking, and data governance compliance',
    audience: 'Compliance/Legal',
    pageCount: 3,
    defaultMetrics: ['compliance'],
    includesCharts: false,
    includesQuotes: false,
    icon: 'Shield',
  },
  blank: {
    id: 'blank',
    name: 'Custom Blank Canvas',
    description: 'Build your own report by selecting exactly which metrics, charts, and sections to include',
    audience: 'Custom',
    pageCount: 0,
    defaultMetrics: [],
    includesCharts: true,
    includesQuotes: true,
    icon: 'PlusCircle',
  }
};

export interface ReportMetric {
  id: string;
  name: string;
  category: 'participation' | 'sentiment' | 'themes' | 'actions' | 'compliance';
  description: string;
  requiresChart: boolean;
}

export const AVAILABLE_METRICS: ReportMetric[] = [
  { id: 'participation_rate', name: 'Participation Rate', category: 'participation', description: 'Survey completion percentage', requiresChart: true },
  { id: 'completion_trend', name: 'Completion Trend', category: 'participation', description: '30-day participation trend', requiresChart: true },
  { id: 'avg_duration', name: 'Average Duration', category: 'participation', description: 'Time spent per response', requiresChart: false },
  { id: 'sentiment_score', name: 'Overall Sentiment', category: 'sentiment', description: 'Average sentiment score', requiresChart: true },
  { id: 'sentiment_distribution', name: 'Sentiment Distribution', category: 'sentiment', description: 'Positive/Neutral/Negative breakdown', requiresChart: true },
  { id: 'mood_improvement', name: 'Mood Improvement', category: 'sentiment', description: 'Pre/post conversation mood change', requiresChart: false },
  { id: 'top_themes', name: 'Top Themes', category: 'themes', description: 'Most discussed feedback themes', requiresChart: true },
  { id: 'theme_trends', name: 'Theme Trends', category: 'themes', description: 'Theme sentiment over time', requiresChart: true },
  { id: 'urgent_flags', name: 'Urgent Issues', category: 'themes', description: 'Escalated items requiring attention', requiresChart: false },
  { id: 'quick_wins', name: 'Quick Wins', category: 'actions', description: 'High-impact, low-effort actions', requiresChart: false },
  { id: 'root_causes', name: 'Root Cause Analysis', category: 'actions', description: 'Underlying issue patterns', requiresChart: false },
  { id: 'interventions', name: 'Recommended Interventions', category: 'actions', description: 'Suggested actions with impact', requiresChart: false },
  { id: 'anonymization', name: 'Anonymization Status', category: 'compliance', description: 'Data protection verification', requiresChart: false },
  { id: 'consent_tracking', name: 'Consent Tracking', category: 'compliance', description: 'User consent records', requiresChart: false },
  { id: 'export_audit', name: 'Export Audit Trail', category: 'compliance', description: 'Data export history', requiresChart: false },
];

export interface ChartStyle {
  id: string;
  name: string;
  description: string;
  colors: string[];
}

export const CHART_STYLES: ChartStyle[] = [
  {
    id: 'emotion',
    name: 'Emotion Spectrum',
    description: 'Gradient colors from the new emotion design system',
    colors: [
      EMOTION_SPECTRUM.thriving.primary,
      EMOTION_SPECTRUM.growing.primary,
      EMOTION_SPECTRUM.emerging.primary,
      EMOTION_SPECTRUM.challenged.primary,
      EMOTION_SPECTRUM.critical.primary,
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Clean, minimal design with semantic colors',
    colors: ['#10b981', '#f59e0b', '#ef4444', '#6b7280']
  },
  {
    id: 'colorful',
    name: 'Colorful',
    description: 'Vibrant palette for engaging presentations',
    colors: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']
  },
  {
    id: 'grayscale',
    name: 'Grayscale',
    description: 'Print-friendly monochrome design',
    colors: ['#1f2937', '#4b5563', '#6b7280', '#9ca3af']
  },
  {
    id: 'accessible',
    name: 'High Contrast',
    description: 'WCAG AAA compliant colors',
    colors: ['#000000', '#0369a1', '#b91c1c', '#15803d']
  }
];
