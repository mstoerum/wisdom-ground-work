import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_MESSAGE_LENGTH = 2000;
const AI_MODEL = "google/gemini-2.5-flash";
const MAX_QUESTIONS = 4; // Keep evaluation short

/**
 * Sanitize user input
 */
const sanitizeContent = (content: string): string => {
  let sanitized = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  const specialCharCount = (sanitized.match(/[<>{}[\]\\|`]/g) || []).length;
  if (specialCharCount > 10) {
    throw new Error("Message contains invalid characters");
  }
  return sanitized.trim();
};

/**
 * Get system prompt for Spradley evaluation with structured framework
 */
const getEvaluationSystemPrompt = (
  messageCount: number,
  conversationContext?: {
    initialMood?: number;
    finalMood?: number;
    messageCount?: number;
    themes?: string[];
    usedVoiceMode?: boolean;
  }
): string => {
  const isFirstMessage = messageCount === 0;
  const contextInfo = conversationContext ? `
CONVERSATION CONTEXT:
- Initial mood: ${conversationContext.initialMood || 'N/A'} / 100
- Final mood: ${conversationContext.finalMood || 'N/A'} / 100
- Total exchanges: ${conversationContext.messageCount || 'N/A'}
- Themes discussed: ${conversationContext.themes?.join(', ') || 'N/A'}
- Used voice mode: ${conversationContext.usedVoiceMode ? 'Yes' : 'No'}
` : '';
  
  if (isFirstMessage) {
    return `You are Spradley, an AI conversation guide. You just finished conducting a survey with a user, and now you're asking them to evaluate their experience with you and the Spradley platform.

${contextInfo}

EVALUATION FRAMEWORK - Follow this structured approach:

**Question 1 (Overall Experience)**: Start with a broad, open question that captures their overall impression:
"Thank you for completing the survey! I'd love to hear about your experience. Overall, how did you find this conversation compared to traditional surveys? Did it feel more natural, or was there anything that felt different or off?"

**Question 2 (Specific Dimension - Ease of Use)**: Based on their response, probe into a specific dimension:
- If positive: "What specifically made it feel natural? Was it easier to express yourself in conversation vs filling out a form?"
- If negative: "I'd like to understand what felt off. Was it the AI responses, the flow, or something else?"

**Question 3 (Specific Dimension - Conversation Quality)**: Ask about the AI interaction:
"Did I understand your responses well, or did you find yourself needing to rephrase things? How was the back-and-forth conversation?"

**Question 4 (Value & Comparison)**: Understand the value proposition:
"How does this compare to other feedback methods you've used? What would make you want to use this again?"

**Question 5 (Closing)**: Wrap up with appreciation:
"Thank you so much! Your feedback helps us improve Spradley for everyone. Is there anything else you'd like to share?"

GUIDELINES:
- Keep questions concise (1-2 sentences max)
- Be warm, appreciative, and genuinely curious
- Ask ONE question at a time
- Adapt follow-up questions based on their responses
- If they mention something specific (e.g., "voice mode was confusing"), probe deeper
- After 4-5 exchanges total, wrap up with appreciation
- Keep the entire evaluation conversational and under 2 minutes

Remember: Frame this as "helping improve Spradley" not "evaluating you". Their honest feedback is valuable.`;
  }

  return `You are Spradley, gathering structured feedback about the user's experience with the AI chat survey.

${contextInfo}

Continue the conversation using this structured framework:

**Current Progress**: You've asked ${messageCount} question(s) so far.

**Next Steps**:
- If they gave a general response, ask about a SPECIFIC dimension (ease of use, conversation quality, trust, value)
- If they mentioned something specific, probe deeper: "Can you tell me more about [that specific thing]?"
- If they're very positive, ask: "What specifically worked well? What made it better than [traditional method]?"
- If they're negative, ask: "I'd like to understand better. What specifically was [the issue]? How could we improve it?"

**Evaluation Dimensions to Cover**:
1. Overall experience & comparison to traditional surveys
2. Ease of use & conversation flow
3. AI understanding & response quality
4. Trust & comfort level
5. Value & likelihood to use again

**Guidelines**:
- Ask ONE specific question at a time
- Be genuinely curious and appreciative
- If they mention a feature (voice mode, trust indicators, etc.), ask about that specifically
- After 4-5 total exchanges, wrap up: "Thank you so much! Your feedback helps us improve Spradley. Is there anything else you'd like to share?"

Remember: This is about improving Spradley, so be genuinely curious and ask specific, behavior-focused questions.`;
};

/**
 * Call AI gateway
 */
const callAI = async (apiKey: string, messages: any[]): Promise<string> => {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 300,
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { surveyId, conversationSessionId, messages } = await req.json();

    if (!surveyId || !conversationSessionId || !Array.isArray(messages) || messages.length === 0) {
      throw new Error("Missing required fields");
    }

    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify user is authenticated
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Verify survey exists and evaluation is enabled
    const { data: survey, error: surveyError } = await supabase
      .from("surveys")
      .select("consent_config, themes")
      .eq("id", surveyId)
      .single();

    if (surveyError || !survey) {
      throw new Error("Survey not found");
    }

    const consentConfig = survey.consent_config as any;
    if (!consentConfig?.enable_spradley_evaluation) {
      throw new Error("Evaluation not enabled for this survey");
    }

    // Fetch conversation context for better evaluation questions
    const { data: session } = await supabase
      .from("conversation_sessions")
      .select("initial_mood, final_mood, mood_selection")
      .eq("id", conversationSessionId)
      .single();

    // Count messages in the original conversation
    // Based on migration 20251023083040, column is conversation_session_id
    const { count: responseCount } = await supabase
      .from("responses")
      .select("*", { count: "exact", head: true })
      .eq("conversation_session_id", conversationSessionId);

    // Check if voice mode was used (simplified - could be enhanced)
    // Based on migration, column is content (not message_text)
    const { data: responses } = await supabase
      .from("responses")
      .select("content")
      .eq("conversation_session_id", conversationSessionId)
      .limit(5);

    const usedVoiceMode = responses?.some(r => {
      const text = (r.content || "").toLowerCase();
      return text.includes("voice") || text.includes("speak");
    }) || false;

    const conversationContext = {
      initialMood: session?.initial_mood || session?.mood_selection?.initial || null,
      finalMood: session?.final_mood || session?.mood_selection?.final || null,
      messageCount: responseCount || 0,
      themes: (survey.themes as string[]) || [],
      usedVoiceMode,
    };

    // Validate and sanitize last message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "user") {
      throw new Error("Last message must be from user");
    }

    const sanitizedContent = sanitizeContent(lastMessage.content);
    if (sanitizedContent.length === 0 || sanitizedContent.length > MAX_MESSAGE_LENGTH) {
      throw new Error("Invalid message content");
    }

    // Get AI API key
    const aiApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!aiApiKey) {
      throw new Error("AI API key not configured");
    }

    // Build system prompt with context
    const userMessageCount = messages.filter(m => m.role === "user").length;
    const systemPrompt = getEvaluationSystemPrompt(userMessageCount - 1, conversationContext);

    // Prepare messages for AI
    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map(m => ({
        role: m.role,
        content: m.role === "user" ? sanitizeContent(m.content) : m.content,
      })),
    ];

    // Call AI
    const aiResponse = await callAI(aiApiKey, aiMessages);

    // Analyze sentiment of user's last message for adaptive questioning
    const lastUserMessage = messages.filter(m => m.role === "user").pop()?.content || "";
    let sentiment = "neutral";
    let sentimentScore = 0.5;
    
    if (lastUserMessage) {
      try {
        const sentimentResponse = await callAI(aiApiKey, [
          { role: "system", content: "Analyze sentiment. Reply with only: positive, neutral, or negative" },
          { role: "user", content: lastUserMessage }
        ]);
        sentiment = sentimentResponse.toLowerCase().trim();
        sentimentScore = sentiment === "positive" ? 0.75 : sentiment === "negative" ? 0.25 : 0.5;
      } catch (error) {
        console.error("Sentiment analysis failed:", error);
        // Default to neutral if analysis fails
      }
    }

    // Determine if conversation should complete
    // Complete after 4-5 exchanges or if AI indicates completion
    const shouldComplete = userMessageCount >= 4 || 
      (userMessageCount >= 3 && (
        aiResponse.toLowerCase().includes("thank you") ||
        aiResponse.toLowerCase().includes("appreciate") ||
        aiResponse.toLowerCase().includes("anything else")
      ));

    return new Response(
      JSON.stringify({
        message: aiResponse,
        shouldComplete,
        sentiment: sentiment,
        sentimentScore: sentimentScore,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Evaluation error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
