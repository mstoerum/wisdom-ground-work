import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getSystemPromptForSurveyType, buildConversationContextForType, type SurveyType } from "../chat/context-prompts.ts";
import { selectFirstQuestion, getMoodAdaptiveResponse } from "../chat/first-questions.ts";

declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Constants
const RATE_LIMIT_WINDOW_MS = 60000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const PREVIEW_RATE_LIMIT_MAX_REQUESTS = 5;
const PREVIEW_RATE_LIMIT_WINDOW_MS = 60000;
const MAX_MESSAGE_LENGTH = 2000;
const AI_MODEL = "google/gemini-2.5-flash";
const AI_MODEL_LITE = "google/gemini-2.5-flash-lite";

// Duration → target exchanges mapping
const DURATION_TARGETS: Record<number, { targetExchanges: number; halfwayPoint: number }> = {
  5: { targetExchanges: 5, halfwayPoint: 3 },
  10: { targetExchanges: 10, halfwayPoint: 5 },
  15: { targetExchanges: 15, halfwayPoint: 8 },
};

// Rate limiting maps
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const previewRateLimitMap = new Map<string, { count: number; resetTime: number }>();

const checkRateLimit = (userId: string): boolean => {
  const now = Date.now();
  const limit = rateLimitMap.get(userId);
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (limit.count >= RATE_LIMIT_MAX_REQUESTS) return false;
  limit.count++;
  return true;
};

