import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  suffix?: string;
}

export const MetricCard = ({ title, value, icon: Icon, trend, suffix }: MetricCardProps) => {
  const displayValue = typeof value === 'number' ? value.toFixed(1) : value;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {displayValue}
          {suffix && <span className="text-sm text-muted-foreground ml-1">{suffix}</span>}
        </div>
        {trend !== undefined && (
          <p className={`text-xs ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last period
          </p>
        )}
      </CardContent>
    </Card>
  );
};
