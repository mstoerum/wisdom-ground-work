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

    console.log(`[${survey_id}] Starting survey-wide deep analysis...`);

    // Fetch survey details
    const { data: survey, error: surveyError } = await supabase
      .from("surveys")
      .select("*, survey_themes(*)")
      .eq("id", survey_id)
      .single();

    if (surveyError || !survey) {
      console.error(`[${survey_id}] Survey not found:`, surveyError);
      return new Response(
        JSON.stringify({ error: "Survey not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all completed sessions for this survey
    const { data: sessions, error: sessionsError } = await supabase
      .from("conversation_sessions")
      .select(`
        id,
        initial_mood,
        final_mood,
        started_at,
        ended_at,
        status
      `)
      .eq("survey_id", survey_id)
      .eq("status", "completed");

    if (sessionsError) {
      console.error(`[${survey_id}] Failed to fetch sessions:`, sessionsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch sessions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!sessions || sessions.length === 0) {
      console.log(`[${survey_id}] No completed sessions found`);
      return new Response(
        JSON.stringify({ message: "No completed sessions to analyze" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all responses and session insights
    const { data: responses, error: responsesError } = await supabase
      .from("responses")
      .select("content, sentiment, sentiment_score, urgency_score, ai_analysis, theme_id")
      .eq("survey_id", survey_id);

    const { data: sessionInsights, error: insightsError } = await supabase
      .from("session_insights")
      .select("root_cause, sentiment_trajectory, recommended_actions")
      .in("session_id", sessions.map(s => s.id));

    if (responsesError || insightsError) {
      console.error(`[${survey_id}] Failed to fetch analysis data`);
    }

    console.log(`[${survey_id}] Analyzing ${sessions.length} sessions with ${responses?.length || 0} responses...`);

    // Calculate basic metrics
    const totalResponses = responses?.length || 0;
    const avgSentiment = totalResponses > 0 
      ? (responses?.reduce((sum, r) => sum + (r.sentiment_score || 50), 0) || 0) / totalResponses
      : 50;
    const urgentCount = responses?.filter(r => r.urgency_score && r.urgency_score >= 4).length || 0;
    
    // Group by themes
    const themeStats = responses?.reduce((acc: any, r) => {
      if (r.theme_id) {
        if (!acc[r.theme_id]) {
          acc[r.theme_id] = { count: 0, totalSentiment: 0, urgentCount: 0 };
        }
        acc[r.theme_id].count++;
        acc[r.theme_id].totalSentiment += r.sentiment_score || 50;
        if (r.urgency_score && r.urgency_score >= 4) {
          acc[r.theme_id].urgentCount++;
        }
      }
      return acc;
    }, {});

    // Aggregate session insights
    const rootCauses = sessionInsights?.map(si => si.root_cause).filter(Boolean) || [];
    const trajectories = sessionInsights?.map(si => si.sentiment_trajectory).filter(Boolean) || [];
    
    // Build comprehensive analysis prompt
    const analysisContext = `
Survey: ${survey.title}
Total Completed Sessions: ${sessions.length}
Total Responses: ${totalResponses}
Average Sentiment: ${avgSentiment.toFixed(1)}/100
Urgent Issues: ${urgentCount}

Sentiment Trajectories:
- Improving: ${trajectories.filter(t => t === 'improving').length}
- Declining: ${trajectories.filter(t => t === 'declining').length}
- Stable: ${trajectories.filter(t => t === 'stable').length}
- Mixed: ${trajectories.filter(t => t === 'mixed').length}

Top Themes by Volume:
${Object.entries(themeStats || {})
  .sort(([,a]: any, [,b]: any) => b.count - a.count)
  .slice(0, 5)
  .map(([themeId, stats]: any) => {
    const theme = (survey.survey_themes as any[])?.find(t => t.id === themeId);
    return `- ${theme?.name || themeId}: ${stats.count} responses (avg sentiment: ${(stats.totalSentiment / stats.count).toFixed(1)})`;
  })
  .join('\n')}

Root Causes Identified:
${rootCauses.slice(0, 10).map((rc, idx) => `${idx + 1}. ${rc}`).join('\n')}

Sample Responses (High Urgency):
${responses?.filter(r => r.urgency_score && r.urgency_score >= 4)
  .slice(0, 5)
  .map(r => `"${r.content.substring(0, 150)}..."`)
  .join('\n')}
`;

    console.log(`[${survey_id}] Running LLM survey-wide analysis...`);

    // Perform LLM analysis
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
            content: "You analyze organization-wide feedback data to provide executive-level strategic insights and recommendations."
          },
          {
            role: "user",
            content: `Perform comprehensive analysis of this survey:\n\n${analysisContext}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_survey",
              description: "Extract executive summary, themes, cultural insights, risks, opportunities, and strategic recommendations",
              parameters: {
                type: "object",
                properties: {
                  executive_summary: {
                    type: "string",
                    description: "2-3 paragraph executive summary highlighting key findings"
                  },
                  top_themes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        theme: { type: "string" },
                        importance: { type: "string", enum: ["critical", "high", "medium", "low"] },
                        sentiment: { type: "string", enum: ["positive", "mixed", "negative"] },
                        key_finding: { type: "string" }
                      }
                    },
                    description: "Top 5-7 themes ranked by strategic importance"
                  },
                  sentiment_trends: {
                    type: "object",
                    properties: {
                      overall_direction: { type: "string", enum: ["improving", "declining", "stable"] },
                      momentum: { type: "string", description: "Is sentiment accelerating or decelerating?" },
                      inflection_points: { 
                        type: "array",
                        items: { type: "string" },
                        description: "Key moments or themes where sentiment shifted"
                      }
                    }
                  },
                  cultural_insights: {
                    type: "string",
                    description: "Deep cultural and organizational insights (2-3 paragraphs)"
                  },
                  risk_factors: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        risk: { type: "string" },
                        severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
                        likelihood: { type: "string", enum: ["high", "medium", "low"] },
                        impact_area: { type: "string" }
                      }
                    },
                    description: "3-5 key risk factors identified"
                  },
                  opportunities: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        opportunity: { type: "string" },
                        potential_impact: { type: "string", enum: ["high", "medium", "low"] },
                        effort_required: { type: "string", enum: ["low", "medium", "high"] }
                      }
                    },
                    description: "3-5 strategic opportunities"
                  },
                  strategic_recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        recommendation: { type: "string" },
                        priority: { type: "string", enum: ["immediate", "short-term", "medium-term", "long-term"] },
                        expected_outcome: { type: "string" },
                        key_stakeholders: { 
                          type: "array",
                          items: { type: "string" }
                        }
                      }
                    },
                    description: "5-7 prioritized strategic recommendations"
                  },
                  participation_analysis: {
                    type: "string",
                    description: "Analysis of participation patterns and their implications"
                  },
                  confidence_score: {
                    type: "integer",
                    description: "Confidence in this analysis from 0-100",
                    minimum: 0,
                    maximum: 100
                  }
                },
                required: [
                  "executive_summary",
                  "top_themes",
                  "sentiment_trends",
                  "cultural_insights",
                  "risk_factors",
                  "opportunities",
                  "strategic_recommendations",
                  "participation_analysis",
                  "confidence_score"
                ],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_survey" } }
      }),
    });

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error(`[${survey_id}] LLM analysis failed:`, errorText);
      return new Response(
        JSON.stringify({ error: "LLM analysis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const analysisData = await analysisResponse.json();
    const toolCall = analysisData.choices[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error(`[${survey_id}] No tool call in LLM response`);
      return new Response(
        JSON.stringify({ error: "Invalid LLM response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    console.log(`[${survey_id}] Analysis complete:`, {
      confidence_score: analysis.confidence_score,
      num_themes: analysis.top_themes?.length || 0,
      num_risks: analysis.risk_factors?.length || 0,
      num_recommendations: analysis.strategic_recommendations?.length || 0
    });

    // Store analytics in database
    const { error: insertError } = await supabase
      .from("survey_analytics")
      .insert({
        survey_id: survey_id,
        executive_summary: analysis.executive_summary,
        top_themes: analysis.top_themes,
        sentiment_trends: analysis.sentiment_trends,
        cultural_insights: analysis.cultural_insights,
        risk_factors: analysis.risk_factors,
        opportunities: analysis.opportunities,
        strategic_recommendations: analysis.strategic_recommendations,
        participation_analysis: analysis.participation_analysis,
        confidence_score: analysis.confidence_score,
        total_sessions_analyzed: sessions.length
      });

    if (insertError) {
      console.error(`[${survey_id}] Failed to store analytics:`, insertError);
      return new Response(
        JSON.stringify({ error: "Failed to store analytics", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[${survey_id}] ✅ Survey analytics stored successfully`);

    return new Response(
      JSON.stringify({ 
        message: "Survey analysis complete",
        survey_id,
        sessions_analyzed: sessions.length,
        confidence_score: analysis.confidence_score
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Deep analytics error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
