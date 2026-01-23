import { Zap, AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { QuickWin, InterventionRecommendation } from "@/lib/actionableIntelligence";

interface ActionSummaryCardProps {
  quickWins: QuickWin[];
  criticalIssues: InterventionRecommendation[];
  onViewQuickWins?: () => void;
  onViewIssues?: () => void;
  isLoading?: boolean;
}

export function ActionSummaryCard({
  quickWins,
  criticalIssues,
  onViewQuickWins,
  onViewIssues,
  isLoading,
}: ActionSummaryCardProps) {
  const topQuickWins = quickWins.slice(0, 3);
  const critical = criticalIssues.filter(i => i.priority === 'critical');
  
  // Don't render if no actionable items
  if (!isLoading && topQuickWins.length === 0 && critical.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="animate-pulse">
          <CardHeader className="pb-2">
            <div className="h-5 bg-muted rounded w-24" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
          </CardContent>
        </Card>
        <Card className="animate-pulse">
          <CardHeader className="pb-2">
            <div className="h-5 bg-muted rounded w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Quick Wins Section */}
      {topQuickWins.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-primary">
              <Zap className="h-4 w-4" />
              Quick Wins
              <Badge variant="secondary" className="ml-auto text-xs">
                {quickWins.length} available
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="space-y-1.5">
              {topQuickWins.map((win, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <span className="text-muted-foreground">{win.title}</span>
                </li>
              ))}
            </ul>
            {quickWins.length > 3 && onViewQuickWins && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onViewQuickWins}
                className="w-full mt-2 text-primary hover:text-primary hover:bg-primary/10"
              >
                View all {quickWins.length} quick wins
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Critical Issues Section */}
      {critical.length > 0 && (
        <Card className={cn(
          "border-destructive/30 bg-destructive/5",
          topQuickWins.length === 0 && "md:col-span-2"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Critical Issues
              <Badge variant="destructive" className="ml-auto text-xs">
                {critical.length} need attention
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {critical.slice(0, 2).map((issue, idx) => (
              <div key={idx} className="space-y-1">
                <p className="text-sm font-medium">{issue.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {issue.rationale}
                </p>
              </div>
            ))}
            {critical.length > 2 && onViewIssues && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onViewIssues}
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                View all {critical.length} critical issues
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty Quick Wins placeholder when only critical exists */}
      {topQuickWins.length === 0 && critical.length > 0 && critical.length <= 2 && (
        <Card className="border-dashed opacity-60">
          <CardContent className="flex flex-col items-center justify-center h-full py-8">
            <Zap className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground text-center">
              Quick wins will appear as more feedback is analyzed
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
