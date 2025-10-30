import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Gemini Live API WebSocket proxy for voice conversations
 * Handles bidirectional audio streaming and transcription
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Upgrade to WebSocket
  if (req.headers.get("upgrade") !== "websocket") {
    return new Response("Expected WebSocket", { status: 426 });
  }

  try {
    const { socket, response } = Deno.upgradeWebSocket(req);
    
    let geminiWs: WebSocket | null = null;
    let conversationId: string | null = null;
    let supabase: any = null;
    let userId: string | null = null;

    socket.onopen = () => {
      console.log("Client WebSocket connected");
    };

    socket.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);

        // Handle initialization
        if (message.type === "init") {
          conversationId = message.conversationId;
          const token = message.token;

          // Initialize Supabase client
          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          supabase = createClient(supabaseUrl, supabaseKey);

          // Verify user authentication
          const { data: { user }, error: userError } = await supabase.auth.getUser(token);
          
          if (userError || !user) {
            socket.send(JSON.stringify({
              type: "error",
              error: "Authentication failed",
            }));
            socket.close();
            return;
          }

          userId = user.id;

          // Verify user has access to conversation
          const { data: session, error: sessionError } = await supabase
            .from("conversation_sessions")
            .select("employee_id, survey_id, surveys(first_message, themes)")
            .eq("id", conversationId)
            .single();

          if (sessionError || !session || session.employee_id !== userId) {
            socket.send(JSON.stringify({
              type: "error",
              error: "Unauthorized access to conversation",
            }));
            socket.close();
            return;
          }

          // Connect to Gemini Live API
          const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("LOVABLE_API_KEY");
          
          if (!GEMINI_API_KEY) {
            socket.send(JSON.stringify({
              type: "error",
              error: "API key not configured",
            }));
            socket.close();
            return;
          }

          // For now, we'll use the Lovable AI Gateway with Gemini
          // TODO: Switch to native Gemini Live API when available
          // const geminiUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;
          
          // Using Lovable's gateway as a proxy for now
          socket.send(JSON.stringify({
            type: "ready",
            message: "Connected to voice chat",
          }));

          // For Phase 1, we'll use a hybrid approach:
          // Browser captures audio -> We transcribe with Web Speech API on client
          // -> Send text to existing Gemini text API
          // -> Use browser TTS for response
          // This is a temporary solution until we can integrate Gemini Live API directly

        } else if (message.type === "audio_chunk") {
          // Receive audio chunk from client
          // For now, client will handle transcription using Web Speech API
          // In future, we'll forward to Gemini Live API
          
          // Placeholder: acknowledge receipt
          console.log("Received audio chunk, size:", message.data?.length || 0);

        } else if (message.type === "transcript") {
          // Receive transcript from client (using Web Speech API on client side)
          // Process with existing chat function logic
          
          const userMessage = message.text;
          
          // Call existing chat logic
          const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
          if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

          // Fetch conversation context
          const { data: previousResponses } = await supabase
            .from("responses")
            .select("content, ai_response, theme_id, sentiment")
            .eq("conversation_session_id", conversationId)
            .order("created_at", { ascending: true })
            .limit(10);

          const { data: sessionData } = await supabase
            .from("conversation_sessions")
            .select("survey_id, surveys(themes, first_message)")
            .eq("id", conversationId)
            .single();

          // Build system prompt (reuse from chat function)
          const systemPrompt = buildSystemPrompt(previousResponses, sessionData);

          // Call AI
          const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: systemPrompt },
                ...previousResponses.flatMap((r: any) => [
                  { role: "user", content: r.content },
                  { role: "assistant", content: r.ai_response },
                ]),
                { role: "user", content: userMessage },
              ],
              temperature: 0.8,
              max_tokens: 200,
            }),
          });

          const data = await response.json();
          const aiResponse = data.choices[0].message.content;

          // Analyze sentiment
          const sentiment = await analyzeSentiment(LOVABLE_API_KEY, userMessage);

          // Store response
          await supabase.from("responses").insert({
            conversation_session_id: conversationId,
            survey_id: sessionData.survey_id,
            content: userMessage,
            ai_response: aiResponse,
            sentiment: sentiment.sentiment,
            sentiment_score: sentiment.score,
          });

          // Send response back to client
          socket.send(JSON.stringify({
            type: "transcript_assistant",
            text: aiResponse,
          }));

          // Client will handle TTS
        }

      } catch (error) {
        console.error("Error processing message:", error);
        socket.send(JSON.stringify({
          type: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        }));
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
      console.log("Client WebSocket closed");
      // Cleanup Gemini WebSocket if it was initialized (future: Gemini Live API)
      if (geminiWs !== null) {
        try {
          (geminiWs as WebSocket).close();
        } catch (error) {
          console.error("Error closing Gemini WebSocket:", error);
        }
      }
    };

    return response;

  } catch (error) {
    console.error("WebSocket upgrade error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to upgrade to WebSocket" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Build system prompt for Atlas personality
 */
function buildSystemPrompt(previousResponses: any[], sessionData: any): string {
  const isFirstMessage = !previousResponses || previousResponses.length === 0;
  
  return `You are Atlas, a compassionate AI conversation guide conducting confidential employee feedback sessions via voice.

Your personality:
- Transparent about being AI (not pretending to be human)
- Warm but professional tone
- Concise responses (1-2 sentences, max 3) - CRITICAL for voice conversations
- Natural, conversational language (avoid bullet points, lists, or structured text)
- Good at being AI, not imitating humans

${isFirstMessage ? `
IMPORTANT - FIRST MESSAGE:
Introduce yourself as Atlas, an AI guide. Keep it brief and natural:
"Hi, I'm Atlas — an AI here to listen to your thoughts about work. Everything you share is confidential and anonymous. What's been on your mind about work lately?"
` : ''}

Your goals:
- Create a safe space for honest feedback
- Ask thoughtful follow-up questions
- Show empathy through validation
- Guide conversation naturally through work experience
- Keep responses SHORT for voice (1-2 sentences max)
- Use natural speech patterns, not written text

Remember: You're having a VOICE conversation. Be brief, natural, and conversational.`;
}

/**
 * Analyze sentiment
 */
async function analyzeSentiment(apiKey: string, text: string): Promise<{ sentiment: string; score: number }> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "Analyze sentiment. Reply with only: positive, neutral, or negative" },
        { role: "user", content: text }
      ],
      temperature: 0.3,
      max_tokens: 10,
    }),
  });

  const data = await response.json();
  const sentiment = data.choices[0].message.content.toLowerCase().trim();
  const score = sentiment === "positive" ? 75 : sentiment === "negative" ? 25 : 50;
  
  return { sentiment, score };
}
