import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { format } from "date-fns";

interface UrgentResponse {
  id: string;
  content: string;
  urgency_score: number;
  ai_analysis: {
    urgency_reason?: string;
    detected_themes?: string[];
    key_sentiment_indicators?: string[];
  };
  created_at: string;
  theme_id?: string;
}

interface UrgentResponsesPanelProps {
  responses: UrgentResponse[];
  isLoading?: boolean;
}

const urgencyConfig = {
  5: {
    label: "Critical",
    icon: AlertTriangle,
    color: "hsl(var(--destructive))",
    bgColor: "hsl(var(--destructive) / 0.1)",
    borderColor: "hsl(var(--destructive) / 0.3)"
  },
  4: {
    label: "High",
    icon: AlertCircle,
    color: "hsl(var(--warning))",
    bgColor: "hsl(var(--warning) / 0.1)",
    borderColor: "hsl(var(--warning) / 0.3)"
  },
  3: {
    label: "Medium",
    icon: Info,
    color: "hsl(var(--chart-3))",
    bgColor: "hsl(var(--chart-3) / 0.1)",
    borderColor: "hsl(var(--chart-3) / 0.3)"
  }
};

export const UrgentResponsesPanel = ({ responses, isLoading }: UrgentResponsesPanelProps) => {
  // Filter and sort by urgency (highest first)
  const urgentResponses = responses
    .filter(r => r.urgency_score && r.urgency_score >= 3)
    .sort((a, b) => (b.urgency_score || 0) - (a.urgency_score || 0));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Urgent Responses
          </CardTitle>
          <CardDescription>
            Responses requiring prompt attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading urgent responses...</div>
        </CardContent>
      </Card>
    );
  }

  if (urgentResponses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            Urgent Responses
          </CardTitle>
          <CardDescription>
            No urgent responses detected
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            All feedback is within normal urgency levels.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Urgent Responses
          <Badge variant="destructive" className="ml-auto">
            {urgentResponses.length}
          </Badge>
        </CardTitle>
        <CardDescription>
          Responses requiring prompt attention (urgency level 3+)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {urgentResponses.map((response) => {
              const urgency = response.urgency_score as 3 | 4 | 5;
              const config = urgencyConfig[urgency];
              const Icon = config.icon;

              return (
                <div
                  key={response.id}
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: config.bgColor,
                    borderColor: config.borderColor
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Icon
                      className="h-5 w-5 mt-0.5 flex-shrink-0"
                      style={{ color: config.color }}
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          style={{
                            backgroundColor: config.bgColor,
                            borderColor: config.borderColor,
                            color: config.color
                          }}
                        >
                          {config.label} ({urgency}/5)
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(response.created_at), 'MMM d, yyyy HH:mm')}
                        </span>
                      </div>

                      {response.ai_analysis?.urgency_reason && (
                        <div className="text-sm font-medium" style={{ color: config.color }}>
                          {response.ai_analysis.urgency_reason}
                        </div>
                      )}

                      <blockquote className="text-sm border-l-2 pl-3 italic text-muted-foreground">
                        "{response.content}"
                      </blockquote>

                      {response.ai_analysis?.key_sentiment_indicators && 
                       response.ai_analysis.key_sentiment_indicators.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {response.ai_analysis.key_sentiment_indicators.map((indicator, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {indicator}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {response.ai_analysis?.detected_themes && 
                       response.ai_analysis.detected_themes.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Themes: {response.ai_analysis.detected_themes.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
