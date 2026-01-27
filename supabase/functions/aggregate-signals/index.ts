import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_MODEL = "google/gemini-2.5-flash";

/**
 * Aggregate semantic signals across responses for a survey
 * Groups similar signals, calculates agreement percentages, and stores patterns
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { survey_id } = await req.json();

    if (!survey_id) {
      return new Response(
        JSON.stringify({ error: "survey_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all signals for this survey
    const { data: signals, error: signalsError } = await supabase
      .from("response_signals")
      .select("id, response_id, signal_text, dimension, facet, intensity, sentiment, confidence")
      .eq("survey_id", survey_id);

    if (signalsError) {
      throw new Error(`Failed to fetch signals: ${signalsError.message}`);
    }

    if (!signals || signals.length === 0) {
      return new Response(
        JSON.stringify({ message: "No signals to aggregate", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[aggregate-signals] Processing ${signals.length} signals for survey ${survey_id}`);

    // Group signals by dimension for processing
    const signalsByDimension = signals.reduce((acc: Record<string, typeof signals>, signal) => {
      if (!acc[signal.dimension]) {
        acc[signal.dimension] = [];
      }
      acc[signal.dimension].push(signal);
      return acc;
    }, {});

    // Use AI to cluster similar signals within each dimension
    const aggregatedSignals: Array<{
      signal_text: string;
      dimension: string;
      facet: string;
      sentiment: string;
      voice_count: number;
      agreement_pct: number;
      avg_intensity: number;
      evidence_ids: string[];
    }> = [];

    for (const [dimension, dimensionSignals] of Object.entries(signalsByDimension)) {
      if (dimensionSignals.length < 2) {
        // Single signal - include directly
        const signal = dimensionSignals[0];
        aggregatedSignals.push({
          signal_text: signal.signal_text,
          dimension: signal.dimension,
          facet: signal.facet || 'general',
          sentiment: signal.sentiment,
          voice_count: 1,
          agreement_pct: 100,
          avg_intensity: signal.intensity,
          evidence_ids: [signal.response_id]
        });
        continue;
      }

      // Use AI to cluster similar signals
      const clusterPrompt = `You have ${dimensionSignals.length} semantic signals from employee feedback, all related to "${dimension}".

Signals:
${dimensionSignals.map((s, i) => `${i + 1}. "${s.signal_text}" (facet: ${s.facet}, intensity: ${s.intensity}, sentiment: ${s.sentiment})`).join('\n')}

Group semantically similar signals into 2-5 clusters. For each cluster, create an aggregated signal that represents the shared meaning.`;

      try {
        const clusterResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: AI_MODEL,
            messages: [
              {
                role: "system",
                content: "You cluster employee feedback signals by semantic similarity. Return structured clusters."
              },
              { role: "user", content: clusterPrompt }
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "create_signal_clusters",
                  description: "Group similar signals into clusters with aggregated descriptions",
                  parameters: {
                    type: "object",
                    properties: {
                      clusters: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            aggregated_signal: {
                              type: "string",
                              description: "A natural language description that summarizes this cluster (8-15 words)"
                            },
                            facet: {
                              type: "string",
                              description: "The specific facet this cluster relates to"
                            },
                            sentiment: {
                              type: "string",
                              enum: ["positive", "negative", "neutral", "mixed"]
                            },
                            signal_indices: {
                              type: "array",
                              items: { type: "integer" },
                              description: "1-based indices of signals in this cluster"
                            }
                          },
                          required: ["aggregated_signal", "facet", "sentiment", "signal_indices"]
                        }
                      }
                    },
                    required: ["clusters"]
                  }
                }
              }
            ],
            tool_choice: { type: "function", function: { name: "create_signal_clusters" } }
          }),
        });

        if (clusterResponse.ok) {
          const clusterData = await clusterResponse.json();
          const toolCall = clusterData.choices[0]?.message?.tool_calls?.[0];
          
          if (toolCall?.function?.arguments) {
            const { clusters } = JSON.parse(toolCall.function.arguments);
            
            for (const cluster of clusters) {
              const clusterSignals = cluster.signal_indices
                .filter((i: number) => i >= 1 && i <= dimensionSignals.length)
                .map((i: number) => dimensionSignals[i - 1]);
              
              if (clusterSignals.length === 0) continue;

              const avgIntensity = clusterSignals.reduce((sum: number, s: any) => sum + s.intensity, 0) / clusterSignals.length;
              
              // Calculate agreement as percentage of signals with matching sentiment
              const dominantSentiment = cluster.sentiment;
              const matchingSentiment = clusterSignals.filter((s: any) => s.sentiment === dominantSentiment).length;
              const agreementPct = Math.round((matchingSentiment / clusterSignals.length) * 100);

              aggregatedSignals.push({
                signal_text: cluster.aggregated_signal,
                dimension,
                facet: cluster.facet,
                sentiment: cluster.sentiment,
                voice_count: clusterSignals.length,
                agreement_pct: agreementPct,
                avg_intensity: Math.round(avgIntensity * 10) / 10,
                evidence_ids: clusterSignals.map((s: any) => s.response_id)
              });
            }
          }
        }
      } catch (clusterError) {
        console.error(`[aggregate-signals] Error clustering ${dimension}:`, clusterError);
        // Fallback: treat each signal individually
        for (const signal of dimensionSignals) {
          aggregatedSignals.push({
            signal_text: signal.signal_text,
            dimension: signal.dimension,
            facet: signal.facet || 'general',
            sentiment: signal.sentiment,
            voice_count: 1,
            agreement_pct: 100,
            avg_intensity: signal.intensity,
            evidence_ids: [signal.response_id]
          });
        }
      }
    }

    // Clear existing aggregated signals for this survey
    const { error: deleteError } = await supabase
      .from("aggregated_signals")
      .delete()
      .eq("survey_id", survey_id);

    if (deleteError) {
      console.error("[aggregate-signals] Error clearing old signals:", deleteError);
    }

    // Insert new aggregated signals
    if (aggregatedSignals.length > 0) {
      const { error: insertError } = await supabase
        .from("aggregated_signals")
        .insert(
          aggregatedSignals.map(s => ({
            survey_id,
            ...s,
            analyzed_at: new Date().toISOString()
          }))
        );

      if (insertError) {
        throw new Error(`Failed to insert aggregated signals: ${insertError.message}`);
      }
    }

    console.log(`[aggregate-signals] Created ${aggregatedSignals.length} aggregated signals`);

    return new Response(
      JSON.stringify({
        success: true,
        raw_signals: signals.length,
        aggregated_signals: aggregatedSignals.length,
        dimensions: Object.keys(signalsByDimension)
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[aggregate-signals] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
