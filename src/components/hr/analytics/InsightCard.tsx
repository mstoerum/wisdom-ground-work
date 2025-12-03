import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronUp, Users } from "lucide-react";
import { EvidenceTrail } from "./EvidenceTrail";
import { NarrativeInsight } from "@/hooks/useNarrativeReports";
import { cn } from "@/lib/utils";

interface InsightCardProps {
  insight: NarrativeInsight;
  colorClass?: string;
}

export function InsightCard({ insight, colorClass }: InsightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const confidenceLabels: Record<number, string> = {
    1: "Low",
    2: "Moderate",
    3: "Good",
    4: "High",
    5: "Very High"
  };

  const confidenceColors: Record<number, string> = {
    1: "bg-rose-500/20 text-rose-700 dark:text-rose-300",
    2: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
    3: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300",
    4: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
    5: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
  };

  // Calculate display values
  const agreementPercentage = insight.agreement_percentage;
  const sampleSize = insight.sample_size;
  const hasAgreementData = typeof agreementPercentage === 'number' && agreementPercentage > 0;
  const hasSampleData = typeof sampleSize === 'number' && sampleSize > 0;

  return (
    <Card className={cn(
      "border-l-4 transition-all hover:shadow-md",
      colorClass
    )}>
      <div className="p-4 space-y-3">
        {/* Main insight text */}
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm font-medium flex-1 leading-relaxed">
            {insight.text}
          </p>
        </div>

        {/* Agreement percentage - prominent display */}
        {hasAgreementData && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {agreementPercentage}% of respondents agree
                </span>
              </div>
              {hasSampleData && (
                <span className="text-xs text-muted-foreground">
                  Based on {sampleSize} responses
                </span>
              )}
            </div>
            <Progress 
              value={agreementPercentage} 
              className="h-2"
            />
          </div>
        )}

        {/* Metadata badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge 
            variant="outline" 
            className={cn("text-xs", confidenceColors[insight.confidence])}
          >
            {confidenceLabels[insight.confidence]} Confidence
          </Badge>
          
          {insight.category && (
            <Badge variant="secondary" className="text-xs">
              {insight.category}
            </Badge>
          )}

          {hasSampleData && !hasAgreementData && (
            <Badge variant="outline" className="text-xs gap-1">
              <Users className="h-3 w-3" />
              {sampleSize} responses
            </Badge>
          )}
        </div>

        {/* Evidence trail toggle */}
        {insight.evidence_ids && insight.evidence_ids.length > 0 && (
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
