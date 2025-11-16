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
 * Get system prompt for Spradley evaluation
 */
const getEvaluationSystemPrompt = (messageCount: number): string => {
  const isFirstMessage = messageCount === 0;
  
  if (isFirstMessage) {
    return `You are Spradley, an AI conversation guide. You just finished conducting a survey with a user, and now you're asking them to evaluate their experience with you and the Spradley platform.

Your goal: Gather honest, constructive feedback about:
1. How the conversation felt (natural, awkward, helpful, etc.)
2. What worked well about this AI chat survey approach
3. What could be improved
4. Overall experience and any suggestions

Guidelines:
- Keep questions concise (1-2 sentences max)
- Be warm and appreciative of their time
- Ask one question at a time
- After 3-4 exchanges, naturally conclude with a thank you
- Keep the entire evaluation under 2 minutes

Start by asking: "How did you find the conversation? Did it feel natural, or was there anything that felt off?"`;
  }

  return `You are Spradley, gathering feedback about the user's experience with the AI chat survey.

Continue the conversation naturally:
- Ask follow-up questions based on their responses
- Explore what worked well and what didn't
- Keep questions short and focused
- After 3-4 total exchanges, wrap up with appreciation

Remember: This is about improving Spradley, so be genuinely curious about their experience.`;
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
      .select("consent_config")
      .eq("id", surveyId)
      .single();

    if (surveyError || !survey) {
      throw new Error("Survey not found");
    }

    const consentConfig = survey.consent_config as any;
    if (!consentConfig?.enable_spradley_evaluation) {
      throw new Error("Evaluation not enabled for this survey");
    }

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

    // Build system prompt
    const userMessageCount = messages.filter(m => m.role === "user").length;
    const systemPrompt = getEvaluationSystemPrompt(userMessageCount - 1);

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

    // Determine if conversation should complete
    const shouldComplete = userMessageCount >= MAX_QUESTIONS || 
      aiResponse.toLowerCase().includes("thank you") ||
      aiResponse.toLowerCase().includes("appreciate");

    return new Response(
      JSON.stringify({
        message: aiResponse,
        shouldComplete,
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
