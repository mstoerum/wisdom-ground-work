import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

interface SurveyData {
  first_message?: string;
  themes?: string[];
}

interface SessionData {
  employee_id: string;
  survey_id: string;
  surveys: SurveyData | SurveyData[];
}

interface PreviousResponse {
  content: string;
  ai_response: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * OpenAI Realtime API WebSocket proxy for ultra-low latency voice conversations
 * - 300-600ms latency (3x faster than Gemini)
 * - Best-in-class voice quality
 * - Native interruption handling
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
    
    let openaiWs: WebSocket | null = null;
    let conversationId: string | null = null;
    let supabase: SupabaseClient | null = null;
    let userId: string | null = null;
    let sessionData: SessionData | null = null;
    let currentUserTranscript = "";
    let currentAiTranscript = "";

    socket.onopen = () => {
      console.log("✅ Client WebSocket connected (redeploy)");
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
            console.error("❌ Authentication failed:", userError?.message || "No user found");
            socket.send(JSON.stringify({
              type: "error",
              error: "Authentication failed. Please refresh and try again.",
            }));
            socket.close();
            return;
          }

          console.log("✅ User authenticated:", user.id);

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

          // Get OpenAI API key
          const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
          
          if (!OPENAI_API_KEY) {
            socket.send(JSON.stringify({
              type: "error",
              error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.",
            }));
            socket.close();
            return;
          }

          // Load conversation context
          const { data: previousResponses } = await supabase
            .from("responses")
            .select("content, ai_response")
            .eq("conversation_session_id", conversationId)
            .order("created_at", { ascending: true })
            .limit(5);

          const systemPrompt = buildSystemPrompt(previousResponses || [], sessionData);

          // Connect to OpenAI Realtime API
          const model = "gpt-4o-realtime-preview-2024-12-17";
          const openaiWsUrl = `wss://api.openai.com/v1/realtime?model=${model}`;
          
          console.log("🔌 Connecting to OpenAI Realtime API...");
          
