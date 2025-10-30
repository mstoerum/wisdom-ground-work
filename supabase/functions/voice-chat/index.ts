import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Gemini Live API WebSocket proxy for voice conversations
 * Handles bidirectional audio streaming with Gemini 2.0 Flash with Audio
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
    let sessionData: any = null;
    let conversationBuffer: { user: string; assistant: string }[] = [];

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

          sessionData = session;

          // Get API key
          const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("LOVABLE_API_KEY");
          
          if (!GEMINI_API_KEY) {
            socket.send(JSON.stringify({
              type: "error",
              error: "API key not configured",
            }));
            socket.close();
            return;
          }

          // Connect to Gemini Live API (Gemini 2.0 Flash with multimodal audio)
          // Using Google AI SDK WebSocket endpoint
          const geminiWsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;
          
          try {
            geminiWs = new WebSocket(geminiWsUrl);

            geminiWs.onopen = () => {
              console.log("Connected to Gemini Live API");
              
              // Initialize session with system instructions
              const { data: previousResponses } = await supabase
                .from("responses")
                .select("content, ai_response")
                .eq("conversation_session_id", conversationId)
                .order("created_at", { ascending: true })
                .limit(5);

              const systemPrompt = buildSystemPrompt(previousResponses || [], sessionData);
              
              // Send setup message to Gemini
              geminiWs?.send(JSON.stringify({
                setup: {
                  model: "models/gemini-2.0-flash-exp",
                  generation_config: {
                    response_modalities: ["AUDIO"],
                    speech_config: {
                      voice_config: {
                        prebuilt_voice_config: {
                          voice_name: "Aoede" // Female voice option
                        }
                      }
                    }
                  },
                  system_instruction: {
                    parts: [{ text: systemPrompt }]
                  }
                }
              }));

              socket.send(JSON.stringify({
                type: "ready",
                message: "Connected to Gemini Live API",
              }));
            };

            geminiWs.onmessage = async (geminiEvent) => {
              try {
                const geminiData = JSON.parse(geminiEvent.data);
                
                // Handle server content (audio response from Gemini)
                if (geminiData.serverContent) {
                  const parts = geminiData.serverContent.modelTurn?.parts || [];
                  
                  for (const part of parts) {
                    // Forward audio data to client
                    if (part.inlineData?.data) {
                      socket.send(JSON.stringify({
                        type: "audio_response",
                        audio: part.inlineData.data,
                        mimeType: part.inlineData.mimeType || "audio/pcm"
                      }));
                    }
                    
                    // Store transcript if available
                    if (part.text) {
                      conversationBuffer[conversationBuffer.length - 1].assistant = part.text;
                    }
                  }
                  
                  // Send turn complete signal
                  if (geminiData.serverContent.turnComplete) {
                    socket.send(JSON.stringify({
                      type: "turn_complete"
                    }));
                    
                    // Save to database
                    const lastExchange = conversationBuffer[conversationBuffer.length - 1];
                    if (lastExchange && lastExchange.user && lastExchange.assistant) {
                      await saveConversationExchange(
                        supabase,
                        conversationId!,
                        sessionData.survey_id,
                        lastExchange.user,
                        lastExchange.assistant,
                        Deno.env.get("LOVABLE_API_KEY")!
                      );
                    }
                  }
                }
                
                // Handle tool calls or other responses
                if (geminiData.toolCall) {
                  console.log("Tool call received:", geminiData.toolCall);
                }
                
              } catch (err) {
                console.error("Error processing Gemini message:", err);
              }
            };

            geminiWs.onerror = (error) => {
              console.error("Gemini WebSocket error:", error);
              socket.send(JSON.stringify({
                type: "error",
                error: "Connection to AI service failed"
              }));
            };

            geminiWs.onclose = () => {
              console.log("Gemini WebSocket closed");
            };

          } catch (error) {
            console.error("Failed to connect to Gemini Live API:", error);
            socket.send(JSON.stringify({
              type: "error",
              error: "Failed to initialize voice AI"
            }));
            socket.close();
          }

        } else if (message.type === "audio_input") {
          // Forward audio input from client to Gemini
          if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
            geminiWs.send(JSON.stringify({
              realtimeInput: {
                mediaChunks: [{
                  data: message.audio,
                  mimeType: message.mimeType || "audio/pcm"
                }]
              }
            }));
          }
        } else if (message.type === "turn_complete") {
          // Signal end of user's turn
          if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
            // Create new conversation buffer entry
            conversationBuffer.push({ user: "", assistant: "" });
            
            geminiWs.send(JSON.stringify({
              clientContent: {
                turns: [{
                  role: "user",
                  parts: [{ text: "user finished speaking" }] // Gemini will have audio context
                }],
                turnComplete: true
              }
            }));
          }
        } else if (message.type === "transcript_update") {
          // Store user transcript (from client-side interim results)
          if (conversationBuffer.length > 0) {
            conversationBuffer[conversationBuffer.length - 1].user = message.text;
          } else {
            conversationBuffer.push({ user: message.text, assistant: "" });
          }
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
      // Cleanup Gemini WebSocket
      if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
        try {
          geminiWs.close();
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
 * Save conversation exchange to database with sentiment analysis
 */
async function saveConversationExchange(
  supabase: any,
  conversationId: string,
  surveyId: string,
  userContent: string,
  aiResponse: string,
  apiKey: string
): Promise<void> {
  try {
    // Analyze sentiment
    const sentiment = await analyzeSentiment(apiKey, userContent);

    // Store response
    await supabase.from("responses").insert({
      conversation_session_id: conversationId,
      survey_id: surveyId,
      content: userContent,
      ai_response: aiResponse,
      sentiment: sentiment.sentiment,
      sentiment_score: sentiment.score,
    });

    console.log("Saved conversation exchange to database");
  } catch (error) {
    console.error("Error saving conversation exchange:", error);
  }
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
