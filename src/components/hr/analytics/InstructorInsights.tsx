import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Target, AlertCircle, CheckCircle2 } from "lucide-react";

interface InstructorInsightsProps {
  responses: any[];
}

export function InstructorInsights({ responses }: InstructorInsightsProps) {
  // Analyze responses to extract actionable insights
  const analysisData = responses.reduce((acc: any, response) => {
    const theme = response.survey_themes?.name || 'Other';
    const sentiment = response.sentiment || 'neutral';
    const score = response.sentiment_score || 50;

    if (!acc[theme]) {
      acc[theme] = {
        positive: [],
        negative: [],
        neutral: [],
        avgScore: 0,
        totalScore: 0,
        count: 0,
      };
    }

    acc[theme][sentiment].push(response.content);
    acc[theme].totalScore += score;
    acc[theme].count += 1;
    acc[theme].avgScore = acc[theme].totalScore / acc[theme].count;

    return acc;
  }, {});

  // Identify strengths (high-scoring themes)
  const strengths = Object.entries(analysisData)
    .filter(([_, data]: any) => data.avgScore >= 70)
    .sort((a: any, b: any) => b[1].avgScore - a[1].avgScore)
    .slice(0, 3);

  // Identify improvement areas (low-scoring themes)
  const improvements = Object.entries(analysisData)
    .filter(([_, data]: any) => data.avgScore < 60)
    .sort((a: any, b: any) => a[1].avgScore - b[1].avgScore)
    .slice(0, 3);

  // Quick wins (themes with mixed feedback but actionable items)
  const quickWins = Object.entries(analysisData)
    .filter(([_, data]: any) => data.negative.length > 0 && data.positive.length > 0)
    .slice(0, 3);

  if (responses.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Insights Yet</h3>
          <p className="text-muted-foreground">
            Actionable insights will appear here as student feedback is collected.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Strengths */}
      {strengths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Strengths to Maintain
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              These aspects are highly valued by students - keep up the excellent work!
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {strengths.map(([theme, data]: any) => (
                <div key={theme} className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{theme}</h4>
                    <Badge className="bg-green-600">{Math.round(data.avgScore)}/100</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {data.positive.length} positive comment{data.positive.length !== 1 ? 's' : ''}
                  </p>
                  {data.positive.slice(0, 2).map((comment: string, idx: number) => (
                    <p key={idx} className="text-sm italic mb-1">"{comment}"</p>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Improvement Areas */}
      {improvements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <Target className="h-5 w-5" />
              Priority Improvement Areas
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Focus on these dimensions to enhance the learning experience
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {improvements.map(([theme, data]: any) => (
                <div key={theme} className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{theme}</h4>
                    <Badge variant="destructive">{Math.round(data.avgScore)}/100</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {data.negative.length} concern{data.negative.length !== 1 ? 's' : ''} raised
                  </p>
                  {data.negative.slice(0, 2).map((comment: string, idx: number) => (
                    <p key={idx} className="text-sm italic mb-1">"{comment}"</p>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Wins */}
      {quickWins.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <Lightbulb className="h-5 w-5" />
              Quick Win Opportunities
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Small changes that could make a big difference based on student feedback
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {quickWins.map(([theme, data]: any) => (
                <div key={theme} className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{theme}</h4>
                    <Badge className="bg-blue-600">{Math.round(data.avgScore)}/100</Badge>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mt-3">
                    <div>
                      <p className="text-xs font-medium text-green-600 mb-1">What's Working:</p>
                      {data.positive.slice(0, 1).map((comment: string, idx: number) => (
                        <p key={idx} className="text-sm italic">"{comment}"</p>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-red-600 mb-1">What to Address:</p>
                      {data.negative.slice(0, 1).map((comment: string, idx: number) => (
                        <p key={idx} className="text-sm italic">"{comment}"</p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {strengths.length === 0 && improvements.length === 0 && quickWins.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Insufficient Data for Insights</h3>
            <p className="text-muted-foreground">
              More student feedback is needed to generate actionable insights.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
