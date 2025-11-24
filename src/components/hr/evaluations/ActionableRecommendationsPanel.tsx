import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowUpRight, ArrowRight, ArrowDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Recommendation {
  recommendation: string;
  rationale?: string;
  priority: "p0" | "p1" | "p2";
  estimated_impact: "high" | "medium" | "low";
}

interface ActionableRecommendationsPanelProps {
  analytics: {
    actionable_recommendations?: Recommendation[];
  } | null;
  isLoading?: boolean;
}

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case "p0":
      return <ArrowUpRight className="h-4 w-4" />;
    case "p1":
      return <ArrowRight className="h-4 w-4" />;
    case "p2":
      return <ArrowDown className="h-4 w-4" />;
    default:
      return <ArrowRight className="h-4 w-4" />;
  }
};

const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case "p0":
      return "Critical";
    case "p1":
      return "High";
    case "p2":
      return "Medium";
    default:
      return priority;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "p0":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "p1":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    case "p2":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
};

const getImpactColor = (impact: string) => {
  switch (impact) {
    case "high":
      return "default";
    case "medium":
      return "secondary";
    case "low":
      return "outline";
    default:
      return "outline";
  }
};

export const ActionableRecommendationsPanel = ({
  analytics,
  isLoading,
}: ActionableRecommendationsPanelProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Actionable Recommendations</CardTitle>
          <CardDescription>Loading recommendations...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const recommendations = analytics?.actionable_recommendations || [];

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Actionable Recommendations</CardTitle>
          <CardDescription>No recommendations available</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Run deep analysis to generate prioritized product recommendations.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const p0 = recommendations.filter((r) => r.priority === "p0");
  const p1 = recommendations.filter((r) => r.priority === "p1");
  const p2 = recommendations.filter((r) => r.priority === "p2");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actionable Recommendations</CardTitle>
        <CardDescription>
          {p0.length} critical, {p1.length} high priority, {p2.length} medium priority
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="border border-border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getPriorityIcon(rec.priority)}</div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(rec.priority)}`}>
                      {getPriorityLabel(rec.priority)}
                    </span>
                    <Badge variant={getImpactColor(rec.estimated_impact) as any}>
                      {rec.estimated_impact} impact
                    </Badge>
                  </div>
                  <p className="text-sm font-medium">{rec.recommendation}</p>
                  {rec.rationale && (
                    <p className="text-xs text-muted-foreground">{rec.rationale}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
