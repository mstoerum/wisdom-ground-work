import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface EvaluationTrendsProps {
  evaluations: any[];
}

export const EvaluationTrends = ({ evaluations }: EvaluationTrendsProps) => {
  // Group evaluations by date
  const trends = useMemo(() => {
    const grouped = evaluations.reduce((acc, evaluation) => {
      const date = format(new Date(evaluation.completed_at), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = {
          date,
          count: 0,
          avgDuration: 0,
          avgSentiment: 0,
          totalDuration: 0,
          totalSentiment: 0,
        };
      }
      acc[date].count++;
      acc[date].totalDuration += evaluation.duration_seconds || 0;
      acc[date].totalSentiment += evaluation.sentiment_score || 0.5;
      acc[date].avgDuration = acc[date].totalDuration / acc[date].count;
      acc[date].avgSentiment = acc[date].totalSentiment / acc[date].count;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped)
      .sort((a: any, b: any) => a.date.localeCompare(b.date))
      .slice(-14); // Last 14 days
  }, [evaluations]);

  // Calculate trend direction
  const getTrend = (current: number, previous: number) => {
    if (current > previous) return { icon: TrendingUp, color: "text-green-600", label: "Increasing" };
    if (current < previous) return { icon: TrendingDown, color: "text-red-600", label: "Decreasing" };
    return { icon: Minus, color: "text-gray-600", label: "Stable" };
  };

  const completionTrend = trends.length >= 2 
    ? getTrend((trends[trends.length - 1] as any).count, (trends[trends.length - 2] as any).count)
    : null;

  const sentimentTrend = trends.length >= 2
    ? getTrend((trends[trends.length - 1] as any).avgSentiment, (trends[trends.length - 2] as any).avgSentiment)
    : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Evaluation Trends</CardTitle>
          <CardDescription>
            Evaluation activity and sentiment over the last 14 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trends.length > 0 ? (
            <div className="space-y-4">
              {/* Trend Indicators */}
              <div className="grid grid-cols-2 gap-4">
                {completionTrend && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Completion Rate</p>
                      <p className="text-xs text-muted-foreground">Evaluations per day</p>
                    </div>
                    <completionTrend.icon className={`h-5 w-5 ${completionTrend.color}`} />
                  </div>
                )}
                {sentimentTrend && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Sentiment</p>
                      <p className="text-xs text-muted-foreground">Average sentiment score</p>
                    </div>
                    <sentimentTrend.icon className={`h-5 w-5 ${sentimentTrend.color}`} />
                  </div>
                )}
              </div>

              {/* Daily Breakdown */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Daily Breakdown</h4>
                <div className="space-y-2">
                  {trends.map((trend: any, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 border rounded text-sm">
                      <span>{format(new Date(trend.date), 'MMM dd')}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">{trend.count} evaluations</span>
                        <span className="text-muted-foreground">
                          {Math.round(trend.avgDuration)}s avg
                        </span>
                        <span className={`font-medium ${
                          trend.avgSentiment > 0.6 ? 'text-green-600' :
                          trend.avgSentiment < 0.4 ? 'text-red-600' :
                          'text-yellow-600'
                        }`}>
                          {trend.avgSentiment.toFixed(2)} sentiment
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Not enough data to show trends yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
