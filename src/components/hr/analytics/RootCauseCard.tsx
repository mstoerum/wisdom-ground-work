import { AlertTriangle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RootCause } from "@/hooks/useThemeAnalytics";

interface RootCauseCardProps {
  rootCause: RootCause;
}

/**
 * Display card for AI-identified root causes
 * Shows cause, impact level, affected count, and recommendation
 */
export function RootCauseCard({ rootCause }: RootCauseCardProps) {
  const impactColors = {
    high: {
      badge: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400",
      icon: "text-rose-500",
    },
    medium: {
      badge: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
      icon: "text-amber-500",
    },
    low: {
      badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
      icon: "text-slate-500",
    },
  };

  const colors = impactColors[rootCause.impact_level];

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
      {/* Header with impact and affected count */}
      <div className="flex items-center gap-2">
        <AlertTriangle className={`h-3.5 w-3.5 ${colors.icon}`} />
        <Badge variant="secondary" className={`text-[10px] font-medium ${colors.badge}`}>
          {rootCause.impact_level.toUpperCase()} IMPACT
        </Badge>
        <span className="text-xs text-muted-foreground">
          Affects {rootCause.affected_count} respondent{rootCause.affected_count !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Root cause description */}
      <p className="text-sm text-foreground">
        {rootCause.cause}
      </p>

      {/* Recommendation */}
      <div className="flex items-start gap-2 pt-1 border-t border-border/50">
        <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Recommendation: </span>
          {rootCause.recommendation}
        </p>
      </div>
    </div>
  );
}
