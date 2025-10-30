import { cn } from "@/lib/utils";

interface RoundedBarChartProps {
  data: Array<{
    name: string;
    value: number;
    completed?: number;
    inProgress?: number;
    count?: number;
  }>;
  maxValue?: number;
  showHatching?: boolean;
  className?: string;
}

export function RoundedBarChart({ 
  data, 
  maxValue, 
  showHatching = true,
  className 
}: RoundedBarChartProps) {
  const max = maxValue || Math.max(...data.map(d => d.value || 0));

  return (
    <div className={cn("space-y-4", className)}>
      {data.map((item, index) => {
        const percentage = max > 0 ? (item.value / max) * 100 : 0;
        const completedPercent = item.completed || percentage;
        const inProgressPercent = item.inProgress || 0;

        return (
          <div key={index} className="flex items-center gap-4">
            {/* Label */}
            <span className="text-sm font-medium w-40 text-foreground truncate">
              {item.name}
            </span>
            
            {/* Bar container - very rounded */}
            <div className="flex-1 h-12 bg-muted rounded-full overflow-hidden relative">
              {/* Main bar - gradient terracotta to coral */}
              <div 
                className="h-full bg-gradient-to-r from-[hsl(var(--terracotta-primary))] to-[hsl(var(--coral-accent))] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${completedPercent}%` }}
              />
              
              {/* Hatched overlay for "in progress" */}
              {showHatching && inProgressPercent > 0 && (
                <div 
                  className="absolute right-0 top-0 h-full opacity-40"
                  style={{ 
                    width: `${inProgressPercent}%`,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='8' height='8' viewBox='0 0 8 8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 8L8 0' stroke='%23AA8877' stroke-width='1'/%3E%3C/svg%3E")`,
                    backgroundSize: '8px 8px'
                  }}
                />
              )}
            </div>
            
            {/* Count - bold */}
            <span className="text-lg font-bold w-12 text-right text-foreground">
              {item.count !== undefined ? item.count : Math.round(item.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
