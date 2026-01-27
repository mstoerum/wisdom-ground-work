import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Dimension = 
  | "expertise" 
  | "autonomy" 
  | "justice" 
  | "social_connection" 
  | "social_status";

export interface AggregatedSignal {
  id: string;
  survey_id: string;
  signal_text: string;
  dimension: Dimension;
  facet: string;
  sentiment: "positive" | "negative" | "neutral" | "mixed";
  voice_count: number;
  agreement_pct: number;
  avg_intensity: number;
  evidence_ids: string[];
  analyzed_at: string;
}

export interface DimensionHealth {
  dimension: Dimension;
  healthScore: number; // 0-100
  positiveCount: number;
  negativeCount: number;
  totalVoices: number;
  topSignals: AggregatedSignal[];
}

export interface SemanticSignalsData {
  dimensions: DimensionHealth[];
  signals: AggregatedSignal[];
  totalVoices: number;
  analyzedAt: string | null;
}

const DIMENSION_LABELS: Record<Dimension, string> = {
  expertise: "Expertise",
  autonomy: "Autonomy",
  justice: "Justice",
  social_connection: "Social Connection",
  social_status: "Social Status",
};

const DIMENSION_DESCRIPTIONS: Record<Dimension, string> = {
  expertise: "Can employees apply their knowledge usefully?",
  autonomy: "Can employees work in their own way?",
  justice: "Do employees benefit fairly?",
  social_connection: "Are employees connected to colleagues?",
  social_status: "Are employees appreciated?",
};

export const getDimensionLabel = (dimension: Dimension): string => 
  DIMENSION_LABELS[dimension] || dimension;

export const getDimensionDescription = (dimension: Dimension): string =>
  DIMENSION_DESCRIPTIONS[dimension] || "";

export const useSemanticSignals = (surveyId: string | undefined) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["semantic-signals", surveyId],
    queryFn: async (): Promise<SemanticSignalsData> => {
      if (!surveyId) {
        return { dimensions: [], signals: [], totalVoices: 0, analyzedAt: null };
      }

      // Fetch aggregated signals
      const { data: signals, error } = await supabase
        .from("aggregated_signals")
        .select("*")
        .eq("survey_id", surveyId)
        .order("voice_count", { ascending: false });

      if (error) {
        console.error("Error fetching semantic signals:", error);
        throw error;
      }

      if (!signals || signals.length === 0) {
        return { dimensions: [], signals: [], totalVoices: 0, analyzedAt: null };
      }

      // Group by dimension and calculate health scores
      const dimensionMap = new Map<Dimension, AggregatedSignal[]>();
      
      for (const signal of signals) {
        const dim = signal.dimension as Dimension;
        if (!dimensionMap.has(dim)) {
          dimensionMap.set(dim, []);
        }
        dimensionMap.get(dim)!.push(signal as AggregatedSignal);
      }

      const dimensions: DimensionHealth[] = [];
      
      for (const dim of ["expertise", "autonomy", "justice", "social_connection", "social_status"] as Dimension[]) {
        const dimSignals = dimensionMap.get(dim) || [];
        
        if (dimSignals.length === 0) {
          dimensions.push({
            dimension: dim,
            healthScore: 50, // Neutral if no data
            positiveCount: 0,
            negativeCount: 0,
            totalVoices: 0,
            topSignals: [],
          });
          continue;
        }

        const positiveSignals = dimSignals.filter(s => s.sentiment === "positive");
        const negativeSignals = dimSignals.filter(s => s.sentiment === "negative");
        
        const positiveVoices = positiveSignals.reduce((sum, s) => sum + s.voice_count, 0);
        const negativeVoices = negativeSignals.reduce((sum, s) => sum + s.voice_count, 0);
        const totalVoices = dimSignals.reduce((sum, s) => sum + s.voice_count, 0);

        // Health score: weighted by voices
        // 100 = all positive, 0 = all negative, 50 = balanced
        const healthScore = totalVoices > 0
          ? Math.round(((positiveVoices - negativeVoices) / totalVoices + 1) * 50)
          : 50;

        dimensions.push({
          dimension: dim,
          healthScore: Math.max(0, Math.min(100, healthScore)),
          positiveCount: positiveSignals.length,
          negativeCount: negativeSignals.length,
          totalVoices,
          topSignals: dimSignals.slice(0, 3), // Top 3 by voice count
        });
      }

      const totalVoices = signals.reduce((sum, s) => sum + (s.voice_count || 0), 0);
      const analyzedAt = signals[0]?.analyzed_at || null;

      return {
        dimensions,
        signals: signals as AggregatedSignal[],
        totalVoices,
        analyzedAt,
      };
    },
    enabled: !!surveyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Mutation to trigger signal aggregation
  const aggregateMutation = useMutation({
    mutationFn: async () => {
      if (!surveyId) throw new Error("No survey ID");
      
      const { data, error } = await supabase.functions.invoke("aggregate-signals", {
        body: { survey_id: surveyId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["semantic-signals", surveyId] });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    aggregate: aggregateMutation.mutate,
    isAggregating: aggregateMutation.isPending,
  };
};
