// ============= SPRADLEY REPORTS DESIGN SYSTEM =============
// Apple-inspired design: Clarity, Deference, Depth

// Emotion Gradient Spectrum - refined, sophisticated tones
export const EMOTION_SPECTRUM = {
  // From challenging to thriving - muted, professional palette
  critical: {
    primary: 'hsl(3, 60%, 58%)',           // Soft coral-red
    background: 'hsl(3, 40%, 97%)',
    text: 'hsl(3, 50%, 35%)',
    rgb: [207, 95, 89] as [number, number, number],
  },
  challenged: {
    primary: 'hsl(30, 55%, 50%)',          // Warm amber (Frictions)
    background: 'hsl(30, 45%, 97%)',
    text: 'hsl(30, 50%, 32%)',
    rgb: [198, 134, 74] as [number, number, number],
  },
  emerging: {
    primary: 'hsl(48, 45%, 52%)',          // Muted gold
    background: 'hsl(48, 35%, 97%)',
    text: 'hsl(48, 45%, 30%)',
    rgb: [193, 171, 92] as [number, number, number],
  },
  growing: {
    primary: 'hsl(168, 38%, 42%)',         // Sage teal
    background: 'hsl(168, 30%, 97%)',
    text: 'hsl(168, 40%, 25%)',
    rgb: [74, 157, 140] as [number, number, number],
  },
  thriving: {
    primary: 'hsl(152, 40%, 48%)',         // Soft emerald
    background: 'hsl(152, 32%, 97%)',
    text: 'hsl(152, 42%, 25%)',
    rgb: [82, 171, 126] as [number, number, number],
  },
} as const;

// Get emotion state from health score (0-100)
export function getEmotionState(score: number): keyof typeof EMOTION_SPECTRUM {
  if (score >= 80) return 'thriving';
  if (score >= 60) return 'growing';
  if (score >= 45) return 'emerging';
  if (score >= 30) return 'challenged';
  return 'critical';
}

// Human-readable emotion labels
export const EMOTION_LABELS: Record<keyof typeof EMOTION_SPECTRUM, string> = {
  critical: 'Needs Immediate Attention',
  challenged: 'Facing Challenges',
  emerging: 'Room to Grow',
  growing: 'Progressing Well',
  thriving: 'Thriving',
};

// ============= REPORT TIERS =============
export interface ReportTier {
  id: 'spark' | 'story' | 'strategy';
  name: string;
  description: string;
  pageCount: string;
  audience: string[];
  features: string[];
  icon: string;
}

export const REPORT_TIERS: ReportTier[] = [
  {
    id: 'spark',
    name: 'Spark Summary',
    description: 'One-page visual snapshot for quick sharing',
    pageCount: '1 page',
    audience: ['All Employees', 'Quick Briefings', 'Slack/Teams'],
    features: [
      'Organizational pulse visual',
      'Top 3 themes with health',
      'Key quote of the survey',
      'One headline insight',
    ],
    icon: 'Zap',
  },
  {
    id: 'story',
    name: 'Story Report',
    description: 'Narrative journey from voices to commitment',
    pageCount: '6-10 pages',
    audience: ['Leadership', 'HR Teams', 'Managers'],
    features: [
      'Cover with landscape visualization',
      '6 narrative chapters',
      'Emotion journey timeline',
      'Evidence-linked insights',
      'Commitment signatures',
    ],
    icon: 'BookOpen',
  },
  {
    id: 'strategy',
    name: 'Strategy Dashboard',
    description: 'Interactive deep-dive with temporal comparisons',
    pageCount: 'Interactive',
    audience: ['HR Analytics', 'Executive Team', 'Board'],
    features: [
      'All Story Report features',
      'Since last survey comparisons',
      'Interactive drill-downs',
      'Export individual sections',
      'Commitment tracking',
    ],
    icon: 'LayoutDashboard',
  },
];

// ============= NEW 6-CHAPTER STRUCTURE =============
export interface ChapterDefinition {
  key: 'voices' | 'landscape' | 'frictions' | 'root_causes' | 'forward' | 'commitment';
  title: string;
  subtitle: string;
  purpose: string;
  icon: string;
  accentColor: keyof typeof EMOTION_SPECTRUM;
}

export const CHAPTER_STRUCTURE: ChapterDefinition[] = [
  {
    key: 'voices',
    title: 'The Voices',
    subtitle: 'Who spoke, and what they shared',
    purpose: 'Human-first opening with quotes, participation, and the human context',
    icon: 'MessageCircle',
    accentColor: 'growing',
  },
  {
    key: 'landscape',
    title: 'The Landscape',
    subtitle: 'The organizational terrain',
    purpose: 'Topographic view of themes, showing peaks and valleys of experience',
    icon: 'Mountain',
    accentColor: 'emerging',
  },
  {
    key: 'frictions',
    title: 'Frictions',
    subtitle: 'Points of tension and concern',
    purpose: 'Areas where employees are experiencing challenges or resistance',
    icon: 'AlertTriangle',
    accentColor: 'challenged',
  },
  {
    key: 'root_causes',
    title: 'Root Causes',
    subtitle: 'Understanding what drives the patterns',
    purpose: 'Deep analysis of underlying patterns and interconnections',
    icon: 'Search',
    accentColor: 'emerging',
  },
  {
    key: 'forward',
    title: 'The Path Forward',
    subtitle: 'Actions that matter',
    purpose: 'Sprint-based action cards with This Week/30 Day/90 Day timeline',
    icon: 'Target',
    accentColor: 'thriving',
  },
  {
    key: 'commitment',
    title: 'Our Commitment',
    subtitle: 'What we pledge to do',
    purpose: 'Leadership commitment signatures and accountability pledges',
    icon: 'Handshake',
    accentColor: 'thriving',
  },
];

