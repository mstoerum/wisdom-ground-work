import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, TrendingDown, AlertTriangle, Shield, Clock } from "lucide-react";
import type { ParticipationMetrics, SentimentMetrics } from "@/hooks/useAnalytics";

interface PulseHeaderProps {
  participation: ParticipationMetrics | null;
  sentiment: SentimentMetrics | null;
  urgentCount: number;
  confidenceScore?: number;
  isLoading?: boolean;
}

export function PulseHeader({ 
  participation, 
  sentiment, 
  urgentCount, 
  confidenceScore,
  isLoading 
}: PulseHeaderProps) {
  const metrics = [
    {
      label: "Participation",
      value: `${participation?.completionRate || 0}%`,
      subtext: `${participation?.completed || 0} of ${participation?.totalAssigned || 0}`,
      icon: Users,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
      trend: participation?.completionRate && participation.completionRate > 70 ? "up" : null,
    },
    {
      label: "Sentiment",
      value: `${sentiment?.avgScore || 0}/100`,
      subtext: sentiment?.moodImprovement && sentiment.moodImprovement > 0 
        ? `+${sentiment.moodImprovement} improvement` 
        : "No change",
      icon: sentiment?.moodImprovement && sentiment.moodImprovement > 0 ? TrendingUp : TrendingDown,
      color: (sentiment?.avgScore || 0) >= 60 ? "text-emerald-600" : (sentiment?.avgScore || 0) >= 40 ? "text-amber-600" : "text-rose-600",
      bgColor: (sentiment?.avgScore || 0) >= 60 ? "bg-emerald-50 dark:bg-emerald-950/20" : (sentiment?.avgScore || 0) >= 40 ? "bg-amber-50 dark:bg-amber-950/20" : "bg-rose-50 dark:bg-rose-950/20",
      trend: sentiment?.moodImprovement && sentiment.moodImprovement > 0 ? "up" : null,
    },
    {
      label: "Urgent Flags",
      value: urgentCount.toString(),
      subtext: urgentCount > 0 ? "Need attention" : "All clear",
      icon: AlertTriangle,
      color: urgentCount > 0 ? "text-amber-600" : "text-emerald-600",
      bgColor: urgentCount > 0 ? "bg-amber-50 dark:bg-amber-950/20" : "bg-emerald-50 dark:bg-emerald-950/20",
      trend: null,
    },
    {
      label: "Confidence",
      value: confidenceScore ? `${confidenceScore}/100` : "—",
      subtext: confidenceScore 
        ? confidenceScore >= 75 ? "High quality" : confidenceScore >= 50 ? "Moderate" : "Low data"
        : "No data",
      icon: Shield,
      color: confidenceScore 
        ? confidenceScore >= 75 ? "text-emerald-600" : confidenceScore >= 50 ? "text-amber-600" : "text-rose-600"
        : "text-muted-foreground",
      bgColor: confidenceScore 
        ? confidenceScore >= 75 ? "bg-emerald-50 dark:bg-emerald-950/20" : confidenceScore >= 50 ? "bg-amber-50 dark:bg-amber-950/20" : "bg-rose-50 dark:bg-rose-950/20"
        : "bg-muted/50",
      trend: null,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {metrics.map((metric) => (
        <Card 
          key={metric.label} 
          className={`border-l-4 ${metric.color.replace('text-', 'border-')} transition-all hover:shadow-md`}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <p className={`text-2xl font-bold ${metric.color}`}>
                  {metric.value}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {metric.trend === "up" && <TrendingUp className="h-3 w-3 text-emerald-600" />}
                  <span>{metric.subtext}</span>
                </div>
              </div>
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <metric.icon className={`h-5 w-5 ${metric.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
