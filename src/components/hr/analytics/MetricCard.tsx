import { Card } from "@/components/ui/card";
import { LucideIcon, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  suffix?: string;
  description?: string;
}

export const MetricCard = ({ title, value, icon: Icon, trend, suffix, description }: MetricCardProps) => {
  const displayValue = typeof value === 'number' ? value.toFixed(1) : value;

  return (
    <Card className="p-8 hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)] transition-shadow duration-300">
      {/* Icon with soft background */}
      <div className="flex items-start justify-between mb-6">
        <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--terracotta-pale))] flex items-center justify-center">
          <Icon className="w-7 h-7 text-[hsl(var(--terracotta-primary))]" />
        </div>
        
        {/* Trend badge - subtle */}
        {trend !== undefined && (
          <div className={cn(
            "px-3 py-1 rounded-full flex items-center gap-1",
            trend >= 0 ? "bg-success/10" : "bg-destructive/10"
          )}>
            {trend >= 0 ? (
              <ArrowUp className="w-3 h-3 text-success" />
            ) : (
              <ArrowDown className="w-3 h-3 text-destructive" />
            )}
            <span className={cn(
              "text-xs font-semibold",
              trend >= 0 ? "text-success" : "text-destructive"
            )}>
              {trend >= 0 ? "+" : ""}{trend}%
            </span>
          </div>
        )}
      </div>
      
      {/* Label - small, uppercase, light */}
      <p className="text-xs font-light text-muted-foreground uppercase tracking-wider mb-2">
        {title}
      </p>
      
      {/* Metric - HUGE, bold */}
      <div className="flex items-baseline gap-2 mb-3">
        <p className="text-6xl font-bold text-[hsl(var(--terracotta-primary))] leading-none">
          {displayValue}
        </p>
        {suffix && (
          <span className="text-3xl font-light text-muted-foreground">{suffix}</span>
        )}
      </div>
      
      {/* Context - tiny, muted */}
      {description && (
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
    </Card>
  );
};
