import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_MODEL = "google/gemini-2.5-pro";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { survey_id } = await req.json();

    if (!survey_id) {
      throw new Error("survey_id is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all evaluations for this survey
    const { data: evaluations, error: evalError } = await supabase
      .from("spradley_evaluations")
      .select("*")
      .eq("survey_id", survey_id)
      .order("created_at", { ascending: false });

    if (evalError) throw evalError;

    if (!evaluations || evaluations.length === 0) {
      return new Response(
        JSON.stringify({ error: "No evaluations found for this survey" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Analyzing ${evaluations.length} evaluations for survey ${survey_id}`);

    // Fetch survey details
    const { data: survey } = await supabase
      .from("surveys")
      .select("title, survey_type")
      .eq("id", survey_id)
      .single();

    // Build analysis context
    const analysisContext = `
You are analyzing ${evaluations.length} Spradley evaluation responses for the survey: "${survey?.title || 'Untitled Survey'}".

Survey Type: ${survey?.survey_type || 'employee_satisfaction'}

EVALUATION DATA:
${evaluations.map((evaluation, idx) => `
--- Evaluation ${idx + 1} ---
Sentiment: ${evaluation.overall_sentiment || 'unknown'} (score: ${evaluation.sentiment_score || 'N/A'})
Duration: ${evaluation.duration_seconds || 'N/A'} seconds
Completed: ${evaluation.completed_at}

Responses:
${Array.isArray(evaluation.evaluation_responses) ? evaluation.evaluation_responses.map((r: any) => `Q: ${r.question}\nA: ${r.answer}`).join('\n\n') : 'No responses'}

${evaluation.key_insights ? `Key Insights: ${JSON.stringify(evaluation.key_insights)}` : ''}
`).join('\n\n')}

TASK: Provide a comprehensive analysis of these Spradley evaluations focusing on:
1. Product-market fit signals (how well does Spradley meet user needs?)
2. Feature-specific feedback (voice mode, trust indicators, conversation flow, etc.)
3. Usability pain points and friction areas
4. Feature requests and improvement suggestions
5. Competitive positioning vs traditional surveys
6. Sentiment trends across different dimensions
7. Actionable recommendations prioritized by impact

Be specific, quote actual user feedback, and focus on insights that can drive product decisions.
`;

    // Call LLM with tool schema for structured output
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          {
            role: "user",
            content: analysisContext,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_spradley_evaluations",
              description: "Analyze Spradley evaluation data and extract insights",
              parameters: {
                type: "object",
                properties: {
                  executive_summary: {
                    type: "string",
                    description: "High-level summary of findings (2-3 sentences)",
                  },
                  top_insights: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        category: { type: "string", enum: ["pain_point", "win", "feature_request", "usability"] },
                        insight: { type: "string" },
                        supporting_quote: { type: "string" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                      },
                      required: ["category", "insight", "priority"],
                    },
                    description: "Top 5-10 insights prioritized by importance",
                  },
                  feature_feedback: {
                    type: "object",
                    properties: {
                      voice_mode: { type: "string" },
                      trust_indicators: { type: "string" },
                      conversation_flow: { type: "string" },
                      ui_ux: { type: "string" },
                    },
                    description: "Feedback on specific features",
                  },
                  usability_issues: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        issue: { type: "string" },
                        severity: { type: "string", enum: ["critical", "major", "minor"] },
                        frequency: { type: "string" },
                        quote: { type: "string" },
                      },
                      required: ["issue", "severity"],
                    },
                    description: "Critical usability problems",
                  },
                  feature_requests: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        request: { type: "string" },
                        demand: { type: "string", enum: ["high", "medium", "low"] },
                        quote: { type: "string" },
                      },
                      required: ["request", "demand"],
                    },
                    description: "User-requested features",
                  },
                  competitive_analysis: {
                    type: "string",
                    description: "How Spradley compares to traditional surveys based on user feedback",
                  },
                  sentiment_trends: {
                    type: "object",
                    properties: {
                      overall: { type: "string" },
                      by_feature: {
                        type: "object",
                        additionalProperties: { type: "string" },
                      },
                      trend_direction: { type: "string", enum: ["improving", "stable", "declining"] },
                    },
                    description: "Sentiment analysis across dimensions",
                  },
                  actionable_recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        recommendation: { type: "string" },
                        rationale: { type: "string" },
                        priority: { type: "string", enum: ["p0", "p1", "p2"] },
                        estimated_impact: { type: "string", enum: ["high", "medium", "low"] },
                      },
                      required: ["recommendation", "priority", "estimated_impact"],
                    },
                    description: "Prioritized product recommendations",
                  },
                  confidence_score: {
                    type: "integer",
                    minimum: 0,
                    maximum: 100,
                    description: "Confidence in analysis quality (0-100)",
                  },
                },
                required: ["executive_summary", "top_insights", "actionable_recommendations", "confidence_score"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyze_spradley_evaluations" } },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI response:", JSON.stringify(aiData, null, 2));

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    // Store analytics
    const { data: storedAnalytics, error: storeError } = await supabase
      .from("spradley_analytics")
      .insert({
        survey_id,
        executive_summary: analysis.executive_summary,
        top_insights: analysis.top_insights,
        feature_feedback: analysis.feature_feedback,
        usability_issues: analysis.usability_issues,
        feature_requests: analysis.feature_requests,
        competitive_analysis: analysis.competitive_analysis,
        sentiment_trends: analysis.sentiment_trends,
        actionable_recommendations: analysis.actionable_recommendations,
        confidence_score: analysis.confidence_score,
        total_evaluations_analyzed: evaluations.length,
      })
      .select()
      .single();

    if (storeError) {
      console.error("Error storing analytics:", storeError);
      throw storeError;
    }

    console.log("Analytics stored successfully");

    return new Response(JSON.stringify({ success: true, analytics: storedAnalytics }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in spradley-deep-analytics:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
