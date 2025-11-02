/**
 * Actionable Intelligence Library
 * 
 * Transforms insights into specific, prioritized actions with impact predictions.
 * Provides root cause analysis, intervention recommendations, and quick wins.
 */

import { 
  ConversationResponse, 
  ConversationSession, 
  ThemeInsight,
  PatternInsight 
} from "./conversationAnalytics";

export interface RootCause {
  id: string;
  theme_id: string;
  theme_name: string;
  cause: string;
  evidence: string[];
  frequency: number;
  impact_score: number; // 0-100
  affected_employees: number;
  representative_quotes: string[];
}

export interface InterventionRecommendation {
  id: string;
  title: string;
  description: string;
  rationale: string;
  root_causes: string[];
  estimated_impact: number; // Expected sentiment improvement
  effort_level: 'low' | 'medium' | 'high';
  timeline: string; // e.g., "2-4 weeks"
  priority: 'critical' | 'high' | 'medium' | 'low';
  quick_win: boolean;
  related_themes: string[];
  action_steps: string[];
  success_metrics: string[];
}

export interface QuickWin {
  id: string;
  title: string;
  description: string;
  effort: 'low' | 'very_low';
  impact: 'high' | 'medium';
  implementation_time: string;
  affected_theme: string;
  evidence: string[];
}

export interface ImpactPrediction {
  theme_id: string;
  theme_name: string;
  current_sentiment: number;
  predicted_sentiment: number;
  improvement: number;
  confidence: number; // 0-100
  interventions: string[];
}

/**
 * Analyze root causes for low sentiment themes
 */
export function analyzeRootCauses(
  themes: ThemeInsight[],
  responses: ConversationResponse[],
  sessions: ConversationSession[]
): RootCause[] {
  const rootCauses: RootCause[] = [];
  
  // Focus on themes with low sentiment (< 60)
  const concerningThemes = themes.filter(t => t.avg_sentiment < 60);
  
  concerningThemes.forEach(theme => {
    // Analyze sentiment drivers to identify root causes
    const negativeDrivers = theme.sentiment_drivers.filter(d => d.sentiment_impact < 0);
    
    negativeDrivers.forEach((driver, index) => {
      const themeResponses = responses.filter(r => r.theme_id === theme.theme_id);
      const affectedSessions = new Set(
        themeResponses
          .filter(r => r.content.toLowerCase().includes(driver.phrase.toLowerCase()))
          .map(r => r.conversation_session_id)
      );
      
      const evidence = driver.context.slice(0, 3);
      const quotes = theme.quotes
        .filter(q => q.text.toLowerCase().includes(driver.phrase.toLowerCase()))
        .slice(0, 3)
        .map(q => q.text);
      
      // Calculate impact score based on frequency and sentiment impact
      const impactScore = Math.min(
        100,
        Math.abs(driver.sentiment_impact) * 20 + (driver.frequency * 5)
      );
      
      rootCauses.push({
        id: `${theme.theme_id}-${index}`,
        theme_id: theme.theme_id,
        theme_name: theme.theme_name,
        cause: driver.phrase,
        evidence: [...evidence, ...quotes].slice(0, 5),
        frequency: driver.frequency,
        impact_score: impactScore,
        affected_employees: affectedSessions.size,
        representative_quotes: quotes,
      });
    });
    
    // Also look at sub-themes with low sentiment
    theme.sub_themes
      .filter(st => st.avg_sentiment < 50)
      .forEach((subTheme, index) => {
        const subThemeQuotes = subTheme.representative_quotes;
        
        rootCauses.push({
          id: `${theme.theme_id}-sub-${index}`,
          theme_id: theme.theme_id,
          theme_name: theme.theme_name,
          cause: subTheme.name,
          evidence: subThemeQuotes,
          frequency: subTheme.frequency,
          impact_score: (50 - subTheme.avg_sentiment) * 2,
          affected_employees: subTheme.frequency,
          representative_quotes: subThemeQuotes,
        });
      });
  });
  
  // Sort by impact score (highest first)
  return rootCauses.sort((a, b) => b.impact_score - a.impact_score);
}

/**
 * Generate intervention recommendations based on root causes
 */
