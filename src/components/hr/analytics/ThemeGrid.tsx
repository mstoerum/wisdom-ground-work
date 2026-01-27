import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { ThemeCard } from "./ThemeCard";
import type { ThemeInsight } from "@/hooks/useAnalytics";
import type { ThemeAnalyticsData } from "@/hooks/useThemeAnalytics";

interface ThemeGridProps {
  themes: ThemeInsight[];
  enrichedThemes?: ThemeAnalyticsData[];
  isLoading?: boolean;
}

/**
 * ThemeGrid: Responsive grid of expandable theme cards
 * - 2-column layout on desktop, 1-column on mobile
 * - Accordion behavior: only one card expanded at a time
 * - Full-width expansion for expanded card
 */
export function ThemeGrid({ themes, enrichedThemes, isLoading }: ThemeGridProps) {
  const [expandedThemeId, setExpandedThemeId] = useState<string | null>(null);

  // Merge themes with enriched data
  const mergedThemes = themes.map(theme => {
    const enriched = enrichedThemes?.find(e => e.themeId === theme.id);
    return {
      ...theme,
      enriched,
      displayHealth: enriched?.healthIndex ?? theme.avgSentiment,
    };
  });

  // Sort by health (lowest first to surface issues)
  const sortedThemes = [...mergedThemes].sort((a, b) => a.displayHealth - b.displayHealth);

  const handleToggle = (themeId: string) => {
    setExpandedThemeId(prev => prev === themeId ? null : themeId);
  };

  const hasAIAnalysis = enrichedThemes && enrichedThemes.length > 0;

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="h-4 w-28 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (themes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No theme data available yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Section Header */}
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

      {/* Grid Container */}
      <motion.div
        layout
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {sortedThemes.map((theme, index) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            enrichedData={theme.enriched}
            isExpanded={expandedThemeId === theme.id}
            onToggle={() => handleToggle(theme.id)}
            index={index}
          />
        ))}
      </motion.div>
    </div>
  );
}
