import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Lily voice - warm, empathetic - perfect for Spradley
const VOICE_ID = "pFZP5JQG7iQjIQuC4Bku";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      console.error("❌ ELEVENLABS_API_KEY is not configured");
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }

    const { conversationId, isPreviewMode, surveyData } = await req.json();
    console.log("📞 Generating ElevenLabs conversation token for:", { conversationId, isPreviewMode });

    // Build system prompt based on context
    const systemPrompt = buildSpradleySystemPrompt(surveyData);
    const firstMessage = surveyData?.first_message || "Hello! I'm Spradley, here to have a confidential conversation about your experience. What's been on your mind lately about work?";

    // Request a signed URL for WebSocket connection with dynamic agent config
    const tokenResponse = await fetch(
      "https://api.elevenlabs.io/v1/convai/conversation/get_signed_url",
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
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
          },
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("❌ ElevenLabs token error:", tokenResponse.status, errorText);
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
}): string {
  const themes = surveyData?.themes || [];
  const themesText = themes.length > 0
    ? themes.map(t => `- ${t.name}: ${t.description || ''}`).join("\n")
    : "General employee feedback";

  return `You are Spradley, a warm and empathetic AI interviewer conducting confidential employee feedback sessions.

VOICE PERSONALITY:
- Warm, genuine, and caring - like a trusted colleague
- Use natural conversational speech with contractions (I'm, you're, that's)
- Brief responses - aim for 1-2 sentences maximum
- Acknowledge what they share before asking follow-ups
- Use verbal affirmations: "I hear you", "That makes sense", "Thank you for sharing"

CONVERSATION THEMES:
${themesText}

CONVERSATION FLOW:
1. Warmly introduce yourself and set a comfortable tone
2. Explore each theme naturally - aim for 2-3 exchanges per theme
3. Ask specific follow-up questions
4. Transition smoothly between topics
5. After covering themes (4-8 exchanges), wrap up warmly
6. End by thanking them sincerely

IMPORTANT FOR VOICE:
- Speak naturally as you would in a real conversation
- Avoid robotic or formal language
- Your tone should convey genuine interest and care`;
}