export function generateInterventions(
  rootCauses: RootCause[],
  themes: ThemeInsight[],
  patterns: PatternInsight[]
): InterventionRecommendation[] {
  const interventions: InterventionRecommendation[] = [];
  
  // Group root causes by theme
  const causesByTheme = new Map<string, RootCause[]>();
  rootCauses.forEach(cause => {
    if (!causesByTheme.has(cause.theme_id)) {
      causesByTheme.set(cause.theme_id, []);
    }
    causesByTheme.get(cause.theme_id)!.push(cause);
  });
  
  // Generate interventions for each theme
  causesByTheme.forEach((causes, themeId) => {
    const theme = themes.find(t => t.theme_id === themeId);
    if (!theme) return;
    
    // Determine priority based on sentiment and frequency
    const totalAffected = causes.reduce((sum, c) => sum + c.affected_employees, 0);
    const avgImpact = causes.reduce((sum, c) => sum + c.impact_score, 0) / causes.length;
    
    let priority: 'critical' | 'high' | 'medium' | 'low' = 'medium';
    if (theme.avg_sentiment < 40 && totalAffected > 10) priority = 'critical';
    else if (theme.avg_sentiment < 50 && totalAffected > 5) priority = 'high';
    else if (theme.avg_sentiment < 60) priority = 'medium';
    else priority = 'low';
    
    // Generate theme-specific interventions
    const themeInterventions = generateThemeSpecificInterventions(
      theme,
      causes,
      priority,
      patterns
    );
    
    interventions.push(...themeInterventions);
  });
  
  // Sort by priority and impact
  const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  return interventions.sort((a, b) => {
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.estimated_impact - a.estimated_impact;
  });
}

/**
 * Generate theme-specific intervention recommendations
 */
