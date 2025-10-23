import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface UrgencyFlagsProps {
  urgencies: any[];
}

export const UrgencyFlags = ({ urgencies }: UrgencyFlagsProps) => {
  const unresolved = urgencies.filter(u => !u.resolved_at);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Urgent Flags ({unresolved.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {unresolved.length > 0 ? (
            unresolved.map((urgency) => (
              <div key={urgency.id} className="border-b pb-4 last:border-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex gap-2">
                    <Badge variant="destructive">{urgency.escalation_type}</Badge>
                    {urgency.responses?.survey_themes && (
                      <Badge variant="outline">{urgency.responses.survey_themes.name}</Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(urgency.escalated_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm mb-2">
                  {urgency.responses?.content?.substring(0, 150)}...
                </p>
                <Button size="sm" variant="outline">Mark as Resolved</Button>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-lg font-medium text-primary mb-2">Great news! 🎉</p>
              <p className="text-muted-foreground">No urgent flags at this time. All feedback is being addressed normally.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
