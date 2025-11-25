import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { EvidenceTrail } from "./EvidenceTrail";
import { NarrativeInsight } from "@/hooks/useNarrativeReports";
import { cn } from "@/lib/utils";

interface InsightCardProps {
  insight: NarrativeInsight;
  colorClass?: string;
}

export function InsightCard({ insight, colorClass }: InsightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const confidenceLabels = {
    1: "Low",
    2: "Moderate",
    3: "Good",
    4: "High",
    5: "Very High"
  };

  const confidenceColors = {
    1: "bg-red-500/20 text-red-700 dark:text-red-300",
    2: "bg-orange-500/20 text-orange-700 dark:text-orange-300",
    3: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300",
    4: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
    5: "bg-green-500/20 text-green-700 dark:text-green-300"
  };

  return (
    <Card className={cn(
      "border-l-4 transition-all hover:shadow-md",
      colorClass
    )}>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm font-medium flex-1 leading-relaxed">
            {insight.text}
          </p>
          <div className="flex flex-col items-end gap-2">
            <Badge 
              variant="outline" 
              className={cn("text-xs whitespace-nowrap", confidenceColors[insight.confidence])}
            >
              {confidenceLabels[insight.confidence]} Confidence
            </Badge>
            {insight.category && (
              <Badge variant="secondary" className="text-xs">
                {insight.category}
              </Badge>
            )}
          </div>
        </div>

        {insight.evidence_ids.length > 0 && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs h-auto py-1 px-2"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Hide Evidence
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  View Evidence ({insight.evidence_ids.length})
                </>
              )}
            </Button>

            {isExpanded && (
              <div className="mt-3">
                <EvidenceTrail evidenceIds={insight.evidence_ids} />
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
