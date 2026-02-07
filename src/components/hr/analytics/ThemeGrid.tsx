import { useState, useCallback } from "react";
import { AnimatePresence, LayoutGroup } from "framer-motion";
import { Sparkles } from "lucide-react";
import { ThemeCard } from "./ThemeCard";
import { ThemeDetailView } from "./ThemeDetailView";
import type { ThemeInsight } from "@/hooks/useAnalytics";
import type { ThemeAnalyticsData } from "@/hooks/useThemeAnalytics";

interface ThemeGridProps {
  themes: ThemeInsight[];
  enrichedThemes?: ThemeAnalyticsData[];
  isLoading?: boolean;
}

export function ThemeGrid({ themes, enrichedThemes, isLoading }: ThemeGridProps) {
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);

  const mergedThemes = themes.map(theme => {
    const enriched = enrichedThemes?.find(e => e.themeId === theme.id);
    return {
      ...theme,
      enriched,
      displayHealth: enriched?.healthIndex ?? theme.avgSentiment,
    };
  });

  const sortedThemes = [...mergedThemes].sort((a, b) => a.displayHealth - b.displayHealth);

  const hasAIAnalysis = enrichedThemes && enrichedThemes.length > 0;

  const selectedTheme = selectedThemeId
    ? sortedThemes.find(t => t.id === selectedThemeId)
    : null;

  const handleBack = useCallback(() => setSelectedThemeId(null), []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="h-4 w-28 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-52 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
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
    <LayoutGroup>
      <div className="space-y-3">
        {/* Section Header — no animation, always visible when grid shown */}
        {!selectedThemeId && (
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-medium text-muted-foreground tracking-wide">
              Theme landscape
            </h3>
            {hasAIAnalysis && (
              <span className="flex items-center gap-1 text-xs text-primary">
                <Sparkles className="h-3 w-3" />
                AI-analyzed
              </span>
            )}
          </div>
        )}

        {/* Grid or Detail View */}
        <AnimatePresence mode="wait">
          {selectedThemeId && selectedTheme ? (
            <ThemeDetailView
              key="detail"
              theme={selectedTheme}
              enrichedData={selectedTheme.enriched}
              onBack={handleBack}
            />
          ) : (
            <div
              key="grid"
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {sortedThemes.map((theme, index) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  enrichedData={theme.enriched}
                  index={index}
                  onClick={() => setSelectedThemeId(theme.id)}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
}
