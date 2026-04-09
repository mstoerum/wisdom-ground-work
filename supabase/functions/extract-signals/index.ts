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
    const { response_id, session_id, survey_id, content, ai_question, themes } = await req.json();

    if (!response_id || !session_id || !survey_id || !content) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: response_id, session_id, survey_id, content" }),
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

    console.log(`[extract-signals] Processing response ${response_id} for session ${session_id}`);

    // Build theme context for classification
    const themeContext = (themes || []).map((t: any) =>
      `- ID: ${t.id} | Name: "${t.name}" | Description: ${t.description || "none"}`
    ).join("\n");

    // Single LLM call replaces analyzeSentiment + detectTheme + detectUrgency + analyze_response
    const extractionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `You are a qualitative research analyst extracting structured signals from employee feedback responses.

You will receive:
1. The AI interviewer's question that prompted the response
2. The employee's response
3. Available themes for classification

Your job is to decompose the response into OPINION UNITS — atomic fragments of meaning. A single response like "I love the team but the workload is killing me" contains TWO opinion units:
1. Positive sentiment about team/collaboration
2. Negative sentiment about workload/stress

For each opinion unit, extract:
- The verbatim or close-paraphrase text
- The organizational aspect it relates to (e.g., "team collaboration", "workload management")
- Continuous sentiment (-1.0 to 1.0, not buckets)
- Intensity (0.0 to 1.0 — how strongly felt)
- Whether it's actionable (could HR do something about this?)
- Escalation level: "none" for normal feedback, "flag" for concerns worth noting (stress, frustration with processes), "urgent" ONLY for genuine safety/harassment/discrimination/crisis situations

Also classify the overall response:
- Overall sentiment label and granular score (0-100)
- Best matching theme ID from the available themes, OR null if the response doesn't substantively discuss any theme. Set theme_id to null when the response is: a general mood check-in, an icebreaker/rapport-building reply, a vague emotional statement without specific workplace content, or simply doesn't clearly relate to any of the listed themes. Only assign a theme when the response contains concrete content about that theme's topic.
- Urgency score (1-5): 1=routine, 2=minor concern, 3=notable, 4=serious, 5=critical`
          },
          {
            role: "user",
            content: `AI Question: "${ai_question || "(opening question)"}"

Employee Response: "${content}"

${themeContext ? `Available Themes:\n${themeContext}` : "No predefined themes available."}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_signals",
              description: "Extract opinion units and classification from an employee response",
              parameters: {
                type: "object",
                properties: {
                  opinion_units: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: { type: "string", description: "Verbatim or close paraphrase of this atomic meaning" },
                        aspect: { type: "string", description: "Free-text organizational aspect label" },
                        sentiment: { type: "number", description: "Sentiment from -1.0 (very negative) to 1.0 (very positive)" },
                        intensity: { type: "number", description: "How strongly felt, 0.0 to 1.0" },
                        is_actionable: { type: "boolean", description: "Could HR take action on this?" },
                        escalation_level: { type: "string", enum: ["none", "flag", "urgent"], description: "none=normal, flag=worth noting, urgent=safety/harassment/crisis ONLY" },
                        escalation_reason: { type: "string", description: "Reason for escalation if not 'none'" }
                      },
                      required: ["text", "aspect", "sentiment", "intensity", "is_actionable", "escalation_level"]
                    },
                    description: "Atomic opinion units extracted from this response"
                  },
                  overall_sentiment: {
                    type: "string",
                    enum: ["positive", "neutral", "negative"],
                    description: "Overall sentiment label"
                  },
                  sentiment_score: {
                    type: "integer",
                    description: "Granular sentiment score 0-100 (0=very negative, 100=very positive)"
                  },
                  theme_id: {
                    type: "string",
                    description: "Best matching theme ID from available themes. Set to null if the response is a general mood check-in, icebreaker, or doesn't substantively discuss any specific theme."
                  },
                  urgency_score: {
                    type: "integer",
                    description: "1=routine, 2=minor concern, 3=notable, 4=serious, 5=critical"
                  },
                  urgency_reason: {
                    type: "string",
                    description: "Brief explanation of urgency assessment"
                  },
                  key_sentiment_indicators: {
                    type: "array",
                    items: { type: "string" },
                    description: "Phrases revealing sentiment"
                  },
                  suggested_followup: {
                    type: "string",
                    description: "A follow-up question that could deepen understanding"
                  }
                },
                required: ["opinion_units", "overall_sentiment", "sentiment_score", "urgency_score"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_signals" } }
      }),
    });

    if (!extractionResponse.ok) {
      const errorText = await extractionResponse.text();
      console.error(`[extract-signals] LLM call failed:`, extractionResponse.status, errorText);
      
      // Fallback: update response with basic classification
      await supabase.from("responses").update({
        sentiment: "neutral",
        sentiment_score: 50,
        urgency_escalated: false,
        urgency_score: 1,
        signals_extracted: false,
      }).eq("id", response_id);

      return new Response(
        JSON.stringify({ error: "LLM extraction failed", fallback: true }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await extractionResponse.json();
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error(`[extract-signals] No tool call in response`);
      return new Response(
        JSON.stringify({ error: "Invalid LLM response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);
    const opinionUnits = result.opinion_units || [];

    console.log(`[extract-signals] Extracted ${opinionUnits.length} opinion units, sentiment: ${result.overall_sentiment} (${result.sentiment_score}), urgency: ${result.urgency_score}`);

    // Determine if truly urgent (only urgency_score >= 4 AND has urgent opinion units)
    const hasUrgentUnit = opinionUnits.some((u: any) => u.escalation_level === "urgent");
    const isUrgent = result.urgency_score >= 4 && hasUrgentUnit;

    // Step 1: Update the response with classification (backward compatible)
    const { error: updateError } = await supabase
      .from("responses")
      .update({
        sentiment: result.overall_sentiment,
        sentiment_score: result.sentiment_score,
        theme_id: result.theme_id || null,
        urgency_escalated: isUrgent,
        urgency_score: result.urgency_score,
        ai_analysis: {
          urgency_score: result.urgency_score,
          urgency_reason: result.urgency_reason,
          key_sentiment_indicators: result.key_sentiment_indicators,
          suggested_followup: result.suggested_followup,
          opinion_unit_count: opinionUnits.length,
        },
        signals_extracted: true,
        opinion_unit_count: opinionUnits.length,
      })
      .eq("id", response_id);

    if (updateError) {
      console.error(`[extract-signals] Failed to update response:`, updateError);
    }

    // Step 2: Insert opinion units
    if (opinionUnits.length > 0) {
      const unitRows = opinionUnits.map((u: any) => ({
        response_id,
        session_id,
        survey_id,
        text: u.text,
        aspect: u.aspect,
        sentiment: Math.max(-1, Math.min(1, u.sentiment || 0)),
        intensity: Math.max(0, Math.min(1, u.intensity || 0.5)),
        is_actionable: u.is_actionable || false,
        escalation_level: u.escalation_level || "none",
        escalation_reason: u.escalation_reason || null,
      }));

      const { error: insertError } = await supabase
        .from("opinion_units")
        .insert(unitRows);

      if (insertError) {
        console.error(`[extract-signals] Failed to insert opinion units:`, insertError);
      } else {
        console.log(`[extract-signals] ✅ ${unitRows.length} opinion units stored`);
      }
    }

    // Step 3: Create escalation log if urgent
    if (isUrgent) {
      console.log(`[extract-signals] ⚠️ Urgent issue detected, logging escalation`);
      await supabase.from("escalation_log").insert({
        response_id,
        escalation_type: "ai_detected",
        escalated_at: new Date().toISOString(),
      });
    }

    // Step 4: Update pipeline_runs status
    await supabase.from("pipeline_runs").upsert({
      survey_id,
      status: "extracting",
      updated_at: new Date().toISOString(),
    }, { onConflict: "survey_id" });

    return new Response(
      JSON.stringify({
        response_id,
        opinion_units_count: opinionUnits.length,
        sentiment: result.overall_sentiment,
        sentiment_score: result.sentiment_score,
        theme_id: result.theme_id,
        urgency_score: result.urgency_score,
        is_urgent: isUrgent,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[extract-signals] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
