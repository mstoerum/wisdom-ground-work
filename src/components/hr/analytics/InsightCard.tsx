import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EvidenceTrail } from "./EvidenceTrail";
import { AgreementBar } from "./AgreementBar";
import { NarrativeInsight } from "@/hooks/useNarrativeReports";
import { CONFIDENCE_CONFIG } from "@/lib/reportDesignSystem";
import { cn } from "@/lib/utils";

interface InsightCardProps {
  insight: NarrativeInsight;
  colorClass?: string;
  accentColor?: string;
}

export function InsightCard({ insight, colorClass, accentColor }: InsightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const confidenceLabel = CONFIDENCE_CONFIG.labels[insight.confidence] || 'Good';
  const confidenceColors = CONFIDENCE_CONFIG.colors[insight.confidence] || CONFIDENCE_CONFIG.colors[3];

  // Calculate display values
  const agreementPercentage = insight.agreement_percentage;
  const sampleSize = insight.sample_size;
  const hasAgreementData = typeof agreementPercentage === 'number' && agreementPercentage > 0;
  const hasEvidence = insight.evidence_ids && insight.evidence_ids.length > 0;

  return (
    <Card 
      className={cn(
        "rounded-xl border-0 shadow-sm hover:shadow-md transition-all duration-200",
        "bg-gradient-to-br from-card to-card/80",
        colorClass
      )}
    >
      <div className="p-5 space-y-4">
        {/* Main insight text - statement first */}
        <p className="text-base font-medium leading-relaxed tracking-[-0.01em]">
          {insight.text}
        </p>

        {/* Agreement percentage with visual bar */}
        {hasAgreementData && (
          <AgreementBar 
            percentage={agreementPercentage!}
            sampleSize={sampleSize}
          />
        )}

        {/* Metadata row - clean & minimal */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs font-medium border-0",
              confidenceColors.bg,
              confidenceColors.text
            )}
          >
            {confidenceLabel} confidence
          </Badge>
          
          {insight.category && (
            <Badge 
              variant="secondary" 
              className="text-xs font-normal"
            >
              {insight.category}
            </Badge>
          )}
        </div>

        {/* Evidence toggle - collapsible */}
        {hasEvidence && (
          <div className="pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs h-auto py-1.5 px-3 text-muted-foreground hover:text-foreground gap-1.5"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  Hide supporting quotes
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  View supporting quotes ({insight.evidence_ids!.length})
                </>
              )}
            </Button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 pl-3 border-l-2 border-muted mt-3">
                    <EvidenceTrail evidenceIds={insight.evidence_ids!} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Card>
  );
}
