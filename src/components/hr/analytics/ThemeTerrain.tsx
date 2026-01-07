import { motion } from "framer-motion";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { useState } from "react";
import { InlineSparkline } from "./InlineSparkline";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { ThemeInsight } from "@/hooks/useAnalytics";

interface ThemeTerrainProps {
  themes: ThemeInsight[];
  isLoading?: boolean;
}

// Emotion spectrum from reportDesignSystem.ts - Aalto color restraint
const getHealthColor = (health: number): { bg: string; bar: string; text: string } => {
  if (health >= 80) return {
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    bar: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
  };
  if (health >= 60) return {
    bg: "bg-teal-50 dark:bg-teal-950/20",
    bar: "bg-teal-500",
    text: "text-teal-700 dark:text-teal-400",
  };
  if (health >= 45) return {
    bg: "bg-amber-50 dark:bg-amber-950/20",
    bar: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
  };
  return {
    bg: "bg-rose-50 dark:bg-rose-950/20",
    bar: "bg-rose-500",
    text: "text-rose-700 dark:text-rose-400",
  };
};

// Generate mock trend data
function generateTrendData(currentValue: number): number[] {
  const points = 7;
  const data: number[] = [];
  let value = currentValue - 10;
  
  for (let i = 0; i < points; i++) {
    value = Math.max(0, Math.min(100, value + (Math.random() - 0.4) * 8));
    data.push(value);
  }
  data[points - 1] = currentValue;
  return data;
}

/**
 * Theme Terrain: Tufte-inspired small multiples with horizontal health bars
 * Color encodes meaning, not decoration (Aalto principle)
 */
export function ThemeTerrain({ themes, isLoading }: ThemeTerrainProps) {
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);

  // Sort by health (lowest first to surface frictions)
  const sortedThemes = [...themes].sort((a, b) => a.avgSentiment - b.avgSentiment);

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

  return (
    <div className="space-y-2">
      {/* Section label - minimal */}
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
        Theme Landscape
      </h3>

      <div className="space-y-1.5">
        {sortedThemes.map((theme, index) => {
          const colors = getHealthColor(theme.avgSentiment);
          const isFriction = theme.avgSentiment < 60;
          const isExpanded = expandedTheme === theme.id;
          const trendData = generateTrendData(theme.avgSentiment);

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
                    {/* Friction warning - only shown when needed */}
                    {isFriction && (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                    )}
                    
                    {/* Theme name */}
                    <span className={`text-sm font-medium min-w-[140px] text-left ${isFriction ? 'text-amber-700 dark:text-amber-400' : ''}`}>
                      {theme.name}
                    </span>

                    {/* Health bar - the core visualization */}
                    <div className="flex-1 flex items-center gap-3">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${colors.bar}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${theme.avgSentiment}%` }}
                          transition={{ delay: index * 0.05 + 0.2, duration: 0.6, ease: "easeOut" }}
                        />
                      </div>

                      {/* Percentage - Tufte: the number is the story */}
                      <span className={`text-sm font-semibold w-10 text-right ${colors.text}`}>
                        {theme.avgSentiment}%
                      </span>

                      {/* Inline sparkline - 7-day trend */}
                      <InlineSparkline
                        data={trendData}
                        color={isFriction ? "hsl(var(--warning))" : "hsl(var(--muted-foreground))"}
                        width={36}
                        height={12}
                        className="opacity-60 group-hover:opacity-100 transition-opacity"
                      />

                      {/* Response count - muted */}
                      <span className="text-[10px] text-muted-foreground w-12 text-right">
                        {theme.responseCount} voices
                      </span>

                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="pl-6 pr-3 pb-3 pt-1">
                    {/* Key signals - evidence panel */}
                    {theme.keySignals && (
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
