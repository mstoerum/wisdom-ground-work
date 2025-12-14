// ============= SPRADLEY REPORTS DESIGN SYSTEM =============
// Based on multidisciplinary vision: Peakon + Techno-Anthropology + HR Specialist + Aalto Design

// Emotion Gradient Spectrum - replacing traffic light colors
export const EMOTION_SPECTRUM = {
  // From challenging to thriving - continuous gradient concept
  critical: {
    primary: 'hsl(0, 72%, 51%)',      // Rose
    background: 'hsl(0, 72%, 96%)',
    text: 'hsl(0, 72%, 35%)',
    rgb: [239, 68, 68] as [number, number, number],
  },
  challenged: {
    primary: 'hsl(25, 95%, 53%)',     // Coral/Terracotta
    background: 'hsl(25, 95%, 96%)',
    text: 'hsl(25, 70%, 40%)',
    rgb: [249, 115, 22] as [number, number, number],
  },
  emerging: {
    primary: 'hsl(45, 93%, 47%)',     // Amber
    background: 'hsl(45, 93%, 96%)',
    text: 'hsl(45, 80%, 35%)',
    rgb: [234, 179, 8] as [number, number, number],
  },
  growing: {
    primary: 'hsl(173, 58%, 39%)',    // Teal
    background: 'hsl(173, 58%, 96%)',
    text: 'hsl(173, 58%, 25%)',
    rgb: [20, 184, 166] as [number, number, number],
  },
  thriving: {
    primary: 'hsl(142, 71%, 45%)',    // Emerald
    background: 'hsl(142, 71%, 96%)',
    text: 'hsl(142, 71%, 25%)',
    rgb: [34, 197, 94] as [number, number, number],
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
  key: 'voices' | 'landscape' | 'journey' | 'why' | 'forward' | 'commitment';
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
    key: 'journey',
    title: 'The Journey',
    subtitle: 'How emotions evolved',
    purpose: 'Emotion timeline showing mood progression through conversations',
    icon: 'TrendingUp',
    accentColor: 'growing',
  },
  {
    key: 'why',
    title: 'The Why',
    subtitle: 'Understanding root causes',
    purpose: 'Deep analysis of underlying patterns and interconnections',
    icon: 'Lightbulb',
    accentColor: 'challenged',
  },
  {
    key: 'forward',
    title: 'The Path Forward',
    subtitle: 'Actions that matter',
    purpose: 'Sprint-based action cards with This Week/30 Day/90 Day timeline',
    icon: 'ArrowRight',
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
  'warnings': 'journey',
  'why': 'why',
  'forward': 'forward',
};

// ============= TYPOGRAPHY SCALE =============
// Variable typography based on significance
export const TYPOGRAPHY = {
  // Quote sizing based on frequency/agreement
  quoteScale: {
    high: { size: 18, weight: 600, lineHeight: 1.4 },    // 70%+ agreement
    medium: { size: 15, weight: 500, lineHeight: 1.5 },  // 40-70% agreement
    low: { size: 13, weight: 400, lineHeight: 1.5 },     // <40% agreement
  },
  // Chapter titles
  chapterTitle: { size: 28, weight: 700, lineHeight: 1.2 },
  chapterSubtitle: { size: 14, weight: 400, lineHeight: 1.4 },
  // Metrics
  metricValue: { size: 36, weight: 700, lineHeight: 1 },
  metricLabel: { size: 12, weight: 500, lineHeight: 1.3 },
  // Body
  body: { size: 11, weight: 400, lineHeight: 1.6 },
  caption: { size: 9, weight: 400, lineHeight: 1.4 },
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
  // Brand
  primary: [196, 132, 107] as [number, number, number],      // Terracotta
  primaryLight: [251, 246, 243] as [number, number, number], // Warm white
  
  // Text
  text: [30, 30, 30] as [number, number, number],
  textSecondary: [80, 80, 80] as [number, number, number],
  textMuted: [120, 120, 120] as [number, number, number],
  
  // Surfaces
  background: [255, 255, 255] as [number, number, number],
  cardBg: [252, 250, 248] as [number, number, number],
  border: [230, 225, 220] as [number, number, number],
  
  // Emotion spectrum (RGB)
  ...Object.fromEntries(
    Object.entries(EMOTION_SPECTRUM).map(([key, value]) => [key, value.rgb])
  ),
};
