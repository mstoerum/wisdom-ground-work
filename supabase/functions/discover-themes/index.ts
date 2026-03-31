import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_MODEL = "google/gemini-2.5-flash";

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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log(`[${survey_id}] Starting theme discovery (Phase 3)...`);

    // 1. Fetch all opinion units for this survey
    const { data: opinionUnits, error: ouError } = await supabase
      .from("opinion_units")
      .select("id, text, aspect, sentiment, intensity, is_actionable, escalation_level, escalation_reason, session_id")
      .eq("survey_id", survey_id)
      .order("created_at", { ascending: true });

    if (ouError) {
      console.error(`[${survey_id}] Failed to fetch opinion units:`, ouError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch opinion units" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!opinionUnits || opinionUnits.length === 0) {
      console.log(`[${survey_id}] No opinion units found, skipping clustering`);
      return new Response(
        JSON.stringify({ message: "No opinion units to cluster" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Fetch configured survey themes for matching
    const { data: survey } = await supabase
      .from("surveys")
      .select("themes")
      .eq("id", survey_id)
      .single();

    const themeIds = Array.isArray(survey?.themes) ? survey.themes : [];
    let configuredThemes: { id: string; name: string; description: string }[] = [];
    if (themeIds.length > 0) {
      const { data: themes } = await supabase
        .from("survey_themes")
        .select("id, name, description")
        .in("id", themeIds);
      configuredThemes = themes || [];
    }

    // 3. Delete previous clusters for this survey (fresh run)
    await supabase
      .from("discovered_clusters")
      .delete()
      .eq("survey_id", survey_id);

    // 4. Build opinion units list for LLM
    const ouList = opinionUnits.map((ou, idx) => 
      `[${idx}] "${ou.text}" (aspect: ${ou.aspect}, sentiment: ${ou.sentiment}, intensity: ${ou.intensity}, escalation: ${ou.escalation_level})`
    ).join("\n");

    const themeList = configuredThemes.length > 0
      ? configuredThemes.map(t => `- "${t.name}": ${t.description || "No description"}`).join("\n")
      : "No pre-configured themes.";

    console.log(`[${survey_id}] Clustering ${opinionUnits.length} opinion units across ${configuredThemes.length} configured themes...`);

    // 5. LLM clustering call
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `You are an organizational psychologist analyzing employee feedback. You receive pre-extracted opinion units (atomic feedback fragments with sentiment and aspect classification). Group them into coherent thematic clusters based on shared concerns, topics, or patterns. Each opinion unit should belong to exactly one cluster. Some clusters may map to pre-configured survey themes; others may be entirely new (emerging) patterns that weren't anticipated.`
          },
          {
            role: "user",
            content: `Cluster these ${opinionUnits.length} opinion units into coherent thematic groups:

Pre-configured survey themes (clusters may or may not align with these):
${themeList}

Opinion Units (index, text, metadata):
${ouList}

Group these into 3-10 clusters. For each cluster, identify whether it maps to a pre-configured theme or is an emerging pattern. Select 2-3 representative quotes per cluster.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_clusters",
              description: "Submit discovered thematic clusters from opinion unit analysis",
              parameters: {
                type: "object",
                properties: {
                  clusters: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string", description: "Short, descriptive cluster name (2-5 words)" },
                        summary: { type: "string", description: "1-2 sentence description of what this cluster captures" },
                        opinion_unit_indices: { 
                          type: "array", 
                          items: { type: "integer" },
                          description: "Indices of opinion units belonging to this cluster"
                        },
                        representative_quotes: {
                          type: "array",
                          items: { type: "string" },
                          description: "2-3 verbatim quotes from the opinion units that best represent this cluster"
                        },
                        matched_theme_name: {
                          type: "string",
                          description: "Name of the pre-configured theme this maps to, or null if emerging"
                        },
                        is_emerging: {
                          type: "boolean",
                          description: "True if this cluster represents a pattern not covered by pre-configured themes"
                        }
                      },
                      required: ["label", "summary", "opinion_unit_indices", "representative_quotes", "is_emerging"]
                    }
                  }
                },
                required: ["clusters"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "submit_clusters" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${survey_id}] LLM clustering failed:`, errorText);
      return new Response(
        JSON.stringify({ error: "LLM clustering failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error(`[${survey_id}] No tool call in LLM response`);
      return new Response(
        JSON.stringify({ error: "Invalid LLM response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);
    const clusters = result.clusters || [];

    console.log(`[${survey_id}] Discovered ${clusters.length} clusters (${clusters.filter((c: any) => c.is_emerging).length} emerging)`);

    // 6. Get or create pipeline run
    const { data: pipelineRun } = await supabase
      .from("pipeline_runs")
      .select("id")
      .eq("survey_id", survey_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // 7. Write clusters to database
    const clusterRows = clusters.map((cluster: any) => {
      const unitIndices = cluster.opinion_unit_indices || [];
      const unitIds = unitIndices
        .filter((idx: number) => idx >= 0 && idx < opinionUnits.length)
        .map((idx: number) => opinionUnits[idx].id);

      const clusterUnits = unitIndices
        .filter((idx: number) => idx >= 0 && idx < opinionUnits.length)
        .map((idx: number) => opinionUnits[idx]);

      const avgSentiment = clusterUnits.length > 0
        ? clusterUnits.reduce((s: number, ou: any) => s + (ou.sentiment || 0), 0) / clusterUnits.length
        : 0;

      const sentiments = clusterUnits.map((ou: any) => ou.sentiment || 0);
      const sentimentSpread = sentiments.length > 1
        ? Math.max(...sentiments) - Math.min(...sentiments)
        : 0;

      const escalationCount = clusterUnits.filter((ou: any) => 
        ou.escalation_level && ou.escalation_level !== "none"
      ).length;

      // Match to configured theme
      let relatedThemeId = null;
      if (cluster.matched_theme_name && !cluster.is_emerging) {
        const match = configuredThemes.find(t => 
          t.name.toLowerCase() === cluster.matched_theme_name?.toLowerCase()
        );
        relatedThemeId = match?.id || null;
      }

      return {
        survey_id,
        pipeline_run_id: pipelineRun?.id || null,
        cluster_label: cluster.label,
        cluster_summary: cluster.summary,
        opinion_unit_ids: unitIds,
        unit_count: unitIds.length,
        avg_sentiment: parseFloat(avgSentiment.toFixed(3)),
        sentiment_spread: parseFloat(sentimentSpread.toFixed(3)),
        escalation_count: escalationCount,
        representative_quotes: cluster.representative_quotes || [],
        related_theme_id: relatedThemeId,
        is_emerging: cluster.is_emerging || false,
      };
    });

    const { error: insertError } = await supabase
      .from("discovered_clusters")
      .insert(clusterRows);

    if (insertError) {
      console.error(`[${survey_id}] Failed to store clusters:`, insertError);
      return new Response(
        JSON.stringify({ error: "Failed to store clusters", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 8. Update opinion_units with cluster_id assignments
    const { data: storedClusters } = await supabase
      .from("discovered_clusters")
      .select("id, opinion_unit_ids")
      .eq("survey_id", survey_id);

    if (storedClusters) {
      for (const cluster of storedClusters) {
        const ids = cluster.opinion_unit_ids || [];
        if (ids.length > 0) {
          await supabase
            .from("opinion_units")
            .update({ cluster_id: cluster.id })
            .in("id", ids);
        }
      }
    }

    // 9. Update pipeline_runs
    if (pipelineRun) {
      await supabase
        .from("pipeline_runs")
        .update({
          clustering_completed_at: new Date().toISOString(),
          status: "clustering_complete",
          updated_at: new Date().toISOString(),
        })
        .eq("id", pipelineRun.id);
    }

    console.log(`[${survey_id}] ✅ Theme discovery complete: ${clusters.length} clusters stored`);

    return new Response(
      JSON.stringify({
        message: "Theme discovery complete",
        survey_id,
        clusters_discovered: clusters.length,
        emerging_count: clusters.filter((c: any) => c.is_emerging).length,
        opinion_units_clustered: opinionUnits.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Theme discovery error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
