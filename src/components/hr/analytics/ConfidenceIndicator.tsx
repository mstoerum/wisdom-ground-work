import { CheckCircle, AlertCircle, XCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ConfidenceIndicatorProps {
  level: 'high' | 'medium' | 'low';
  sampleSize?: number;
  className?: string;
}

export function ConfidenceIndicator({ level, sampleSize = 0, className = "" }: ConfidenceIndicatorProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getIcon = () => {
    switch (level) {
      case 'high':
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" aria-label="High confidence" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" aria-label="Medium confidence" />;
      case 'low':
        return <XCircle className="h-4 w-4 text-red-600 dark:text-red-500" aria-label="Low confidence" />;
    }
  };

  const getLevel1Message = () => {
    switch (level) {
      case 'high':
        return `High confidence (${sampleSize} responses)`;
      case 'medium':
        return `Medium confidence (${sampleSize} responses)`;
      case 'low':
        return `Low confidence (${sampleSize} responses)`;
    }
  };

  const getLevel2Details = () => {
    const breakdown = {
      sampleSize,
      adequacy: level === 'high' ? 'Excellent' : level === 'medium' ? 'Adequate' : 'Insufficient',
      reliability: level === 'high' ? 'Very reliable' : level === 'medium' ? 'Moderately reliable' : 'Use with caution',
    };

    const recommendation = level === 'high' 
      ? 'This data is reliable for decision-making.' 
      : level === 'medium'
      ? 'Consider gathering more responses for higher confidence.'
      : 'More data needed. Interpret with caution.';

    return {
      breakdown,
      recommendation
    };
  };

  const details = getLevel2Details();

  return (
    <TooltipProvider>
      <Tooltip open={showDetails} onOpenChange={setShowDetails}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-auto p-0 hover:bg-transparent ${className}`}
            aria-label="Confidence indicator. Click for details."
            tabIndex={0}
          >
            {getIcon()}
          </Button>
        </TooltipTrigger>
        <TooltipContent 
          side="bottom" 
          className="max-w-xs p-4 space-y-3"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          {/* Level 1: Simple message */}
          <div>
            <p className="font-semibold text-sm">{getLevel1Message()}</p>
          </div>

          {/* Level 2: Detailed breakdown (progressive disclosure) */}
          <div className="space-y-2 text-xs border-t pt-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-muted-foreground">Sample Size:</span>
                <p className="font-medium">{details.breakdown.sampleSize}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Data Adequacy:</span>
                <p className="font-medium">{details.breakdown.adequacy}</p>
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Reliability:</span>
              <p className="font-medium">{details.breakdown.reliability}</p>
            </div>
            <div className="pt-2 border-t">
              <p className="text-muted-foreground italic">{details.recommendation}</p>
            </div>
          </div>

          {/* Help text */}
          <p className="text-xs text-muted-foreground pt-2 border-t">
            Confidence is based on sample size and response quality. 
            High confidence (50+ responses) is ideal for decision-making.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
