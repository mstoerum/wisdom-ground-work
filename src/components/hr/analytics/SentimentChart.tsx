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
    { name: 'Positive', value: positive, fill: 'hsl(var(--chart-1))' },
    { name: 'Neutral', value: neutral, fill: 'hsl(var(--chart-2))' },
    { name: 'Negative', value: negative, fill: 'hsl(var(--chart-3))' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sentiment Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{
          positive: { label: "Positive", color: "hsl(var(--chart-1))" },
          neutral: { label: "Neutral", color: "hsl(var(--chart-2))" },
          negative: { label: "Negative", color: "hsl(var(--chart-3))" },
        }} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="fill" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