function generateThemeSpecificInterventions(
  theme: ThemeInsight,
  causes: RootCause[],
  priority: 'critical' | 'high' | 'medium' | 'low',
  patterns: PatternInsight[]
): InterventionRecommendation[] {
  const interventions: InterventionRecommendation[] = [];
  const themeName = theme.theme_name.toLowerCase();
  
  // Work-Life Balance interventions
  if (themeName.includes('work-life') || themeName.includes('balance')) {
    const overloadCause = causes.find(c => 
      c.cause.toLowerCase().includes('overload') || 
      c.cause.toLowerCase().includes('hours') ||
      c.cause.toLowerCase().includes('overtime')
    );
    
    if (overloadCause) {
      interventions.push({
        id: `${theme.theme_id}-wl-1`,
        title: "Implement Flexible Work Hours Policy",
        description: "Create a flexible work hours policy to address work-life balance concerns.",
        rationale: `${overloadCause.frequency} employees mentioned work overload. Flexible hours can help employees manage their time better.`,
        root_causes: [overloadCause.cause],
        estimated_impact: 15,
        effort_level: 'medium',
        timeline: "3-4 weeks",
        priority,
        quick_win: false,
        related_themes: [theme.theme_name],
        action_steps: [
          "Draft flexible work hours policy document",
          "Review with legal and HR teams",
          "Announce policy to all employees",
          "Set up tracking system for flexible hours",
          "Schedule check-in after 1 month"
        ],
        success_metrics: [
          "Reduction in work-life balance mentions",
          "Increase in positive sentiment for work-life theme",
          "Employee satisfaction survey improvement"
        ],
      });
    }
    
    interventions.push({
      id: `${theme.theme_id}-wl-2`,
      title: "Establish 'No After-Hours Communication' Policy",
      description: "Set clear boundaries for after-hours communication to reduce employee stress.",
      rationale: "Multiple employees mentioned after-hours emails and messages affecting their work-life balance.",
      root_causes: causes.filter(c => 
        c.cause.toLowerCase().includes('after hours') ||
        c.cause.toLowerCase().includes('evening') ||
        c.cause.toLowerCase().includes('weekend')
      ).map(c => c.cause),
      estimated_impact: 12,
      effort_level: 'low',
      timeline: "1-2 weeks",
      priority,
      quick_win: true,
      related_themes: [theme.theme_name],
      action_steps: [
        "Draft communication policy",
        "Get leadership buy-in",
        "Communicate policy via email and team meetings",
        "Set expectation with managers"
      ],
      success_metrics: [
        "Reduction in after-hours communication",
        "Employee feedback on improved boundaries"
      ],
    });
  }
  
  // Career Growth interventions
  if (themeName.includes('career') || themeName.includes('growth') || themeName.includes('development')) {
    const stuckCause = causes.find(c => 
      c.cause.toLowerCase().includes('stuck') ||
      c.cause.toLowerCase().includes('stagnant') ||
      c.cause.toLowerCase().includes('dead end')
    );
    
    if (stuckCause) {
      interventions.push({
        id: `${theme.theme_id}-cg-1`,
        title: "Launch Career Development Program",
        description: "Create structured career development paths and mentorship programs.",
        rationale: `${stuckCause.frequency} employees feel stuck in their careers. A development program can provide clear paths forward.`,
        root_causes: [stuckCause.cause],
        estimated_impact: 20,
        effort_level: 'high',
        timeline: "6-8 weeks",
        priority,
        quick_win: false,
        related_themes: [theme.theme_name],
        action_steps: [
          "Define career paths for each role",
          "Create mentorship matching program",
          "Develop training curriculum",
          "Launch pilot program",
          "Gather feedback and iterate"
        ],
        success_metrics: [
          "Number of employees in mentorship program",
          "Sentiment improvement in career growth theme",
          "Internal promotion rate increase"
        ],
      });
    }
    
    interventions.push({
      id: `${theme.theme_id}-cg-2`,
      title: "Implement Quarterly Career Check-ins",
      description: "Schedule regular one-on-ones focused on career goals and development.",
      rationale: "Regular check-ins can help identify career concerns early and provide support.",
      root_causes: causes.map(c => c.cause),
      estimated_impact: 10,
      effort_level: 'low',
      timeline: "2 weeks",
      priority,
      quick_win: true,
      related_themes: [theme.theme_name],
      action_steps: [
        "Create career check-in template",
        "Train managers on conducting check-ins",
        "Schedule first round of check-ins",
        "Follow up on action items"
      ],
      success_metrics: [
        "Completion rate of career check-ins",
        "Employee satisfaction with check-ins"
      ],
    });
  }
  
  // Communication interventions
  if (themeName.includes('communication') || themeName.includes('transparency')) {
    interventions.push({
      id: `${theme.theme_id}-comm-1`,
      title: "Improve Communication Transparency",
      description: "Establish regular communication channels and transparent update processes.",
      rationale: "Employees mentioned lack of transparency in decision-making and communication gaps.",
      root_causes: causes.map(c => c.cause),
      estimated_impact: 15,
      effort_level: 'medium',
      timeline: "3-4 weeks",
      priority,
      quick_win: false,
      related_themes: [theme.theme_name],
      action_steps: [
        "Create monthly all-hands meeting schedule",
        "Establish internal communication channels",
        "Implement decision-making transparency guidelines",
        "Train leadership on transparent communication"
      ],
      success_metrics: [
        "Employee attendance at all-hands meetings",
        "Sentiment improvement in communication theme"
      ],
    });
  }
  
  // Team Collaboration interventions
  if (themeName.includes('team') || themeName.includes('collaboration')) {
    const siloCause = causes.find(c => 
      c.cause.toLowerCase().includes('silo') ||
      c.cause.toLowerCase().includes('isolation')
    );
    
    if (siloCause) {
      interventions.push({
        id: `${theme.theme_id}-tc-1`,
        title: "Break Down Team Silos",
        description: "Create cross-functional projects and regular team-building activities.",
        rationale: `${siloCause.frequency} employees mentioned silos affecting collaboration.`,
        root_causes: [siloCause.cause],
        estimated_impact: 18,
        effort_level: 'medium',
        timeline: "4-6 weeks",
        priority,
        quick_win: false,
        related_themes: [theme.theme_name],
        action_steps: [
          "Identify key cross-functional opportunities",
          "Create cross-team project teams",
          "Schedule regular team-building events",
          "Set up shared communication channels"
        ],
        success_metrics: [
          "Number of cross-functional projects",
          "Sentiment improvement in collaboration theme"
        ],
      });
    }
  }
  
  // Generic intervention if no specific match
  if (interventions.length === 0) {
    interventions.push({
      id: `${theme.theme_id}-generic-1`,
      title: `Address ${theme.theme_name} Concerns`,
      description: `Take action to improve employee sentiment in ${theme.theme_name}.`,
      rationale: `${theme.response_count} employees have expressed concerns about ${theme.theme_name}.`,
      root_causes: causes.map(c => c.cause),
      estimated_impact: Math.max(5, 20 - theme.avg_sentiment / 5),
      effort_level: 'medium',
      timeline: "4-6 weeks",
      priority,
      quick_win: false,
      related_themes: [theme.theme_name],
      action_steps: [
        "Conduct focus group with affected employees",
        "Identify specific pain points",
        "Develop action plan",
        "Implement changes",
        "Monitor and adjust"
      ],
      success_metrics: [
        `Sentiment improvement in ${theme.theme_name}`,
        "Reduction in negative mentions"
      ],
    });
  }
  
  return interventions;
}

