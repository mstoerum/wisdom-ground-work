import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Gemini Live API WebSocket proxy for voice conversations
 * Provides bidirectional audio streaming with Google's Gemini Live API
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
    let isPreviewMode = false;

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

          // Check if preview mode
          isPreviewMode = conversationId?.startsWith("preview-") || false;

          if (!isPreviewMode) {
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
          }

          // Get API key
          const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
          
          if (!GEMINI_API_KEY) {
            console.log("No GEMINI_API_KEY, using fallback mode");
            socket.send(JSON.stringify({
              type: "ready",
              message: "Connected (text fallback mode)",
              mode: "fallback",
            }));
            return;
          }

          try {
            // Connect to Gemini Live API
            const geminiUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;
            
            geminiWs = new WebSocket(geminiUrl);

            geminiWs.onopen = () => {
              console.log("Connected to Gemini Live API");
              
              // Configure Gemini session
              const config = {
                setup: {
                  model: "models/gemini-2.0-flash-exp",
                  generation_config: {
                    response_modalities: ["AUDIO"],
                    speech_config: {
                      voice_config: {
                        prebuilt_voice_config: {
                          voice_name: "Kore" // Warm, empathetic female voice
                        }
                      }
                    }
                  },
                  system_instruction: {
                    parts: [{
                      text: `You are Atlas, a compassionate AI conversation guide conducting confidential employee feedback sessions via voice.

Your personality:
- Transparent about being AI (not pretending to be human)
- Warm but professional tone
- Concise responses (1-2 sentences, max 3) - CRITICAL for voice conversations
- Natural, conversational language (avoid bullet points, lists, or structured text)
- Good at being AI, not imitating humans

Your goals:
- Create a safe space for honest feedback
- Ask thoughtful follow-up questions
- Show empathy through validation
- Guide conversation naturally through work experience
- Keep responses SHORT for voice (1-2 sentences max)
- Use natural speech patterns, not written text

Remember: You're having a VOICE conversation. Be brief, natural, and conversational. Show empathy and acknowledge emotions.`
                    }]
                  }
                }
              };

              geminiWs!.send(JSON.stringify(config));
              
              socket.send(JSON.stringify({
                type: "ready",
                message: "Connected to Gemini Live API",
                mode: "live",
              }));
            };

            geminiWs.onmessage = async (geminiEvent) => {
              try {
                const data = JSON.parse(geminiEvent.data);
                console.log("Gemini event:", data);

                // Handle server content (AI responses)
                if (data.serverContent) {
                  const parts = data.serverContent.modelTurn?.parts || [];
                  
                  for (const part of parts) {
                    // Audio response
                    if (part.inlineData?.mimeType === "audio/pcm") {
                      socket.send(JSON.stringify({
                        type: "audio_response",
                        audio: part.inlineData.data,
                      }));
                    }
                    
                    // Text transcript (for display)
                    if (part.text) {
                      socket.send(JSON.stringify({
                        type: "transcript_assistant",
                        text: part.text,
                      }));

                      // Store in database if not preview mode
                      if (!isPreviewMode && supabase && conversationId) {
                        // We'll store the last user message and this response
                        // This is a simplified version - you may want to batch these
                      }
                    }
                  }

                  // Mark turn complete
                  if (data.serverContent.turnComplete) {
                    socket.send(JSON.stringify({
                      type: "turn_complete",
                    }));
                  }
                }

                // Handle setup complete
                if (data.setupComplete) {
                  console.log("Gemini setup complete");
                }

              } catch (error) {
                console.error("Error processing Gemini message:", error);
              }
            };

            geminiWs.onerror = (error) => {
              console.error("Gemini WebSocket error:", error);
              socket.send(JSON.stringify({
                type: "error",
                error: "Gemini connection error",
              }));
            };

            geminiWs.onclose = () => {
              console.log("Gemini WebSocket closed");
              socket.send(JSON.stringify({
                type: "gemini_disconnected",
              }));
            };

          } catch (error) {
            console.error("Failed to connect to Gemini:", error);
            socket.send(JSON.stringify({
              type: "error",
              error: "Failed to connect to Gemini Live API",
            }));
          }

        } else if (message.type === "audio_chunk") {
          // Forward audio chunk to Gemini
          if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
            const audioMessage = {
              realtimeInput: {
                mediaChunks: [{
                  mimeType: "audio/pcm",
                  data: message.audio,
                }]
              }
            };
            
            geminiWs.send(JSON.stringify(audioMessage));
          } else {
            console.log("Gemini WebSocket not ready, buffering audio");
          }

        } else if (message.type === "interrupt") {
          // User interrupted - send interrupt signal to Gemini
          if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
            // Gemini Live API handles interruptions automatically
            console.log("User interrupted conversation");
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
