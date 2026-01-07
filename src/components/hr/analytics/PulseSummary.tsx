import { motion } from "framer-motion";
import { InlineSparkline } from "./InlineSparkline";
import type { ParticipationMetrics, SentimentMetrics, ThemeInsight } from "@/hooks/useAnalytics";

interface PulseSummaryProps {
  participation: ParticipationMetrics | null;
  sentiment: SentimentMetrics | null;
  themes: ThemeInsight[];
  isLoading?: boolean;
}

// Generate mock 7-day trend data for sparklines
function generateTrendData(currentValue: number, variance: number = 5): number[] {
  const points = 7;
  const data: number[] = [];
  let value = currentValue - variance * 2;
  
  for (let i = 0; i < points; i++) {
    value = Math.max(0, Math.min(100, value + (Math.random() - 0.3) * variance));
    data.push(value);
  }
  // Ensure last point is close to current value
  data[points - 1] = currentValue;
  return data;
}

/**
 * Pulse Summary: Apple-minimal metric cards with Tufte sparklines
 * Shows the 4 key numbers HR professionals need at a glance
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

  const metrics = [
    {
      label: "Voices",
      value: participation?.completed || 0,
      sparklineData: generateTrendData(participation?.completed || 0, 3),
      color: "hsl(var(--chart-lime))",
      description: "completed",
    },
    {
      label: "Engaged",
      value: `${participation?.completionRate || 0}%`,
      sparklineData: generateTrendData(participation?.completionRate || 0),
      color: "hsl(var(--primary))",
      description: "participation",
    },
    {
      label: "Health",
      value: healthScore,
      sparklineData: generateTrendData(healthScore),
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
      sparklineData: null, // No trend for static count
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
            
            {/* Label + sparkline row */}
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm text-muted-foreground font-medium">
                {metric.label}
              </span>
              
              {metric.sparklineData && (
                <InlineSparkline
                  data={metric.sparklineData}
                  color={metric.color}
                  width={40}
                  height={14}
                />
              )}
            </div>
            
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
