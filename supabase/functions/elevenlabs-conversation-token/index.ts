import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Voice IDs - Lily is warm, empathetic - perfect for Spradley
const VOICE_ID = "pFZP5JQG7iQjIQuC4Bku"; // Lily

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }

    const { conversationId, isPreviewMode, surveyData } = await req.json();
    console.log("📞 Generating ElevenLabs conversation token for:", { conversationId, isPreviewMode });

    // Build system prompt based on context
    let systemPrompt = buildSpradleySystemPrompt(surveyData);
    let firstMessage = surveyData?.first_message || "Hello! I'm Spradley, here to have a confidential conversation about your experience. Everything you share stays between us. What's been on your mind lately about work?";

    // For non-preview mode, load conversation context from database
    if (!isPreviewMode && conversationId && conversationId !== 'preview-conversation') {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Load survey and session data
      const { data: session } = await supabase
        .from("conversation_sessions")
        .select(`
          id,
          survey_id,
          surveys (
            id,
            title,
            first_message,
            themes,
            survey_type
          )
        `)
        .eq("id", conversationId)
        .single();

      if (session?.surveys) {
        const survey = session.surveys as any;
        firstMessage = survey.first_message || firstMessage;

        // Load theme details
        const themeIds = Array.isArray(survey.themes) ? survey.themes : [];
        if (themeIds.length > 0) {
          const { data: themes } = await supabase
            .from("survey_themes")
            .select("id, name, description")
            .in("id", themeIds);

          if (themes) {
            systemPrompt = buildSpradleySystemPrompt({
              ...surveyData,
              themes: themes,
              survey_type: survey.survey_type
            });
          }
        }

        // Load previous responses for context
        const { data: responses } = await supabase
          .from("responses")
          .select("content, ai_response, sentiment, theme_id")
          .eq("conversation_session_id", conversationId)
          .order("created_at", { ascending: true })
          .limit(10);

        if (responses && responses.length > 0) {
          systemPrompt += buildConversationHistory(responses);
        }
      }
    }

    // Get conversation token from ElevenLabs
    // Note: ElevenLabs Conversational AI uses agent-based tokens
    // We request a signed URL for WebRTC connection
    const tokenResponse = await fetch(
      "https://api.elevenlabs.io/v1/convai/conversation/get-signed-url",
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Dynamic agent configuration via overrides
          agent_config: {
            prompt: {
              prompt: systemPrompt,
            },
            first_message: firstMessage,
            language: "en",
            tts: {
              voice_id: VOICE_ID,
              model_id: "eleven_turbo_v2_5",
              stability: 0.5,
              similarity_boost: 0.75,
            },
            stt: {
              model_id: "scribe_v2",
            },
          },
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("ElevenLabs token error:", tokenResponse.status, errorText);
      throw new Error(`ElevenLabs API error: ${tokenResponse.status} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    console.log("✅ ElevenLabs token generated successfully");

    return new Response(
      JSON.stringify({
        signed_url: tokenData.signed_url,
        voice_id: VOICE_ID,
        first_message: firstMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Error generating conversation token:", error);
    return new Response(
      JSON.stringify({
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
 * Build the Spradley system prompt for voice conversations
 */
function buildSpradleySystemPrompt(surveyData?: {
  first_message?: string;
  themes?: Array<{ name: string; description: string }>;
  survey_type?: string;
}): string {
  const themes = surveyData?.themes || [];
  const themesText = themes.length > 0
    ? themes.map(t => `- ${t.name}: ${t.description}`).join("\n")
    : "General employee feedback";

  const isSpradleyEvaluation = surveyData?.survey_type === "course_evaluation";

  return `You are Spradley, a warm and empathetic AI interviewer conducting ${isSpradleyEvaluation ? "course evaluation" : "confidential employee feedback"} sessions.

VOICE PERSONALITY:
- Warm, genuine, and caring - like a trusted colleague
- Use natural conversational speech with contractions (I'm, you're, that's)
- Brief responses - aim for 1-2 sentences maximum
- Acknowledge what they share before asking follow-ups
- Use verbal affirmations: "I hear you", "That makes sense", "Thank you for sharing that"

EMPATHY GUIDELINES:
- Acknowledge the person sharing, not just the content
- Scale your response to intensity: brief for minor points, more for significant shares
- For negative feedback: acknowledge, then gently redirect to solutions
- Never: validate criticism as absolute fact, mirror intense emotions, escalate negativity

CONVERSATION STYLE:
- Ask one clear question at a time
- Keep questions under 15 words
- Use natural transitions between topics
- Offer choices when helpful: "Was it more about the workload, the communication, or something else?"
- Redirect negative feedback constructively: "What would make this better?"

${isSpradleyEvaluation ? "EVALUATION DIMENSIONS" : "CONVERSATION THEMES"}:
${themesText}

CONVERSATION FLOW:
1. Warmly introduce yourself and set a comfortable tone
2. Explore each theme naturally - aim for 2-3 exchanges per theme
3. Ask specific follow-up questions to understand their experience
4. Transition smoothly between topics
5. After covering themes adequately (4-8 exchanges), wrap up warmly
6. End by thanking them sincerely for their time and honesty

IMPORTANT FOR VOICE:
- Speak naturally as you would in a real conversation
- Avoid robotic or formal language
- Use filler words sparingly but naturally (well, so, you know)
- Pause appropriately between thoughts
- Your tone should convey genuine interest and care`;
}

/**
 * Build conversation history context from previous responses
 */
function buildConversationHistory(responses: Array<{ content: string; ai_response: string | null; sentiment: string | null }>): string {
  if (responses.length === 0) return "";

  const recentExchanges = responses.slice(-5).map(r => 
    `Employee: "${r.content.substring(0, 100)}${r.content.length > 100 ? '...' : ''}"`
  ).join("\n");

  const sentimentPattern = responses
    .slice(-3)
    .map(r => r.sentiment)
    .filter(Boolean)
    .join(" → ");

  return `

CONVERSATION CONTEXT (continue naturally from here):
Previous exchanges:
${recentExchanges}

Recent sentiment pattern: ${sentimentPattern || "neutral"}
Exchange count: ${responses.length}

Continue the conversation naturally, building on what they've already shared.`;
}
