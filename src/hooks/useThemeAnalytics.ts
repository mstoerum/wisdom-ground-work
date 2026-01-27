import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface SemanticInsight {
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  agreement_pct: number;
  voice_count: number;
  confidence: number;
  evidence_ids: string[];
}

export interface RootCause {
  cause: string;
  impact_level: 'high' | 'medium' | 'low';
  affected_count: number;
  recommendation: string;
}

export interface ThemeAnalyticsData {
  id: string;
  surveyId: string;
  themeId: string;
  themeName: string;
  
  // Scores
  healthIndex: number;
  healthStatus: 'thriving' | 'stable' | 'emerging' | 'friction' | 'critical';
  intensityScore: number;
  directionScore: number;
  
  // Polarization
  polarizationLevel: 'low' | 'medium' | 'high';
  polarizationScore: number;
  
  // Semantic insights
  insights: {
    frictions: SemanticInsight[];
    strengths: SemanticInsight[];
    patterns: SemanticInsight[];
  };
  
  rootCauses: RootCause[];
  
  // Metadata
  responseCount: number;
  confidence: number;
  analyzedAt: Date;
}

interface ThemeAnalyticsRow {
  id: string;
  survey_id: string;
  theme_id: string;
  health_index: number;
  health_status: string;
  intensity_score: number;
  direction_score: number;
  polarization_level: string;
  polarization_score: number | null;
  insights: {
    frictions: SemanticInsight[];
    strengths: SemanticInsight[];
    patterns: SemanticInsight[];
  };
  root_causes: RootCause[];
  confidence_score: number | null;
  response_count: number;
  analyzed_at: string;
  survey_themes: {
    name: string;
  };
}

interface UseThemeAnalyticsOptions {
  responseCount?: number;
  autoAnalyze?: boolean;
}

export function useThemeAnalytics(surveyId: string | null, options: UseThemeAnalyticsOptions = {}) {
  const { responseCount = 0, autoAnalyze = true } = options;
  const queryClient = useQueryClient();
  const lastResponseCountRef = useRef(responseCount);
  const autoAnalyzedRef = useRef(false);

  // Fetch theme analytics data
  const query = useQuery({
    queryKey: ['theme-analytics', surveyId],
    queryFn: async (): Promise<ThemeAnalyticsData[]> => {
      if (!surveyId) return [];

      const { data, error } = await supabase
        .from('theme_analytics')
        .select(`
          *,
          survey_themes!inner(name)
        `)
        .eq('survey_id', surveyId);

      if (error) {
        console.error('[useThemeAnalytics] Error fetching:', error);
        throw error;
      }

      return (data as unknown as ThemeAnalyticsRow[] || []).map(row => ({
        id: row.id,
        surveyId: row.survey_id,
        themeId: row.theme_id,
        themeName: row.survey_themes?.name || 'Unknown Theme',
        healthIndex: row.health_index,
        healthStatus: row.health_status as ThemeAnalyticsData['healthStatus'],
        intensityScore: Number(row.intensity_score),
        directionScore: Number(row.direction_score),
        polarizationLevel: row.polarization_level as ThemeAnalyticsData['polarizationLevel'],
        polarizationScore: Number(row.polarization_score) || 0,
        insights: row.insights || { frictions: [], strengths: [], patterns: [] },
        rootCauses: row.root_causes || [],
        responseCount: row.response_count,
        confidence: row.confidence_score || 3,
        analyzedAt: new Date(row.analyzed_at),
      }));
    },
    enabled: !!surveyId,
  });

  // Mutation to trigger analysis
  const analyzeMutation = useMutation({
    mutationFn: async ({ surveyId, themeId }: { surveyId: string; themeId?: string }) => {
      const { data, error } = await supabase.functions.invoke('analyze-theme', {
        body: { survey_id: surveyId, theme_id: themeId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['theme-analytics', surveyId] });
      toast.success(`Analyzed ${data.themes_analyzed} theme(s) successfully`);
    },
    onError: (error) => {
      console.error('[useThemeAnalytics] Analysis error:', error);
      toast.error('Failed to analyze themes');
    }
  });

  // Check if analysis is stale (>24h old or no analysis exists)
  const isStale = (): boolean => {
    if (!query.data || query.data.length === 0) return true;
    
    const oldestAnalysis = query.data.reduce((oldest, theme) => {
      return theme.analyzedAt < oldest ? theme.analyzedAt : oldest;
    }, query.data[0].analyzedAt);
    
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return oldestAnalysis < twentyFourHoursAgo;
  };

  const hasAnalysis = (query.data?.length || 0) > 0;

  // Reset auto-analysis flag when response count increases significantly
  useEffect(() => {
    if (responseCount >= lastResponseCountRef.current + 5) {
      autoAnalyzedRef.current = false;
      lastResponseCountRef.current = responseCount;
    }
  }, [responseCount]);

  // Auto-trigger analysis when conditions are met
  useEffect(() => {
    if (!autoAnalyze) return;
    if (!surveyId) return;
    if (query.isLoading) return;
    if (hasAnalysis) return;
    if (autoAnalyzedRef.current) return;
    if (analyzeMutation.isPending) return;
    if (responseCount < 5) return;

    // Debounce: wait 3 seconds before auto-triggering
    const timer = setTimeout(() => {
      autoAnalyzedRef.current = true;
      analyzeMutation.mutate({ surveyId });
    }, 3000);

    return () => clearTimeout(timer);
  }, [surveyId, hasAnalysis, responseCount, query.isLoading, analyzeMutation.isPending, autoAnalyze]);

  // Reset auto-analyzed flag when survey changes
  useEffect(() => {
    autoAnalyzedRef.current = false;
    lastResponseCountRef.current = 0;
  }, [surveyId]);

  // Real-time subscription for theme analytics updates
  useEffect(() => {
    if (!surveyId) return;

    const channel: RealtimeChannel = supabase
      .channel(`theme-analytics-${surveyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'theme_analytics',
          filter: `survey_id=eq.${surveyId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['theme-analytics', surveyId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [surveyId, queryClient]);

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    isAnalyzing: analyzeMutation.isPending,
    error: query.error,
    hasAnalysis,
    isStale: isStale(),
    analyzeThemes: (themeId?: string) => {
      if (!surveyId) {
        toast.error('No survey selected');
        return;
      }
      analyzeMutation.mutate({ surveyId, themeId });
    },
    refetch: query.refetch,
  };
}
