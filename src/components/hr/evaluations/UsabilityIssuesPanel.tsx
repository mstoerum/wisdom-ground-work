import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UsabilityIssue {
  issue: string;
  severity: "critical" | "major" | "minor";
  frequency?: string;
  quote?: string;
}

interface UsabilityIssuesPanelProps {
  analytics: {
    usability_issues?: UsabilityIssue[];
  } | null;
  isLoading?: boolean;
}

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case "critical":
      return <AlertTriangle className="h-5 w-5 text-destructive" />;
    case "major":
      return <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
    case "minor":
      return <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    default:
      return <Info className="h-5 w-5" />;
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "critical":
      return "destructive";
    case "major":
      return "outline";
    case "minor":
      return "secondary";
    default:
      return "outline";
  }
};

export const UsabilityIssuesPanel = ({ analytics, isLoading }: UsabilityIssuesPanelProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usability Issues</CardTitle>
          <CardDescription>Loading issues...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const issues = analytics?.usability_issues || [];

  if (issues.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usability Issues</CardTitle>
          <CardDescription>No critical issues identified</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No usability issues found in the evaluation data. Great job! 🎉
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const criticalIssues = issues.filter((i) => i.severity === "critical");
  const majorIssues = issues.filter((i) => i.severity === "major");
  const minorIssues = issues.filter((i) => i.severity === "minor");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usability Issues</CardTitle>
        <CardDescription>
          {criticalIssues.length} critical, {majorIssues.length} major, {minorIssues.length} minor
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {issues.map((issue, idx) => (
            <div
              key={idx}
              className="border border-border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getSeverityIcon(issue.severity)}</div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={getSeverityColor(issue.severity) as any}>
                      {issue.severity}
                    </Badge>
                    {issue.frequency && (
                      <span className="text-xs text-muted-foreground">
                        Frequency: {issue.frequency}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium">{issue.issue}</p>
                  {issue.quote && (
                    <blockquote className="text-xs text-muted-foreground italic border-l-2 border-muted-foreground/30 pl-3">
                      "{issue.quote}"
                    </blockquote>
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
