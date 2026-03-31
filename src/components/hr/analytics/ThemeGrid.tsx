import { useState, useCallback, useEffect } from "react";
import { AnimatePresence, LayoutGroup } from "framer-motion";
import { Sparkles, Zap } from "lucide-react";
import { ThemeCard } from "./ThemeCard";
import { ThemeDetailView } from "./ThemeDetailView";
import type { ThemeInsight } from "@/hooks/useAnalytics";
import type { ThemeAnalyticsData } from "@/hooks/useThemeAnalytics";
import { supabase } from "@/integrations/supabase/client";

interface DiscoveredCluster {
  id: string;
  cluster_label: string;
  cluster_summary: string | null;
  unit_count: number;
  avg_sentiment: number | null;
  sentiment_spread: number | null;
  escalation_count: number;
  representative_quotes: string[];
  related_theme_id: string | null;
  is_emerging: boolean;
}

interface ThemeGridProps {
  themes: ThemeInsight[];
  enrichedThemes?: ThemeAnalyticsData[];
  isLoading?: boolean;
  surveyId?: string;
}

export function ThemeGrid({ themes, enrichedThemes, isLoading, surveyId }: ThemeGridProps) {
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [emergingClusters, setEmergingClusters] = useState<DiscoveredCluster[]>([]);

  // Fetch emerging clusters (those not mapped to existing themes)
  useEffect(() => {
    if (!surveyId) return;
    const fetchClusters = async () => {
      const { data } = await supabase
        .from("discovered_clusters")
        .select("id, cluster_label, cluster_summary, unit_count, avg_sentiment, sentiment_spread, escalation_count, representative_quotes, related_theme_id, is_emerging")
        .eq("survey_id", surveyId)
        .eq("is_emerging", true)
        .order("unit_count", { ascending: false });
      setEmergingClusters((data as DiscoveredCluster[]) || []);
    };
    fetchClusters();
  }, [surveyId]);

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
