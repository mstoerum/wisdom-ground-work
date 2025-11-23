import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, TrendingUp, TrendingDown, Minus, Quote, CheckCircle2, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SessionInsight {
  id: string;
  session_id: string;
  root_cause: string | null;
  sentiment_trajectory: 'improving' | 'declining' | 'stable' | 'mixed' | null;
  key_quotes: string[];
  recommended_actions: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    timeframe: string;
  }>;
  confidence_score: number | null;
  created_at: string;
}

interface SessionInsightsPanelProps {
  insights: SessionInsight[];
  isLoading?: boolean;
}

const trajectoryConfig = {
  improving: {
    label: "Improving",
    icon: TrendingUp,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-900/20",
    border: "border-green-200 dark:border-green-800"
  },
  declining: {
    label: "Declining",
    icon: TrendingDown,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-200 dark:border-red-800"
  },
  stable: {
    label: "Stable",
    icon: Minus,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800"
  },
  mixed: {
    label: "Mixed",
    icon: Minus,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-200 dark:border-amber-800"
  }
};

const priorityConfig = {
  high: { label: "High Priority", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  medium: { label: "Medium Priority", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  low: { label: "Low Priority", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" }
};

export const SessionInsightsPanel = ({ insights, isLoading }: SessionInsightsPanelProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Session Insights
          </CardTitle>
          <CardDescription>Deep AI analysis of completed conversations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Session Insights
          </CardTitle>
          <CardDescription>Deep AI analysis of completed conversations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No session insights available yet.</p>
            <p className="text-sm mt-1">Insights are generated when conversations are completed.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {insights.map((insight) => {
        const trajectory = insight.sentiment_trajectory 
          ? trajectoryConfig[insight.sentiment_trajectory]
          : null;
        const TrajectoryIcon = trajectory?.icon;

        return (
          <Card key={insight.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">Root Cause Analysis</CardTitle>
                  {insight.confidence_score && (
                    <CardDescription className="mt-1">
                      Confidence: {insight.confidence_score}%
                    </CardDescription>
                  )}
                </div>
                {trajectory && TrajectoryIcon && (
                  <Badge variant="outline" className={`${trajectory.bg} ${trajectory.border} ${trajectory.color} flex items-center gap-1`}>
                    <TrajectoryIcon className="w-3 h-3" />
                    {trajectory.label}
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Root Cause */}
              {insight.root_cause && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    Core Issue
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {insight.root_cause}
                  </p>
                </div>
              )}

              {/* Key Quotes */}
              {insight.key_quotes && insight.key_quotes.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Quote className="w-4 h-4 text-primary" />
                    Key Quotes
                  </h4>
                  <div className="space-y-2">
                    {insight.key_quotes.map((quote, idx) => (
                      <div 
                        key={idx} 
                        className="pl-4 border-l-2 border-primary/20 py-1"
                      >
                        <p className="text-sm italic text-muted-foreground">"{quote}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Actions */}
              {insight.recommended_actions && insight.recommended_actions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    Recommended Actions
                  </h4>
                  <div className="space-y-3">
                    {insight.recommended_actions
                      .sort((a, b) => {
                        const priorityOrder = { high: 0, medium: 1, low: 2 };
                        return priorityOrder[a.priority] - priorityOrder[b.priority];
                      })
                      .map((action, idx) => (
                        <div 
                          key={idx}
                          className="flex items-start gap-3 p-3 rounded-lg border bg-card/50"
                        >
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-relaxed">
                              {action.action}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {action.timeframe}
                            </div>
                          </div>
                          <Badge 
                            variant="secondary"
                            className={priorityConfig[action.priority].color}
                          >
                            {priorityConfig[action.priority].label}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
