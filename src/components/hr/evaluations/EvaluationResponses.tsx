import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Clock, MessageSquare } from "lucide-react";

interface EvaluationResponsesProps {
  evaluations: any[];
}

export const EvaluationResponses = ({ evaluations }: EvaluationResponsesProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Individual Evaluations</CardTitle>
        <CardDescription>
          Detailed responses from each evaluation session
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {evaluations.map((evaluation) => {
              const responses = evaluation.evaluation_responses as any[];
              const insights = evaluation.key_insights as any;
              
              return (
                <Card key={evaluation.id} className="border-l-4 border-l-primary">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {evaluation.survey?.title || 'Survey'}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {format(new Date(evaluation.completed_at), 'MMM dd, yyyy HH:mm')}
                          {evaluation.employee?.full_name && ` • ${evaluation.employee.full_name}`}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          evaluation.sentiment_score && evaluation.sentiment_score > 0.6 ? "default" :
                          evaluation.sentiment_score && evaluation.sentiment_score < 0.4 ? "destructive" :
                          "secondary"
                        }>
                          {evaluation.sentiment_score ? evaluation.sentiment_score.toFixed(2) : 'N/A'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {evaluation.duration_seconds}s
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {responses?.map((response, idx) => (
                        <div key={idx} className="space-y-1 pl-4 border-l-2 border-muted">
                          <p className="text-sm font-medium text-muted-foreground">
                            Q{response.questionNumber || idx + 1}: {response.question}
                          </p>
                          <p className="text-sm">{response.answer}</p>
                        </div>
                      ))}
                      {insights?.dimensions && (
                        <div className="mt-4 pt-4 border-t space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">Key Dimensions:</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {Object.entries(insights.dimensions).map(([key, value]: [string, any]) => (
                              value && (
                                <div key={key} className="space-y-1">
                                  <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                                  <p className="text-muted-foreground line-clamp-2">{value}</p>
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