/**
 * Identify quick wins - low effort, high impact actions
 */
export function identifyQuickWins(
  interventions: InterventionRecommendation[],
  themes: ThemeInsight[]
): QuickWin[] {
  const quickWins: QuickWin[] = [];
  
  // Filter interventions that are quick wins
  interventions
    .filter(i => i.quick_win && i.effort_level === 'low')
    .forEach(intervention => {
      quickWins.push({
        id: intervention.id,
        title: intervention.title,
        description: intervention.description,
        effort: 'low',
        impact: intervention.estimated_impact >= 15 ? 'high' : 'medium',
        implementation_time: intervention.timeline,
        affected_theme: intervention.related_themes[0],
        evidence: intervention.root_causes,
      });
    });
  
  // Also identify quick wins from patterns
  // Simple actions that can address multiple patterns
  const highFrequencyPatterns = themes
    .flatMap(t => t.sentiment_drivers)
    .filter(d => d.frequency >= 3 && d.sentiment_impact < -10)
    .slice(0, 5);
  
  highFrequencyPatterns.forEach((driver, index) => {
    if (driver.phrase.toLowerCase().includes('meeting')) {
      quickWins.push({
        id: `quick-win-meetings-${index}`,
        title: "Implement Meeting-Free Fridays",
        description: "Designate Fridays as meeting-free days to reduce meeting overload.",
        effort: 'very_low',
        impact: 'high',
        implementation_time: "1 week",
        affected_theme: "Work-Life Balance",
        evidence: [driver.phrase, ...driver.context.slice(0, 2)],
      });
    }
  });
  
  return quickWins.sort((a, b) => {
    const impactOrder = { high: 2, medium: 1 };
    return impactOrder[b.impact] - impactOrder[a.impact];
  });
}

/**
 * Predict impact of interventions
 */
export function predictImpact(
  interventions: InterventionRecommendation[],
  themes: ThemeInsight[]
): ImpactPrediction[] {
  const predictions: ImpactPrediction[] = [];
  
  // Group interventions by theme
  const interventionsByTheme = new Map<string, InterventionRecommendation[]>();
  interventions.forEach(i => {
    i.related_themes.forEach(themeName => {
      if (!interventionsByTheme.has(themeName)) {
        interventionsByTheme.set(themeName, []);
      }
      interventionsByTheme.get(themeName)!.push(i);
    });
  });
  
  // Generate predictions for each theme
  interventionsByTheme.forEach((themeInterventions, themeName) => {
    const theme = themes.find(t => t.theme_name === themeName);
    if (!theme) return;
    
    // Calculate predicted sentiment improvement
    // Base improvement from interventions
    const totalImpact = themeInterventions.reduce((sum, i) => sum + i.estimated_impact, 0);
    
    // Apply diminishing returns (can't exceed 100)
    const predictedSentiment = Math.min(100, theme.avg_sentiment + totalImpact);
    const improvement = predictedSentiment - theme.avg_sentiment;
    
    // Calculate confidence based on number of interventions and current sentiment
    // Lower sentiment = higher confidence in improvement potential
    const confidence = Math.min(
      100,
      50 + (100 - theme.avg_sentiment) * 0.5 + (themeInterventions.length * 10)
    );
    
    predictions.push({
      theme_id: theme.theme_id,
      theme_name: themeName,
      current_sentiment: theme.avg_sentiment,
      predicted_sentiment: predictedSentiment,
      improvement,
      confidence: Math.round(confidence),
      interventions: themeInterventions.map(i => i.title),
    });
  });
  
  return predictions.sort((a, b) => b.improvement - a.improvement);
}
