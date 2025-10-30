import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface SentimentChartProps {
  positive: number;
  neutral: number;
  negative: number;
}

export const SentimentChart = ({ positive, neutral, negative }: SentimentChartProps) => {
  const data = [
    { name: 'Positive', value: positive, fill: 'hsl(var(--lime-green))' },
    { name: 'Neutral', value: neutral, fill: 'hsl(var(--butter-yellow))' },
    { name: 'Negative', value: negative, fill: 'hsl(var(--coral-pink))' },
  ];

  return (
    <Card className="hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-shadow duration-300">
      <CardHeader>
        <CardTitle>Sentiment Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{
          positive: { label: "Positive", color: "hsl(var(--lime-green))" },
          neutral: { label: "Neutral", color: "hsl(var(--butter-yellow))" },
          negative: { label: "Negative", color: "hsl(var(--coral-pink))" },
        }} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar 
                dataKey="value" 
                fill="fill" 
                radius={[16, 16, 0, 0]}
                className="transition-all duration-600"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
