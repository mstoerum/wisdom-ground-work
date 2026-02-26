import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getSystemPromptForSurveyType, buildConversationContextForType, type SurveyType } from "./context-prompts.ts";
import { selectFirstQuestion, getMoodAdaptiveResponse } from "./first-questions.ts";

// Declare EdgeRuntime for background task support
declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
};

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
const MIN_EXCHANGES = 6; // Minimum exchanges for meaningful conversation
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
    return turnCount >= 8;
  }

  // Hard minimum: at least themes.length + 2 or MIN_EXCHANGES, whichever is larger
  const hardMinimum = Math.max(MIN_EXCHANGES, themes.length + 2);
  if (turnCount < hardMinimum) {
    return false;
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

  // Theme-gated: ALL themes must be touched before completion can trigger
  const allThemesTouched = discussedCount >= totalThemes;
  if (!allThemesTouched) {
    console.log(`[shouldCompleteBasedOnThemes] turnCount=${turnCount}, discussed=${discussedCount}/${totalThemes} — NOT all themes touched, continuing`);
    return false;
  }

  // Depth check: average at least 1 exchange per discussed theme
  const themeExchangeCounts = new Map<string, number>();
  previousResponses.forEach(r => {
    if (r.theme_id) {
      themeExchangeCounts.set(r.theme_id, (themeExchangeCounts.get(r.theme_id) || 0) + 1);
    }
  });

  const avgExchangesPerTheme = discussedCount > 0
    ? Array.from(themeExchangeCounts.values()).reduce((a, b) => a + b, 0) / discussedCount
    : 0;

  if (avgExchangesPerTheme < 1) {
    console.log(`[shouldCompleteBasedOnThemes] turnCount=${turnCount}, allTouched=true, avgDepth=${avgExchangesPerTheme.toFixed(1)} — insufficient depth, continuing`);
    return false;
  }

  console.log(`[shouldCompleteBasedOnThemes] turnCount=${turnCount}, discussed=${discussedCount}/${totalThemes}, avgDepth=${avgExchangesPerTheme.toFixed(1)} — COMPLETE`);
  return true;
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
  
  // Build per-theme depth info for the AI
  const perThemeDepth = themes?.map((t: any) => {
    const count = themeExchangeCounts.get(t.id) || 0;
    return `${t.name} (${count} exchanges)`;
  }).join(", ") || "None";

  // Find the most recent theme and its exchange count
  const lastResponseWithTheme = [...previousResponses].reverse().find(r => r.theme_id);
  const currentThemeName = lastResponseWithTheme 
    ? themes?.find((t: any) => t.id === lastResponseWithTheme.theme_id)?.name 
    : null;
  const currentThemeCount = lastResponseWithTheme 
    ? themeExchangeCounts.get(lastResponseWithTheme.theme_id) || 0 
    : 0;

  const mustTransition = currentThemeCount >= 2 && uncoveredThemes.length > 0;

  return `
CONVERSATION CONTEXT:
- Topics already discussed: ${discussedThemes.size > 0 ? Array.from(discussedThemes).join(", ") : "None yet"}
- Theme coverage: ${discussedThemeIds.size} of ${totalThemes} themes (${Math.round(coveragePercent)}%)
- Per-theme depth: ${perThemeDepth}
${currentThemeName ? `- Current theme: "${currentThemeName}" has ${currentThemeCount} exchanges${mustTransition ? " — MUST transition now" : ""}` : ""}
- Recent sentiment pattern: ${sentimentPattern.join(" → ")}
- Exchange count: ${previousResponses.length}
${previousResponses.length > 0 ? `- Key points mentioned earlier: "${previousResponses.slice(0, 2).map(r => r.content.substring(0, 60)).join('"; "')}"` : ""}

ADAPTIVE INSTRUCTIONS:
${mustTransition ? 
  `- CRITICAL: "${currentThemeName}" already has ${currentThemeCount} exchanges. You MUST transition to an undiscussed theme NOW.\n  Do NOT ask another follow-up on a theme you've already explored twice. Move to: ${uncoveredThemes.map((t: any) => t.name).join(", ")}` : ""}
${lastSentiment === "negative" ? 
  "- The employee is sharing challenges. Ask specific follow-up questions to understand what happened and what would help." : ""}
${lastSentiment === "positive" ? 
  "- The employee is positive. Great! Also explore if there are any areas for improvement to ensure balanced feedback." : ""}
${uncoveredThemes.length > 0 && !mustTransition ? 
  `\nCRITICAL: These themes have NOT been discussed yet: ${uncoveredThemes.map((t: any) => t.name).join(", ")}.\nYou MUST transition to one of these themes soon.\nDo NOT wrap up or suggest completion until all themes are covered.\n` : ""}
${isNearCompletion && uncoveredThemes.length === 0 ? 
  `- All themes covered. Offer a word_cloud with 3-4 NEW topics NOT in the survey themes. Infer from conversation hints (e.g. mentions of workload → "Work-Life Balance", mentions of skills → "Career Growth"). Always include "I'm all good" as last option. Set allowOther: true, maxSelections: 1. If user selected "[SELECTED: I'm all good]", proceed to thank them briefly and signal completion. If they selected a topic, explore with 1-2 questions then offer word_cloud again (minus explored topics).` : ""}
${previousResponses.length >= 3 ? "- Reference earlier points when relevant to build on what they've shared." : ""}
`;
};

/**
 * Generate system prompt for constructive AI conversation
 * Now returns structured JSON with empathy and question separated
 */
const getSystemPrompt = (conversationContext: string, isFirstMessage: boolean, surveyType?: SurveyType, firstQuestion?: string): string => {
  const isCourseEvaluation = surveyType === "course_evaluation";
  const context = isCourseEvaluation ? "your learning experience" : "how things are going at work";
  
  const introGuidance = isFirstMessage ? `
IMPORTANT - FIRST MESSAGE PROTOCOL:
This is the FIRST message. Return ONLY the question, no empathy needed.

First question to use: "${firstQuestion || "How have things been feeling lately?"}"
Introduction: "Hi, I'm Spradley. Thanks for taking a few minutes to chat about ${context}."

For your JSON response:
- empathy: null (not needed for first message)
- question: The full intro + first question combined

CRITICAL RULES FOR FIRST MESSAGE:
- Do NOT mention being an AI or not being a person
- Do NOT explain anonymity or confidentiality in the intro
- Do NOT ask open-ended questions like "tell me about your experience"
- Do NOT use scale-based questions (1-10)
- Keep the intro to 2 sentences max before the question
` : '';

  return `You are Spradley, a neutral research interviewer collecting feedback.

RESPONSE FORMAT (JSON only):
{"empathy": "3-12 words scaled to intensity, or null", "question": "one focused question"}

EMPATHY RULES (Calibrated Empathy with Constructive Neutrality):

CORE APPROACH:
- Acknowledge the person sharing, not the content of their statement
- Treat all responses as perspectives to explore, not truths to affirm
- Never validate criticism as fact or take sides

LENGTH (scales with emotional intensity):
• Low (neutral facts): 3-5 words ("Thanks for sharing that.")
• Medium (mild emotion): 5-8 words ("I appreciate you explaining that.")
• High (strong emotion): 8-12 words ("Thank you for being open about your experience.")

CONSTRUCTIVE NEUTRALITY (for negative feedback):
- Never agree that someone/something is "bad" or "wrong"
- Acknowledge they shared a perspective, then redirect constructively
- Focus on: "What would improvement look like?" not "That's terrible"
- Use null for first message only

FEW-SHOT EXAMPLES:
User: "My manager never listens to anyone."
✓ {"empathy": "Thank you for sharing that perspective.", "question": "What would better communication look like for you?"}
✗ {"empathy": "That sounds really frustrating.", "question": "How long has this been going on?"}

User: "The workload is completely unreasonable."
✓ {"empathy": "I appreciate you being open about that.", "question": "What would a more manageable workload look like?"}
✗ {"empathy": "That sounds overwhelming.", "question": "How bad has it gotten?"}

User: "I actually really enjoy the team collaboration here."
✓ {"empathy": "That's great to hear.", "question": "What specifically makes the collaboration work well?"}

DE-ESCALATION (for heated/venting responses):
- Stay calm and neutral in tone
- Shorter empathy (3-5 words) to avoid amplifying
- Redirect quickly to constructive question

MATCH THE VIBE:
- Positive feedback → Warm, curious ("That's great to hear.")
- Neutral facts → Brief, appreciative ("Got it, thanks.")
- Negative feedback → Acknowledge + redirect ("Thanks for sharing that. What would help?")

NEVER:
- Mirror/repeat their words
- Validate criticism as fact ("That IS frustrating")
- Use language that implies agreement with complaints
- Escalate negative emotions ("That sounds awful")
- Name emotions directly ("I hear you're frustrated")

QUESTION RULES:
- Maximum 15 words, prefer under 12
- Direct and specific - no preamble
- Offer 2-3 structured options when it helps narrow the topic:
  Good: "Was it the workload, the timeline, or something else?"
  Good: "Did that help or hinder your progress?"
- For negative feedback, redirect toward improvement:
  Good: "What would make this better?"
  Good: "What would improvement look like in this area?"
- Never repeat or paraphrase what they said
- Ask for specifics, examples, or root causes
- One question only

NEUTRAL STANCE:
- Maintain professional curiosity without emotional investment
- Your role: understand and clarify, not validate or affirm
- Distance between opinion and fact should be clear

${introGuidance}

FLOW:
- 1-2 follow-ups per theme, then move on naturally
- Cover ALL themes before concluding
- Do NOT linger on any single theme — after 2 exchanges, transition with a brief bridging sentence
- When all themes covered: ask if anything else, then thank briefly

${conversationContext}`;
};

/**
 * Parse structured AI response into empathy and question
 */
const parseStructuredResponse = (aiMessage: string): { empathy: string | null; question: string; raw: string; inputType?: string; inputConfig?: any } => {
  try {
    // Clean markdown code blocks if present
    let cleaned = aiMessage.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const parsed = JSON.parse(cleaned);
    if (parsed.question) {
      return {
        empathy: parsed.empathy || null,
        question: parsed.question,
        raw: aiMessage,
        inputType: parsed.inputType || undefined,
        inputConfig: parsed.inputConfig || undefined,
      };
    }
  } catch (e) {
    console.log("Failed to parse structured response, attempting extraction...");
    
    // Attempt 1: Extract complete JSON object
    const jsonMatch = aiMessage.match(/\{[\s\S]*"question"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.question) {
          return { empathy: parsed.empathy || null, question: parsed.question, raw: aiMessage, inputType: parsed.inputType, inputConfig: parsed.inputConfig };
        }
      } catch (e2) {
        console.log("JSON extraction failed, trying regex");
      }
    }
    
    // Attempt 2: Extract from truncated JSON using regex
    const questionMatch = aiMessage.match(/"question"\s*:\s*"([^"]+)/);
    if (questionMatch && questionMatch[1]) {
      const empathyMatch = aiMessage.match(/"empathy"\s*:\s*"([^"]+)"/);
      const question = questionMatch[1].replace(/["\}]+$/, '').trim();
      if (question.length > 5) {
        console.log("Extracted question from truncated JSON:", question);
        return {
          empathy: empathyMatch ? empathyMatch[1] : null,
          question: question,
          raw: aiMessage
        };
      }
    }
    
    // Attempt 3: Strip all JSON artifacts and use remaining text
    if (aiMessage.includes('"question"') || aiMessage.includes('"empathy"')) {
      const textContent = aiMessage
        .replace(/^\s*\{?\s*/g, '')
        .replace(/"empathy"\s*:\s*("[^"]*"|null)\s*,?\s*/g, '')
        .replace(/"question"\s*:\s*"/g, '')
        .replace(/"\s*\}?\s*$/g, '')
        .trim();
      
      if (textContent && textContent.length > 10 && !textContent.startsWith('{')) {
        console.log("Stripped JSON wrapper, using:", textContent);
        return { empathy: null, question: textContent, raw: aiMessage };
      }
    }
  }
  
  // Final fallback: Use generic continuation if everything fails
  if (aiMessage.includes('{') || aiMessage.includes('"question"')) {
    console.error("All parsing attempts failed, using generic fallback");
    return {
      empathy: null,
      question: "Thank you for sharing. Could you tell me a bit more about that?",
      raw: aiMessage
    };
  }
  
  // Plain text response
  return {
    empathy: null,
    question: aiMessage.trim(),
    raw: aiMessage
  };
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
    AI_MODEL_LITE, // Use lite model for faster classification
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

  const urgencyResponse = await callAI(apiKey, AI_MODEL_LITE, [{ role: "user", content: urgencyPrompt }], 0.1, 10); // Use lite model for faster classification
  
  return urgencyResponse.toLowerCase().includes('urgent');
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, messages, testMode, themes: requestThemeIds, finishEarly, themeCoverage, isFinalResponse, isCompletionConfirmation, firstMessage: requestFirstMessage, initialMood } = await req.json();
    
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

      // Handle final response - MUST return structured summary for receipt UI
      if (isFinalResponse) {
        console.log("[chat] Preview mode isFinalResponse - generating structured summary");
        
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

        // Generate structured summary for receipt
        const conversationContext = messages
          .filter((m: any) => m.role === "user")
          .map((m: any) => m.content)
          .join("\n");

        let structuredSummary = { opening: "Thank you for sharing your thoughts today.", keyPoints: ["Thank you for sharing your feedback"], sentiment: "mixed" as const };
        
        try {
          const summaryResponse = await callAI(
            LOVABLE_API_KEY,
            AI_MODEL_LITE,
            [
              { role: "system", content: "Extract structured insights from feedback conversations. Return valid JSON only." },
              { role: "user", content: `Based on this feedback conversation, create a rich summary:

1. OPENING: A warm, personalized 1-sentence acknowledgment of what was shared (e.g., "Thank you for sharing openly about your experience with...")

2. KEY_POINTS: 2-4 meaningful bullet points summarizing specific feedback (25-35 words each, capture the essence with context and nuance)

3. SENTIMENT: overall emotional tone (positive, mixed, or constructive)

Conversation content:
${conversationContext || "User shared their thoughts and feedback."}

Return ONLY valid JSON: {"opening": "Thank you for...", "keyPoints": [...], "sentiment": "..."}` }
            ],
            0.4,
            350
          );
          
          let cleaned = summaryResponse.trim();
          if (cleaned.startsWith('```json')) {
            cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }
          const parsed = JSON.parse(cleaned);
          if (parsed.keyPoints && Array.isArray(parsed.keyPoints)) {
            structuredSummary = {
              opening: parsed.opening || "Thank you for sharing your thoughts today.",
              keyPoints: parsed.keyPoints.slice(0, 4),
              sentiment: parsed.sentiment || "mixed"
            };
          }
          console.log("[chat] Preview mode generated structured summary:", structuredSummary);
        } catch (e) {
          console.error("[chat] Failed to parse structured summary in preview final response:", e);
        }

        return new Response(
          JSON.stringify({ 
            message: finalMessage,
            structuredSummary,
            shouldComplete: false,  // Let user review before completing
            isCompletionPrompt: true  // Triggers receipt UI
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
            .select("id, name, description, survey_type, suggested_questions, sentiment_keywords")
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
      const conversationContext = buildConversationContextForType(surveyType, mockResponses, themes);
      let systemPrompt = getSystemPromptForSurveyType(surveyType, themes, conversationContext);
      
      // If firstMessage is provided and this is an introduction, use it as the initial message
      // Otherwise, generate a warm, feeling-focused first message
      if (isIntroductionTrigger) {
        // Build initial theme progress for preview mode
        const initialThemeProgress = buildThemeProgress([], themes, null);
        
        // Check if we have an initial mood from the mood selector
        if (typeof initialMood === 'number' && initialMood >= 1 && initialMood <= 5) {
          // Use mood-adaptive response
          const moodResponse = getMoodAdaptiveResponse(initialMood, themes, surveyType);
          return new Response(
            JSON.stringify({ 
              message: moodResponse.question,
              empathy: moodResponse.empathy,
              shouldComplete: false,
              themeProgress: initialThemeProgress
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else if (requestFirstMessage) {
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
        300 // Increased for JSON responses with inputType/inputConfig
      );

      // For preview mode, estimate which theme is being discussed based on exchange count
      const previewThemeProgress = buildThemeProgress(
        mockResponses, 
        themes, 
        themes[Math.min(turnCount, themes.length - 1)]?.id || null
      );

      // Parse structured response for preview mode
      const { empathy, question, inputType, inputConfig } = parseStructuredResponse(aiMessage);
      console.log("Preview mode parsed response:", { empathy, question: question.substring(0, 50), inputType });
      
      return new Response(
        JSON.stringify({ 
          message: question,
          empathy: empathy,
          shouldComplete: shouldComplete,
          themeProgress: previewThemeProgress,
          ...(inputType && inputType !== "text" ? { inputType, inputConfig } : {})
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
      .select("id, name, description, suggested_questions, sentiment_keywords")
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

      // Generate structured summary for the receipt
      const conversationContext = messages.map((m: any) => m.role === "user" ? m.content : "").filter(Boolean).join("\n");
      let structuredSummary = { opening: "Thank you for sharing your thoughts today.", keyPoints: ["Thank you for sharing your feedback"], sentiment: "mixed" };
      
      try {
        const summaryResponse = await callAI(
          LOVABLE_API_KEY,
          AI_MODEL_LITE,
          [
            { role: "system", content: "Extract structured insights from feedback conversations. Return valid JSON only." },
            { role: "user", content: `Based on this conversation, create a rich summary:

1. OPENING: A warm, personalized 1-sentence acknowledgment of what was shared (e.g., "Thank you for sharing openly about your experience with...")

2. KEY_POINTS: 2-4 meaningful bullet points summarizing specific feedback (25-35 words each, capture the essence with context and nuance)

3. SENTIMENT: overall emotional tone (positive, mixed, or constructive)

Conversation content:
${conversationContext || "User shared their thoughts and feedback."}

Return ONLY valid JSON: {"opening": "Thank you for...", "keyPoints": [...], "sentiment": "..."}` }
          ],
          0.4,
          350
        );
        
        let cleaned = summaryResponse.trim();
        if (cleaned.startsWith('```json')) {
          cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        const parsed = JSON.parse(cleaned);
        if (parsed.keyPoints && Array.isArray(parsed.keyPoints)) {
          structuredSummary = {
            opening: parsed.opening || "Thank you for sharing your thoughts today.",
            keyPoints: parsed.keyPoints.slice(0, 4),
            sentiment: parsed.sentiment || "mixed"
          };
        }
      } catch (e) {
        console.error("Failed to parse structured summary in finishEarly:", e);
      }

      return new Response(
        JSON.stringify({ 
          message: summaryMessage,
          finalQuestion: finalQuestion || null,
          structuredSummary,
          shouldComplete: false,
          isCompletionPrompt: true  // Triggers receipt UI with buttons
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

        // Generate structured summary for the receipt
        const conversationContext = previousResponses?.map(r => r.content).join("\n") || "";
        const structuredSummaryPrompt = `Based on this conversation about ${surveyType === 'course_evaluation' ? 'course evaluation' : 'workplace feedback'}, create a rich summary:

1. OPENING: A warm, personalized 1-sentence acknowledgment of what was shared (e.g., "Thank you for sharing openly about your experience with...")

2. KEY_POINTS: 2-4 meaningful bullet points summarizing specific feedback (25-35 words each, capture the essence with context and nuance)

3. SENTIMENT: overall emotional tone (positive, mixed, or constructive)

Conversation content:
${conversationContext}

Return ONLY valid JSON: {"opening": "Thank you for...", "keyPoints": [...], "sentiment": "..."}`;
        
        let structuredSummary = { opening: "Thank you for sharing your thoughts today.", keyPoints: ["Thank you for sharing your feedback"], sentiment: "mixed" };
        try {
          const summaryResponse = await callAI(
            LOVABLE_API_KEY,
            AI_MODEL_LITE,
            [
              { role: "system", content: "You extract structured insights from conversations. Always return valid JSON only, no markdown." },
              { role: "user", content: structuredSummaryPrompt }
            ],
            0.3,
            250
          );
          
          let cleaned = summaryResponse.trim();
          if (cleaned.startsWith('```json')) {
            cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }
          const parsed = JSON.parse(cleaned);
          if (parsed.keyPoints && Array.isArray(parsed.keyPoints)) {
            structuredSummary = {
              opening: parsed.opening || "Thank you for sharing your thoughts today.",
              keyPoints: parsed.keyPoints.slice(0, 4),
              sentiment: parsed.sentiment || "mixed"
            };
          }
        } catch (e) {
          console.error("Failed to parse structured summary:", e);
          structuredSummary = {
            opening: "Thank you for sharing your thoughts today.",
            keyPoints: previousResponses?.slice(-3).map(r => 
              r.content.length > 100 ? r.content.substring(0, 97) + "..." : r.content
            ) || ["Thank you for sharing your feedback"],
            sentiment: "mixed"
          };
        }

        // Return with structured summary for receipt display
        return new Response(
          JSON.stringify({
            message: "Thank you for your time and valuable insights. Your feedback will help create meaningful change.",
            structuredSummary,
            shouldComplete: true,
            isCompletionPrompt: true
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Handle final response - MUST return structured summary for receipt UI
    if (isFinalResponse) {
      console.log(`[${conversationId}] isFinalResponse triggered - generating structured summary`);
      
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

        console.log(`[${conversationId}] Saving final response...`);
        const { error: insertError } = await supabase.from("responses").insert({
          conversation_session_id: conversationId,
          survey_id: session?.survey_id,
          content: sanitizedContent,
          ai_response: finalMessage,
          sentiment,
          sentiment_score: sentimentScore,
          theme_id: detectedThemeId,
          created_at: new Date().toISOString(),
        });

        if (insertError) {
          console.error(`[${conversationId}] Warning: Failed to save final response:`, insertError);
        }
      }

      // Generate structured summary for receipt UI
      const conversationContext = (previousResponses || [])
        .map((r: any) => r.content)
        .filter(Boolean)
        .join("\n");

      let structuredSummary = { keyPoints: ["Thank you for sharing your feedback"], sentiment: "mixed" as const };
      
      try {
        const summaryResponse = await callAI(
          LOVABLE_API_KEY,
          AI_MODEL_LITE,
          [
            { role: "system", content: "Extract structured insights. Return valid JSON only." },
            { role: "user", content: `Based on this ${surveyType === 'course_evaluation' ? 'course evaluation' : 'workplace feedback'} conversation, extract:
1. KEY_POINTS: 2-4 bullet points summarizing what the participant shared (each under 15 words)
2. SENTIMENT: overall tone (positive, mixed, or negative)

Conversation content:
${conversationContext || "User shared their thoughts and feedback."}

Return ONLY valid JSON: {"keyPoints": [...], "sentiment": "..."}` }
          ],
          0.3,
          250
        );
        
        let cleaned = summaryResponse.trim();
        if (cleaned.startsWith('```json')) {
          cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        const parsed = JSON.parse(cleaned);
        if (parsed.keyPoints && Array.isArray(parsed.keyPoints)) {
          structuredSummary = {
            keyPoints: parsed.keyPoints.slice(0, 4),
            sentiment: parsed.sentiment || "mixed"
          };
        }
        console.log(`[${conversationId}] Generated structured summary:`, structuredSummary);
      } catch (e) {
        console.error(`[${conversationId}] Failed to parse structured summary in final response:`, e);
        // Fallback to recent responses as key points
        structuredSummary = {
          keyPoints: (previousResponses || []).slice(-3).map((r: any) => 
            r.content.length > 60 ? r.content.substring(0, 60) + "..." : r.content
          ).filter(Boolean),
          sentiment: "mixed"
        };
        if (structuredSummary.keyPoints.length === 0) {
          structuredSummary.keyPoints = ["Thank you for sharing your feedback"];
        }
      }

      return new Response(
        JSON.stringify({ 
          message: finalMessage,
          structuredSummary,
          shouldComplete: false,  // Let user review before completing
          isCompletionPrompt: true  // Triggers receipt UI
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Determine completion based on theme exploration, not just exchange count
    const shouldComplete = shouldCompleteBasedOnThemes(previousResponses || [], themes || [], turnCount);
    
    // Check if user selected "I'm all good" from end-of-conversation word cloud
    const isAllGoodSelection = sanitizedContent.includes("[SELECTED: I'm all good]") || sanitizedContent.toLowerCase() === "i'm all good";
    
    // Check if user is confirming completion
    const userConfirmingCompletion = sanitizedContent.toLowerCase().match(/\b(yes|yeah|sure|ok|okay|done|finished|that'?s all|nothing else|no|nope)\b/);
    
    // Handle "I'm all good" selection — trigger completion with structured summary
    if (isAllGoodSelection && turnCount >= 4 && !isIntroductionTrigger) {
      console.log(`[${conversationId}] User selected "I'm all good" — triggering completion`);
      
      // Save the selection as a response
      if (sanitizedContent.length > 3) {
        const { sentiment, score: sentimentScore } = await analyzeSentiment(LOVABLE_API_KEY, sanitizedContent);
        await supabase.from("responses").insert({
          conversation_session_id: conversationId,
          survey_id: session?.survey_id,
          content: sanitizedContent,
          ai_response: "Thank you for your time and valuable insights.",
          sentiment,
          sentiment_score: sentimentScore,
          created_at: new Date().toISOString(),
        });
      }

      // Generate structured summary
      const conversationContext = previousResponses?.map(r => r.content).join("\n") || "";
      let structuredSummary = { keyPoints: ["Thank you for sharing your feedback"], sentiment: "mixed" };
      try {
        const summaryResponse = await callAI(
          LOVABLE_API_KEY,
          AI_MODEL_LITE,
          [
            { role: "system", content: "You extract structured insights from conversations. Always return valid JSON only, no markdown." },
            { role: "user", content: `Based on this conversation about ${surveyType === 'course_evaluation' ? 'course evaluation' : 'workplace feedback'}, extract:
1. KEY_POINTS: 2-4 bullet points summarizing what the participant shared (each under 15 words)
2. SENTIMENT: overall tone (positive, mixed, or negative)

Conversation content:
${conversationContext}

Return ONLY valid JSON: {"keyPoints": [...], "sentiment": "..."}` }
          ],
          0.3,
          250
        );
        let cleaned = summaryResponse.trim();
        if (cleaned.startsWith('```json')) {
          cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        const parsed = JSON.parse(cleaned);
        if (parsed.keyPoints && Array.isArray(parsed.keyPoints)) {
          structuredSummary = {
            keyPoints: parsed.keyPoints.slice(0, 4),
            sentiment: parsed.sentiment || "mixed"
          };
        }
      } catch (e) {
        console.error("Failed to parse structured summary for 'I'm all good':", e);
      }

      return new Response(
        JSON.stringify({
          message: "Thank you for your time and valuable insights. Your feedback will help create meaningful change.",
          structuredSummary,
          shouldComplete: true,
          isCompletionPrompt: true
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Natural completion flow: AI detected completion + user confirms
    if (shouldComplete && !isFinalResponse && !isIntroductionTrigger) {
      // Generate structured summary with key points
      const conversationContext = previousResponses?.map(r => r.content).join("\n") || "";
      const structuredSummaryPrompt = `Based on this conversation about ${surveyType === 'course_evaluation' ? 'course evaluation' : 'workplace feedback'}, extract:

1. KEY_POINTS: 2-4 bullet points summarizing what the participant shared (each under 15 words, focus on specific feedback given)
2. SENTIMENT: overall tone of the conversation (positive, mixed, or negative)

Conversation content:
${conversationContext}

Return ONLY valid JSON in this exact format:
{"keyPoints": ["point 1", "point 2", "point 3"], "sentiment": "mixed"}`;
      
      const summaryResponse = await callAI(
        LOVABLE_API_KEY,
        AI_MODEL_LITE,
        [
          { role: "system", content: "You extract structured insights from conversations. Always return valid JSON only, no markdown." },
          { role: "user", content: structuredSummaryPrompt }
        ],
        0.3,
        250
      );
      
      // Parse the structured summary
      let structuredSummary = { keyPoints: ["Thank you for sharing your feedback"], sentiment: "mixed" };
      try {
        let cleaned = summaryResponse.trim();
        if (cleaned.startsWith('```json')) {
          cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        const parsed = JSON.parse(cleaned);
        if (parsed.keyPoints && Array.isArray(parsed.keyPoints)) {
          structuredSummary = {
            keyPoints: parsed.keyPoints.slice(0, 4), // Max 4 points
            sentiment: parsed.sentiment || "mixed"
          };
        }
      } catch (e) {
        console.error("Failed to parse structured summary:", e, summaryResponse);
        // Fallback: create basic summary from conversation
        structuredSummary = {
          keyPoints: previousResponses?.slice(-3).map(r => 
            r.content.length > 60 ? r.content.substring(0, 60) + "..." : r.content
          ) || ["Thank you for sharing your feedback"],
          sentiment: "mixed"
        };
      }
      
      return new Response(
        JSON.stringify({
          message: "Thank you for sharing your thoughts.",
          structuredSummary,
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

      // Generate structured summary for the receipt
      const conversationContext = previousResponses?.map(r => r.content).join("\n") || "";
      const structuredSummaryPrompt = `Based on this conversation about ${surveyType === 'course_evaluation' ? 'course evaluation' : 'workplace feedback'}, extract:

1. KEY_POINTS: 2-4 bullet points summarizing what the participant shared (each under 15 words, focus on specific feedback given)
2. SENTIMENT: overall tone of the conversation (positive, mixed, or negative)

Conversation content:
${conversationContext}

Return ONLY valid JSON in this exact format:
{"keyPoints": ["point 1", "point 2", "point 3"], "sentiment": "mixed"}`;
      
      let structuredSummary = { keyPoints: ["Thank you for sharing your feedback"], sentiment: "mixed" };
      try {
        const summaryResponse = await callAI(
          LOVABLE_API_KEY,
          AI_MODEL_LITE,
          [
            { role: "system", content: "You extract structured insights from conversations. Always return valid JSON only, no markdown." },
            { role: "user", content: structuredSummaryPrompt }
          ],
          0.3,
          250
        );
        
        let cleaned = summaryResponse.trim();
        if (cleaned.startsWith('```json')) {
          cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        const parsed = JSON.parse(cleaned);
        if (parsed.keyPoints && Array.isArray(parsed.keyPoints)) {
          structuredSummary = {
            keyPoints: parsed.keyPoints.slice(0, 4),
            sentiment: parsed.sentiment || "mixed"
          };
        }
      } catch (e) {
        console.error("Failed to parse structured summary:", e);
        structuredSummary = {
          keyPoints: previousResponses?.slice(-3).map(r => 
            r.content.length > 60 ? r.content.substring(0, 60) + "..." : r.content
          ) || ["Thank you for sharing your feedback"],
          sentiment: "mixed"
        };
      }

      console.log(`[${conversationId}] ✅ Returning completion with structuredSummary:`, structuredSummary);

      return new Response(
        JSON.stringify({
          message: "Thank you for your time and valuable insights. Your feedback will help create meaningful change.",
          structuredSummary,
          shouldComplete: true,
          isCompletionPrompt: true
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Force isFirstMessage=true for introduction trigger
    const hasExistingAssistantMessages = messages.some((m: any) => m.role === "assistant");
    const isFirstMessage = isIntroductionTrigger || (turnCount === 1 && !hasExistingAssistantMessages);

    // If this is an introduction trigger, handle first message
    if (isIntroductionTrigger) {
      // Build initial theme progress
      const initialThemeProgress = buildThemeProgress([], themes || [], null);
      
      // Check if we have an initial mood from the mood selector
      if (typeof initialMood === 'number' && initialMood >= 1 && initialMood <= 5) {
        // Use mood-adaptive response
        const moodResponse = getMoodAdaptiveResponse(initialMood, themes || [], surveyType);
        return new Response(
          JSON.stringify({ 
            message: moodResponse.question,
            empathy: moodResponse.empathy,
            shouldComplete: false,
            themeProgress: initialThemeProgress
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const surveyFirstMessageText = survey?.first_message;
      
      if (surveyFirstMessageText) {
        // Use the provided first message directly
        return new Response(
          JSON.stringify({ 
            message: surveyFirstMessageText,
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
    const aiMessageRaw = await callAI(
      LOVABLE_API_KEY,
      AI_MODEL,
      [{ role: "system", content: systemPrompt }, ...filteredMessages],
      0.8,
      300 // Increased for JSON responses with inputType/inputConfig
    );

    // Parse structured response
    const { empathy, question, raw, inputType, inputConfig } = parseStructuredResponse(aiMessageRaw);
    const aiMessage = question; // Use question as the main message for storage

      // IMPORTANT: Don't save the [START_CONVERSATION] trigger to database
    if (!isIntroductionTrigger) {
      // PERF: Insert response immediately WITHOUT waiting for classification
      // Classification (sentiment, theme, urgency) runs in background via EdgeRuntime.waitUntil()
      console.log(`[${conversationId}] Inserting response immediately (classification deferred to background)...`);
      const { data: insertedResponse, error: insertError } = await supabase
        .from("responses")
        .insert({
          conversation_session_id: conversationId,
          survey_id: session?.survey_id,
          content: sanitizedContent,
          ai_response: aiMessage,
          sentiment: null,          // Will be filled by background task
          sentiment_score: null,    // Will be filled by background task
          theme_id: null,           // Will be filled by background task
          urgency_escalated: false, // Will be updated by background task if urgent
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
      });

      // PERF: Background task handles ALL classification + analysis (not blocking response)
      if (insertedResponse?.id) {
        const backgroundTask = async () => {
          try {
            // Step 1: Run classification (sentiment, theme, urgency) in parallel
            console.log(`[${conversationId}] [BACKGROUND] Starting classification...`);
            const [sentimentResult, detectedThemeId, isUrgent] = await Promise.all([
              analyzeSentiment(LOVABLE_API_KEY, sanitizedContent),
              detectTheme(LOVABLE_API_KEY, sanitizedContent, themes || []),
              detectUrgency(LOVABLE_API_KEY, sanitizedContent)
            ]);
            const { sentiment, score: sentimentScore } = sentimentResult;

            console.log(`[${conversationId}] [BACKGROUND] Classification complete:`, {
              sentiment, sentimentScore, detectedThemeId, isUrgent
            });

            // Step 2: Update response with classification results
            const { error: classifyError } = await supabase
              .from("responses")
              .update({
                sentiment,
                sentiment_score: sentimentScore,
                theme_id: detectedThemeId,
                urgency_escalated: isUrgent,
              })
              .eq("id", insertedResponse.id);

            if (classifyError) {
              console.error(`[${conversationId}] [BACKGROUND] Failed to update classification:`, classifyError);
            }

            // Step 3: LLM deep analysis (existing behavior)
            console.log(`[${conversationId}] [BACKGROUND] Starting LLM analysis...`);
            
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
                
                console.log(`[${conversationId}] [BACKGROUND] LLM analysis complete:`, {
                  urgency_score: analysis.urgency_score,
                  urgency_reason: analysis.urgency_reason
                });

                const { error: updateError } = await supabase
                  .from("responses")
                  .update({
                    urgency_score: analysis.urgency_score,
                    ai_analysis: analysis
                  })
                  .eq("id", insertedResponse.id);

                if (updateError) {
                  console.error(`[${conversationId}] [BACKGROUND] Failed to update response with analysis:`, updateError);
                } else {
                  console.log(`[${conversationId}] [BACKGROUND] ✅ Response enriched with LLM analysis`);
                }
              }
            } else {
              console.error(`[${conversationId}] [BACKGROUND] LLM analysis failed:`, await analysisResponse.text());
            }
          } catch (analysisError) {
            console.error(`[${conversationId}] [BACKGROUND] Error during background tasks:`, analysisError);
          }

          // If urgent, create escalation log entry (use fresh check since isUrgent is in closure)
          try {
            const { data: freshResponse } = await supabase
              .from("responses")
              .select("urgency_escalated")
              .eq("id", insertedResponse.id)
              .single();
            
            if (freshResponse?.urgency_escalated) {
              console.log(`[${conversationId}] [BACKGROUND] Urgent issue detected, logging escalation...`);
              const { error: escalationError } = await supabase.from("escalation_log").insert({
                response_id: insertedResponse.id,
                escalation_type: 'ai_detected',
                escalated_at: new Date().toISOString(),
              });

              if (escalationError) {
                console.error(`[${conversationId}] [BACKGROUND] Failed to log escalation:`, escalationError);
              } else {
                console.log(`[${conversationId}] [BACKGROUND] ✅ Escalation logged successfully`);
              }
            }
          } catch (escError) {
            console.error(`[${conversationId}] [BACKGROUND] Escalation check error:`, escError);
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
              },
            });
          }
          
          console.log(`[${conversationId}] [BACKGROUND] All background tasks complete`);
        };

        // Fire and forget - don't block the response
        EdgeRuntime.waitUntil(backgroundTask());
        console.log(`[${conversationId}] Background task queued (classification + analysis), returning response immediately`);
      }
    }

    // PERF: Build theme progress from in-memory data instead of re-fetching from DB
    // For non-introduction messages, use previousResponses (already fetched) + the new response
    let updatedResponses: any[] = previousResponses || [];
    if (!isIntroductionTrigger) {
      // Append current response to in-memory list (theme_id is null since classification is background)
      // This is fine - theme progress will be slightly behind by one exchange
      updatedResponses = [...(previousResponses || []), { theme_id: null }];
    }
    
    const themeProgress = buildThemeProgress(
      updatedResponses,
      themes || [],
      null // theme_id for current response not yet available (background classification)
    );

    // If shouldComplete is true, ALWAYS generate structured summary and proper completion flags
    if (shouldComplete && !isIntroductionTrigger) {
      console.log("[chat] Final return with shouldComplete=true - generating structured summary");
      
      // Build conversation context from responses
      const conversationContext = (updatedResponses || previousResponses || [])
        .map((r: any) => r.content)
        .filter(Boolean)
        .join("\n");
      
      // Generate structured summary
      const structuredSummaryPrompt = `Based on this conversation about ${surveyType === 'course_evaluation' ? 'course evaluation' : 'workplace feedback'}, extract:

1. KEY_POINTS: 2-4 bullet points summarizing what the participant shared (each under 15 words)
2. SENTIMENT: overall tone (positive, mixed, or negative)

Conversation content:
${conversationContext || "User shared their thoughts and feedback."}

Return ONLY valid JSON: {"keyPoints": [...], "sentiment": "..."}`;

      let structuredSummary = { keyPoints: ["Thank you for sharing your feedback"], sentiment: "mixed" };
      
      try {
        const summaryResponse = await callAI(
          LOVABLE_API_KEY,
          AI_MODEL_LITE,
          [
            { role: "system", content: "Extract structured insights. Return valid JSON only." },
            { role: "user", content: structuredSummaryPrompt }
          ],
          0.3,
          250
        );
        
        let cleaned = summaryResponse.trim();
        if (cleaned.startsWith('```json')) {
          cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        const parsed = JSON.parse(cleaned);
        if (parsed.keyPoints && Array.isArray(parsed.keyPoints)) {
          structuredSummary = {
            keyPoints: parsed.keyPoints.slice(0, 4),
            sentiment: parsed.sentiment || "mixed"
          };
        }
        console.log("[chat] Generated structured summary:", structuredSummary);
      } catch (e) {
        console.error("[chat] Failed to parse structured summary in final return:", e);
      }

      return new Response(
        JSON.stringify({
          message: aiMessage,
          empathy,
          structuredSummary,
          shouldComplete: false,  // Set to false so user can review before submitting
          isCompletionPrompt: true,  // This triggers the receipt UI
          themeProgress
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normal response (no completion)
    return new Response(
      JSON.stringify({ 
        message: aiMessage,
        empathy: empathy,
        shouldComplete: false,
        themeProgress,
        ...(inputType && inputType !== "text" ? { inputType, inputConfig } : {})
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
