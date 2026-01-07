import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getSystemPromptForSurveyType, buildConversationContextForType, type SurveyType } from "./context-prompts.ts";
import { selectFirstQuestion } from "./first-questions.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Constants
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;
const PREVIEW_RATE_LIMIT_MAX_REQUESTS = 5; // Stricter limit for unauthenticated preview mode
const PREVIEW_RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_MESSAGE_LENGTH = 2000;
const MIN_EXCHANGES = 4; // Minimum exchanges for meaningful conversation
const MAX_EXCHANGES = 20; // Maximum exchanges to prevent overly long conversations
const AI_MODEL = "google/gemini-2.5-flash";
const AI_MODEL_LITE = "google/gemini-2.5-flash-lite";

// Rate limiting map (simple in-memory, production should use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const previewRateLimitMap = new Map<string, { count: number; resetTime: number }>();

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
 * Check rate limit for preview/unauthenticated requests (IP-based, stricter)
 */
const checkPreviewRateLimit = (identifier: string): boolean => {
  const now = Date.now();
  const limit = previewRateLimitMap.get(identifier);
  
  if (!limit || now > limit.resetTime) {
    previewRateLimitMap.set(identifier, { count: 1, resetTime: now + PREVIEW_RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (limit.count >= PREVIEW_RATE_LIMIT_MAX_REQUESTS) {
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
 * Build theme progress data for frontend visualization
 * Now includes depth tracking for each theme based on exploration level
 */
const buildThemeProgress = (
  previousResponses: any[],
  themes: any[],
  currentThemeId: string | null
): {
  themes: Array<{ id: string; name: string; discussed: boolean; current: boolean; depth: number }>;
  coveragePercent: number;
  discussedCount: number;
  totalCount: number;
} => {
  const discussedThemeIds = new Set(
    previousResponses
      .filter(r => r.theme_id)
      .map(r => r.theme_id)
      .filter(Boolean)
  );

  // Count exchanges per theme for depth calculation
  const themeExchangeCounts = new Map<string, number>();
  previousResponses.forEach(r => {
    if (r.theme_id) {
      themeExchangeCounts.set(r.theme_id, (themeExchangeCounts.get(r.theme_id) || 0) + 1);
    }
  });

  // Calculate depth for each theme (0-100)
  // - First mention: 25%
  // - Each additional exchange: +20%
  // - Maximum: 100%
  const calculateDepth = (themeId: string): number => {
    const exchangeCount = themeExchangeCounts.get(themeId) || 0;
    if (exchangeCount === 0) return 0;
    
    // Initial mention = 25%, each additional = +20%, capped at 100%
    const depth = Math.min(100, 25 + (exchangeCount - 1) * 20);
    return depth;
  };

  const themeProgress = themes.map(t => ({
    id: t.id,
    name: t.name,
    discussed: discussedThemeIds.has(t.id),
    current: t.id === currentThemeId,
    depth: calculateDepth(t.id),
  }));

  const discussedCount = discussedThemeIds.size;
  const totalCount = themes.length;
  const coveragePercent = totalCount > 0 ? (discussedCount / totalCount) * 100 : 0;

  return {
    themes: themeProgress,
    coveragePercent,
    discussedCount,
    totalCount,
  };
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
  "- The employee is sharing challenges. Ask specific follow-up questions to understand what happened and what would help." : ""}
${lastSentiment === "positive" ? 
  "- The employee is positive. Great! Also explore if there are any areas for improvement to ensure balanced feedback." : ""}
${uncoveredThemes.length > 0 && previousResponses.length < 10 ? 
  `- Themes not yet covered: ${uncoveredThemes.map((t: any) => t.name).join(", ")}. Transition naturally to explore these.` : ""}
${isNearCompletion && previousResponses.length >= MIN_EXCHANGES ? 
  `- You have gathered good insights across ${discussedThemeIds.size} themes. Start moving toward a natural conclusion. Ask if there's anything else important they'd like to share, then thank them warmly.` : ""}
${previousResponses.length >= 3 ? "- Reference earlier points when relevant to build on what they've shared." : ""}
${previousResponses.length < MIN_EXCHANGES ? "- Continue exploring to gather sufficient depth. Ask specific follow-up questions to get concrete examples." : ""}
`;
};

/**
 * Generate system prompt for constructive AI conversation
 */
const getSystemPrompt = (conversationContext: string, isFirstMessage: boolean, surveyType?: SurveyType, firstQuestion?: string): string => {
  const isCourseEvaluation = surveyType === "course_evaluation";
  const context = isCourseEvaluation ? "your learning experience" : "how things are going at work";
  
  const introGuidance = isFirstMessage ? `
IMPORTANT - FIRST MESSAGE PROTOCOL:
Start with this warm, brief introduction and first question:

"Hi, I'm Spradley. Thanks for taking a few minutes to chat about ${context}.

${firstQuestion || "How have things been feeling lately?"}"

CRITICAL RULES FOR FIRST MESSAGE:
- Do NOT mention being an AI or not being a person
- Do NOT explain anonymity or confidentiality in the intro
- Do NOT ask open-ended questions like "tell me about your experience"
- Do NOT use scale-based questions (1-10)
- DO ask the specific feeling-focused first question above
- Keep the intro to 2 sentences max before the question
` : '';

  return `You are Spradley, a conversation guide conducting feedback sessions.

Your personality:
- Warm and genuine in your interactions
- Direct and conversational
- Concise responses (1-2 sentences, max 3)
- Focused on gathering constructive feedback
- Professional but approachable tone

Your goals:
- Guide the conversation through different themes systematically
- Ask thoughtful follow-up questions to understand specifics
- Explore both positive aspects and areas for improvement
- Ensure all relevant themes are covered
- Gather actionable feedback through constructive dialogue
- Reference earlier points naturally when building on topics

${introGuidance}

Conversation flow:
1. Start with the provided first question - a feeling-focused question
2. Explore themes systematically - aim for 2-3 exchanges per theme
3. Ask specific follow-up questions to get concrete examples
4. Balance positive feedback with constructive suggestions
5. Transition naturally between themes after adequate depth
6. Adaptively conclude when themes are adequately explored:
   - Minimum 4 exchanges for meaningful conversation
   - Aim for 60%+ theme coverage with 2+ exchanges per theme, OR 80%+ coverage
   - All themes should be touched on if possible
   - Maximum 20 exchanges to prevent overly long conversations
   - When near completion, ask if there's anything else important, then thank warmly

${conversationContext}

Remember: Focus on constructive dialogue and systematic theme exploration. Keep responses concise and direct.`;
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
    const { conversationId, messages, testMode, themes: requestThemeIds, finishEarly, themeCoverage, isFinalResponse, isCompletionConfirmation, firstMessage: requestFirstMessage } = await req.json();
    
    // Validate required fields
    if (!conversationId || typeof conversationId !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid or missing conversationId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid or empty messages array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get authorization header (optional for preview/demo mode)
    const authHeader = req.headers.get("authorization");
    const lastMessage = messages[messages.length - 1];

    // Check if this is an auto-triggered introduction request
    const isIntroductionTrigger = lastMessage?.content === "[START_CONVERSATION]" && messages.length === 1;
    
    // Input validation (skip for introduction trigger)
    let sanitizedContent = lastMessage?.content || "";
    if (!isIntroductionTrigger && lastMessage) {
      sanitizedContent = validateInput(conversationId, messages, lastMessage.content);
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Check if this is a preview mode conversation
    const isPreviewMode = testMode || (conversationId && typeof conversationId === 'string' && conversationId.startsWith("preview-"));
    
     if (isPreviewMode) {
      // Apply stricter IP-based rate limiting for unauthenticated preview requests
      const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                       req.headers.get("x-real-ip") || 
                       "unknown";
      const rateLimitKey = `preview_${clientIP}_${conversationId.substring(0, 20)}`;
      
      if (!checkPreviewRateLimit(rateLimitKey)) {
        console.warn(`Preview rate limit exceeded for: ${clientIP}`);
        return new Response(
          JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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
      
      // Fetch theme details first (must be before usage in preview mode)
      let themes: any[] = [];
      let surveyType: SurveyType = "employee_satisfaction";
      
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
      
      // Fetch themes if provided
      if (requestThemeIds && Array.isArray(requestThemeIds) && requestThemeIds.length > 0) {
        try {
          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          const { data, error } = await supabase
            .from("survey_themes")
            .select("id, name, description, survey_type")
            .in("id", requestThemeIds);
          
          if (!error && data) {
            themes = data;
            // Detect survey type from themes
            if (themes.length > 0) {
              surveyType = themes[0].survey_type || "employee_satisfaction";
            }
          }
        } catch (error) {
          console.error("Error fetching themes in preview mode:", error);
          // Continue with empty themes - not critical for preview
        }
      }

      // Build context-aware prompt based on survey type
      const conversationContext = buildConversationContextForType(surveyType, [], themes);
      let systemPrompt = getSystemPromptForSurveyType(surveyType, themes, conversationContext);
      
      // If firstMessage is provided and this is an introduction, use it as the initial message
      // Otherwise, generate a warm, feeling-focused first message
      if (isIntroductionTrigger) {
        // Build initial theme progress for preview mode
        const initialThemeProgress = buildThemeProgress([], themes, null);
        
        if (requestFirstMessage) {
          // Use the provided first message directly
          return new Response(
            JSON.stringify({ 
              message: requestFirstMessage,
              shouldComplete: false,
              themeProgress: initialThemeProgress
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          // Generate warm first message with feeling-focused question based on themes
          const firstQuestion = selectFirstQuestion(themes || [], surveyType);
          const context = surveyType === "course_evaluation" ? "your learning experience" : "how things are going at work";
          const warmFirstMessage = `Hi, I'm Spradley. Thanks for taking a few minutes to chat about ${context}.\n\n${firstQuestion}`;
          return new Response(
            JSON.stringify({ 
              message: warmFirstMessage,
              shouldComplete: false,
              themeProgress: initialThemeProgress
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

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

      // For preview mode, estimate which theme is being discussed based on exchange count
      const previewThemeProgress = buildThemeProgress(
        mockResponses, 
        themes, 
        themes[Math.min(turnCount, themes.length - 1)]?.id || null
      );

      return new Response(
        JSON.stringify({ 
          message: aiMessage,
          shouldComplete: shouldComplete,
          themeProgress: previewThemeProgress
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if this is a public link conversation (before requiring auth)
    const { data: sessionCheck } = await supabase
      .from("conversation_sessions")
      .select("public_link_id, employee_id")
      .eq("id", conversationId)
      .single();

    const isPublicLinkSession = sessionCheck?.public_link_id !== null;

    // Verify user authentication (required for non-public-link mode)
    let userId: string | null = null;

    if (!isPublicLinkSession) {
      if (!authHeader) {
        throw new Error("Missing authorization header");
      }
      
      const { data: { user }, error: userError } = await supabase.auth.getUser(
        authHeader.replace("Bearer ", "")
      );
      
      if (userError || !user) {
        throw new Error("Unauthorized: Invalid authentication");
      }
      
      userId = user.id;
    } else {
      // Public link - use anonymous access
      userId = sessionCheck?.employee_id || null;
      console.log("Public link conversation - allowing anonymous access");
    }

    // Rate limiting check (use conversationId for public links)
    const rateLimitKey = isPublicLinkSession ? conversationId : userId!;
    if (!checkRateLimit(rateLimitKey)) {
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
        public_link_id,
        surveys(
          themes,
          first_message,
          survey_type,
          title,
          description
        )
      `)
      .eq("id", conversationId)
      .single();

    if (sessionError || !session) {
      throw new Error("Conversation not found");
    }

    // Verify user owns this conversation (skip for public links)
    if (!isPublicLinkSession && session.employee_id !== userId) {
      console.warn(`Unauthorized access attempt: User ${userId} tried to access conversation ${conversationId}`);
      throw new Error("Unauthorized: You don't have access to this conversation");
    }

    // Fetch theme details for classification
    const survey = session?.surveys as any;
    const themeIds = survey?.themes || [];
    const surveyType: SurveyType = survey?.survey_type || "employee_satisfaction";
    const surveyFirstMessage = survey?.first_message;
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
    
    // Handle user responding to completion confirmation
    if (isCompletionConfirmation) {
      const userResponse = sanitizedContent.toLowerCase();
      const wantsToAddMore = userResponse.match(/\b(yes|yeah|sure|actually|wait)\b/);
      
      if (wantsToAddMore) {
        // User wants to add more - continue conversation
        const continuePrompt = "Of course! What would you like to add?";
        return new Response(
          JSON.stringify({
            message: continuePrompt,
            shouldComplete: false,
            isCompletionPrompt: false
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // User says no/nothing OR clicked "Complete Survey" button (empty content)
        // Save their final response only if it has meaningful content
        if (sanitizedContent.length > 3 && !isIntroductionTrigger) {
          const { sentiment, score: sentimentScore } = await analyzeSentiment(LOVABLE_API_KEY, sanitizedContent);
          const detectedThemeId = await detectTheme(LOVABLE_API_KEY, sanitizedContent, themes || []);

          await supabase.from("responses").insert({
            conversation_session_id: conversationId,
            survey_id: session?.survey_id,
            content: sanitizedContent,
            ai_response: "Thank you for your time and insights.",
            sentiment,
            sentiment_score: sentimentScore,
            theme_id: detectedThemeId,
            created_at: new Date().toISOString(),
          });
        }

        // Return final thank you message
        return new Response(
          JSON.stringify({
            message: "Thank you for your time and valuable insights. Your feedback will help create meaningful change.",
            shouldComplete: true,
            showSummary: true
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
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

    // Handle user responding to completion confirmation
    if (isCompletionConfirmation) {
      const userResponse = sanitizedContent.toLowerCase();
      const wantsToAddMore = userResponse.match(/\b(yes|yeah|sure|actually|wait)\b/);
      
      if (wantsToAddMore) {
        // User wants to add more - continue conversation
        const continuePrompt = "Of course! What would you like to add?";
        return new Response(
          JSON.stringify({
            message: continuePrompt,
            shouldComplete: false,
            isCompletionPrompt: false
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // User says no/nothing OR clicked "Complete Survey" button (empty content)
        // Save their final response only if it has meaningful content
        if (sanitizedContent.length > 3 && !isIntroductionTrigger) {
          const { sentiment, score: sentimentScore } = await analyzeSentiment(LOVABLE_API_KEY, sanitizedContent);
          const detectedThemeId = await detectTheme(LOVABLE_API_KEY, sanitizedContent, themes || []);

          await supabase.from("responses").insert({
            conversation_session_id: conversationId,
            survey_id: session?.survey_id,
            content: sanitizedContent,
            ai_response: "Thank you for your time and insights.",
            sentiment,
            sentiment_score: sentimentScore,
            theme_id: detectedThemeId,
            created_at: new Date().toISOString(),
          });
        }

        // Return final thank you message
        return new Response(
          JSON.stringify({
            message: "Thank you for your time and valuable insights. Your feedback will help create meaningful change.",
            shouldComplete: true,
            showSummary: true
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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

        console.log(`[${conversationId}] Saving preview final response...`);
        const { error: previewInsertError } = await supabase.from("responses").insert({
          conversation_session_id: conversationId,
          survey_id: session?.survey_id,
          content: sanitizedContent,
          ai_response: finalMessage,
          sentiment,
          sentiment_score: sentimentScore,
          theme_id: detectedThemeId,
          created_at: new Date().toISOString(),
        });

        if (previewInsertError) {
          console.error(`[${conversationId}] Warning: Failed to save preview final response:`, previewInsertError);
        }
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
    
    // Check if user is confirming completion
    const userConfirmingCompletion = sanitizedContent.toLowerCase().match(/\b(yes|yeah|sure|ok|okay|done|finished|that'?s all|nothing else|no|nope)\b/);
    
    // Natural completion flow: AI detected completion + user confirms
    if (shouldComplete && !isFinalResponse && !isIntroductionTrigger) {
      // Generate conversation summary
      const conversationContext = previousResponses?.map(r => r.content).join("\n") || "";
      const summaryPrompt = `Based on this conversation about ${surveyType === 'course_evaluation' ? 'course evaluation' : 'workplace feedback'}, create a brief summary (2-3 sentences) of the key points the participant discussed: ${conversationContext}`;
      
      const summary = await callAI(
        LOVABLE_API_KEY,
        AI_MODEL_LITE,
        [
          { role: "system", content: "You summarize conversations concisely and accurately." },
          { role: "user", content: summaryPrompt }
        ],
        0.5,
        150
      );
      
      return new Response(
        JSON.stringify({
          message: `Thank you for sharing your thoughts. Let me summarize what we discussed:\n\n${summary}\n\nIs there anything you'd like to add or clarify before we finish?`,
          shouldComplete: false,
          isCompletionPrompt: true
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // User responds to completion prompt with confirmation
    if (messages.some((m: any) => m.content?.includes("Is there anything you'd like to add or clarify")) && userConfirmingCompletion) {
      // Save final confirmation response if has content
      if (sanitizedContent && !isIntroductionTrigger) {
        const { sentiment, score: sentimentScore } = await analyzeSentiment(LOVABLE_API_KEY, sanitizedContent);
        const detectedThemeId = await detectTheme(LOVABLE_API_KEY, sanitizedContent, themes || []);

        console.log("Attempting to insert final completion response:", {
          conversationId,
          surveyId: session?.survey_id,
          content: sanitizedContent
        });

        console.log(`[${conversationId}] Saving final completion response...`);
        const { data: finalInserted, error: finalInsertError } = await supabase.from("responses").insert({
          conversation_session_id: conversationId,
          survey_id: session?.survey_id,
          content: sanitizedContent,
          ai_response: "Thank you for your time and insights.",
          sentiment,
          sentiment_score: sentimentScore,
          theme_id: detectedThemeId,
          created_at: new Date().toISOString(),
        })
        .select();

        if (finalInsertError) {
          console.error(`[${conversationId}] CRITICAL: Failed to save final response:`, {
            error: finalInsertError,
            code: finalInsertError.code,
            message: finalInsertError.message,
          });
          
          // Return error to frontend
          return new Response(
            JSON.stringify({ 
              error: "Failed to save final response. Please try again.",
              details: finalInsertError.message 
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`[${conversationId}] ✅ Final response saved successfully:`, {
          responseId: finalInserted?.[0]?.id,
        });
      }

      return new Response(
        JSON.stringify({
          message: "Thank you for your time and valuable insights. Your feedback will help create meaningful change.",
          shouldComplete: true,
          showSummary: true
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Force isFirstMessage=true for introduction trigger
    const hasExistingAssistantMessages = messages.some((m: any) => m.role === "assistant");
    const isFirstMessage = isIntroductionTrigger || (turnCount === 1 && !hasExistingAssistantMessages);

    // If this is an introduction trigger, handle first message
    if (isIntroductionTrigger) {
      const surveyFirstMessageText = survey?.first_message;
      
      if (surveyFirstMessageText) {
        // Use the provided first message directly
        return new Response(
          JSON.stringify({ 
            message: surveyFirstMessageText,
            shouldComplete: false
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // Generate warm first message with feeling-focused question based on themes
        const firstQuestion = selectFirstQuestion(themes || [], surveyType);
        const context = surveyType === "course_evaluation" ? "your learning experience" : "how things are going at work";
        const warmFirstMessage = `Hi, I'm Spradley. Thanks for taking a few minutes to chat about ${context}.\n\n${firstQuestion}`;
        
        return new Response(
          JSON.stringify({ 
            message: warmFirstMessage,
            shouldComplete: false
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Build conversation context
    const conversationContext = buildConversationContext(previousResponses || [], themes || []);
    const systemPromptWithContext = getSystemPromptForSurveyType(
      surveyType,
      themes || [],
      conversationContext
    );
    
    // Prepend first message if available
    const systemPrompt = surveyFirstMessage 
      ? `${surveyFirstMessage}\n\n${systemPromptWithContext}`
      : systemPromptWithContext;

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
      console.log("Attempting to insert response:", {
        conversationId,
        surveyId: session?.survey_id,
        hasContent: !!sanitizedContent,
        hasAiMessage: !!aiMessage,
        sentiment,
        themeId: detectedThemeId
      });

      console.log(`[${conversationId}] Attempting to save response to database...`);
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
        console.error(`[${conversationId}] CRITICAL: Failed to save response:`, {
          error: insertError,
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          surveyId: session?.survey_id,
          conversationId,
          hasPublicLink: !!session?.public_link_id,
          isAnonymous: !userId,
        });
        
        // Return error to frontend so user knows there's a problem
        return new Response(
          JSON.stringify({ 
            error: "Failed to save your response. Please try again.",
            details: insertError.message,
            aiMessage: aiMessage // Still show the AI response
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[${conversationId}] ✅ Response saved successfully:`, {
        responseId: insertedResponse?.id,
        theme: detectedThemeId,
        sentiment,
      });

      // SPRINT 1: Real-time LLM-powered analysis
      if (insertedResponse?.id) {
        try {
          console.log(`[${conversationId}] Running LLM analysis on response...`);
          
          const analysisResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: AI_MODEL_LITE,
              messages: [
                {
                  role: "system",
                  content: "You analyze employee feedback to extract urgency, themes, and sentiment indicators."
                },
                {
                  role: "user",
                  content: `Analyze this feedback: "${sanitizedContent}"\n\nAvailable themes: ${themes?.map((t: any) => `${t.id}:${t.name}`).join(", ")}`
                }
              ],
              tools: [
                {
                  type: "function",
                  function: {
                    name: "analyze_response",
                    description: "Extract urgency score, themes, and sentiment from employee feedback",
                    parameters: {
                      type: "object",
                      properties: {
                        urgency_score: {
                          type: "integer",
                          description: "Urgency level from 1-5 where 1=routine, 2=minor concern, 3=notable issue, 4=serious problem, 5=critical/urgent",
                          enum: [1, 2, 3, 4, 5]
                        },
                        urgency_reason: {
                          type: "string",
                          description: "Brief explanation of why this urgency level was assigned"
                        },
                        detected_themes: {
                          type: "array",
                          items: { type: "string" },
                          description: "Array of theme IDs that are relevant to this response"
                        },
                        key_sentiment_indicators: {
                          type: "array",
                          items: { type: "string" },
                          description: "Phrases or words that reveal the person's sentiment"
                        },
                        suggested_followup: {
                          type: "string",
                          description: "A specific follow-up question that could deepen understanding"
                        }
                      },
                      required: ["urgency_score", "urgency_reason", "detected_themes", "key_sentiment_indicators", "suggested_followup"],
                      additionalProperties: false
                    }
                  }
                }
              ],
              tool_choice: { type: "function", function: { name: "analyze_response" } }
            }),
          });

          if (analysisResponse.ok) {
            const analysisData = await analysisResponse.json();
            const toolCall = analysisData.choices[0]?.message?.tool_calls?.[0];
            
            if (toolCall?.function?.arguments) {
              const analysis = JSON.parse(toolCall.function.arguments);
              
              console.log(`[${conversationId}] LLM analysis complete:`, {
                urgency_score: analysis.urgency_score,
                urgency_reason: analysis.urgency_reason
              });

              // Update response with analysis results
              const { error: updateError } = await supabase
                .from("responses")
                .update({
                  urgency_score: analysis.urgency_score,
                  ai_analysis: analysis
                })
                .eq("id", insertedResponse.id);

              if (updateError) {
                console.error(`[${conversationId}] Failed to update response with analysis:`, updateError);
              } else {
                console.log(`[${conversationId}] ✅ Response enriched with LLM analysis`);
              }
            }
          } else {
            console.error(`[${conversationId}] LLM analysis failed:`, await analysisResponse.text());
          }
        } catch (analysisError) {
          console.error(`[${conversationId}] Error during LLM analysis:`, analysisError);
          // Don't fail the whole request if analysis fails
        }
      }

      // If urgent, create escalation log entry
      if (isUrgent && insertedResponse) {
        console.log(`[${conversationId}] Urgent issue detected, logging escalation...`);
        const { error: escalationError } = await supabase.from("escalation_log").insert({
          response_id: insertedResponse.id,
          escalation_type: 'ai_detected',
          escalated_at: new Date().toISOString(),
        });

        if (escalationError) {
          console.error(`[${conversationId}] Failed to log escalation:`, escalationError);
        } else {
          console.log(`[${conversationId}] ✅ Escalation logged successfully`);
        }
      }

      // Log to audit logs (only for authenticated users)
      if (userId) {
        await supabase.from("audit_logs").insert({
          user_id: userId,
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
    }

    // Build theme progress - for non-introduction messages, re-fetch the latest detected theme
    // For introduction trigger, just use previous responses
    let currentThemeId: string | null = null;
    let updatedResponses: any[] = previousResponses || [];
    
    if (!isIntroductionTrigger) {
      // Get the most recent response's theme_id (we just inserted it)
      const { data: latestResponse } = await supabase
        .from("responses")
        .select("theme_id")
        .eq("conversation_session_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      currentThemeId = latestResponse?.theme_id || null;
      
      // Re-fetch all responses to get accurate progress
      const { data: allResponses } = await supabase
        .from("responses")
        .select("theme_id")
        .eq("conversation_session_id", conversationId);
      
      updatedResponses = allResponses || [];
    }
    
    const themeProgress = buildThemeProgress(
      updatedResponses,
      themes || [],
      currentThemeId
    );

    return new Response(
      JSON.stringify({ 
        message: aiMessage,
        shouldComplete: shouldComplete,
        themeProgress
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
