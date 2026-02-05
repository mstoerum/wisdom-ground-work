import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { 
      conversationId, 
      userText, 
      aiText, 
      isPreviewMode 
    } = await req.json();

    console.log("💾 Saving voice response:", { 
      conversationId, 
      userTextLength: userText?.length, 
      aiTextLength: aiText?.length,
      isPreviewMode 
    });

    // Don't save in preview mode
    if (isPreviewMode) {
      console.log("📋 Preview mode - skipping database save");
      return new Response(
        JSON.stringify({ 
          success: true, 
          preview: true,
          message: "Preview mode - response not saved" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!conversationId || conversationId === 'preview-conversation') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid conversation ID" 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the session to find survey_id
    const { data: session, error: sessionError } = await supabase
      .from("conversation_sessions")
      .select("survey_id")
      .eq("id", conversationId)
      .single();

    if (sessionError || !session) {
      console.error("Session not found:", sessionError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Conversation session not found" 
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Analyze sentiment using simple heuristics (can be enhanced with AI)
    const sentiment = analyzeSentiment(userText);
    const sentimentScore = calculateSentimentScore(sentiment);

    // Save the response
    const { data: response, error: insertError } = await supabase
      .from("responses")
      .insert({
        survey_id: session.survey_id,
        conversation_session_id: conversationId,
        content: userText,
        ai_response: aiText,
        sentiment: sentiment,
        sentiment_score: sentimentScore,
        is_paraphrased: false,
        urgency_escalated: sentiment === 'negative' && sentimentScore < -0.5,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error saving response:", insertError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to save response" 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log("✅ Response saved successfully:", response.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        responseId: response.id,
        sentiment,
        sentimentScore 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Error in save-voice-response:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Simple sentiment analysis based on keyword matching
 * Can be enhanced with Lovable AI for more accurate analysis
 */
function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const lowerText = text.toLowerCase();
  
  const positiveKeywords = [
    'great', 'good', 'excellent', 'amazing', 'love', 'enjoy', 'happy',
    'appreciate', 'thankful', 'wonderful', 'fantastic', 'helpful',
    'supportive', 'satisfied', 'pleased', 'excited', 'motivated'
  ];
  
  const negativeKeywords = [
    'bad', 'terrible', 'awful', 'hate', 'frustrated', 'disappointed',
    'stressed', 'overwhelmed', 'unfair', 'ignored', 'undervalued',
    'micromanaged', 'burnout', 'quit', 'leave', 'unhappy', 'worried'
  ];

  let positiveCount = 0;
  let negativeCount = 0;

  for (const word of positiveKeywords) {
    if (lowerText.includes(word)) positiveCount++;
  }

  for (const word of negativeKeywords) {
    if (lowerText.includes(word)) negativeCount++;
  }

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

/**
 * Calculate sentiment score from -1 (very negative) to 1 (very positive)
 */
function calculateSentimentScore(sentiment: 'positive' | 'negative' | 'neutral'): number {
  switch (sentiment) {
    case 'positive': return 0.5;
    case 'negative': return -0.5;
    default: return 0;
  }
}
