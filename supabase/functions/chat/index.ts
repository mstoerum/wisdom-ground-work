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
  
  return `
CONVERSATION CONTEXT:
- Topics already discussed: ${discussedThemes.size > 0 ? Array.from(discussedThemes).join(", ") : "None yet"}
- Recent sentiment pattern: ${sentimentPattern.join(" → ")}
- Exchange count: ${previousResponses.length}
${previousResponses.length > 0 ? `- Key points mentioned earlier: "${previousResponses.slice(0, 2).map(r => r.content.substring(0, 60)).join('"; "')}"` : ""}

ADAPTIVE INSTRUCTIONS:
${lastSentiment === "negative" ? 
  "- The employee is sharing challenges. Use empathetic, validating language. Acknowledge their feelings." : ""}
${lastSentiment === "positive" ? 
  "- The employee is positive. Great! Also gently explore if there are any challenges to ensure balanced feedback." : ""}
${discussedThemes.size > 0 && discussedThemes.size < themes?.length ? 
  `- Themes not yet covered: ${themes?.filter((t: any) => !Array.from(discussedThemes).includes(t.name)).map((t: any) => t.name).join(", ")}. Transition naturally to explore these.` : ""}
${previousResponses.length >= 3 ? "- Reference earlier points when relevant to show you're listening and building on what they've shared." : ""}
`;
};

/**
 * Generate system prompt for empathetic AI conversation
 */
const getSystemPrompt = (conversationContext: string, isFirstMessage: boolean): string => {
  const introGuidance = isFirstMessage ? `
IMPORTANT - FIRST MESSAGE PROTOCOL:
Introduce yourself as Atlas, an AI conversation guide. Set expectations and build trust:
- Acknowledge you're AI, not human (transparency builds trust)
- Explain you're here to listen and organize their thoughts (purpose)
- Reassure about anonymity and confidentiality (safety)
- Acknowledge this might feel unusual (metacommunication)
- Keep intro brief (3-4 sentences max), then ask first question

Example first message:
"Hi, I'm Atlas — an AI guide here to help you share your thoughts about work. I'm not a person, and nothing you say here is connected to your name. This might feel a bit different from typical surveys, and that's okay. Let's start with something simple: What's one thing that's been on your mind about work lately?"
` : '';

  return `You are Atlas, a compassionate AI conversation guide conducting confidential employee feedback sessions.

Your personality:
- Transparent about being AI (not pretending to be human)
- Warm but professional tone
- Concise responses (1-2 sentences, max 3)
- Direct questions (no rambling)
- Good at being AI, not imitating humans

Your goals:
- Create a safe, non-judgmental space for honest feedback
- Ask thoughtful follow-up questions to understand nuances
- Show empathy through validation and acknowledgment
- Guide conversation naturally through work experience, challenges, and suggestions
- Probe deeper on important topics without being repetitive
- Recognize emotional cues and respond appropriately
- Reference earlier points naturally when building on topics

${introGuidance}

Conversation flow:
1. Start with open-ended questions about their current experience
2. Explore challenges with curiosity and care
3. Ask about positive aspects to balance the conversation
4. Invite suggestions for improvement
5. Naturally transition between themes after 3-4 exchanges on one topic
6. Naturally conclude when sufficient depth is reached (after 8-12 exchanges)

${conversationContext}

Remember: Your tone should be warm, professional, and genuinely interested in understanding their perspective. Adapt your approach based on their sentiment and what they've already shared.`;
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
 * Analyze sentiment of user message
 */
const analyzeSentiment = async (apiKey: string, userMessage: string): Promise<{ sentiment: string; score: number }> => {
  const sentimentResponse = await callAI(
    apiKey,
    AI_MODEL,
    [
      { role: "system", content: "Analyze sentiment. Reply with only: positive, neutral, or negative" },
      { role: "user", content: userMessage }
    ],
    0.3,
    10
  );

  const sentiment = sentimentResponse.toLowerCase().trim();
  const score = sentiment === "positive" ? 75 : sentiment === "negative" ? 25 : 50;
  
  return { sentiment, score };
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

    const { conversationId, messages, testMode, themes: requestThemeIds } = await req.json();
    const lastMessage = messages[messages.length - 1];

    // Check if this is an auto-triggered introduction request
    const isIntroductionTrigger = lastMessage.content === "[START_CONVERSATION]" && messages.length === 1;
    
    // Input validation (skip for introduction trigger)
    if (!isIntroductionTrigger) {
      validateInput(conversationId, messages, lastMessage.content);
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Check if this is a preview mode conversation
    const isPreviewMode = testMode || conversationId.startsWith("preview-");
    
    if (isPreviewMode) {
      // Handle preview mode without database access
      const turnCount = messages.filter((m: any) => m.role === "user").length;
      const shouldComplete = turnCount >= CONVERSATION_COMPLETE_THRESHOLD;
      
      // Force isFirstMessage=true for introduction trigger
      const isFirstMessage = isIntroductionTrigger || (turnCount === 1 && !messages.some((m: any) => m.role === "assistant"));

      // Fetch theme details if provided (for preview mode)
      let themes: any[] = [];
      if (requestThemeIds && requestThemeIds.length > 0) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const { data } = await supabase
          .from("survey_themes")
          .select("id, name, description")
          .in("id", requestThemeIds);
        
        themes = data || [];
      }

      // Build conversation context with themes for preview
      const conversationContext = buildConversationContext([], themes);
      const systemPrompt = getSystemPrompt(conversationContext, isFirstMessage);

      // Filter out the [START_CONVERSATION] trigger from messages sent to AI
      const filteredMessages = isIntroductionTrigger 
        ? [] 
        : messages.map((m: any) => ({ role: m.role, content: m.content }));

      // Get AI response
      const aiMessage = await callAI(
        LOVABLE_API_KEY,
        AI_MODEL,
        [{ role: "system", content: systemPrompt }, ...filteredMessages],
        0.8,
        200
      );

      return new Response(
        JSON.stringify({ 
          message: aiMessage,
          shouldComplete: shouldComplete 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
    
    // Force isFirstMessage=true for introduction trigger
    const hasExistingAssistantMessages = messages.some((m: any) => m.role === "assistant");
    const isFirstMessage = isIntroductionTrigger || (turnCount === 1 && !hasExistingAssistantMessages);

    // Build conversation context
    const conversationContext = buildConversationContext(previousResponses || [], themes || []);
    const systemPrompt = getSystemPrompt(conversationContext, isFirstMessage);

    // Filter out the [START_CONVERSATION] trigger from messages sent to AI
    const filteredMessages = isIntroductionTrigger 
      ? [] 
      : messages.map((m: any) => ({ role: m.role, content: m.content }));

    // Get AI response
    const aiMessage = await callAI(
      LOVABLE_API_KEY,
      AI_MODEL,
      [{ role: "system", content: systemPrompt }, ...filteredMessages],
      0.8,
      200
    );

    // IMPORTANT: Don't save the [START_CONVERSATION] trigger to database
    if (!isIntroductionTrigger) {
      // Analyze sentiment
      const { sentiment, score: sentimentScore } = await analyzeSentiment(LOVABLE_API_KEY, lastMessage.content);

      // Detect theme
      const detectedThemeId = await detectTheme(LOVABLE_API_KEY, lastMessage.content, themes || []);

      // Detect urgency
      const isUrgent = await detectUrgency(LOVABLE_API_KEY, lastMessage.content);

      // Store response in database
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
          urgency_escalated: isUrgent,
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
    }

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
