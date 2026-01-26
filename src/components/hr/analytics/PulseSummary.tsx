import { motion } from "framer-motion";
import type { ParticipationMetrics, SentimentMetrics, ThemeInsight } from "@/hooks/useAnalytics";

interface PulseSummaryProps {
  participation: ParticipationMetrics | null;
  sentiment: SentimentMetrics | null;
  themes: ThemeInsight[];
  isLoading?: boolean;
}

/**
 * Pulse Summary: Apple-minimal metric cards
 * Shows the 4 key numbers HR professionals need at a glance
 * Removed sparklines for data integrity (one-off surveys have no trends)
 */
export function PulseSummary({
  participation,
  sentiment,
  themes,
  isLoading,
}: PulseSummaryProps) {
  // Calculate overall health score (average of theme sentiments)
  const healthScore = themes.length > 0
    ? Math.round(themes.reduce((sum, t) => sum + t.avgSentiment, 0) / themes.length)
    : sentiment?.avgScore || 0;

  // NEW: Use responseCount for public surveys where sessions may not be completed
  const responseCount = participation?.responseCount || 0;
  const sessionCount = participation?.sessionCount || participation?.totalAssigned || 0;
  const activeSessionCount = participation?.activeSessionCount || 0;
  
  // Show responses as primary metric if we have them, otherwise completed sessions
  const voicesValue = responseCount > 0 ? responseCount : (participation?.completed || 0);
  const voicesDescription = responseCount > 0 ? "responses" : "completed";

  const metrics = [
    {
      label: "Voices",
      value: voicesValue,
      color: "hsl(var(--chart-lime))",
      description: voicesDescription,
      // Show session info if different from response count
      subtext: sessionCount > 0 && sessionCount !== voicesValue 
        ? `${sessionCount} session${sessionCount !== 1 ? 's' : ''}${activeSessionCount > 0 ? ` (${activeSessionCount} active)` : ''}`
        : undefined,
    },
    {
      label: "Engaged",
      value: `${Math.round(participation?.completionRate || 0)}%`,
      color: "hsl(var(--primary))",
      description: "participation",
    },
    {
      label: "Health",
      value: healthScore,
      color: healthScore >= 70 
        ? "hsl(var(--chart-lime))" 
        : healthScore >= 50 
          ? "hsl(var(--warning))" 
          : "hsl(var(--destructive))",
      description: healthScore >= 70 ? "thriving" : healthScore >= 50 ? "emerging" : "attention",
    },
    {
      label: "Themes",
      value: themes.length,
      color: "hsl(var(--muted-foreground))",
      description: "explored",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-6 animate-pulse">
            <div className="h-12 w-20 bg-muted rounded mb-2" />
            <div className="h-4 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="group"
        >
          {/* Apple-style: No borders, just space defines boundaries */}
          <div className="p-4 md:p-6 rounded-2xl bg-card/50 hover:bg-card transition-colors">
            {/* Large number - Tufte: maximize data-ink ratio */}
            <div 
              className="text-3xl md:text-4xl font-bold tracking-tight mb-1"
              style={{ color: metric.color }}
            >
              {metric.value}
            </div>
            
            {/* Label row */}
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm text-muted-foreground font-medium">
                {metric.label}
              </span>
            </div>
            
            {/* NEW: Subtext for session info */}
            {'subtext' in metric && metric.subtext && (
              <div className="text-[9px] text-muted-foreground/50 mt-0.5">
                {metric.subtext}
              </div>
            )}
            
            {/* Subtle description */}
            <div className="text-[10px] text-muted-foreground/60 mt-0.5">
              {metric.description}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
