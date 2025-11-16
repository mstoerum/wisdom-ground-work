import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface EvaluationMetricsProps {
  evaluations: any[];
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export const EvaluationMetrics = ({ evaluations }: EvaluationMetricsProps) => {
  // Calculate detailed metrics
  const metrics = useMemo(() => {
    const durationData = evaluations.reduce((acc, eval) => {
      const duration = Math.floor((eval.duration_seconds || 0) / 10) * 10; // Round to nearest 10s
      if (!acc[duration]) acc[duration] = 0;
      acc[duration]++;
      return acc;
    }, {} as Record<number, number>);

    const questionData = evaluations.reduce((acc, eval) => {
      const insights = eval.key_insights as any;
      const questions = insights?.total_questions || 0;
      if (!acc[questions]) acc[questions] = 0;
      acc[questions]++;
      return acc;
    }, {} as Record<number, number>);

    const sentimentData = [
      {
        name: 'Positive',
        value: evaluations.filter(e => e.sentiment_score && e.sentiment_score > 0.6).length,
      },
      {
        name: 'Neutral',
        value: evaluations.filter(e => e.sentiment_score && e.sentiment_score >= 0.4 && e.sentiment_score <= 0.6).length,
      },
      {
        name: 'Negative',
        value: evaluations.filter(e => e.sentiment_score && e.sentiment_score < 0.4).length,
      },
    ];

    return {
      durationDistribution: Object.entries(durationData)
        .map(([duration, count]) => ({ duration: `${duration}s`, count }))
        .sort((a, b) => parseInt(a.duration) - parseInt(b.duration)),
      questionDistribution: Object.entries(questionData)
        .map(([questions, count]) => ({ questions: `${questions}`, count }))
        .sort((a, b) => parseInt(a.questions) - parseInt(b.questions)),
      sentimentDistribution: sentimentData,
    };
  }, [evaluations]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Duration Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Duration Distribution</CardTitle>
            <CardDescription>
              How long users spend on evaluations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.durationDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.durationDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="duration" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Not enough data
              </p>
            )}
          </CardContent>
        </Card>

        {/* Question Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Questions Per Evaluation</CardTitle>
            <CardDescription>
              Number of questions answered per evaluation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.questionDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.questionDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="questions" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Not enough data
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sentiment Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Sentiment Distribution</CardTitle>
          <CardDescription>
            Overall sentiment breakdown of evaluations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.sentimentDistribution.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.sentimentDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {metrics.sentimentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Not enough data
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
