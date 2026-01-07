import { motion } from "framer-motion";
import { AlertTriangle, ChevronDown, Sparkles } from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ThemeInsightCard } from "./ThemeInsightCard";
import { RootCauseCard } from "./RootCauseCard";
import { PolarizationBadge } from "./PolarizationBadge";
import type { ThemeInsight } from "@/hooks/useAnalytics";
import type { ThemeAnalyticsData } from "@/hooks/useThemeAnalytics";

interface ThemeTerrainProps {
  themes: ThemeInsight[];
  enrichedThemes?: ThemeAnalyticsData[];
  isLoading?: boolean;
}

// Health status to color mapping
const getHealthColor = (health: number, status?: string): { bg: string; bar: string; text: string; status: string } => {
  // If we have AI-analyzed status, use that for label
  const statusLabels: Record<string, string> = {
    thriving: "Thriving",
    stable: "Stable",
    emerging: "Emerging",
    friction: "Friction",
    critical: "Critical",
  };

  if (health >= 85) return {
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    bar: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
    status: status ? statusLabels[status] || "Thriving" : "Thriving",
  };
  if (health >= 70) return {
    bg: "bg-teal-50 dark:bg-teal-950/20",
    bar: "bg-teal-500",
    text: "text-teal-700 dark:text-teal-400",
    status: status ? statusLabels[status] || "Stable" : "Stable",
  };
  if (health >= 50) return {
    bg: "bg-amber-50 dark:bg-amber-950/20",
    bar: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
    status: status ? statusLabels[status] || "Emerging" : "Emerging",
  };
  if (health >= 30) return {
    bg: "bg-orange-50 dark:bg-orange-950/20",
    bar: "bg-orange-500",
    text: "text-orange-700 dark:text-orange-400",
    status: status ? statusLabels[status] || "Friction" : "Friction",
  };
  return {
    bg: "bg-rose-50 dark:bg-rose-950/20",
    bar: "bg-rose-500",
    text: "text-rose-700 dark:text-rose-400",
    status: status ? statusLabels[status] || "Critical" : "Critical",
  };
};

/**
 * Theme Terrain: Tufte-inspired small multiples with horizontal health bars
 * Now supports enriched AI-analyzed theme data with semantic insights
 */
export function ThemeTerrain({ themes, enrichedThemes, isLoading }: ThemeTerrainProps) {
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);

  // Merge basic themes with enriched data
  const mergedThemes = themes.map(theme => {
    const enriched = enrichedThemes?.find(e => e.themeId === theme.id);
    return {
      ...theme,
      enriched,
      // Use AI-analyzed health index if available, otherwise fall back to avgSentiment
      displayHealth: enriched?.healthIndex ?? theme.avgSentiment,
      healthStatus: enriched?.healthStatus,
    };
  });

  // Sort by health (lowest first to surface frictions)
  const sortedThemes = [...mergedThemes].sort((a, b) => a.displayHealth - b.displayHealth);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-5 w-32 bg-muted rounded animate-pulse" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (themes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No theme data available yet
      </div>
    );
  }

  const hasAIAnalysis = enrichedThemes && enrichedThemes.length > 0;

  return (
    <div className="space-y-2">
      {/* Section label */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-medium text-muted-foreground tracking-wide">
          Theme landscape
        </h3>
        {hasAIAnalysis && (
          <span className="flex items-center gap-1 text-[10px] text-primary">
            <Sparkles className="h-3 w-3" />
            AI-analyzed
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        {sortedThemes.map((theme, index) => {
          const colors = getHealthColor(theme.displayHealth, theme.healthStatus);
          const isFriction = theme.displayHealth < 50;
          const isExpanded = expandedTheme === theme.id;
          const enriched = theme.enriched;

          return (
            <motion.div
              key={theme.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <Collapsible open={isExpanded} onOpenChange={() => setExpandedTheme(isExpanded ? null : theme.id)}>
                <CollapsibleTrigger className="w-full">
                  <div className={`group flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-muted/50 ${isExpanded ? 'bg-muted/50' : ''}`}>
                    {/* Friction warning */}
                    {isFriction && (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                    )}
                    
                    {/* Theme name */}
                    <span className={`text-sm font-medium min-w-[140px] text-left ${isFriction ? 'text-amber-700 dark:text-amber-400' : ''}`}>
                      {theme.name}
                    </span>

                    {/* Health bar */}
                    <div className="flex-1 flex items-center gap-3">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${colors.bar}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${theme.displayHealth}%` }}
                          transition={{ delay: index * 0.05 + 0.2, duration: 0.6, ease: "easeOut" }}
                        />
                      </div>

                      {/* Health score */}
                      <span className={`text-sm font-semibold w-10 text-right ${colors.text}`}>
                        {Math.round(theme.displayHealth)}
                      </span>

                      {/* Status label */}
                      <span className={`text-[10px] w-14 text-muted-foreground`}>
                        {colors.status}
                      </span>

                      {/* Polarization badge */}
                      {enriched?.polarizationLevel && enriched.polarizationLevel !== 'low' && (
                        <PolarizationBadge 
                          level={enriched.polarizationLevel} 
                          score={enriched.polarizationScore}
                        />
                      )}

                      {/* Response count */}
                      <span className="text-[10px] text-muted-foreground w-12 text-right">
                        {theme.responseCount} voices
                      </span>

                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="pl-6 pr-3 pb-3 pt-1">
                    {/* AI-analyzed insights */}
                    {enriched && (enriched.insights.frictions.length > 0 || enriched.insights.strengths.length > 0) ? (
                      <div className="space-y-4 text-sm">
                        {/* Frictions */}
                        {enriched.insights.frictions.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[10px] uppercase tracking-wider text-amber-600 font-medium">Frictions</span>
                            {enriched.insights.frictions.slice(0, 3).map((insight, i) => (
                              <ThemeInsightCard key={i} insight={insight} variant="friction" />
                            ))}
                          </div>
                        )}
                        
                        {/* Strengths */}
                        {enriched.insights.strengths.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-medium">Strengths</span>
                            {enriched.insights.strengths.slice(0, 3).map((insight, i) => (
                              <ThemeInsightCard key={i} insight={insight} variant="strength" />
                            ))}
                          </div>
                        )}

                        {/* Root Causes */}
                        {enriched.rootCauses.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-border/50">
                            <span className="text-[10px] uppercase tracking-wider text-foreground/70 font-medium">Root causes</span>
                            {enriched.rootCauses.slice(0, 2).map((cause, i) => (
                              <RootCauseCard key={i} rootCause={cause} />
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Fallback to basic quotes when no AI analysis */
                      theme.keySignals && (
                        <div className="space-y-3 text-sm">
                          {theme.keySignals.concerns && theme.keySignals.concerns.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] uppercase tracking-wider text-amber-600 font-medium">Frictions</span>
                              {theme.keySignals.concerns.slice(0, 2).map((quote, i) => (
                                <blockquote key={i} className="text-muted-foreground border-l-2 border-amber-300 pl-3 py-0.5 text-sm italic">
                                  "{quote}"
                                </blockquote>
                              ))}
                            </div>
                          )}
                          
                          {theme.keySignals.positives && theme.keySignals.positives.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-medium">Strengths</span>
                              {theme.keySignals.positives.slice(0, 2).map((quote, i) => (
                                <blockquote key={i} className="text-muted-foreground border-l-2 border-emerald-300 pl-3 py-0.5 text-sm italic">
                                  "{quote}"
                                </blockquote>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