// Map old chapter keys to new structure for migration
export const CHAPTER_MIGRATION_MAP: Record<string, ChapterDefinition['key']> = {
  'pulse': 'voices',
  'working': 'landscape',
  'warnings': 'frictions',
  'journey': 'frictions',
  'why': 'root_causes',
  'forward': 'forward',
  'commitment': 'commitment',
};

// Human-readable chapter labels (for display)
export const CHAPTER_LABELS: Record<string, string> = {
  pulse: 'The Voices',
  voices: 'The Voices',
  working: 'The Landscape',
  landscape: 'The Landscape',
  warnings: 'Frictions',
  frictions: 'Frictions',
  journey: 'Frictions',
  why: 'Root Causes',
  root_causes: 'Root Causes',
  forward: 'The Path Forward',
  commitment: 'Our Commitment',
};

// ============= TYPOGRAPHY SCALE =============
// Apple-inspired typography with SF Pro characteristics
export const TYPOGRAPHY = {
  // Quote sizing based on frequency/agreement
  quoteScale: {
    high: { size: 18, weight: 600, lineHeight: 1.4 },    // 70%+ agreement
    medium: { size: 15, weight: 500, lineHeight: 1.5 },  // 40-70% agreement
    low: { size: 13, weight: 400, lineHeight: 1.5 },     // <40% agreement
  },
  // Chapter titles - Apple-style
  chapterTitle: { size: 28, weight: 500, lineHeight: 1.2, tracking: '-0.02em' },
  chapterSubtitle: { size: 14, weight: 400, lineHeight: 1.4, color: 'muted-foreground/80' },
  // Narrative text - optimized for reading
  narrative: { size: 17, weight: 300, lineHeight: 1.65 },
  // Metrics
  metricValue: { size: 36, weight: 700, lineHeight: 1 },
  metricLabel: { size: 12, weight: 500, lineHeight: 1.3 },
  // Body
  body: { size: 11, weight: 400, lineHeight: 1.6 },
  caption: { size: 9, weight: 400, lineHeight: 1.4 },
  // Labels
  label: { size: 12, weight: 500, lineHeight: 1.3, tracking: '0.04em' },
};

// ============= ACTION SPRINT CARDS =============
export interface SprintAction {
  id: string;
  text: string;
  timeline: 'immediate' | 'short' | 'medium';
  owner?: string;
  impact: 'high' | 'medium' | 'low';
  agreementPercentage?: number;
}

export const SPRINT_TIMELINES = {
  immediate: {
    label: 'This Week',
    color: EMOTION_SPECTRUM.critical.primary,
    days: 7,
  },
  short: {
    label: '30 Days',
    color: EMOTION_SPECTRUM.emerging.primary,
    days: 30,
  },
  medium: {
    label: '90 Days',
    color: EMOTION_SPECTRUM.growing.primary,
    days: 90,
  },
};

// ============= COMMITMENT SIGNATURE =============
export interface CommitmentSignature {
  name: string;
  role: string;
  date: Date;
  pledges: string[];
}

// ============= TEMPORAL COMPARISON =============
export interface TemporalComparison {
  metric: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'improving' | 'stable' | 'declining';
}

export function calculateTrend(current: number, previous: number): TemporalComparison['trend'] {
  const changePercent = previous > 0 ? ((current - previous) / previous) * 100 : 0;
  if (changePercent > 5) return 'improving';
  if (changePercent < -5) return 'declining';
  return 'stable';
}

// ============= PDF BRAND COLORS (RGB for jsPDF) =============
export const PDF_COLORS = {
  // Brand - refined tones
  primary: [180, 140, 115] as [number, number, number],      // Warm taupe
  primaryLight: [250, 248, 246] as [number, number, number], // Warm white
  
  // Text
  text: [35, 35, 35] as [number, number, number],
  textSecondary: [90, 90, 90] as [number, number, number],
  textMuted: [130, 130, 130] as [number, number, number],
  
  // Surfaces
  background: [255, 255, 255] as [number, number, number],
  cardBg: [253, 252, 251] as [number, number, number],
  border: [235, 232, 228] as [number, number, number],
  
  // Emotion spectrum (RGB)
  ...Object.fromEntries(
    Object.entries(EMOTION_SPECTRUM).map(([key, value]) => [key, value.rgb])
  ),
};

// ============= READING TIME ESTIMATION =============
export function estimateReadingTime(chapters: { narrative: string; insights: { text: string }[] }[]): number {
  const wordsPerMinute = 200;
  let totalWords = 0;
  
  chapters.forEach(chapter => {
    totalWords += chapter.narrative.split(/\s+/).length;
    chapter.insights.forEach(insight => {
      totalWords += insight.text.split(/\s+/).length;
    });
  });
  
  return Math.max(1, Math.ceil(totalWords / wordsPerMinute));
}

// ============= CONFIDENCE DISPLAY =============
export const CONFIDENCE_CONFIG = {
  labels: {
    1: 'Low',
    2: 'Moderate', 
    3: 'Good',
    4: 'High',
    5: 'Very High',
  } as Record<number, string>,
  colors: {
    1: { bg: 'bg-muted', text: 'text-muted-foreground' },
    2: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-300' },
    3: { bg: 'bg-yellow-50 dark:bg-yellow-950/30', text: 'text-yellow-700 dark:text-yellow-300' },
    4: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-300' },
    5: { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-800 dark:text-emerald-200' },
  } as Record<number, { bg: string; text: string }>,
};
