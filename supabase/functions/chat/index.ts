import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getSystemPromptForSurveyType, buildConversationContextForType, type SurveyType } from "./context-prompts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Constants
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;
const MAX_MESSAGE_LENGTH = 2000;
const MIN_EXCHANGES = 4; // Minimum exchanges for meaningful conversation
const MAX_EXCHANGES = 20; // Maximum exchanges to prevent overly long conversations
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
 * Sanitize user input to prevent injection attacks
 */
const sanitizeContent = (content: string): string => {
  // Remove potential HTML/script tags
  let sanitized = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Detect and reject excessive special characters (potential injection attempts)
  const specialCharCount = (sanitized.match(/[<>{}[\]\\|`]/g) || []).length;
  if (specialCharCount > 10) {
    throw new Error("Message contains invalid characters");
  }
  
  return sanitized.trim();
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
  
  // Sanitize content
  const sanitized = sanitizeContent(lastContent);
  if (sanitized.length === 0) {
    throw new Error("Message cannot be empty after sanitization");
  }
  
  return sanitized;
};

/**
 * Determine if themes have been adequately explored
 * Returns true if conversation should complete based on theme coverage
 */
const shouldCompleteBasedOnThemes = (
  previousResponses: any[],
  themes: any[],
  turnCount: number
): boolean => {
  if (!themes || themes.length === 0) {
    // No themes specified - use exchange count as fallback
    return turnCount >= 8 && turnCount <= MAX_EXCHANGES;
  }

  // Need minimum exchanges for meaningful conversation
  if (turnCount < MIN_EXCHANGES) {
    return false;
  }

  // Cap at maximum to prevent overly long conversations
  if (turnCount >= MAX_EXCHANGES) {
    return true;
  }

  // Count unique themes discussed
  const discussedThemeIds = new Set(
    previousResponses
      .filter(r => r.theme_id)
      .map(r => r.theme_id)
      .filter(Boolean)
  );

  const discussedCount = discussedThemeIds.size;
  const totalThemes = themes.length;

  // Calculate coverage percentage
  const coveragePercent = totalThemes > 0 ? (discussedCount / totalThemes) * 100 : 0;

  // Count exchanges per theme (for depth check)
  const themeExchangeCounts = new Map<string, number>();
  previousResponses.forEach(r => {
    if (r.theme_id) {
      themeExchangeCounts.set(r.theme_id, (themeExchangeCounts.get(r.theme_id) || 0) + 1);
    }
  });
  
  const avgExchangesPerTheme = discussedCount > 0 
    ? Array.from(themeExchangeCounts.values()).reduce((a, b) => a + b, 0) / discussedCount 
    : 0;

  // Completion criteria:
  // 1. At least 60% theme coverage AND average 2+ exchanges per theme
  // 2. OR 80%+ theme coverage (even if some themes are light)
  // 3. OR all themes covered with at least 1 exchange each
  const hasGoodCoverage = coveragePercent >= 60 && avgExchangesPerTheme >= 2;
  const hasHighCoverage = coveragePercent >= 80;
  const allThemesTouched = discussedCount >= totalThemes && turnCount >= totalThemes;

  // Also check if we have sufficient depth (at least 6 exchanges and good coverage)
  const hasSufficientDepth = turnCount >= 6 && (hasGoodCoverage || hasHighCoverage);

  return hasSufficientDepth || allThemesTouched;
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

  const uncoveredThemes = themes?.filter((t: any) => !discussedThemeIds.has(t.id)) || [];
  const isNearCompletion = shouldCompleteBasedOnThemes(previousResponses, themes || [], previousResponses.length);
  
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
  `- Themes not yet covered: ${uncoveredThemes.map((t: any) => t.name).join(", ")}. Transition naturally to explore these.` : ""}
${isNearCompletion && previousResponses.length >= MIN_EXCHANGES ? 
  `- You have gathered good insights across ${discussedThemeIds.size} themes. Start moving toward a natural conclusion. Ask if there's anything else important they'd like to share, then thank them warmly.` : ""}
${previousResponses.length >= 3 ? "- Reference earlier points when relevant to show you're listening and building on what they've shared." : ""}
${previousResponses.length < MIN_EXCHANGES ? "- Continue exploring to gather sufficient depth. Ask thoughtful follow-up questions." : ""}
`;
};

/**
 * Generate system prompt for empathetic AI conversation
 */
const getSystemPrompt = (conversationContext: string, isFirstMessage: boolean): string => {
  const introGuidance = isFirstMessage ? `
IMPORTANT - FIRST MESSAGE PROTOCOL:
Introduce yourself as Spradley, an AI conversation guide. Set expectations and build trust:
- Acknowledge you're AI, not human (transparency builds trust)
- Explain you're here to listen and organize their thoughts (purpose)
- Reassure about anonymity and confidentiality (safety)
- Acknowledge this might feel unusual (metacommunication)
- Keep intro brief (3-4 sentences max), then ask first question

Example first message:
"Hi, I'm Spradley — an AI guide here to help you share your thoughts about work. I'm not a person, and nothing you say here is connected to your name. This might feel a bit different from typical surveys, and that's okay. Let's start with something simple: What's one thing that's been on your mind about work lately?"
` : '';

  return `You are Spradley, a compassionate AI conversation guide conducting confidential employee feedback sessions.

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
5. Naturally transition between themes after 2-3 exchanges on one topic
6. Adaptively conclude when themes are adequately explored:
   - Minimum 4 exchanges for meaningful conversation
   - Aim for 60%+ theme coverage with 2+ exchanges per theme, OR 80%+ coverage
   - All themes should be touched on if possible
   - Maximum 20 exchanges to prevent overly long conversations
   - When near completion, ask if there's anything else important, then thank warmly

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
    const { conversationId, messages, testMode, themes: requestThemeIds, finishEarly, themeCoverage, isFinalResponse } = await req.json();
    
    // Get authorization header (optional for preview/demo mode)
    const authHeader = req.headers.get("authorization");
    const lastMessage = messages[messages.length - 1];

    // Check if this is an auto-triggered introduction request
    const isIntroductionTrigger = lastMessage.content === "[START_CONVERSATION]" && messages.length === 1;
    
    // Input validation (skip for introduction trigger)
    let sanitizedContent = lastMessage.content;
    if (!isIntroductionTrigger) {
      sanitizedContent = validateInput(conversationId, messages, lastMessage.content);
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Check if this is a preview mode conversation
    const isPreviewMode = testMode || conversationId.startsWith("preview-");
    
     if (isPreviewMode) {
      // Handle preview mode without database access
      const turnCount = messages.filter((m: any) => m.role === "user").length;
      
      // Handle finish early request
      if (finishEarly) {
        const summaryPrompt = `You've been conducting a conversation with a participant. They want to finish early (${Math.round(themeCoverage || 0)}% theme coverage, ${turnCount} exchanges).

Summarize what they've shared so far in 2-3 sentences, then either:
1. Ask ONE final important question that would help get a clearer picture of their experience (if coverage < 60%), OR
2. Ask if there's anything else they'd like to add (if coverage >= 60%)

Be warm and appreciative. Keep it brief.`;

        const summaryMessage = await callAI(
          LOVABLE_API_KEY,
          AI_MODEL,
          [
            { role: "system", content: summaryPrompt },
            ...messages.map((m: any) => ({ role: m.role, content: m.content }))
          ],
          0.7,
          150
        );

        // Extract final question if present
        const finalQuestionMatch = summaryMessage.match(/(?:question|ask|wondering)[^.]*[?]/i);
        const finalQuestion = finalQuestionMatch ? finalQuestionMatch[0] : null;

        return new Response(
          JSON.stringify({ 
            message: summaryMessage,
            finalQuestion: finalQuestion || null,
            shouldComplete: false
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Handle final response
      if (isFinalResponse) {
        const finalResponsePrompt = `The participant has finished sharing. Acknowledge their final response warmly and thank them for their time. Keep it brief (1-2 sentences).`;

        const finalMessage = await callAI(
          LOVABLE_API_KEY,
          AI_MODEL,
          [
            { role: "system", content: finalResponsePrompt },
            ...messages.map((m: any) => ({ role: m.role, content: m.content }))
          ],
          0.7,
          100
        );

        return new Response(
          JSON.stringify({ 
            message: finalMessage,
            shouldComplete: true
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Build mock previousResponses for theme-based completion check
      const mockResponses = messages
        .filter((m: any, idx: number) => m.role === "user" && idx > 0) // Skip intro
        .map((m: any, idx: number) => ({
          content: m.content,
          theme_id: null, // In preview, we don't have theme detection
          sentiment: null
        }));
      
      const shouldComplete = shouldCompleteBasedOnThemes(mockResponses, themes || [], turnCount);
      
      // Force isFirstMessage=true for introduction trigger
      const isFirstMessage = isIntroductionTrigger || (turnCount === 1 && !messages.some((m: any) => m.role === "assistant"));

      // Fetch theme details if provided (for preview mode)
      let themes: any[] = [];
      let surveyType: SurveyType = "employee_satisfaction";
      
      if (requestThemeIds && requestThemeIds.length > 0) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const { data } = await supabase
          .from("survey_themes")
          .select("id, name, description, survey_type")
          .in("id", requestThemeIds);
        
        themes = data || [];
        // Detect survey type from themes
        if (themes.length > 0) {
          surveyType = themes[0].survey_type || "employee_satisfaction";
        }
      }

      // Build context-aware prompt based on survey type
      const conversationContext = buildConversationContextForType(surveyType, [], themes);
      const systemPrompt = getSystemPromptForSurveyType(surveyType, themes, conversationContext);

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

    // Verify user authentication (required for non-preview mode)
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }
    
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
    
    // Handle finish early request
    if (finishEarly) {
      const coveragePercent = themeCoverage || 0;
      const summaryPrompt = `You've been conducting a conversation with a participant. They want to finish early (${Math.round(coveragePercent)}% theme coverage, ${turnCount} exchanges).

Summarize what they've shared so far in 2-3 sentences, then either:
1. Ask ONE final important question that would help get a clearer picture of their experience (if coverage < 60%), OR
2. Ask if there's anything else they'd like to add (if coverage >= 60%)

Be warm and appreciative. Keep it brief.`;

      const summaryMessage = await callAI(
        LOVABLE_API_KEY,
        AI_MODEL,
        [
          { role: "system", content: summaryPrompt },
          ...messages.map((m: any) => ({ role: m.role, content: m.content }))
        ],
        0.7,
        150
      );

      // Extract final question if present (look for question mark)
      const sentences = summaryMessage.split(/[.!?]+/).filter(s => s.trim());
      const questionSentence = sentences.find((s: string) => {
        const trimmed = s.trim();
        return trimmed.endsWith('?') && trimmed.length > 20;
      });
      const finalQuestion = questionSentence ? questionSentence.trim() : null;

      return new Response(
        JSON.stringify({ 
          message: summaryMessage,
          finalQuestion: finalQuestion || null,
          shouldComplete: false
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle final response
    if (isFinalResponse) {
      const finalResponsePrompt = `The participant has finished sharing. Acknowledge their final response warmly and thank them for their time. Keep it brief (1-2 sentences).`;

      const finalMessage = await callAI(
        LOVABLE_API_KEY,
        AI_MODEL,
        [
          { role: "system", content: finalResponsePrompt },
          ...messages.map((m: any) => ({ role: m.role, content: m.content }))
        ],
        0.7,
        100
      );

      // Save final response if not introduction trigger
      if (!isIntroductionTrigger && sanitizedContent) {
        const { sentiment, score: sentimentScore } = await analyzeSentiment(LOVABLE_API_KEY, sanitizedContent);
        const detectedThemeId = await detectTheme(LOVABLE_API_KEY, sanitizedContent, themes || []);

        await supabase.from("responses").insert({
          conversation_session_id: conversationId,
          survey_id: session?.survey_id,
          content: sanitizedContent,
          ai_response: finalMessage,
          sentiment,
          sentiment_score: sentimentScore,
          theme_id: detectedThemeId,
          created_at: new Date().toISOString(),
        });
      }

      return new Response(
        JSON.stringify({ 
          message: finalMessage,
          shouldComplete: true
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Determine completion based on theme exploration, not just exchange count
    const shouldComplete = shouldCompleteBasedOnThemes(previousResponses || [], themes || [], turnCount);
    
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
      // Analyze sentiment (use sanitized content)
      const { sentiment, score: sentimentScore } = await analyzeSentiment(LOVABLE_API_KEY, sanitizedContent);

      // Detect theme (use sanitized content)
      const detectedThemeId = await detectTheme(LOVABLE_API_KEY, sanitizedContent, themes || []);

      // Detect urgency (use sanitized content)
      const isUrgent = await detectUrgency(LOVABLE_API_KEY, sanitizedContent);

      // Store response in database (use sanitized content)
      const { data: insertedResponse, error: insertError } = await supabase
        .from("responses")
        .insert({
          conversation_session_id: conversationId,
          survey_id: session?.survey_id,
          content: sanitizedContent,
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
