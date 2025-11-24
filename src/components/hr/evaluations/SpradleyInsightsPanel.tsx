import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, Lightbulb, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Insight {
  category: "pain_point" | "win" | "feature_request" | "usability";
  insight: string;
  supporting_quote?: string;
  priority: "high" | "medium" | "low";
}

interface SpradleyInsightsPanelProps {
  analytics: {
    executive_summary?: string;
    top_insights?: Insight[];
    confidence_score?: number;
    analyzed_at?: string;
  } | null;
  isLoading?: boolean;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "pain_point":
      return <AlertTriangle className="h-4 w-4" />;
    case "win":
      return <TrendingUp className="h-4 w-4" />;
    case "feature_request":
      return <Lightbulb className="h-4 w-4" />;
    case "usability":
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case "pain_point":
      return "destructive";
    case "win":
      return "default";
    case "feature_request":
      return "secondary";
    case "usability":
      return "outline";
    default:
      return "outline";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "medium":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "low":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
};

export const SpradleyInsightsPanel = ({ analytics, isLoading }: SpradleyInsightsPanelProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Insights</CardTitle>
          <CardDescription>Analyzing evaluations...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Insights</CardTitle>
          <CardDescription>No analysis available yet</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Run deep analysis to generate insights from evaluation data.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Executive Summary</CardTitle>
              <CardDescription>
                {analytics.analyzed_at && (
                  <>Analyzed {new Date(analytics.analyzed_at).toLocaleDateString()}</>
                )}
              </CardDescription>
            </div>
            {analytics.confidence_score && (
              <Badge variant="outline" className="text-sm">
                {analytics.confidence_score}% confidence
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {analytics.executive_summary}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Insights</CardTitle>
          <CardDescription>
            {analytics.top_insights?.length || 0} key findings from evaluation analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.top_insights?.map((insight, idx) => (
              <div
                key={idx}
                className="border border-border rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getCategoryIcon(insight.category)}</div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={getCategoryColor(insight.category) as any}>
                        {insight.category.replace("_", " ")}
                      </Badge>
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(insight.priority)}`}>
                        {insight.priority} priority
                      </span>
                    </div>
                    <p className="text-sm font-medium">{insight.insight}</p>
                    {insight.supporting_quote && (
                      <blockquote className="text-xs text-muted-foreground italic border-l-2 border-muted-foreground/30 pl-3">
                        "{insight.supporting_quote}"
                      </blockquote>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
