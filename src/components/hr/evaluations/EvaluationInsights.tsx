import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lightbulb, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { useMemo } from "react";

interface EvaluationInsightsProps {
  evaluations: any[];
}

export const EvaluationInsights = ({ evaluations }: EvaluationInsightsProps) => {
  // Extract key insights from all evaluations
  const insights = useMemo(() => {
    const dimensions: Record<string, string[]> = {
      overall_experience: [],
      ease_of_use: [],
      conversation_quality: [],
      value_comparison: [],
    };

    const painPoints: string[] = [];
    const strengths: string[] = [];
    const suggestions: string[] = [];

    evaluations.forEach((eval) => {
      const keyInsights = eval.key_insights as any;
      if (!keyInsights?.dimensions) return;

      const dims = keyInsights.dimensions;
      
      // Collect responses by dimension
      Object.keys(dimensions).forEach((key) => {
        if (dims[key]) {
          dimensions[key].push(dims[key]);
        }
      });

      // Extract pain points (negative sentiment responses)
      if (eval.sentiment_score && eval.sentiment_score < 0.4) {
        const responses = eval.evaluation_responses as any[];
        responses?.forEach((r) => {
          if (r.answer && r.answer.toLowerCase().includes("problem") || 
              r.answer.toLowerCase().includes("issue") ||
              r.answer.toLowerCase().includes("difficult") ||
              r.answer.toLowerCase().includes("confusing")) {
            painPoints.push(r.answer);
          }
        });
      }

      // Extract strengths (positive sentiment responses)
      if (eval.sentiment_score && eval.sentiment_score > 0.6) {
        const responses = eval.evaluation_responses as any[];
        responses?.forEach((r) => {
          if (r.answer && (r.answer.toLowerCase().includes("good") || 
              r.answer.toLowerCase().includes("great") ||
              r.answer.toLowerCase().includes("easy") ||
              r.answer.toLowerCase().includes("helpful"))) {
            strengths.push(r.answer);
          }
        });
      }

      // Extract suggestions
      const responses = eval.evaluation_responses as any[];
      responses?.forEach((r) => {
        if (r.answer && (r.answer.toLowerCase().includes("could") || 
            r.answer.toLowerCase().includes("should") ||
            r.answer.toLowerCase().includes("suggest") ||
            r.answer.toLowerCase().includes("improve"))) {
          suggestions.push(r.answer);
        }
      });
    });

    return {
      dimensions,
      painPoints: [...new Set(painPoints)].slice(0, 5),
      strengths: [...new Set(strengths)].slice(0, 5),
      suggestions: [...new Set(suggestions)].slice(0, 5),
    };
  }, [evaluations]);

  return (
    <div className="space-y-4">
      {/* Strengths */}
      {insights.strengths.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <CardTitle>What's Working Well</CardTitle>
            </div>
            <CardDescription>
              Positive feedback from users about their Spradley experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.strengths.map((strength, idx) => (
                <Alert key={idx} className="border-green-200 bg-green-50">
                  <AlertDescription className="text-sm">{strength}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pain Points */}
      {insights.painPoints.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <CardTitle>Areas for Improvement</CardTitle>
            </div>
            <CardDescription>
              Common issues and challenges users mentioned
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.painPoints.map((point, idx) => (
                <Alert key={idx} className="border-orange-200 bg-orange-50">
                  <AlertDescription className="text-sm">{point}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      {insights.suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-blue-600" />
              <CardTitle>User Suggestions</CardTitle>
            </div>
            <CardDescription>
              Ideas and recommendations from users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.suggestions.map((suggestion, idx) => (
                <Alert key={idx} className="border-blue-200 bg-blue-50">
                  <AlertDescription className="text-sm">{suggestion}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dimension Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Evaluation Dimensions</CardTitle>
          </div>
          <CardDescription>
            Feedback breakdown by evaluation dimension
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(insights.dimensions).map(([key, values]) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <Badge variant="outline">{values.length} responses</Badge>
                </div>
                {values.length > 0 && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {values[0]?.substring(0, 100)}...
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
