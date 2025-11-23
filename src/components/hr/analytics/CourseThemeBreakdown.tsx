import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BookOpen } from "lucide-react";

interface CourseThemeBreakdownProps {
  responses: any[];
}

export function CourseThemeBreakdown({ responses }: CourseThemeBreakdownProps) {
  // Group responses by theme and calculate average sentiment
  const themeData = responses.reduce((acc: any[], response) => {
    const themeName = response.survey_themes?.name || 'Other';
    const existing = acc.find(item => item.theme === themeName);
    
    if (existing) {
      existing.count += 1;
      existing.totalSentiment += response.sentiment_score || 50;
      existing.avgSentiment = Math.round(existing.totalSentiment / existing.count);
    } else {
      acc.push({
        theme: themeName,
        count: 1,
        totalSentiment: response.sentiment_score || 50,
        avgSentiment: response.sentiment_score || 50,
      });
    }
    
    return acc;
  }, []);

  // Sort by count descending
  const sortedThemeData = themeData.sort((a, b) => b.count - a.count);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Evaluation Dimensions Breakdown
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Student feedback distribution across course evaluation dimensions
        </p>
      </CardHeader>
      <CardContent>
        {sortedThemeData.length > 0 ? (
          <ChartContainer
            config={{
              count: {
                label: "Responses",
                color: "hsl(var(--primary))",
              },
              avgSentiment: {
                label: "Avg Sentiment",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-[400px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedThemeData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="theme" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  className="text-xs"
                />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--primary))" 
                  radius={[8, 8, 0, 0]}
                  name="Responses"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            No theme data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
