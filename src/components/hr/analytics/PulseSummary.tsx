import { Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import type { ParticipationMetrics, SentimentMetrics, ThemeInsight } from "@/hooks/useAnalytics";

interface PulseSummaryProps {
  participation: ParticipationMetrics | null;
  sentiment: SentimentMetrics | null;
  themes: ThemeInsight[];
  responseCount?: number;
  isLoading?: boolean;
}

function getConfidenceConfig(count: number) {
  if (count >= 50) return {
    label: "High",
    description: "decision-ready",
    color: "hsl(var(--chart-lime))",
    Icon: ShieldCheck,
  };
  if (count >= 10) return {
    label: "Good",
    description: "reliable trends",
    color: "hsl(var(--warning))",
    Icon: Shield,
  };
  return {
    label: "Low",
    description: "interpret with caution",
    color: "hsl(var(--destructive))",
    Icon: ShieldAlert,
  };
}

/**
 * Pulse Summary: Apple-minimal metric cards (now 5 including Confidence)
 * No entry animations — instant render for repeat visits
 */
export function PulseSummary({
  participation,
  sentiment,
  themes,
  responseCount: responseCountProp,
  isLoading,
}: PulseSummaryProps) {
  const healthScore = themes.length > 0
    ? Math.round(themes.reduce((sum, t) => sum + t.avgSentiment, 0) / themes.length)
    : sentiment?.avgScore || 0;

  const responseCount = responseCountProp ?? participation?.responseCount ?? 0;
  const sessionCount = participation?.sessionCount || participation?.totalAssigned || 0;
  const activeSessionCount = participation?.activeSessionCount || 0;
  
  const voicesValue = responseCount > 0 ? responseCount : (participation?.completed || 0);
  const voicesDescription = responseCount > 0 ? "responses" : "completed";

  const confidenceConfig = getConfidenceConfig(responseCount);

  const metrics = [
    {
      label: "Voices",
      value: voicesValue,
      color: "hsl(var(--chart-lime))",
      description: voicesDescription,
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
    {
      label: "Confidence",
      value: confidenceConfig.label,
      color: confidenceConfig.color,
      description: confidenceConfig.description,
      icon: confidenceConfig.Icon,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-6 animate-pulse">
            <div className="h-12 w-20 bg-muted rounded mb-2" />
            <div className="h-4 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-5">
      {metrics.map((metric) => (
        <div key={metric.label} className="group">
          <div className="p-4 md:p-5 rounded-2xl bg-card/50 hover:bg-card transition-colors">
            {/* Large number */}
            <div className="flex items-center gap-2">
              {'icon' in metric && metric.icon && (
                <metric.icon className="h-5 w-5" style={{ color: metric.color }} />
              )}
              <span
                className="text-3xl md:text-4xl font-bold tracking-tight"
                style={{ color: metric.color }}
              >
                {metric.value}
              </span>
            </div>
            
            {/* Label */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground font-medium">
                {metric.label}
              </span>
            </div>
            
            {/* Subtext */}
            {'subtext' in metric && metric.subtext && (
              <div className="text-xs text-muted-foreground/50 mt-0.5">
                {metric.subtext}
              </div>
            )}
            
            {/* Description */}
            <div className="text-xs text-muted-foreground/60 mt-0.5">
              {metric.description}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
