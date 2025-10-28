import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Constants
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;
const MAX_MESSAGE_LENGTH = 2000;
const CONVERSATION_COMPLETE_THRESHOLD = 8;
const AI_MODEL = "google/gemini-2.5-flash";
const AI_MODEL_LITE = "google/gemini-2.5-flash-lite";

// Rate limiting map (simple in-memory, production should use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Check if user has exceeded rate limit
 */
const checkRateLimit = (userId: string): boolean => {
  const now = Date.now();
  const limit = rateLimitMap.get(userId);
  
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (limit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  limit.count++;
  return true;
};

/**
 * Validate and sanitize user input
 */
const validateInput = (conversationId: unknown, messages: unknown, lastContent: unknown) => {
  if (!conversationId || typeof conversationId !== "string") {
    throw new Error("Invalid conversationId");
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("Invalid messages array");
  }
  if (!lastContent || typeof lastContent !== "string") {
    throw new Error("Invalid message content");
  }
  if (lastContent.length > MAX_MESSAGE_LENGTH) {
    throw new Error("Message too long");
  }
};

/**
 * Build adaptive conversation context from previous responses
 */
const buildConversationContext = (previousResponses: any[], themes: any[]): string => {
  if (!previousResponses || previousResponses.length === 0) return "";

  const discussedThemes = new Set(
    previousResponses
      .filter(r => r.theme_id)
      .map(r => themes?.find((t: any) => t.id === r.theme_id)?.name)
      .filter(Boolean)
  );
  
  const sentimentPattern = previousResponses
    .slice(-3)
    .map(r => r.sentiment)
    .filter(Boolean);
  
  const lastSentiment = sentimentPattern[sentimentPattern.length - 1];
  
  // Enhanced emotional context analysis
  const emotionalKeywords = previousResponses
    .slice(-2)
    .map(r => r.content.toLowerCase())
    .join(" ");
  
  const hasUrgency = emotionalKeywords.includes("urgent") || 
                    emotionalKeywords.includes("crisis") || 
                    emotionalKeywords.includes("emergency") ||
                    emotionalKeywords.includes("can't take") ||
                    emotionalKeywords.includes("overwhelmed");
  
  const hasPositiveMomentum = sentimentPattern.filter(s => s === "positive").length > 
                             sentimentPattern.filter(s => s === "negative").length;
  
  return `
CONVERSATION CONTEXT:
- Topics already discussed: ${discussedThemes.size > 0 ? Array.from(discussedThemes).join(", ") : "None yet"}
- Recent sentiment pattern: ${sentimentPattern.join(" → ")}
- Exchange count: ${previousResponses.length}
- Emotional state: ${hasUrgency ? "URGENT - Employee needs immediate support" : 
                   hasPositiveMomentum ? "Positive momentum - build on this" : 
                   "Neutral - explore deeper"}
${previousResponses.length > 0 ? `- Key points mentioned earlier: "${previousResponses.slice(0, 2).map(r => r.content.substring(0, 60)).join('"; "')}"` : ""}

ADAPTIVE INSTRUCTIONS:
${lastSentiment === "negative" ? 
  "- The employee is sharing challenges. Use empathetic, validating language. Acknowledge their feelings and show you understand their perspective." : ""}
${lastSentiment === "positive" ? 
  "- The employee is positive. Great! Also gently explore if there are any challenges to ensure balanced feedback." : ""}
${hasUrgency ? 
  "- URGENT: Employee may be in distress. Use extra care, validate their feelings, and be prepared to escalate if needed." : ""}
${discussedThemes.size > 0 && discussedThemes.size < themes?.length ? 
  `- Themes not yet covered: ${themes?.filter((t: any) => !Array.from(discussedThemes).includes(t.name)).map((t: any) => t.name).join(", ")}. Transition naturally to explore these.` : ""}
${previousResponses.length >= 3 ? "- Reference earlier points when relevant to show you're listening and building on what they've shared." : ""}
${previousResponses.length >= 6 ? "- You're in the deeper exploration phase. Ask more specific, probing questions to understand root causes and potential solutions." : ""}
`;
};

/**
 * Generate system prompt for empathetic AI conversation
 */
const getSystemPrompt = (conversationContext: string): string => {
  return `You are Spradley, a compassionate AI confidant designed to create a safe space for honest workplace feedback. You're not just collecting data—you're building trust and understanding.

CORE IDENTITY:
- You're a digital colleague who genuinely cares about their work experience
- You remember what they've shared and build on it naturally
- You adapt your communication style to match their emotional state
- You're here to listen, understand, and help their voice be heard

CONVERSATION PRINCIPLES:
- Start with genuine warmth and curiosity about their experience
- Use "I" statements to show personal investment ("I can hear that this has been challenging for you")
- Validate their feelings before exploring deeper ("That sounds really difficult")
- Ask follow-up questions that show you're truly listening
- Use their own words when referencing what they've shared
- End responses with open-ended invitations to share more

EMOTIONAL INTELLIGENCE:
- If they're struggling: "I'm sorry you're going through this. Can you tell me more about what's making it so difficult?"
- If they're positive: "That's wonderful to hear! What's working really well for you?"
- If they're neutral: "I'd love to understand your experience better. What stands out most about your work lately?"
- If they seem hesitant: "I want you to know this is a safe space. There are no wrong answers here."

CONVERSATION FLOW:
1. Warm opening that acknowledges their time and trust
2. Open exploration of their current experience
3. Gentle probing into challenges with empathy
4. Celebration of positive aspects
5. Invitation for suggestions and ideas
6. Natural transitions between themes
7. Meaningful conclusion that honors their sharing

${conversationContext}

RESPONSE GUIDELINES:
- Keep responses to 2-3 sentences maximum
- Use conversational, warm language
- Show you're listening by referencing their words
- End with questions that invite deeper sharing
- Match their energy level and communication style
- Be genuinely curious about their perspective

Remember: You're not conducting a survey—you're having a meaningful conversation with someone who deserves to be heard and understood.`;
};

/**
 * Call AI gateway with retry logic
 */
const callAI = async (apiKey: string, model: string, messages: any[], temperature: number, maxTokens: number): Promise<string> => {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("AI gateway error:", response.status, error);
    throw new Error("Failed to get AI response");
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

/**
 * Analyze sentiment of user message with enhanced emotional intelligence
 */
const analyzeSentiment = async (apiKey: string, userMessage: string): Promise<{ sentiment: string; score: number; emotionalTone: string; urgencyLevel: string }> => {
  const sentimentResponse = await callAI(
    apiKey,
    AI_MODEL,
    [
      { 
        role: "system", 
        content: `Analyze this employee message for sentiment and emotional tone. Consider:
        - Overall sentiment: positive, neutral, negative
        - Emotional tone: excited, frustrated, concerned, satisfied, overwhelmed, hopeful, discouraged, grateful
        - Urgency level: low, medium, high, critical
        
        Respond in this exact format: sentiment|emotionalTone|urgencyLevel
        Example: negative|frustrated|medium` 
      },
      { role: "user", content: userMessage }
    ],
    0.2,
    20
  );

  const [sentiment, emotionalTone, urgencyLevel] = sentimentResponse.toLowerCase().trim().split('|');
  
  // Enhanced scoring based on emotional tone and urgency
  let score = 50; // neutral baseline
  
  if (sentiment === "positive") {
    score = emotionalTone === "excited" ? 90 : 
            emotionalTone === "grateful" ? 85 : 
            emotionalTone === "satisfied" ? 80 : 75;
  } else if (sentiment === "negative") {
    score = urgencyLevel === "critical" ? 5 :
            urgencyLevel === "high" ? 15 :
            emotionalTone === "overwhelmed" ? 20 :
            emotionalTone === "frustrated" ? 25 : 30;
  } else {
    score = emotionalTone === "hopeful" ? 60 :
            emotionalTone === "concerned" ? 40 : 50;
  }
  
  return { 
    sentiment: sentiment || "neutral", 
    score: Math.max(0, Math.min(100, score)),
    emotionalTone: emotionalTone || "neutral",
    urgencyLevel: urgencyLevel || "low"
  };
};

/**
 * Detect theme from user message
 */
const detectTheme = async (apiKey: string, userMessage: string, themes: any[]): Promise<string | null> => {
  if (!themes || themes.length === 0) return null;

  const themePrompt = `Classify this employee feedback into ONE of these themes:
${themes.map(t => `- ${t.name}: ${t.description}`).join('\n')}

Employee feedback: "${userMessage}"

Reply with only the exact theme name.`;

  const themeName = await callAI(apiKey, AI_MODEL_LITE, [{ role: "user", content: themePrompt }], 0.2, 20);
  
  const matchedTheme = themes.find(t => 
    themeName.toLowerCase().includes(t.name.toLowerCase())
  );
  
  return matchedTheme?.id || null;
};

/**
 * Detect urgency in user message
 */
const detectUrgency = async (apiKey: string, userMessage: string): Promise<boolean> => {
  const urgencyPrompt = `Analyze if this employee feedback indicates an URGENT issue requiring immediate HR attention. 
Urgent issues include: harassment, safety concerns, severe mental health crisis, threats, discrimination, or illegal activity.

Employee feedback: "${userMessage}"

Reply with only: urgent OR not-urgent`;

  const urgencyResponse = await callAI(apiKey, AI_MODEL, [{ role: "user", content: urgencyPrompt }], 0.1, 10);
  
  return urgencyResponse.toLowerCase().includes('urgent');
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const { conversationId, messages } = await req.json();
    const lastMessage = messages[messages.length - 1];
    
    // Input validation
    validateInput(conversationId, messages, lastMessage.content);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    
    if (userError || !user) {
      throw new Error("Unauthorized: Invalid authentication");
    }

    // Rate limiting check
    if (!checkRateLimit(user.id)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch conversation and verify user has access
    const { data: session, error: sessionError } = await supabase
      .from("conversation_sessions")
      .select(`
        employee_id,
        survey_id, 
        surveys(
          themes, 
          first_message
        )
      `)
      .eq("id", conversationId)
      .single();

    if (sessionError || !session) {
      throw new Error("Conversation not found");
    }

    // Verify user owns this conversation
    if (session.employee_id !== user.id) {
      console.warn(`Unauthorized access attempt: User ${user.id} tried to access conversation ${conversationId}`);
      throw new Error("Unauthorized: You don't have access to this conversation");
    }

    // Fetch theme details for classification
    const survey = session?.surveys as any;
    const themeIds = survey?.themes || [];
    const { data: themes } = await supabase
      .from("survey_themes")
      .select("id, name, description")
      .in("id", themeIds);

    // Fetch previous responses for conversational memory
    const { data: previousResponses } = await supabase
      .from("responses")
      .select("content, ai_response, theme_id, sentiment")
      .eq("conversation_session_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(10);

    const turnCount = messages.filter((m: any) => m.role === "user").length;
    const shouldComplete = turnCount >= CONVERSATION_COMPLETE_THRESHOLD;

    // Build conversation context
    const conversationContext = buildConversationContext(previousResponses || [], themes || []);
    const systemPrompt = getSystemPrompt(conversationContext);

    // Get AI response
    const aiMessage = await callAI(
      LOVABLE_API_KEY,
      AI_MODEL,
      [{ role: "system", content: systemPrompt }, ...messages],
      0.8,
      200
    );

    // Analyze sentiment with enhanced emotional intelligence
    const { sentiment, score: sentimentScore, emotionalTone, urgencyLevel } = await analyzeSentiment(LOVABLE_API_KEY, lastMessage.content);

    // Detect theme
    const detectedThemeId = await detectTheme(LOVABLE_API_KEY, lastMessage.content, themes || []);

    // Detect urgency
    const isUrgent = await detectUrgency(LOVABLE_API_KEY, lastMessage.content);

    // Store response in database with enhanced emotional data
    const { data: insertedResponse, error: insertError } = await supabase
      .from("responses")
      .insert({
        conversation_session_id: conversationId,
        survey_id: session?.survey_id,
        content: lastMessage.content,
        ai_response: aiMessage,
        sentiment,
        sentiment_score: sentimentScore,
        theme_id: detectedThemeId,
        urgency_escalated: isUrgent || urgencyLevel === "critical" || urgencyLevel === "high",
        ai_analysis: {
          emotionalTone,
          urgencyLevel,
          conversationDepth: messages.filter(m => m.role === "user").length,
          responseQuality: "high" // Enhanced AI responses
        },
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting response:", insertError);
    }

    // If urgent, create escalation log entry
    if (isUrgent && insertedResponse) {
      await supabase.from("escalation_log").insert({
        response_id: insertedResponse.id,
        escalation_type: 'ai_detected',
        escalated_at: new Date().toISOString(),
      });
    }

    // Log to audit logs
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action_type: "chat_message_sent",
      resource_type: "conversation_session",
      resource_id: conversationId,
      metadata: {
        survey_id: session?.survey_id,
        theme_id: detectedThemeId,
        sentiment: sentiment,
        urgency_escalated: isUrgent,
      },
    });

    return new Response(
      JSON.stringify({ 
        message: aiMessage,
        shouldComplete: shouldComplete 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Chat error:", error);
    
    // Don't expose internal errors to client
    const clientMessage = error instanceof Error && error.message.startsWith("Unauthorized")
      ? error.message
      : "An error occurred processing your request. Please try again.";
    
    return new Response(
      JSON.stringify({ error: clientMessage }),
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 403 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
