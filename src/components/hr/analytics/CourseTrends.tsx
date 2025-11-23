import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { TrendingUp, Calendar } from "lucide-react";

interface CourseTrendsProps {
  responses: any[];
  courseEvaluations: any[];
}

export function CourseTrends({ responses, courseEvaluations }: CourseTrendsProps) {
  // Group responses by survey/semester
  const trendData = courseEvaluations.map(survey => {
    const surveyResponses = responses.filter(r => r.survey_id === survey.id);
    const avgSentiment = surveyResponses.length > 0
      ? Math.round(
          surveyResponses.reduce((sum, r) => sum + (r.sentiment_score || 50), 0) / surveyResponses.length
        )
      : 0;
    
    const participationCount = new Set(surveyResponses.map(r => r.conversation_sessions?.id)).size;

    return {
      name: survey.title,
      date: new Date(survey.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      sentiment: avgSentiment,
      participation: participationCount,
      responses: surveyResponses.length,
    };
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (trendData.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Trend Data Available</h3>
          <p className="text-muted-foreground">
            Trends will appear as you collect feedback from multiple course evaluations.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Student Sentiment Trends
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Track how student sentiment evolves across course evaluations
          </p>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              sentiment: {
                label: "Avg Sentiment",
                color: "hsl(var(--primary))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis domain={[0, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="sentiment" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--primary))", r: 5 }}
                  name="Sentiment Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Participation Trends
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Monitor student engagement over time
          </p>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              participation: {
                label: "Students",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="participation" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--chart-2))", r: 5 }}
                  name="Students Participated"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