const checkPreviewRateLimit = (identifier: string): boolean => {
  const now = Date.now();
  const limit = previewRateLimitMap.get(identifier);
  if (!limit || now > limit.resetTime) {
    previewRateLimitMap.set(identifier, { count: 1, resetTime: now + PREVIEW_RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (limit.count >= PREVIEW_RATE_LIMIT_MAX_REQUESTS) return false;
  limit.count++;
  return true;
};

const sanitizeContent = (content: string): string => {
  let sanitized = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  const specialCharCount = (sanitized.match(/[<>{}[\]\\|`]/g) || []).length;
  if (specialCharCount > 10) {
    throw new Error("Message contains invalid characters");
  }
  return sanitized.trim();
};

const validateInput = (conversationId: unknown, messages: unknown, lastContent: unknown) => {
  if (!conversationId || typeof conversationId !== "string") throw new Error("Invalid conversationId");
  if (!Array.isArray(messages) || messages.length === 0) throw new Error("Invalid messages array");
  if (!lastContent || typeof lastContent !== "string") throw new Error("Invalid message content");
  if ((lastContent as string).length > MAX_MESSAGE_LENGTH) throw new Error("Message too long");
  const sanitized = sanitizeContent(lastContent as string);
  if (sanitized.length === 0) throw new Error("Message cannot be empty after sanitization");
  return sanitized;
};

const callAI = async (apiKey: string, model: string, messages: any[], temperature: number, maxTokens: number): Promise<string> => {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
  });
  if (!response.ok) {
    const error = await response.text();
    console.error("AI gateway error:", response.status, error);
    throw new Error("Failed to get AI response");
  }
  const data = await response.json();
  return data.choices[0].message.content;
};

const analyzeSentiment = async (apiKey: string, userMessage: string): Promise<{ sentiment: string; score: number }> => {
  const sentimentResponse = await callAI(
    apiKey, AI_MODEL_LITE,
    [{ role: "system", content: "Analyze sentiment. Reply with only: positive, neutral, or negative" }, { role: "user", content: userMessage }],
    0.3, 10
  );
  const sentiment = sentimentResponse.toLowerCase().trim();
  const score = sentiment === "positive" ? 75 : sentiment === "negative" ? 25 : 50;
  return { sentiment, score };
};

const detectTheme = async (apiKey: string, userMessage: string, themes: any[]): Promise<string | null> => {
  if (!themes || themes.length === 0) return null;
  const themePrompt = `Classify this employee feedback into ONE of these themes:\n${themes.map(t => `- ${t.name}: ${t.description}`).join('\n')}\n\nEmployee feedback: "${userMessage}"\n\nReply with only the exact theme name.`;
  const themeName = await callAI(apiKey, AI_MODEL_LITE, [{ role: "user", content: themePrompt }], 0.2, 20);
  const matchedTheme = themes.find(t => themeName.toLowerCase().includes(t.name.toLowerCase()));
  return matchedTheme?.id || null;
};

const detectUrgency = async (apiKey: string, userMessage: string): Promise<boolean> => {
  const urgencyPrompt = `Analyze if this employee feedback indicates an URGENT issue requiring immediate HR attention. Urgent issues include: harassment, safety concerns, severe mental health crisis, threats, discrimination, or illegal activity.\n\nEmployee feedback: "${userMessage}"\n\nReply with only: urgent OR not-urgent`;
  const urgencyResponse = await callAI(apiKey, AI_MODEL_LITE, [{ role: "user", content: urgencyPrompt }], 0.1, 10);
  return urgencyResponse.toLowerCase().includes('urgent');
};

const parseStructuredResponse = (aiMessage: string): { empathy: string | null; question: string; raw: string } => {
  try {
    let cleaned = aiMessage.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(cleaned);
    if (parsed.question) return { empathy: parsed.empathy || null, question: parsed.question, raw: aiMessage };
  } catch (e) {
    const jsonMatch = aiMessage.match(/\{[\s\S]*"question"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.question) return { empathy: parsed.empathy || null, question: parsed.question, raw: aiMessage };
      } catch (_) {}
    }
    const questionMatch = aiMessage.match(/"question"\s*:\s*"([^"]+)/);
    if (questionMatch && questionMatch[1]) {
      const empathyMatch = aiMessage.match(/"empathy"\s*:\s*"([^"]+)"/);
      const question = questionMatch[1].replace(/["\}]+$/, '').trim();
      if (question.length > 5) return { empathy: empathyMatch ? empathyMatch[1] : null, question, raw: aiMessage };
    }
  }
  if (aiMessage.includes('{') || aiMessage.includes('"question"')) {
    return { empathy: null, question: "Thank you for sharing. Could you tell me a bit more about that?", raw: aiMessage };
  }
  return { empathy: null, question: aiMessage.trim(), raw: aiMessage };
};

const buildThemeProgress = (previousResponses: any[], themes: any[], currentThemeId: string | null) => {
  const discussedThemeIds = new Set(previousResponses.filter(r => r.theme_id).map(r => r.theme_id).filter(Boolean));
  const themeExchangeCounts = new Map<string, number>();
  previousResponses.forEach(r => {
    if (r.theme_id) themeExchangeCounts.set(r.theme_id, (themeExchangeCounts.get(r.theme_id) || 0) + 1);
  });
  const calculateDepth = (themeId: string): number => {
    const exchangeCount = themeExchangeCounts.get(themeId) || 0;
    if (exchangeCount === 0) return 0;
    return Math.min(100, 25 + (exchangeCount - 1) * 20);
  };
  const themeProgress = themes.map(t => ({
    id: t.id, name: t.name, discussed: discussedThemeIds.has(t.id), current: t.id === currentThemeId, depth: calculateDepth(t.id),
  }));
  const discussedCount = discussedThemeIds.size;
  const totalCount = themes.length;
  const coveragePercent = totalCount > 0 ? (discussedCount / totalCount) * 100 : 0;
  return { themes: themeProgress, coveragePercent, discussedCount, totalCount };
};

/**
 * Time-aware completion logic for chat-v2
 */
const shouldCompleteBasedOnTime = (turnCount: number, targetExchanges: number): boolean => {
  if (turnCount < 3) return false;
  if (turnCount >= targetExchanges + 2) return true;
  if (turnCount >= targetExchanges) return true;
  return false;
};

/**
 * Build conversation context with time-aware pacing
 */
const buildTimedConversationContext = (
  previousResponses: any[],
  themes: any[],
  targetExchanges: number,
  selectedThemeId: string | null,
  surveyType: SurveyType
): string => {
  const turnCount = previousResponses.length;
  const remaining = targetExchanges - turnCount;

  const discussedThemeIds = new Set(
    previousResponses.filter(r => r.theme_id).map(r => r.theme_id).filter(Boolean)
  );
  const discussedThemes = new Set(
    previousResponses
      .filter(r => r.theme_id)
      .map(r => themes?.find((t: any) => t.id === r.theme_id)?.name)
      .filter(Boolean)
  );

  const sentimentPattern = previousResponses.slice(-3).map(r => r.sentiment).filter(Boolean);
  const lastSentiment = sentimentPattern[sentimentPattern.length - 1];

  let pacingInstruction = '';
  if (remaining <= 2) {
    pacingInstruction = '- We are near the end. Start wrapping up naturally. Ask if there is anything else important, then thank them warmly.';
  } else if (remaining <= 4) {
    pacingInstruction = '- We are approaching the final stretch. Focus on the most important remaining topics.';
  }

  let themeFocus = '';
  if (selectedThemeId) {
    const selectedTheme = themes.find(t => t.id === selectedThemeId);
    if (selectedTheme) {
      themeFocus = `- The participant chose to explore "${selectedTheme.name}" in more depth. Focus your questions on this theme for the next 2-3 exchanges.`;
    }
  }

  const uncoveredThemes = themes.filter((t: any) => !discussedThemeIds.has(t.id));

  return `
CONVERSATION CONTEXT:
- Exchange ${turnCount} of ~${targetExchanges} target
- Remaining exchanges: ~${Math.max(0, remaining)}
- Topics discussed: ${discussedThemes.size > 0 ? Array.from(discussedThemes).join(", ") : "None yet"}
- Recent sentiment: ${sentimentPattern.join(" → ") || "none"}
${previousResponses.length > 0 ? `- Key points mentioned earlier: "${previousResponses.slice(0, 2).map(r => r.content.substring(0, 60)).join('"; "')}"` : ""}

PACING RULES:
- You have approximately ${Math.max(0, remaining)} exchanges left
- Each theme should get 1-3 exchanges depending on remaining time
- If running low on time, prioritize depth over breadth
- Transition between themes naturally but efficiently
${pacingInstruction}
${themeFocus}

ADAPTIVE INSTRUCTIONS:
${lastSentiment === "negative" ? "- The employee is sharing challenges. Ask specific follow-up questions to understand what happened and what would help." : ""}
${lastSentiment === "positive" ? "- The employee is positive. Great! Also explore if there are any areas for improvement." : ""}
${uncoveredThemes.length > 0 && remaining > 3 && !selectedThemeId ? `- Themes not yet covered: ${uncoveredThemes.map((t: any) => t.name).join(", ")}. Transition naturally.` : ""}
${previousResponses.length >= 3 ? "- Reference earlier points when relevant to build on what they've shared." : ""}
`;
};

/**
 * Generate structured summary from conversation
 */
const generateStructuredSummary = async (
  apiKey: string,
  previousResponses: any[],
  surveyType: SurveyType
): Promise<{ keyPoints: string[]; sentiment: string; opening?: string }> => {
  const conversationContext = previousResponses.map(r => r.content).filter(Boolean).join("\n");
  const fallback = { keyPoints: ["Thank you for sharing your feedback"], sentiment: "mixed" };

  try {
    const summaryResponse = await callAI(
      apiKey, AI_MODEL_LITE,
      [
        { role: "system", content: "Extract structured insights from feedback conversations. Return valid JSON only." },
        {
          role: "user", content: `Based on this ${surveyType === 'course_evaluation' ? 'course evaluation' : 'workplace feedback'} conversation, create a summary:

1. OPENING: A warm, personalized 1-sentence acknowledgment
2. KEY_POINTS: 2-4 bullet points summarizing specific feedback (25-35 words each)
3. SENTIMENT: overall tone (positive, mixed, or constructive)

Conversation:
${conversationContext || "User shared their thoughts."}

Return ONLY valid JSON: {"opening": "...", "keyPoints": [...], "sentiment": "..."}`
        }
      ],
      0.4, 350
    );

    let cleaned = summaryResponse.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(cleaned);
    if (parsed.keyPoints && Array.isArray(parsed.keyPoints)) {
      return {
        opening: parsed.opening || "Thank you for sharing your thoughts today.",
        keyPoints: parsed.keyPoints.slice(0, 4),
        sentiment: parsed.sentiment || "mixed",
      };
    }
  } catch (e) {
    console.error("Failed to parse structured summary:", e);
  }
  return fallback;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      conversationId, messages, testMode, themes: requestThemeIds,
      finishEarly, themeCoverage, isFinalResponse, isCompletionConfirmation,
      firstMessage: requestFirstMessage, initialMood,
      // chat-v2 specific fields
      selectedDuration, selectedThemeId: requestSelectedThemeId,
    } = await req.json();

    // Validate required fields
    if (!conversationId || typeof conversationId !== "string") {
      return new Response(JSON.stringify({ error: "Invalid or missing conversationId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid or empty messages array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const authHeader = req.headers.get("authorization");
    const lastMessage = messages[messages.length - 1];
    const isIntroductionTrigger = lastMessage?.content === "[START_CONVERSATION]" && messages.length === 1;

    let sanitizedContent = lastMessage?.content || "";
    if (!isIntroductionTrigger && lastMessage) {
      sanitizedContent = validateInput(conversationId, messages, lastMessage.content);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const isPreviewMode = testMode || (conversationId && typeof conversationId === 'string' && conversationId.startsWith("preview-"));

    // Rate limiting for preview mode
    if (isPreviewMode) {
      const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
      const rateLimitKey = `preview_${clientIP}_${conversationId.substring(0, 20)}`;
      if (!checkPreviewRateLimit(rateLimitKey)) {
        return new Response(JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ========== PHASE: INTRODUCTION — Ask for duration ==========
    if (isIntroductionTrigger) {
      return new Response(
        JSON.stringify({
          message: "How much time do you have for our chat today?",
          phase: "duration_selection",
          shouldComplete: false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== PHASE: DURATION SELECTED — Store and start interview ==========
    if (selectedDuration && typeof selectedDuration === "number") {
      const durationConfig = DURATION_TARGETS[selectedDuration] || DURATION_TARGETS[10];

      // Store duration in session
      if (!isPreviewMode) {
        await supabase
          .from("conversation_sessions")
          .update({ selected_duration: selectedDuration })
          .eq("id", conversationId);
      }

      // Fetch themes
      let themes: any[] = [];
      let surveyType: SurveyType = "employee_satisfaction";

      if (!isPreviewMode) {
        const { data: session } = await supabase
          .from("conversation_sessions")
          .select(`survey_id, surveys(themes, survey_type)`)
          .eq("id", conversationId)
          .single();

        const survey = session?.surveys as any;
        const themeIds = survey?.themes || [];
        surveyType = survey?.survey_type || "employee_satisfaction";

        if (themeIds.length > 0) {
          const { data } = await supabase.from("survey_themes").select("id, name, description").in("id", themeIds);
          themes = data || [];
        }
      } else if (requestThemeIds && Array.isArray(requestThemeIds) && requestThemeIds.length > 0) {
        const { data } = await supabase.from("survey_themes").select("id, name, description, survey_type").in("id", requestThemeIds);
        if (data) {
          themes = data;
          if (themes.length > 0) surveyType = themes[0].survey_type || "employee_satisfaction";
        }
      }

      // Use mood-adaptive response if we have initial mood
      const storedMood = typeof initialMood === "number" ? initialMood : 3;
      const moodResponse = getMoodAdaptiveResponse(storedMood, themes, surveyType);
      const firstQuestion = moodResponse.question || selectFirstQuestion(themes, surveyType);

      const initialThemeProgress = buildThemeProgress([], themes, null);

      return new Response(
        JSON.stringify({
          message: firstQuestion,
          empathy: moodResponse.empathy,
          phase: "interview",
          targetExchanges: durationConfig.targetExchanges,
          halfwayPoint: durationConfig.halfwayPoint,
          shouldComplete: false,
          themeProgress: initialThemeProgress,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== PHASE: THEME SELECTED — Store and continue with focus ==========
    if (requestSelectedThemeId && typeof requestSelectedThemeId === "string") {
      // Store in session
      if (!isPreviewMode) {
        await supabase
          .from("conversation_sessions")
          .update({ selected_theme_id: requestSelectedThemeId })
          .eq("id", conversationId);
      }

      // Fetch theme details to ask a relevant first question
      let themes: any[] = [];
      let surveyType: SurveyType = "employee_satisfaction";
      let selectedThemeName = "this topic";

      if (!isPreviewMode) {
        const { data: session } = await supabase
          .from("conversation_sessions")
          .select(`survey_id, surveys(themes, survey_type)`)
          .eq("id", conversationId)
          .single();

        const survey = session?.surveys as any;
        const themeIds = survey?.themes || [];
        surveyType = survey?.survey_type || "employee_satisfaction";

        if (themeIds.length > 0) {
          const { data } = await supabase.from("survey_themes").select("id, name, description").in("id", themeIds);
          themes = data || [];
        }
      } else if (requestThemeIds && Array.isArray(requestThemeIds)) {
        const { data } = await supabase.from("survey_themes").select("id, name, description, survey_type").in("id", requestThemeIds);
        if (data) {
          themes = data;
          if (themes.length > 0) surveyType = themes[0].survey_type || "employee_satisfaction";
        }
      }

      const selectedTheme = themes.find(t => t.id === requestSelectedThemeId);
      selectedThemeName = selectedTheme?.name || "this topic";

      // Generate a transition question about the selected theme
      const transitionQuestion = await callAI(
        LOVABLE_API_KEY, AI_MODEL,
        [{
          role: "system",
          content: `You are Spradley, a neutral research interviewer. The participant just chose to discuss "${selectedThemeName}" in more depth. Ask one focused, feeling-based question about this topic. Maximum 15 words. Respond with JSON: {"empathy": null, "question": "..."}`
        }],
        0.8, 100
      );

      const { empathy, question } = parseStructuredResponse(transitionQuestion);

      // Fetch updated responses for progress
      const { data: previousResponses } = await supabase
        .from("responses")
        .select("theme_id")
        .eq("conversation_session_id", conversationId);

      const themeProgress = buildThemeProgress(previousResponses || [], themes, requestSelectedThemeId);

      return new Response(
        JSON.stringify({
          message: question,
          empathy,
          phase: "interview",
          shouldComplete: false,
          themeProgress,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== MAIN CONVERSATION FLOW ==========
    // From here, it follows the same pattern as the original chat function
    // but with time-aware pacing

    // Check if this is a public link session
    const { data: sessionCheck } = await supabase
      .from("conversation_sessions")
      .select("public_link_id, employee_id")
      .eq("id", conversationId)
      .single();

    const isPublicLinkSession = sessionCheck?.public_link_id !== null;

    // Verify authentication
    let userId: string | null = null;
    if (!isPreviewMode && !isPublicLinkSession) {
      if (!authHeader) throw new Error("Missing authorization header");
      const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      if (userError || !user) throw new Error("Unauthorized: Invalid authentication");
      userId = user.id;
    } else if (isPublicLinkSession) {
      userId = sessionCheck?.employee_id || null;
    }

    // Rate limiting
    const rateLimitKey = isPublicLinkSession ? conversationId : userId!;
    if (!isPreviewMode && !checkRateLimit(rateLimitKey)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch conversation session with survey data
    const { data: session, error: sessionError } = await supabase
      .from("conversation_sessions")
      .select(`employee_id, survey_id, public_link_id, selected_duration, selected_theme_id, surveys(themes, first_message, survey_type, title, description)`)
      .eq("id", conversationId)
      .single();

    if (sessionError || !session) throw new Error("Conversation not found");

    if (!isPreviewMode && !isPublicLinkSession && session.employee_id !== userId) {
      throw new Error("Unauthorized: You don't have access to this conversation");
    }

    const survey = session?.surveys as any;
    const themeIds = survey?.themes || [];
    const surveyType: SurveyType = survey?.survey_type || "employee_satisfaction";
    const storedDuration = session.selected_duration || 10;
    const storedSelectedThemeId = session.selected_theme_id || null;
    const durationConfig = DURATION_TARGETS[storedDuration] || DURATION_TARGETS[10];

    const { data: themes } = await supabase
      .from("survey_themes")
      .select("id, name, description")
      .in("id", themeIds);

    const { data: previousResponses } = await supabase
      .from("responses")
      .select("content, ai_response, theme_id, sentiment")
      .eq("conversation_session_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20);

    const turnCount = messages.filter((m: any) => m.role === "user").length;

    // ===== Handle finish early =====
    if (finishEarly) {
      const structuredSummary = await generateStructuredSummary(LOVABLE_API_KEY, previousResponses || [], surveyType);
      return new Response(
        JSON.stringify({
          message: "Thank you for your time and valuable insights.",
          structuredSummary,
          shouldComplete: false,
          isCompletionPrompt: true,
          phase: "reviewing",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== Handle final response =====
    if (isFinalResponse) {
      if (!isIntroductionTrigger && sanitizedContent) {
        const { sentiment, score: sentimentScore } = await analyzeSentiment(LOVABLE_API_KEY, sanitizedContent);
        const detectedThemeId = await detectTheme(LOVABLE_API_KEY, sanitizedContent, themes || []);
        await supabase.from("responses").insert({
          conversation_session_id: conversationId, survey_id: session?.survey_id,
          content: sanitizedContent, ai_response: "Thank you for your time and insights.",
          sentiment, sentiment_score: sentimentScore, theme_id: detectedThemeId,
          created_at: new Date().toISOString(),
        });
      }
      const structuredSummary = await generateStructuredSummary(LOVABLE_API_KEY, previousResponses || [], surveyType);
      return new Response(
        JSON.stringify({
          message: "Thank you for your time and valuable insights.",
          structuredSummary,
          shouldComplete: false,
          isCompletionPrompt: true,
          phase: "reviewing",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== Handle completion confirmation =====
    if (isCompletionConfirmation) {
      if (sanitizedContent.length > 3) {
        const { sentiment, score: sentimentScore } = await analyzeSentiment(LOVABLE_API_KEY, sanitizedContent);
        const detectedThemeId = await detectTheme(LOVABLE_API_KEY, sanitizedContent, themes || []);
        await supabase.from("responses").insert({
          conversation_session_id: conversationId, survey_id: session?.survey_id,
          content: sanitizedContent, ai_response: "Thank you for your time and insights.",
          sentiment, sentiment_score: sentimentScore, theme_id: detectedThemeId,
          created_at: new Date().toISOString(),
        });
      }
      const structuredSummary = await generateStructuredSummary(LOVABLE_API_KEY, previousResponses || [], surveyType);
      return new Response(
        JSON.stringify({
          message: "Thank you for your time and valuable insights. Your feedback will help create meaningful change.",
          structuredSummary,
          shouldComplete: true,
          isCompletionPrompt: true,
          phase: "complete",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== Check for halfway theme selection trigger =====
    const halfwayPoint = durationConfig.halfwayPoint;
    const responseTurnCount = (previousResponses?.length || 0) + 1; // +1 for current response being processed

    if (responseTurnCount === halfwayPoint && !storedSelectedThemeId) {
      // First, save the current response
      const [sentimentResult, detectedThemeId, isUrgent] = await Promise.all([
        analyzeSentiment(LOVABLE_API_KEY, sanitizedContent),
        detectTheme(LOVABLE_API_KEY, sanitizedContent, themes || []),
        detectUrgency(LOVABLE_API_KEY, sanitizedContent)
      ]);

      await supabase.from("responses").insert({
        conversation_session_id: conversationId, survey_id: session?.survey_id,
        content: sanitizedContent, ai_response: "",
        sentiment: sentimentResult.sentiment, sentiment_score: sentimentResult.score,
        theme_id: detectedThemeId, urgency_escalated: isUrgent,
        created_at: new Date().toISOString(),
      });

      // Build list of remaining (undiscussed) themes
      const discussedThemeIds = new Set(
        (previousResponses || []).filter(r => r.theme_id).map(r => r.theme_id).filter(Boolean)
      );
      if (detectedThemeId) discussedThemeIds.add(detectedThemeId);

      const remainingThemes = (themes || []).filter(t => !discussedThemeIds.has(t.id));

      if (remainingThemes.length > 0) {
        const themeProgress = buildThemeProgress(
          [...(previousResponses || []), { theme_id: detectedThemeId }],
          themes || [],
          detectedThemeId
        );

        return new Response(
          JSON.stringify({
            message: "We're about halfway through. Which of these topics would you most like to talk about?",
            phase: "theme_selection",
            availableThemes: remainingThemes.map(t => ({ id: t.id, name: t.name })),
            shouldComplete: false,
            themeProgress,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // If all themes covered, skip theme selection and continue
    }

    // ===== Check time-based completion =====
    const shouldComplete = shouldCompleteBasedOnTime(turnCount, durationConfig.targetExchanges);

    if (shouldComplete && !isFinalResponse) {
      // Save the current response first
      const [sentimentResult, detectedThemeId] = await Promise.all([
        analyzeSentiment(LOVABLE_API_KEY, sanitizedContent),
        detectTheme(LOVABLE_API_KEY, sanitizedContent, themes || []),
      ]);

      await supabase.from("responses").insert({
        conversation_session_id: conversationId, survey_id: session?.survey_id,
        content: sanitizedContent, ai_response: "Thank you for sharing your thoughts.",
        sentiment: sentimentResult.sentiment, sentiment_score: sentimentResult.score,
        theme_id: detectedThemeId, created_at: new Date().toISOString(),
      });

      const structuredSummary = await generateStructuredSummary(LOVABLE_API_KEY, previousResponses || [], surveyType);
      const themeProgress = buildThemeProgress(
        [...(previousResponses || []), { theme_id: detectedThemeId }],
        themes || [],
        detectedThemeId
      );

      return new Response(
        JSON.stringify({
          message: "Thank you for sharing your thoughts.",
          structuredSummary,
          shouldComplete: false,
          isCompletionPrompt: true,
          phase: "reviewing",
          themeProgress,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== Normal conversation exchange =====
    const conversationContext = buildTimedConversationContext(
      previousResponses || [], themes || [],
      durationConfig.targetExchanges, storedSelectedThemeId, surveyType
    );

    const systemPrompt = getSystemPromptForSurveyType(surveyType, themes || [], conversationContext);

    const filteredMessages = messages.map((m: any) => ({ role: m.role, content: m.content }));

    const aiMessageRaw = await callAI(
      LOVABLE_API_KEY, AI_MODEL,
      [{ role: "system", content: systemPrompt }, ...filteredMessages],
      0.8, 180
    );

    const { empathy, question } = parseStructuredResponse(aiMessageRaw);

    // Save response and run background analysis
    const [sentimentResult, detectedThemeId, isUrgent] = await Promise.all([
      analyzeSentiment(LOVABLE_API_KEY, sanitizedContent),
      detectTheme(LOVABLE_API_KEY, sanitizedContent, themes || []),
      detectUrgency(LOVABLE_API_KEY, sanitizedContent)
    ]);

    const { data: insertedResponse, error: insertError } = await supabase
      .from("responses")
      .insert({
        conversation_session_id: conversationId, survey_id: session?.survey_id,
        content: sanitizedContent, ai_response: question,
        sentiment: sentimentResult.sentiment, sentiment_score: sentimentResult.score,
        theme_id: detectedThemeId, urgency_escalated: isUrgent,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error(`[${conversationId}] Failed to save response:`, insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save your response. Please try again.", aiMessage: question }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Background analysis (fire and forget)
    if (insertedResponse?.id) {
      const backgroundTask = async () => {
        try {
          const analysisResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: AI_MODEL_LITE,
              messages: [
                { role: "system", content: "You analyze employee feedback to extract urgency, themes, and sentiment indicators." },
                { role: "user", content: `Analyze this feedback: "${sanitizedContent}"\n\nAvailable themes: ${themes?.map((t: any) => `${t.id}:${t.name}`).join(", ")}` }
              ],
              tools: [{
                type: "function",
                function: {
                  name: "analyze_response",
                  description: "Extract urgency score, themes, and sentiment from employee feedback",
                  parameters: {
                    type: "object",
                    properties: {
                      urgency_score: { type: "integer", description: "Urgency level 1-5", enum: [1, 2, 3, 4, 5] },
                      urgency_reason: { type: "string" },
                      detected_themes: { type: "array", items: { type: "string" } },
                      key_sentiment_indicators: { type: "array", items: { type: "string" } },
                      suggested_followup: { type: "string" }
                    },
                    required: ["urgency_score", "urgency_reason", "detected_themes", "key_sentiment_indicators", "suggested_followup"],
                    additionalProperties: false
                  }
                }
              }],
              tool_choice: { type: "function", function: { name: "analyze_response" } }
            }),
          });
          if (analysisResponse.ok) {
            const analysisData = await analysisResponse.json();
            const toolCall = analysisData.choices[0]?.message?.tool_calls?.[0];
            if (toolCall?.function?.arguments) {
              const analysis = JSON.parse(toolCall.function.arguments);
              await supabase.from("responses").update({ urgency_score: analysis.urgency_score, ai_analysis: analysis }).eq("id", insertedResponse.id);
            }
          }
        } catch (e) {
          console.error(`[${conversationId}] Background analysis error:`, e);
        }

        // Semantic signal extraction (employee_satisfaction only)
        if (surveyType === "employee_satisfaction") {
          try {
            const signalResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                model: AI_MODEL_LITE,
                messages: [
                  { role: "system", content: `You analyze employee feedback through 5 psychological dimensions: EXPERTISE, AUTONOMY, JUSTICE, SOCIAL_CONNECTION, SOCIAL_STATUS.` },
                  { role: "user", content: `Analyze this feedback: "${sanitizedContent}"` }
                ],
                tools: [{
                  type: "function",
                  function: {
                    name: "extract_semantic_signal",
                    description: "Extract psychological dimension and semantic signal",
                    parameters: {
                      type: "object",
                      properties: {
                        signal_text: { type: "string" },
                        dimension: { type: "string", enum: ["expertise", "autonomy", "justice", "social_connection", "social_status"] },
                        facet: { type: "string" },
                        intensity: { type: "integer", minimum: 1, maximum: 10 },
                        sentiment: { type: "string", enum: ["positive", "negative", "neutral"] },
                        confidence: { type: "number", minimum: 0, maximum: 1 }
                      },
                      required: ["signal_text", "dimension", "facet", "intensity", "sentiment", "confidence"],
                      additionalProperties: false
                    }
                  }
                }],
                tool_choice: { type: "function", function: { name: "extract_semantic_signal" } }
              }),
            });
            if (signalResponse.ok) {
              const signalData = await signalResponse.json();
              const signalToolCall = signalData.choices[0]?.message?.tool_calls?.[0];
              if (signalToolCall?.function?.arguments) {
                const signal = JSON.parse(signalToolCall.function.arguments);
                await supabase.from("response_signals").insert({
                  response_id: insertedResponse.id, survey_id: session?.survey_id,
                  signal_text: signal.signal_text, dimension: signal.dimension,
                  facet: signal.facet, intensity: signal.intensity,
                  sentiment: signal.sentiment, confidence: signal.confidence
                });
              }
            }
          } catch (e) {
            console.error(`[${conversationId}] Signal extraction error:`, e);
          }
        }

        if (isUrgent) {
          await supabase.from("escalation_log").insert({
            response_id: insertedResponse.id, escalation_type: 'ai_detected',
            escalated_at: new Date().toISOString(),
          }).then(() => {}, (e: any) => console.error("Escalation log error:", e));
        }

        if (userId) {
          await supabase.from("audit_logs").insert({
            user_id: userId, action_type: "chat_message_sent",
            resource_type: "conversation_session", resource_id: conversationId,
            metadata: { survey_id: session?.survey_id, theme_id: detectedThemeId, sentiment: sentimentResult.sentiment, urgency_escalated: isUrgent },
          }).then(() => {}, (e: any) => console.error("Audit log error:", e));
        }
      };

      EdgeRuntime.waitUntil(backgroundTask());
    }

    // Build theme progress
    const { data: allResponses } = await supabase
      .from("responses")
      .select("theme_id")
      .eq("conversation_session_id", conversationId);

    const themeProgress = buildThemeProgress(allResponses || [], themes || [], detectedThemeId);

    return new Response(
      JSON.stringify({
        message: question,
        empathy,
        shouldComplete: false,
        phase: "interview",
        themeProgress,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Chat-v2 error:", error);
    const clientMessage = error instanceof Error && error.message.startsWith("Unauthorized")
      ? error.message
      : "An error occurred processing your request. Please try again.";
    return new Response(
      JSON.stringify({ error: clientMessage }),
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 403 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
