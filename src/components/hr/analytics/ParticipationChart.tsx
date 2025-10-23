import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface ParticipationChartProps {
  completed: number;
  pending: number;
}

export const ParticipationChart = ({ completed, pending }: ParticipationChartProps) => {
  const data = [
    { name: 'Completed', value: completed, fill: 'hsl(var(--chart-1))' },
    { name: 'Pending', value: pending, fill: 'hsl(var(--chart-4))' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Participation Status</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{
          completed: { label: "Completed", color: "hsl(var(--chart-1))" },
          pending: { label: "Pending", color: "hsl(var(--chart-4))" },
        }} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="fill"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