          try {
            openaiWs = new WebSocket(openaiWsUrl, {
              headers: {
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "OpenAI-Beta": "realtime=v1",
              },
            });

            openaiWs.onopen = () => {
              console.log("✅ Connected to OpenAI Realtime API");
              
              // Configure session
              openaiWs?.send(JSON.stringify({
                type: "session.update",
                session: {
                  modalities: ["text", "audio"],
                  instructions: systemPrompt,
                  voice: "alloy", // Natural, balanced voice (options: alloy, echo, shimmer)
                  input_audio_format: "pcm16",
                  output_audio_format: "pcm16",
                  input_audio_transcription: {
                    model: "whisper-1"
                  },
                  turn_detection: {
                    type: "server_vad", // Server-side voice activity detection
                    threshold: 0.5,
                    prefix_padding_ms: 300,
                    silence_duration_ms: 500, // Very responsive - 500ms of silence triggers response
                  },
                  temperature: 0.8,
                  max_response_output_tokens: 4096,
                }
              }));

              socket.send(JSON.stringify({
                type: "ready",
                message: "Connected to OpenAI Realtime API - ready for conversation!",
              }));
            };

            openaiWs.onmessage = async (openaiEvent) => {
              try {
                const data = JSON.parse(openaiEvent.data);
                
                // Log for debugging
                console.log("📨 OpenAI event:", data.type);

                // Handle different event types
                switch (data.type) {
                  case "session.created":
                  case "session.updated":
                    console.log("✅ Session configured");
                    break;

                  case "input_audio_buffer.speech_started":
                    socket.send(JSON.stringify({
                      type: "speech_started",
                    }));
                    currentUserTranscript = "";
                    break;

                  case "input_audio_buffer.speech_stopped":
                    socket.send(JSON.stringify({
                      type: "speech_stopped",
                    }));
                    break;

                  case "conversation.item.input_audio_transcription.completed":
                    // User speech transcription
                    currentUserTranscript = data.transcript;
                    socket.send(JSON.stringify({
                      type: "user_transcript",
                      text: data.transcript,
                    }));
                    break;

                  case "response.audio_transcript.delta":
                    // AI response transcript (streaming)
                    currentAiTranscript += data.delta;
                    socket.send(JSON.stringify({
                      type: "ai_transcript_delta",
                      text: data.delta,
                    }));
                    break;

                  case "response.audio.delta":
                    // AI audio response (streaming)
                    socket.send(JSON.stringify({
                      type: "audio_response",
                      audio: data.delta,
                    }));
                    break;

                  case "response.done":
                    // Response complete - save to database
                    if (currentUserTranscript && currentAiTranscript) {
                      await saveConversationExchange(
                        supabase!,
                        conversationId!,
                        sessionData!.survey_id,
                        currentUserTranscript,
                        currentAiTranscript,
                        OPENAI_API_KEY
                      );
                      
                      // Reset for next turn
                      currentUserTranscript = "";
                      currentAiTranscript = "";
                    }
                    
                    socket.send(JSON.stringify({
                      type: "response_complete",
                    }));
                    break;

                  case "error":
                    console.error("❌ OpenAI error:", data.error);
                    socket.send(JSON.stringify({
                      type: "error",
                      error: data.error.message || "OpenAI API error",
                    }));
                    break;
                }
                
              } catch (err) {
                console.error("❌ Error processing OpenAI message:", err);
              }
            };

            openaiWs.onerror = (error) => {
              console.error("❌ OpenAI WebSocket error:", error);
              socket.send(JSON.stringify({
                type: "error",
                error: "Connection to AI service failed"
              }));
            };

            openaiWs.onclose = () => {
              console.log("🔌 OpenAI WebSocket closed");
            };

          } catch (error) {
            console.error("❌ Failed to connect to OpenAI Realtime API:", error);
            socket.send(JSON.stringify({
              type: "error",
              error: "Failed to initialize voice AI. Please check your API key and try again.",
            }));
            socket.close();
          }

        } else if (message.type === "audio_input") {
          // Forward audio input from client to OpenAI
          if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
            openaiWs.send(JSON.stringify({
              type: "input_audio_buffer.append",
              audio: message.audio, // Base64 encoded PCM16 audio
            }));
          }
        } else if (message.type === "response.create") {
          // Manual trigger for response (if not using VAD)
          if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
            openaiWs.send(JSON.stringify({
              type: "response.create",
            }));
          }
        } else if (message.type === "conversation.item.truncate") {
          // Interrupt current response
          if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
            openaiWs.send(JSON.stringify({
              type: "response.cancel",
            }));
          }
        }

      } catch (error) {
        console.error("❌ Error processing message:", error);
        socket.send(JSON.stringify({
          type: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        }));
      }
    };

    socket.onerror = (error) => {
      console.error("❌ Client WebSocket error:", error);
    };

    socket.onclose = () => {
      console.log("🔌 Client WebSocket closed");
      // Cleanup OpenAI WebSocket
      if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
        try {
          openaiWs.close();
        } catch (error) {
          console.error("Error closing OpenAI WebSocket:", error);
        }
      }
    };

    return response;

  } catch (error) {
    console.error("❌ WebSocket upgrade error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to upgrade to WebSocket" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Build system prompt for Atlas personality
 */
function buildSystemPrompt(previousResponses: PreviousResponse[], sessionData: SessionData): string {
  const isFirstMessage = !previousResponses || previousResponses.length === 0;
  
  let prompt = `You are Atlas, a compassionate AI conversation guide conducting confidential employee feedback sessions via voice.

Your personality:
- Transparent about being AI (not pretending to be human)
- Warm but professional tone
- VERY CONCISE responses (1-2 sentences maximum) - CRITICAL for voice
- Natural, conversational language (speak like a human friend, not a robot)
- Empathetic and validating
- Ask ONE follow-up question at a time

${isFirstMessage ? `
IMPORTANT - FIRST MESSAGE:
Introduce yourself warmly and briefly:
"Hi, I'm Atlas - an AI here to listen to your thoughts about work. Everything you share is completely confidential and anonymous. What's been on your mind lately?"
` : ''}

Your goals:
- Create a safe space for honest feedback
- Ask thoughtful follow-up questions to dig deeper
- Show empathy by validating feelings
- Guide conversation naturally through work experience
- Keep responses EXTREMELY SHORT for natural voice flow (1-2 sentences max!)
- Use natural speech patterns and contractions (I'm, you're, that's, etc.)
- Avoid lists, bullet points, or structured text - this is voice!

Remember: This is a VOICE conversation. Be brief, warm, and conversational. Think of it as talking to a friend over coffee, not writing an email.`;

  // Add conversation context if available
  if (previousResponses && previousResponses.length > 0) {
    prompt += `\n\nRecent conversation context:\n`;
    previousResponses.forEach((r) => {
      prompt += `\nEmployee: ${r.content}\nAtlas: ${r.ai_response}\n`;
    });
    prompt += `\nContinue this conversation naturally. Reference what they've shared to show you're listening.`;
  }

  return prompt;
}

/**
 * Save conversation exchange to database with sentiment analysis
 */
async function saveConversationExchange(
  supabase: SupabaseClient,
  conversationId: string,
  surveyId: string,
  userContent: string,
  aiResponse: string,
  apiKey: string
): Promise<void> {
  try {
    // Analyze sentiment using OpenAI
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

    console.log("✅ Saved conversation exchange to database");
  } catch (error) {
    console.error("❌ Error saving conversation exchange:", error);
  }
}

/**
 * Analyze sentiment using OpenAI
 */
async function analyzeSentiment(apiKey: string, text: string): Promise<{ sentiment: string; score: number }> {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Fast and cheap for sentiment
        messages: [
          { role: "system", content: "Analyze the sentiment of employee feedback. Reply with only one word: positive, neutral, or negative" },
          { role: "user", content: text }
        ],
        temperature: 0.3,
        max_tokens: 10,
      }),
    });

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    const sentiment = data.choices[0].message.content.toLowerCase().trim();
    const score = sentiment === "positive" ? 75 : sentiment === "negative" ? 25 : 50;
    
    return { sentiment, score };
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    return { sentiment: "neutral", score: 50 };
  }
}
