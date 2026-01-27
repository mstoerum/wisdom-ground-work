import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type DimensionHealth, type AggregatedSignal, getDimensionLabel, type Dimension } from "@/hooks/useSemanticSignals";
import { ArrowRight, TrendingDown, TrendingUp, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface CrossPatternsProps {
  dimensions: DimensionHealth[];
  signals: AggregatedSignal[];
  className?: string;
}

interface Pattern {
  type: "correlation" | "friction" | "strength" | "insight";
  title: string;
  description: string;
  dimensions: Dimension[];
  confidence: number;
}

export const CrossPatterns = ({ dimensions, signals, className }: CrossPatternsProps) => {
  const patterns = useMemo(() => {
    const detected: Pattern[] = [];
    
    if (dimensions.length < 2) return detected;

    // Find strongest and weakest dimensions
    const sorted = [...dimensions].sort((a, b) => b.healthScore - a.healthScore);
    const strongest = sorted[0];
    const weakest = sorted[sorted.length - 1];

    // Pattern 1: Clear strength
    if (strongest && strongest.healthScore >= 70) {
      detected.push({
        type: "strength",
        title: `${getDimensionLabel(strongest.dimension)} is a strength`,
        description: `Employees feel positive about ${getDimensionLabel(strongest.dimension).toLowerCase()} with ${strongest.healthScore}% health score across ${strongest.totalVoices} voices.`,
        dimensions: [strongest.dimension],
        confidence: strongest.healthScore / 100,
      });
    }

    // Pattern 2: Clear friction point
    if (weakest && weakest.healthScore < 40) {
      detected.push({
        type: "friction",
        title: `${getDimensionLabel(weakest.dimension)} needs attention`,
        description: `${getDimensionLabel(weakest.dimension)} shows significant friction at ${weakest.healthScore}% health, with ${weakest.negativeCount} negative signals.`,
        dimensions: [weakest.dimension],
        confidence: (100 - weakest.healthScore) / 100,
      });
    }

    // Pattern 3: Autonomy-Expertise correlation
    const autonomy = dimensions.find(d => d.dimension === "autonomy");
    const expertise = dimensions.find(d => d.dimension === "expertise");
    if (autonomy && expertise) {
      const diff = Math.abs(autonomy.healthScore - expertise.healthScore);
      if (diff <= 15 && autonomy.totalVoices > 0 && expertise.totalVoices > 0) {
        const avg = (autonomy.healthScore + expertise.healthScore) / 2;
        detected.push({
          type: "correlation",
          title: "Autonomy & Expertise move together",
          description: avg >= 60 
            ? "When employees can work independently, they feel their skills are valued."
            : "Low autonomy may be limiting how employees use their expertise.",
          dimensions: ["autonomy", "expertise"],
          confidence: 1 - (diff / 100),
        });
      }
    }

    // Pattern 4: Social dimensions alignment
    const connection = dimensions.find(d => d.dimension === "social_connection");
    const status = dimensions.find(d => d.dimension === "social_status");
    if (connection && status) {
      const diff = Math.abs(connection.healthScore - status.healthScore);
      if (diff > 25 && connection.totalVoices > 0 && status.totalVoices > 0) {
        const higher = connection.healthScore > status.healthScore ? connection : status;
        const lower = connection.healthScore > status.healthScore ? status : connection;
        detected.push({
          type: "insight",
          title: "Social dimension gap detected",
          description: `Employees feel ${getDimensionLabel(higher.dimension).toLowerCase()} (${higher.healthScore}%) but struggle with ${getDimensionLabel(lower.dimension).toLowerCase()} (${lower.healthScore}%).`,
          dimensions: ["social_connection", "social_status"],
          confidence: diff / 100,
        });
      }
    }

    // Pattern 5: Justice impact
    const justice = dimensions.find(d => d.dimension === "justice");
    if (justice && justice.healthScore < 50 && justice.totalVoices >= 2) {
      detected.push({
        type: "friction",
        title: "Fairness concerns may affect overall morale",
        description: `Justice scores of ${justice.healthScore}% often ripple into other areas like recognition and autonomy.`,
        dimensions: ["justice"],
        confidence: (100 - justice.healthScore) / 100,
      });
    }

    return detected.slice(0, 4); // Max 4 patterns
  }, [dimensions]);

  if (patterns.length === 0) {
    return null;
  }

  const getPatternIcon = (type: Pattern["type"]) => {
    switch (type) {
      case "strength": return TrendingUp;
      case "friction": return TrendingDown;
      case "correlation": return ArrowRight;
      case "insight": return Lightbulb;
    }
  };

  const getPatternColor = (type: Pattern["type"]) => {
    switch (type) {
      case "strength": return "text-green-600 bg-green-50 dark:bg-green-950/30";
      case "friction": return "text-red-600 bg-red-50 dark:bg-red-950/30";
      case "correlation": return "text-blue-600 bg-blue-50 dark:bg-blue-950/30";
      case "insight": return "text-amber-600 bg-amber-50 dark:bg-amber-950/30";
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          Cross-Dimension Patterns
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {patterns.map((pattern, idx) => {
            const Icon = getPatternIcon(pattern.type);
            const colorClass = getPatternColor(pattern.type);
            
            return (
              <div 
                key={idx}
                className={cn(
                  "p-3 rounded-lg border",
                  colorClass.includes("green") && "border-green-200 dark:border-green-800",
                  colorClass.includes("red") && "border-red-200 dark:border-red-800",
                  colorClass.includes("blue") && "border-blue-200 dark:border-blue-800",
                  colorClass.includes("amber") && "border-amber-200 dark:border-amber-800",
                  colorClass
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon className="w-4 h-4 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium mb-1">{pattern.title}</h4>
                    <p className="text-xs opacity-80">{pattern.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {pattern.dimensions.map(dim => (
                        <Badge 
                          key={dim} 
                          variant="secondary" 
                          className="text-[10px] px-1.5 py-0"
                        >
                          {getDimensionLabel(dim)}
                        </Badge>
                      ))}
                      <span className="text-[10px] opacity-60 ml-auto">
                        {Math.round(pattern.confidence * 100)}% confidence
                      </span>
                    </div>
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
