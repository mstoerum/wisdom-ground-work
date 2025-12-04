import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ChevronRight, 
  ChevronDown, 
  MessageSquare,
  AlertCircle,
  ThumbsUp,
  MessageCircle
} from "lucide-react";
import type { ThemeInsight } from "@/hooks/useAnalytics";

interface ThemeHealthListProps {
  themes: ThemeInsight[];
  isLoading?: boolean;
}

type StatusType = 'critical' | 'attention' | 'healthy' | 'thriving';

function getStatusFromHealth(health: number): StatusType {
  if (health < 50) return 'critical';
  if (health < 70) return 'attention';
  if (health < 85) return 'healthy';
  return 'thriving';
}

function getStatusConfig(status: StatusType) {
  const configs = {
    critical: {
      label: 'Critical',
      badgeClass: 'bg-destructive/10 text-destructive border-destructive/20',
      rowClass: 'border-l-4 border-l-destructive/50 bg-destructive/5',
    },
    attention: {
      label: 'Needs Attention',
      badgeClass: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
      rowClass: 'border-l-4 border-l-yellow-500/50 bg-yellow-500/5',
    },
    healthy: {
      label: 'Healthy',
      badgeClass: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
      rowClass: 'border-l-4 border-l-green-500/50 bg-green-500/5',
    },
    thriving: {
      label: 'Thriving',
      badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      rowClass: 'border-l-4 border-l-blue-500/50 bg-blue-500/5',
    },
  };
  return configs[status];
}

