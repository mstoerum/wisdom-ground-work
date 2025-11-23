import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_MODEL_LITE = "google/gemini-2.5-flash-lite";

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

    console.log(`[${session_id}] Starting session analysis...`);

    // Fetch session details
    const { data: session, error: sessionError } = await supabase
      .from("conversation_sessions")
      .select("*")
      .eq("id", session_id)
      .single();

    if (sessionError || !session) {
      console.error(`[${session_id}] Session not found:`, sessionError);
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all responses for this session
    const { data: responses, error: responsesError } = await supabase
      .from("responses")
      .select("content, ai_response, sentiment, sentiment_score, urgency_score, ai_analysis, created_at")
      .eq("conversation_session_id", session_id)
      .order("created_at", { ascending: true });

    if (responsesError) {
      console.error(`[${session_id}] Failed to fetch responses:`, responsesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch responses" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!responses || responses.length === 0) {
      console.log(`[${session_id}] No responses found, skipping analysis`);
      return new Response(
        JSON.stringify({ message: "No responses to analyze" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[${session_id}] Analyzing ${responses.length} responses...`);

    // Build conversation thread for analysis
    const conversationThread = responses.map((r, idx) => 
      `[Response ${idx + 1}]\nUser: ${r.content}\nAI: ${r.ai_response}\nSentiment: ${r.sentiment} (${r.sentiment_score}/100)\nUrgency: ${r.urgency_score || 'N/A'}/5`
    ).join("\n\n");

    // Extract sentiment scores for trajectory analysis
    const sentimentScores = responses
      .map(r => r.sentiment_score)
      .filter(s => s !== null && s !== undefined);

    // Perform LLM analysis
    const analysisResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL_LITE,
        messages: [
          {
            role: "system",
            content: "You analyze completed feedback conversations to extract deep insights, root causes, and actionable recommendations."
          },
          {
            role: "user",
            content: `Analyze this completed conversation:

Initial Mood: ${session.initial_mood || 'N/A'}/10
Final Mood: ${session.final_mood || 'N/A'}/10
Total Responses: ${responses.length}

Conversation Thread:
${conversationThread}

Provide comprehensive analysis.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_session",
              description: "Extract root cause, sentiment trajectory, key quotes, and recommended actions from a conversation",
              parameters: {
                type: "object",
                properties: {
                  root_cause: {
                    type: "string",
                    description: "The underlying root cause or core issue (1-2 sentences)"
                  },
                  sentiment_trajectory: {
                    type: "string",
                    enum: ["improving", "declining", "stable", "mixed"],
                    description: "How sentiment changed throughout the conversation"
                  },
                  key_quotes: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 most impactful verbatim quotes from the participant"
                  },
                  recommended_actions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        action: { type: "string", description: "Specific actionable recommendation" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        timeframe: { type: "string", description: "Suggested timeframe (e.g., 'immediate', '1 week', '1 month')" }
                      },
                      required: ["action", "priority", "timeframe"]
                    },
                    description: "3-5 specific, actionable recommendations prioritized by impact"
                  },
                  confidence_score: {
                    type: "integer",
                    description: "Confidence in this analysis from 0-100",
                    minimum: 0,
                    maximum: 100
                  }
                },
                required: ["root_cause", "sentiment_trajectory", "key_quotes", "recommended_actions", "confidence_score"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_session" } }
      }),
    });

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error(`[${session_id}] LLM analysis failed:`, errorText);
      return new Response(
        JSON.stringify({ error: "LLM analysis failed" }),
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

    const analysis = JSON.parse(toolCall.function.arguments);

    console.log(`[${session_id}] Analysis complete:`, {
      root_cause: analysis.root_cause?.substring(0, 50) + "...",
      sentiment_trajectory: analysis.sentiment_trajectory,
      confidence_score: analysis.confidence_score,
      num_actions: analysis.recommended_actions?.length || 0
    });

    // Store insights in database
    const { error: insertError } = await supabase
      .from("session_insights")
      .insert({
        session_id: session_id,
        root_cause: analysis.root_cause,
        sentiment_trajectory: analysis.sentiment_trajectory,
        key_quotes: analysis.key_quotes,
        recommended_actions: analysis.recommended_actions,
        confidence_score: analysis.confidence_score
      });

    if (insertError) {
      console.error(`[${session_id}] Failed to store insights:`, insertError);
      return new Response(
        JSON.stringify({ error: "Failed to store insights", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[${session_id}] ✅ Session insights stored successfully`);

    return new Response(
      JSON.stringify({ 
        message: "Session analysis complete",
        session_id,
        confidence_score: analysis.confidence_score
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Session analysis error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
