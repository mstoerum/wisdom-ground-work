import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Simplified evaluation endpoint for batch saving Spradley evaluations
 * Now uses predefined static questions instead of dynamic AI-generated ones
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { 
      surveyId, 
      conversationSessionId, 
      responses, 
      quickRating,
      sentiment,
      sentimentScore 
    } = await req.json();

    if (!surveyId || !conversationSessionId) {
      throw new Error("Missing required fields: surveyId and conversationSessionId");
    }

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Try to get authenticated user (optional for anonymous surveys)
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (!authError && user) {
        userId = user.id;
      }
    }

    // Verify survey exists and evaluation is enabled
    const { data: survey, error: surveyError } = await supabase
      .from("surveys")
      .select("consent_config")
      .eq("id", surveyId)
      .single();

    if (surveyError || !survey) {
      console.error("Survey lookup error:", surveyError);
      throw new Error("Survey not found");
    }

    const consentConfig = survey.consent_config as any;
    if (!consentConfig?.enable_spradley_evaluation) {
      throw new Error("Evaluation not enabled for this survey");
    }

    // Format responses for storage
    const formattedResponses = responses ? Object.entries(responses).map(([questionId, answer]) => ({
      question_id: questionId,
      answer: answer,
    })) : [];

    // Save evaluation to database - using correct column names
    const { data: evaluation, error: insertError } = await supabase
      .from("spradley_evaluations")
      .insert({
        survey_id: surveyId,
        conversation_session_id: conversationSessionId,
        employee_id: userId,
        evaluation_responses: formattedResponses,
        overall_sentiment: sentiment || "neutral",
        sentiment_score: sentimentScore || 0.5,
        key_insights: {
          response_count: formattedResponses.length,
          quick_rating: quickRating || null,
          saved_via: "batch_endpoint",
        },
        duration_seconds: 0,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to save evaluation:", insertError);
      throw new Error("Failed to save evaluation: " + insertError.message);
    }

    console.log("Evaluation saved successfully:", evaluation?.id);

    return new Response(
      JSON.stringify({
        success: true,
        evaluationId: evaluation?.id,
        sentiment: sentiment || "neutral",
        sentimentScore: sentimentScore || 0.5,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Evaluation error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
