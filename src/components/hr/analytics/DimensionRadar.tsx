import { useMemo } from "react";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type DimensionHealth, getDimensionLabel } from "@/hooks/useSemanticSignals";
import { Brain, Users, Scale, Heart, Star } from "lucide-react";

interface DimensionRadarProps {
  dimensions: DimensionHealth[];
  className?: string;
}

const DIMENSION_ICONS = {
  expertise: Brain,
  autonomy: Star,
  justice: Scale,
  social_connection: Users,
  social_status: Heart,
};

const DIMENSION_COLORS = {
  expertise: "hsl(var(--chart-1))",
  autonomy: "hsl(var(--chart-2))",
  justice: "hsl(var(--chart-3))",
  social_connection: "hsl(var(--chart-4))",
  social_status: "hsl(var(--chart-5))",
};

export const DimensionRadar = ({ dimensions, className }: DimensionRadarProps) => {
  const radarData = useMemo(() => {
    return dimensions.map(dim => ({
      dimension: getDimensionLabel(dim.dimension),
      health: dim.healthScore,
      fullMark: 100,
    }));
  }, [dimensions]);

  const averageHealth = useMemo(() => {
    if (dimensions.length === 0) return 0;
    return Math.round(
      dimensions.reduce((sum, d) => sum + d.healthScore, 0) / dimensions.length
    );
  }, [dimensions]);

  const healthStatus = averageHealth >= 70 ? "Healthy" : averageHealth >= 40 ? "Attention Needed" : "Critical";
  const healthColor = averageHealth >= 70 ? "text-green-600" : averageHealth >= 40 ? "text-amber-600" : "text-red-600";

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Workplace Drivers</CardTitle>
          <div className="text-right">
            <div className={`text-2xl font-bold ${healthColor}`}>{averageHealth}%</div>
            <div className="text-xs text-muted-foreground">{healthStatus}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis 
                dataKey="dimension" 
                tick={{ 
                  fill: "hsl(var(--foreground))", 
                  fontSize: 11,
                  fontWeight: 500
                }}
              />
              <Radar
                name="Health"
                dataKey="health"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`${value}%`, "Health Score"]}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Dimension Legend */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t">
          {dimensions.map(dim => {
            const Icon = DIMENSION_ICONS[dim.dimension];
            const color = dim.healthScore >= 70 
              ? "text-green-600" 
              : dim.healthScore >= 40 
                ? "text-amber-600" 
                : "text-red-600";
            
            return (
              <div 
                key={dim.dimension}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
              >
                <Icon className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">
                    {getDimensionLabel(dim.dimension)}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-sm font-bold ${color}`}>
                      {dim.healthScore}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      · {dim.totalVoices} voices
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