function UrgencyDots({ count }: { count: number }) {
  const maxDots = 3;
  const filled = Math.min(count, maxDots);
  
  return (
    <div className="flex gap-1">
      {Array.from({ length: maxDots }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${
            i < filled 
              ? 'bg-destructive' 
              : 'bg-muted'
          }`}
        />
      ))}
    </div>
  );
}

function KeySignalsPanel({ keySignals }: { keySignals: ThemeInsight['keySignals'] }) {
  const hasSignals = keySignals.concerns.length > 0 || keySignals.positives.length > 0 || keySignals.other.length > 0;
  
  if (!hasSignals) {
    return (
      <div className="py-4 px-6 text-sm text-muted-foreground text-center">
        No feedback quotes available for this theme yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30">
      {/* Concerns */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-destructive">
          <AlertCircle className="h-4 w-4" />
          Concerns ({keySignals.concerns.length})
        </div>
        <div className="space-y-2">
          {keySignals.concerns.length > 0 ? (
            keySignals.concerns.map((quote, i) => (
              <div key={i} className="text-xs p-2 bg-destructive/10 rounded border border-destructive/20">
                "{quote}"
              </div>
            ))
          ) : (
            <div className="text-xs text-muted-foreground italic">No concerns flagged</div>
          )}
        </div>
      </div>

      {/* Positives */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
          <ThumbsUp className="h-4 w-4" />
          Positives ({keySignals.positives.length})
        </div>
        <div className="space-y-2">
          {keySignals.positives.length > 0 ? (
            keySignals.positives.map((quote, i) => (
              <div key={i} className="text-xs p-2 bg-green-500/10 rounded border border-green-500/20">
                "{quote}"
              </div>
            ))
          ) : (
            <div className="text-xs text-muted-foreground italic">No positive feedback yet</div>
          )}
        </div>
      </div>

      {/* Other Feedback */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <MessageCircle className="h-4 w-4" />
          Other ({keySignals.other.length})
        </div>
        <div className="space-y-2">
          {keySignals.other.length > 0 ? (
            keySignals.other.map((quote, i) => (
              <div key={i} className="text-xs p-2 bg-muted rounded border">
                "{quote}"
              </div>
            ))
          ) : (
            <div className="text-xs text-muted-foreground italic">No other feedback</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Mobile Card View for each theme
function ThemeCard({ 
  theme, 
  isExpanded, 
  onToggle 
}: { 
  theme: ThemeInsight; 
  isExpanded: boolean; 
  onToggle: () => void;
}) {
  const health = Math.round(theme.avgSentiment);
  const status = getStatusFromHealth(health);
  const config = getStatusConfig(status);

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div className={`rounded-lg ${config.rowClass}`}>
        <CollapsibleTrigger asChild>
          <div className="p-4 cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className="font-medium text-sm">{theme.name}</span>
              </div>
              <Badge variant="outline" className={`text-xs ${config.badgeClass}`}>
                {config.label}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm pl-6">
              <div className="flex items-center gap-4">
                <span className={`font-semibold ${
                  health >= 70 ? 'text-green-600 dark:text-green-400' :
                  health >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-destructive'
                }`}>
                  {health}% Health
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />
                  {theme.responseCount}
                </span>
              </div>
              <UrgencyDots count={theme.urgencyCount} />
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <KeySignalsPanel keySignals={theme.keySignals} />
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function ThemeHealthList({ themes, isLoading }: ThemeHealthListProps) {
  const [expandedThemes, setExpandedThemes] = useState<Set<string>>(new Set());

  const toggleExpanded = (themeId: string) => {
    setExpandedThemes(prev => {
      const next = new Set(prev);
      if (next.has(themeId)) {
        next.delete(themeId);
      } else {
        next.add(themeId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Theme Health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!themes || themes.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Theme Health</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No theme data available yet. Generate responses to see theme health metrics.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort themes by health (lowest first to surface concerns)
  const sortedThemes = [...themes].sort((a, b) => a.avgSentiment - b.avgSentiment);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Theme Health</CardTitle>
          <span className="text-xs text-muted-foreground hidden sm:block">
            Click row to see key signals
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Mobile Card View */}
        <div className="md:hidden divide-y px-4 pb-4">
          {sortedThemes.map((theme) => (
            <div key={theme.id} className="py-2 first:pt-0">
              <ThemeCard
                theme={theme}
                isExpanded={expandedThemes.has(theme.id)}
                onToggle={() => toggleExpanded(theme.id)}
              />
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground border-b">
            <div className="col-span-4">Theme</div>
            <div className="col-span-2 text-center">Health</div>
            <div className="col-span-2 text-center">Urgency</div>
            <div className="col-span-2 text-center">Responses</div>
            <div className="col-span-2 text-center">Status</div>
          </div>

          {/* Theme Rows */}
          <div className="divide-y">
            {sortedThemes.map((theme) => {
              const health = Math.round(theme.avgSentiment);
              const status = getStatusFromHealth(health);
              const config = getStatusConfig(status);
              const isExpanded = expandedThemes.has(theme.id);

              return (
                <Collapsible
                  key={theme.id}
                  open={isExpanded}
                  onOpenChange={() => toggleExpanded(theme.id)}
                >
                  <CollapsibleTrigger asChild>
                    <div 
                      className={`grid grid-cols-12 gap-2 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors ${config.rowClass}`}
                    >
                      {/* Theme Name */}
                      <div className="col-span-4 flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className="font-medium text-sm truncate">{theme.name}</span>
                      </div>

                      {/* Health Score */}
                      <div className="col-span-2 flex items-center justify-center">
                        <span className={`text-sm font-semibold ${
                          health >= 70 ? 'text-green-600 dark:text-green-400' :
                          health >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-destructive'
                        }`}>
                          {health}%
                        </span>
                      </div>

                      {/* Urgency Dots */}
                      <div className="col-span-2 flex items-center justify-center">
                        <UrgencyDots count={theme.urgencyCount} />
                      </div>

                      {/* Response Count */}
                      <div className="col-span-2 flex items-center justify-center gap-1 text-sm text-muted-foreground">
                        <MessageSquare className="h-3 w-3" />
                        {theme.responseCount}
                      </div>

                      {/* Status Badge */}
                      <div className="col-span-2 flex items-center justify-center">
                        <Badge variant="outline" className={`text-xs ${config.badgeClass}`}>
                          {config.label}
                        </Badge>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <KeySignalsPanel keySignals={theme.keySignals} />
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
