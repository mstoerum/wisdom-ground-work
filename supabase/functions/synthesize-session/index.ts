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
    const { session_id } = await req.json();

    if (!session_id) {
      return new Response(
        JSON.stringify({ error: "session_id is required" }),
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

    console.log(`[${session_id}] Starting session synthesis (Phase 2)...`);

    // 1. Fetch session
    const { data: session, error: sessionError } = await supabase
      .from("conversation_sessions")
      .select("id, survey_id, started_at, ended_at, initial_mood, final_mood, status")
      .eq("id", session_id)
      .single();

    if (sessionError || !session) {
      console.error(`[${session_id}] Session not found:`, sessionError);
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Fetch opinion units (Phase 1 output)
    const { data: opinionUnits, error: ouError } = await supabase
      .from("opinion_units")
      .select("id, text, aspect, sentiment, intensity, is_actionable, escalation_level, escalation_reason, response_id, created_at")
      .eq("session_id", session_id)
      .order("created_at", { ascending: true });

    if (ouError) {
      console.error(`[${session_id}] Failed to fetch opinion units:`, ouError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch opinion units" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Fetch responses for context (content length, theme mapping, quotes)
    const { data: responses, error: respError } = await supabase
      .from("responses")
      .select("id, content, ai_response, theme_id, created_at")
      .eq("conversation_session_id", session_id)
      .order("created_at", { ascending: true });

    if (respError) {
      console.error(`[${session_id}] Failed to fetch responses:`, respError);
    }

    const validResponses = (responses || []).filter(r => !r.content.startsWith("[SELECTED:"));

    if (!opinionUnits || opinionUnits.length === 0) {
      // Fallback: if no opinion units exist, skip synthesis
      console.log(`[${session_id}] No opinion units found, skipping synthesis`);
      return new Response(
        JSON.stringify({ message: "No opinion units to synthesize" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Fetch theme names for context
    const themeIds = [...new Set(validResponses.map(r => r.theme_id).filter(Boolean))];
    let themeMap: Record<string, string> = {};
    if (themeIds.length > 0) {
      const { data: themes } = await supabase
        .from("survey_themes")
        .select("id, name")
        .in("id", themeIds);
      if (themes) {
        themeMap = Object.fromEntries(themes.map(t => [t.id, t.name]));
      }
    }

    // 5. Pre-compute engagement metrics
    const avgResponseLength = validResponses.length > 0
      ? Math.round(validResponses.reduce((sum, r) => sum + r.content.length, 0) / validResponses.length)
      : 0;

    const flagCount = opinionUnits.filter(ou => ou.escalation_level === "flag").length;
    const urgentCount = opinionUnits.filter(ou => ou.escalation_level === "urgent").length;
    const actionableCount = opinionUnits.filter(ou => ou.is_actionable).length;

    // 6. Build opinion units summary for LLM
    const ouSummary = opinionUnits.map((ou, idx) => {
      const position = opinionUnits.length > 1 ? (idx / (opinionUnits.length - 1)).toFixed(2) : "0.50";
      return `[${position}] "${ou.text}" (aspect: ${ou.aspect}, sentiment: ${ou.sentiment}, intensity: ${ou.intensity}, escalation: ${ou.escalation_level}${ou.escalation_reason ? `, reason: ${ou.escalation_reason}` : ""})`;
    }).join("\n");

    // Theme distribution
    const themeDistribution = themeIds.map(tid => {
      const name = themeMap[tid] || "Unknown";
      const responseCount = validResponses.filter(r => r.theme_id === tid).length;
      const relatedOUs = opinionUnits.filter(ou => {
        const resp = validResponses.find(r => r.id === ou.response_id);
        return resp?.theme_id === tid;
      });
      const avgSent = relatedOUs.length > 0
        ? (relatedOUs.reduce((s, ou) => s + (ou.sentiment || 0), 0) / relatedOUs.length).toFixed(2)
        : "N/A";
      return `${name}: ${responseCount} responses, ${relatedOUs.length} opinion units, avg sentiment ${avgSent}`;
    }).join("\n");

    const durationMin = session.started_at && session.ended_at
      ? Math.round((new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 60000)
      : null;

    console.log(`[${session_id}] Synthesizing ${opinionUnits.length} opinion units from ${validResponses.length} responses...`);

    // 7. LLM synthesis call
    const analysisResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `You synthesize completed employee feedback sessions into structured insights. You receive pre-extracted opinion units (atomic feedback fragments with sentiment and aspect classification) rather than raw text. Focus on narrative coherence, emotional arc, root causes, and actionable recommendations. Be concise and evidence-based.`
          },
          {
            role: "user",
            content: `Synthesize this completed feedback session:

Session Metadata:
- Duration: ${durationMin !== null ? `${durationMin} minutes` : "Unknown"}
- Initial Mood: ${session.initial_mood ?? "N/A"}/10
- Final Mood: ${session.final_mood ?? "N/A"}/10
- Total Responses: ${validResponses.length}
- Opinion Units: ${opinionUnits.length}
- Flagged concerns: ${flagCount}, Urgent: ${urgentCount}, Actionable: ${actionableCount}

Theme Distribution:
${themeDistribution || "No themes assigned"}

Opinion Units (position 0.0=start → 1.0=end):
${ouSummary}

Provide a comprehensive synthesis.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "synthesize_session",
              description: "Produce a structured synthesis of a feedback session from opinion units",
              parameters: {
                type: "object",
                properties: {
                  narrative_summary: {
                    type: "string",
                    description: "2-3 sentence human-readable summary of the session's key narrative"
                  },
                  emotional_arc: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        position: { type: "number", description: "0.0 (start) to 1.0 (end)" },
                        sentiment: { type: "number", description: "-1.0 to 1.0" },
                        label: { type: "string", description: "Brief label like 'opening warmth', 'frustration peak', 'hopeful close'" }
                      },
                      required: ["position", "sentiment", "label"]
                    },
                    description: "3-5 key emotional waypoints through the conversation"
                  },
                  sentiment_trajectory: {
                    type: "string",
                    enum: ["improving", "declining", "stable", "mixed"],
                    description: "Overall sentiment direction"
                  },
                  root_causes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        cause: { type: "string" },
                        evidence_count: { type: "integer" },
                        severity: { type: "string", enum: ["high", "medium", "low"] }
                      },
                      required: ["cause", "evidence_count", "severity"]
                    },
                    description: "1-3 underlying root causes identified"
                  },
                  key_quotes: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 most impactful verbatim quotes from opinion units"
                  },
                  recommended_actions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        action: { type: "string" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        timeframe: { type: "string" },
                        evidence: { type: "string", description: "Brief evidence supporting this action" }
                      },
                      required: ["action", "priority", "timeframe"]
                    },
                    description: "2-4 actionable recommendations"
                  },
                  depth_score: {
                    type: "integer",
                    description: "1-100 rating of how deeply the participant engaged",
                    minimum: 0,
                    maximum: 100
                  },
                  openness_score: {
                    type: "integer",
                    description: "1-100 rating of how openly the participant shared",
                    minimum: 0,
                    maximum: 100
                  },
                  confidence_score: {
                    type: "integer",
                    description: "0-100 confidence in this synthesis",
                    minimum: 0,
                    maximum: 100
                  }
                },
                required: [
                  "narrative_summary", "emotional_arc", "sentiment_trajectory",
                  "root_causes", "key_quotes", "recommended_actions",
                  "depth_score", "openness_score", "confidence_score"
                ]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "synthesize_session" } }
      }),
    });

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error(`[${session_id}] LLM synthesis failed:`, errorText);
      return new Response(
        JSON.stringify({ error: "LLM synthesis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const analysisData = await analysisResponse.json();
    const toolCall = analysisData.choices[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error(`[${session_id}] No tool call in LLM response`);
      return new Response(
        JSON.stringify({ error: "Invalid LLM response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const synthesis = JSON.parse(toolCall.function.arguments);

    console.log(`[${session_id}] Synthesis complete:`, {
      trajectory: synthesis.sentiment_trajectory,
      confidence: synthesis.confidence_score,
      root_causes: synthesis.root_causes?.length || 0,
      actions: synthesis.recommended_actions?.length || 0,
    });

    // 8. Build themes_explored from actual data
    const themesExplored = themeIds.map(tid => {
      const name = themeMap[tid] || "Unknown";
      const relatedOUs = opinionUnits.filter(ou => {
        const resp = validResponses.find(r => r.id === ou.response_id);
        return resp?.theme_id === tid;
      });
      const avgSentiment = relatedOUs.length > 0
        ? relatedOUs.reduce((s, ou) => s + (ou.sentiment || 0), 0) / relatedOUs.length
        : 0;
      return {
        theme_id: tid,
        theme_name: name,
        opinion_count: relatedOUs.length,
        avg_sentiment: parseFloat(avgSentiment.toFixed(2)),
      };
    });

    // 9. Store in session_syntheses
    const { error: insertError } = await supabase
      .from("session_syntheses")
      .upsert({
        session_id,
        survey_id: session.survey_id,
        narrative_summary: synthesis.narrative_summary,
        emotional_arc: synthesis.emotional_arc,
        themes_explored: themesExplored,
        key_quotes: synthesis.key_quotes,
        root_causes: synthesis.root_causes,
        recommended_actions: synthesis.recommended_actions,
        engagement_quality: {
          depth_score: synthesis.depth_score,
          openness_score: synthesis.openness_score,
          avg_response_length: avgResponseLength,
        },
        escalation_summary: {
          flag_count: flagCount,
          urgent_count: urgentCount,
          top_concerns: opinionUnits
            .filter(ou => ou.escalation_level !== "none")
            .map(ou => ou.text)
            .slice(0, 5),
        },
        sentiment_trajectory: synthesis.sentiment_trajectory,
        confidence_score: synthesis.confidence_score,
        opinion_units_analyzed: opinionUnits.length,
      }, { onConflict: "session_id" });

    if (insertError) {
      console.error(`[${session_id}] Failed to store synthesis:`, insertError);
      return new Response(
        JSON.stringify({ error: "Failed to store synthesis", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 10. Backward-compatible write to session_insights
    const { error: legacyError } = await supabase
      .from("session_insights")
      .upsert({
        session_id,
        root_cause: synthesis.root_causes?.map((rc: any) => rc.cause).join("; ") || synthesis.narrative_summary,
        sentiment_trajectory: synthesis.sentiment_trajectory,
        key_quotes: synthesis.key_quotes,
        recommended_actions: synthesis.recommended_actions,
        confidence_score: synthesis.confidence_score,
      }, { onConflict: "session_id" });

    if (legacyError) {
      console.warn(`[${session_id}] Legacy session_insights write failed (non-critical):`, legacyError);
    }

    // 11. Update pipeline_runs
    await supabase
      .from("pipeline_runs")
      .update({
        synthesis_completed_at: new Date().toISOString(),
        status: "synthesis_complete",
        updated_at: new Date().toISOString(),
      })
      .eq("survey_id", session.survey_id)
      .is("synthesis_completed_at", null);

    console.log(`[${session_id}] ✅ Session synthesis stored successfully`);

    // 12. Cascade: check if all sessions for this survey are synthesized
    const { count: activeSessions } = await supabase
      .from("conversation_sessions")
      .select("id", { count: "exact", head: true })
      .eq("survey_id", session.survey_id)
      .eq("status", "completed");

    const { count: synthesizedSessions } = await supabase
      .from("session_syntheses")
      .select("id", { count: "exact", head: true })
      .eq("survey_id", session.survey_id);

    if (activeSessions && synthesizedSessions && synthesizedSessions >= activeSessions) {
      console.log(`[${session_id}] All ${activeSessions} sessions synthesized — triggering discover-themes`);
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/discover-themes`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ survey_id: session.survey_id }),
        });
      } catch (cascadeErr) {
        console.warn(`[${session_id}] discover-themes cascade failed (non-critical):`, cascadeErr);
      }
    }

    return new Response(
      JSON.stringify({
        message: "Session synthesis complete",
        session_id,
        confidence_score: synthesis.confidence_score,
        opinion_units_analyzed: opinionUnits.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Session synthesis error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
