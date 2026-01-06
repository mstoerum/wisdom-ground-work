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
  theme_id?: string | null;
  sentiment?: string | null;
}

interface Theme {
  id: string;
  name: string;
  description: string;
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
    let themes: Theme[] = [];

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

          // Fetch theme details for classification (same as chat function)
          const survey = session?.surveys as any;
          const themeIds = survey?.themes || [];
          const { data: themesData } = await supabase
            .from("survey_themes")
            .select("id, name, description")
            .in("id", themeIds);

          themes = themesData || [];

          // Load conversation context with theme information
          const { data: previousResponses } = await supabase
            .from("responses")
            .select("content, ai_response, theme_id, sentiment")
            .eq("conversation_session_id", conversationId)
            .order("created_at", { ascending: true })
            .limit(10);

          const systemPrompt = buildSystemPrompt(previousResponses || [], sessionData, themes);

          console.log("🔌 Creating ephemeral session token...");
          
          try {
            // Step 1: Create ephemeral session via REST API
            const sessionResponse = await fetch("https://api.openai.com/v1/realtime/sessions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "gpt-realtime",
                voice: "alloy",
              }),
            });

            if (!sessionResponse.ok) {
              const errorText = await sessionResponse.text();
              console.error("❌ Failed to create session:", sessionResponse.status, errorText);
              socket.send(JSON.stringify({
                type: "error",
                error: `Failed to initialize voice AI: ${sessionResponse.status}`,
              }));
              socket.close();
              return;
            }

            const sessionData = await sessionResponse.json();
            const ephemeralToken = sessionData.client_secret?.value;

            if (!ephemeralToken) {
              console.error("❌ No ephemeral token in response");
              socket.send(JSON.stringify({
                type: "error",
                error: "Failed to get session token from OpenAI",
              }));
              socket.close();
              return;
            }

            console.log("✅ Ephemeral token created");

            // Step 2: Connect to WebSocket using ephemeral token
            const model = "gpt-realtime";
            const openaiWsUrl = `wss://api.openai.com/v1/realtime?model=${model}`;
            
            console.log("🔌 Connecting to OpenAI Realtime API with ephemeral token...");
            
            openaiWs = new WebSocket(openaiWsUrl, {
              headers: {
                "Authorization": `Bearer ${ephemeralToken}`,
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
                    threshold: 0.5, // More sensitive to detect speech earlier, less likely to miss quiet speaking
                    prefix_padding_ms: 500, // Capture more audio at the start, preventing word cutoff
                    silence_duration_ms: 3000, // Allow 3-second pauses for thinking and natural breathing
                  },
                  temperature: 0.8,
                  max_response_output_tokens: "inf", // Remove token limit to allow unlimited AI responses
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
                    // Response complete - save to database with theme detection
                    if (currentUserTranscript && currentAiTranscript) {
                      // Detect theme (same logic as chat function)
                      const detectedThemeId = await detectTheme(
                        OPENAI_API_KEY,
                        currentUserTranscript,
                        themes || []
                      );
                      
                      await saveConversationExchange(
                        supabase!,
                        conversationId!,
                        sessionData!.survey_id,
                        currentUserTranscript,
                        currentAiTranscript,
                        OPENAI_API_KEY,
                        detectedThemeId
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
        } else if (message.type === "interrupt") {
          // Handle interruption from client
          console.log('⚠️ Client requested interruption');
          
          if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
            openaiWs.send(JSON.stringify({
              type: "response.cancel",
            }));
            
            // Clear transcripts
            currentUserTranscript = "";
            currentAiTranscript = "";
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
 * Build conversation context from previous responses (same as chat function)
 */
function buildConversationContext(previousResponses: PreviousResponse[], themes: Theme[]): string {
  if (!previousResponses || previousResponses.length === 0) return "";

  const discussedThemes = new Set(
    previousResponses
      .filter(r => r.theme_id)
      .map(r => themes?.find((t: Theme) => t.id === r.theme_id)?.name)
      .filter(Boolean)
  );
  
  const discussedThemeIds = new Set(
    previousResponses
      .filter(r => r.theme_id)
      .map(r => r.theme_id)
      .filter(Boolean)
  );

  const sentimentPattern = previousResponses
    .slice(-3)
    .map(r => r.sentiment)
    .filter(Boolean);
  
  const lastSentiment = sentimentPattern[sentimentPattern.length - 1];
  
  const totalThemes = themes?.length || 0;
  const coveragePercent = totalThemes > 0 
    ? (discussedThemeIds.size / totalThemes) * 100 
    : 0;

  // Count exchanges per theme
  const themeExchangeCounts = new Map<string, number>();
  previousResponses.forEach(r => {
    if (r.theme_id) {
      themeExchangeCounts.set(r.theme_id, (themeExchangeCounts.get(r.theme_id) || 0) + 1);
    }
  });
  const avgExchangesPerTheme = discussedThemeIds.size > 0
    ? Array.from(themeExchangeCounts.values()).reduce((a, b) => a + b, 0) / discussedThemeIds.size
    : 0;

  const uncoveredThemes = themes?.filter((t: Theme) => !discussedThemeIds.has(t.id)) || [];
  
  // Simple completion check for voice chat (theme-aware)
  const MIN_EXCHANGES = 4;
  const MAX_EXCHANGES = 20;
  const hasGoodCoverage = coveragePercent >= 60 && avgExchangesPerTheme >= 2;
  const hasHighCoverage = coveragePercent >= 80;
  const allThemesTouched = discussedThemeIds.size >= totalThemes && previousResponses.length >= totalThemes;
  const isNearCompletion = previousResponses.length >= MIN_EXCHANGES && 
    (hasGoodCoverage || hasHighCoverage || allThemesTouched) &&
    previousResponses.length < MAX_EXCHANGES;
  
  return `
CONVERSATION CONTEXT:
- Topics already discussed: ${discussedThemes.size > 0 ? Array.from(discussedThemes).join(", ") : "None yet"}
- Theme coverage: ${discussedThemeIds.size} of ${totalThemes} themes (${Math.round(coveragePercent)}%)
- Average depth per theme: ${avgExchangesPerTheme.toFixed(1)} exchanges
- Recent sentiment pattern: ${sentimentPattern.join(" → ")}
- Exchange count: ${previousResponses.length}
${previousResponses.length > 0 ? `- Key points mentioned earlier: "${previousResponses.slice(0, 2).map(r => r.content.substring(0, 60)).join('"; "')}"` : ""}

ADAPTIVE INSTRUCTIONS:
${lastSentiment === "negative" ? 
  "- The employee is sharing challenges. Use empathetic, validating language. Acknowledge their feelings." : ""}
${lastSentiment === "positive" ? 
  "- The employee is positive. Great! Also gently explore if there are any challenges to ensure balanced feedback." : ""}
${uncoveredThemes.length > 0 && previousResponses.length < 10 ? 
  `- Themes not yet covered: ${uncoveredThemes.map((t: Theme) => t.name).join(", ")}. Transition naturally to explore these.` : ""}
${isNearCompletion ? 
  `- You have gathered good insights across ${discussedThemeIds.size} themes. Start moving toward a natural conclusion. Ask if there's anything else important they'd like to share, then thank them warmly.` : ""}
${previousResponses.length >= 3 ? "- Reference earlier points when relevant to show you're listening and building on what they've shared." : ""}
${previousResponses.length < MIN_EXCHANGES ? "- Continue exploring to gather sufficient depth. Ask thoughtful follow-up questions." : ""}
`;
}

/**
 * Build system prompt for Spradley personality (matches chat function)
 */
function buildSystemPrompt(previousResponses: PreviousResponse[], sessionData: SessionData, themes: Theme[]): string {
  const isFirstMessage = !previousResponses || previousResponses.length === 0;
  const survey = sessionData?.surveys as any;
  const firstMessage = survey?.first_message || "";
  
  const conversationContext = buildConversationContext(previousResponses, themes);
  
  // Select a feeling-focused first question based on primary theme
  const primaryTheme = themes && themes.length > 0 ? themes[0] : null;
  const defaultFirstQuestion = primaryTheme 
    ? getFirstQuestionForTheme(primaryTheme.name)
    : "How have things been feeling at work lately?";
  
  const introGuidance = isFirstMessage ? `
IMPORTANT - FIRST MESSAGE PROTOCOL:
${firstMessage ? `Use this as your opening: "${firstMessage}"` : `Start with this warm, brief introduction:

"Hi, I'm Spradley. Thanks for taking a few minutes to chat about how things are going at work. ${defaultFirstQuestion}"`}

CRITICAL RULES FOR FIRST MESSAGE:
- Do NOT mention being an AI or not being a person
- Do NOT explain anonymity or confidentiality in the intro
- Do NOT ask open-ended questions like "what's been on your mind"
- Do NOT use scale-based questions (1-10)
- DO ask the specific feeling-focused first question
- Keep the intro to 2 sentences max before the question
` : '';

  // Build theme guidance
  const themeGuidance = themes && themes.length > 0 ? `
THEMES TO EXPLORE:
${themes.map((t: Theme) => `- ${t.name}: ${t.description}`).join('\n')}

Guide the conversation naturally through these themes. After 2-3 exchanges on one topic, transition to explore other themes. Don't force it - make it feel natural.

Adaptive completion: Conclude when themes are adequately explored:
- Minimum 4 exchanges for meaningful conversation
- Aim for 60%+ theme coverage with 2+ exchanges per theme, OR 80%+ coverage
- All themes should be touched on if possible
- Maximum 20 exchanges to prevent overly long conversations
- When near completion, ask if there's anything else important, then thank warmly
` : '';

  return `You are Spradley, a compassionate conversation guide conducting confidential employee feedback sessions via voice.

Your personality:
- Warm and genuine in your interactions
- Focus on listening, not explaining yourself
- VERY CONCISE responses (1-2 sentences maximum) - CRITICAL for voice
- Natural, conversational language (speak like a human friend, not a robot)
- Empathetic and validating
- Ask ONE follow-up question at a time

${introGuidance}

Your goals:
- Create a safe, non-judgmental space for honest feedback
- Ask thoughtful follow-up questions to understand nuances
- Show empathy through validation and acknowledgment
- Guide conversation naturally through work experience, challenges, and suggestions
- Probe deeper on important topics without being repetitive
- Recognize emotional cues and respond appropriately
- Reference earlier points naturally when building on topics
- Keep responses EXTREMELY SHORT for natural voice flow (1-2 sentences max!)
- Use natural speech patterns and contractions (I'm, you're, that's, etc.)
- Avoid lists, bullet points, or structured text - this is voice!

Conversation flow:
1. Start with the provided feeling-focused first question
2. Explore challenges with curiosity and care
3. Ask about positive aspects to balance the conversation
4. Invite suggestions for improvement
5. Naturally transition between themes after 2-3 exchanges on one topic
6. Adaptively conclude when themes are adequately explored

${themeGuidance}

${conversationContext}

Remember: Your tone should be warm and genuinely interested in understanding their perspective. Adapt your approach based on their sentiment and what they've already shared. This is a VOICE conversation - be brief, warm, and conversational.`;
}

/**
 * Get a feeling-focused first question based on theme name
 */
function getFirstQuestionForTheme(themeName: string): string {
  const themeKey = themeName.toLowerCase().replace(/\s+/g, "-");
  
  const themeQuestions: Record<string, string> = {
    "work-satisfaction": "When you think about heading to work, what's the first feeling that comes up?",
    "work-life-balance": "When you leave work at the end of the day, how easy is it to switch off?",
    "team-collaboration": "How connected do you feel to the people you work with right now?",
    "career-growth": "When you imagine where you'll be in a year, how does that make you feel?",
    "leadership": "How supported do you feel by those leading your team?",
    "culture": "How comfortable do you feel being yourself at work?",
    "compensation": "How do you feel about the recognition you receive for your work?",
    "communication": "How clear do things feel at work right now?",
    "recognition": "When was the last time you felt genuinely appreciated at work?",
    "workload": "How manageable does your workload feel right now?"
  };
  
  // Try exact match first
  if (themeQuestions[themeKey]) {
    return themeQuestions[themeKey];
  }
  
  // Try partial match
  for (const [key, question] of Object.entries(themeQuestions)) {
    if (themeKey.includes(key) || key.includes(themeKey)) {
      return question;
    }
  }
  
  return "How have things been feeling at work lately?";
}

/**
 * Detect theme from user message (same as chat function)
 */
async function detectTheme(apiKey: string, userMessage: string, themes: Theme[]): Promise<string | null> {
  if (!themes || themes.length === 0) return null;

  try {
    const themePrompt = `Classify this employee feedback into ONE of these themes:
${themes.map(t => `- ${t.name}: ${t.description}`).join('\n')}

Employee feedback: "${userMessage}"

Reply with only the exact theme name.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: themePrompt }],
        temperature: 0.2,
        max_tokens: 20,
      }),
    });

    if (!response.ok) {
      console.error("Theme detection failed:", response.status);
      return null;
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    const themeName = data.choices[0].message.content.trim();
    
    const matchedTheme = themes.find(t => 
      themeName.toLowerCase().includes(t.name.toLowerCase())
    );
    
    return matchedTheme?.id || null;
  } catch (error) {
    console.error("Error detecting theme:", error);
    return null;
  }
}

/**
 * Save conversation exchange to database with sentiment analysis and theme detection
 */
async function saveConversationExchange(
  supabase: SupabaseClient,
  conversationId: string,
  surveyId: string,
  userContent: string,
  aiResponse: string,
  apiKey: string,
  themeId?: string | null
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
      theme_id: themeId || null,
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
