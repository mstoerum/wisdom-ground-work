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

    console.log(`[${survey_id}] Starting survey interpretation (Phase 4)...`);

    // 1. Fetch survey metadata + configured themes
    const { data: survey } = await supabase
      .from("surveys")
      .select("id, title, description, themes, survey_type")
      .eq("id", survey_id)
      .single();

    if (!survey) {
      return new Response(
        JSON.stringify({ error: "Survey not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const themeIds = Array.isArray(survey.themes) ? survey.themes : [];
    let configuredThemes: { id: string; name: string; description: string }[] = [];
    if (themeIds.length > 0) {
      const { data: themes } = await supabase
        .from("survey_themes")
        .select("id, name, description")
        .in("id", themeIds);
      configuredThemes = themes || [];
    }

    // 2. Fetch session syntheses
    const { data: syntheses } = await supabase
      .from("session_syntheses")
      .select("narrative_summary, sentiment_trajectory, emotional_arc, themes_explored, key_quotes, root_causes, recommended_actions, engagement_quality, escalation_summary, confidence_score, opinion_units_analyzed")
      .eq("survey_id", survey_id);

    // 3. Fetch discovered clusters
    const { data: clusters } = await supabase
      .from("discovered_clusters")
      .select("cluster_label, cluster_summary, unit_count, avg_sentiment, sentiment_spread, escalation_count, representative_quotes, is_emerging, related_theme_id")
      .eq("survey_id", survey_id);

    // 4. Fetch aggregate opinion unit stats
    const { data: opinionUnits } = await supabase
      .from("opinion_units")
      .select("sentiment, intensity, is_actionable, escalation_level")
      .eq("survey_id", survey_id);

    // 5. Fetch conversation session stats
    const { data: sessions } = await supabase
      .from("conversation_sessions")
      .select("id, status, started_at, ended_at, initial_mood, final_mood")
      .eq("survey_id", survey_id);

    const completedSessions = sessions?.filter(s => s.status === "completed") || [];
    const totalSessions = sessions?.length || 0;

    // Build aggregate stats
    const units = opinionUnits || [];
    const totalUnits = units.length;
    const actionableCount = units.filter(u => u.is_actionable).length;
    const escalatedCount = units.filter(u => u.escalation_level && u.escalation_level !== "none").length;
    const avgSentiment = totalUnits > 0
      ? (units.reduce((s, u) => s + (u.sentiment || 0), 0) / totalUnits).toFixed(2)
      : "N/A";

    const escalationBreakdown: Record<string, number> = {};
    units.forEach(u => {
      const level = u.escalation_level || "none";
      escalationBreakdown[level] = (escalationBreakdown[level] || 0) + 1;
    });

    // Build structured context for LLM
    const sessionSummaries = (syntheses || []).map((s, i) => 
      `Session ${i + 1}: ${s.narrative_summary} [trajectory: ${s.sentiment_trajectory}, confidence: ${s.confidence_score}%, units analyzed: ${s.opinion_units_analyzed}]`
    ).join("\n\n");

    const clusterSummaries = (clusters || []).map(c => 
      `- "${c.cluster_label}" (${c.unit_count} signals, sentiment: ${c.avg_sentiment}, spread: ${c.sentiment_spread}, escalations: ${c.escalation_count}${c.is_emerging ? ", EMERGING" : ""}): ${c.cluster_summary}`
    ).join("\n");

    const themeContext = configuredThemes.map(t => `- ${t.name}: ${t.description || "No description"}`).join("\n");

    const contextBlock = `
SURVEY: "${survey.title}" (type: ${survey.survey_type})
${survey.description ? `Description: ${survey.description}` : ""}

CONFIGURED THEMES:
${themeContext || "None configured"}

PARTICIPATION:
- Total sessions: ${totalSessions}
- Completed: ${completedSessions.length}
- Completion rate: ${totalSessions > 0 ? ((completedSessions.length / totalSessions) * 100).toFixed(0) : 0}%

OPINION UNIT STATISTICS:
- Total opinion units extracted: ${totalUnits}
- Actionable signals: ${actionableCount} (${totalUnits > 0 ? ((actionableCount / totalUnits) * 100).toFixed(0) : 0}%)
- Escalated signals: ${escalatedCount}
- Average sentiment: ${avgSentiment} (scale: -1 to +1)
- Escalation breakdown: ${JSON.stringify(escalationBreakdown)}

DISCOVERED CLUSTERS (${(clusters || []).length} total, ${(clusters || []).filter(c => c.is_emerging).length} emerging):
${clusterSummaries || "No clusters discovered yet"}

SESSION SYNTHESES (${(syntheses || []).length} sessions analyzed):
${sessionSummaries || "No sessions synthesized yet"}
`.trim();

    console.log(`[${survey_id}] Sending ${contextBlock.length} chars of structured context to LLM...`);

    // 6. LLM interpretation call
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
            content: `You are a senior organizational psychologist and people analytics expert. You are given pre-processed, structured data from an employee feedback survey pipeline — NOT raw text. Your job is to synthesize this into a strategic survey-level interpretation. Be evidence-based: reference cluster labels, session counts, and sentiment scores. Distinguish between confirmed patterns (high confidence, multiple sessions) and emerging signals (few data points). Be specific and actionable — avoid generic HR platitudes.`
          },
          {
            role: "user",
            content: `Interpret this employee feedback survey and produce a comprehensive analysis:\n\n${contextBlock}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_interpretation",
              description: "Submit the complete survey interpretation with strategic insights",
              parameters: {
                type: "object",
                properties: {
                  executive_summary: {
                    type: "string",
                    description: "2-3 paragraph executive summary of the survey findings, written for C-suite. Lead with the most impactful finding."
                  },
                  top_themes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        theme: { type: "string" },
                        sentiment: { type: "string", enum: ["positive", "negative", "mixed", "neutral"] },
                        intensity: { type: "number", description: "1-10 scale" },
                        summary: { type: "string" },
                        evidence_count: { type: "integer" }
                      },
                      required: ["theme", "sentiment", "intensity", "summary", "evidence_count"]
                    },
                    description: "Top 5-8 themes ranked by importance/urgency"
                  },
                  sentiment_trends: {
                    type: "object",
                    properties: {
                      overall: { type: "string", enum: ["positive", "negative", "mixed", "neutral"] },
                      trajectory: { type: "string", enum: ["improving", "declining", "stable", "polarizing"] },
                      notable_shifts: { type: "array", items: { type: "string" } }
                    },
                    required: ["overall", "trajectory", "notable_shifts"]
                  },
                  cultural_insights: {
                    type: "string",
                    description: "Analysis of organizational culture signals revealed by the feedback patterns"
                  },
                  risk_factors: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        risk: { type: "string" },
                        severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
                        evidence: { type: "string" },
                        mitigation: { type: "string" }
                      },
                      required: ["risk", "severity", "evidence", "mitigation"]
                    }
                  },
                  opportunities: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        opportunity: { type: "string" },
                        impact: { type: "string", enum: ["high", "medium", "low"] },
                        effort: { type: "string", enum: ["high", "medium", "low"] },
                        evidence: { type: "string" }
                      },
                      required: ["opportunity", "impact", "effort", "evidence"]
                    }
                  },
                  strategic_recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        recommendation: { type: "string" },
                        priority: { type: "string", enum: ["immediate", "short_term", "medium_term", "long_term"] },
                        rationale: { type: "string" },
                        expected_impact: { type: "string" }
                      },
                      required: ["recommendation", "priority", "rationale", "expected_impact"]
                    }
                  },
                  participation_analysis: {
                    type: "string",
                    description: "Analysis of participation patterns, completion rates, and engagement quality"
                  },
                  confidence_score: {
                    type: "integer",
                    description: "0-100 confidence in the overall analysis based on data volume and consistency"
                  }
                },
                required: ["executive_summary", "top_themes", "sentiment_trends", "cultural_insights", "risk_factors", "opportunities", "strategic_recommendations", "participation_analysis", "confidence_score"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "submit_interpretation" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${survey_id}] LLM interpretation failed:`, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "LLM interpretation failed" }),
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

    console.log(`[${survey_id}] Interpretation complete. Confidence: ${result.confidence_score}%, Themes: ${result.top_themes?.length}, Risks: ${result.risk_factors?.length}`);

    // 7. Upsert into survey_analytics (delete old, insert new)
    await supabase
      .from("survey_analytics")
      .delete()
      .eq("survey_id", survey_id);

    const { error: insertError } = await supabase
      .from("survey_analytics")
      .insert({
        survey_id,
        executive_summary: result.executive_summary,
        top_themes: result.top_themes,
        sentiment_trends: result.sentiment_trends,
        cultural_insights: result.cultural_insights,
        risk_factors: result.risk_factors,
        opportunities: result.opportunities,
        strategic_recommendations: result.strategic_recommendations,
        participation_analysis: result.participation_analysis,
        confidence_score: result.confidence_score,
        total_sessions_analyzed: completedSessions.length,
        analyzed_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error(`[${survey_id}] Failed to store interpretation:`, insertError);
      return new Response(
        JSON.stringify({ error: "Failed to store interpretation", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 8. Update pipeline_runs
    const { data: pipelineRun } = await supabase
      .from("pipeline_runs")
      .select("id")
      .eq("survey_id", survey_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (pipelineRun) {
      await supabase
        .from("pipeline_runs")
        .update({
          interpretation_completed_at: new Date().toISOString(),
          status: "interpretation_complete",
          updated_at: new Date().toISOString(),
        })
        .eq("id", pipelineRun.id);
    }

    console.log(`[${survey_id}] ✅ Survey interpretation complete and stored`);

    return new Response(
      JSON.stringify({
        message: "Survey interpretation complete",
        survey_id,
        confidence_score: result.confidence_score,
        themes_identified: result.top_themes?.length || 0,
        risks_identified: result.risk_factors?.length || 0,
        recommendations: result.strategic_recommendations?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Survey interpretation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
