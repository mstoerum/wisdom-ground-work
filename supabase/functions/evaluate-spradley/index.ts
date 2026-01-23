import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EvaluationMessage {
  role: "user" | "assistant";
  content: string;
}

interface InterviewContext {
  themesDiscussed: string[];
  overallSentiment: 'positive' | 'neutral' | 'negative';
  exchangeCount: number;
  duration: number;
  initialMood: number | null;
  keyTopicsMentioned: string[];
}

/**
 * LLM-powered evaluation endpoint that generates contextual follow-up questions
 * based on user responses and interview context
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { 
      action,
      surveyId, 
      conversationSessionId,
      // For "generate_followup" action
      currentDimensionId,
      currentDimensionName,
      userAnswer,
      previousAnswers,
      interviewContext,
      quickRating,
      conversationHistory,
      // For "save" action
      responses, 
      questionsAsked,
      sentiment,
      sentimentScore,
      durationSeconds,
    } = body;

    if (!surveyId || !conversationSessionId) {
      throw new Error("Missing required fields: surveyId and conversationSessionId");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Get user if authenticated
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (!authError && user) {
        userId = user.id;
      }
    }

    // Route based on action
    if (action === "generate_followup") {
      return await generateFollowUp({
        currentDimensionId,
        currentDimensionName,
        userAnswer,
        previousAnswers: previousAnswers || {},
        interviewContext: interviewContext || {},
        quickRating,
        conversationHistory: conversationHistory || [],
        corsHeaders,
      });
    }

    // Default: save action
    return await saveEvaluation({
      supabase,
      surveyId,
      conversationSessionId,
      userId,
      responses: responses || {},
      questionsAsked: questionsAsked || {},
      sentiment: sentiment || "neutral",
      sentimentScore: sentimentScore || 0.5,
      durationSeconds: durationSeconds || 0,
      interviewContext,
      quickRating,
      corsHeaders,
    });

  } catch (error) {
    console.error("Evaluation error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

/**
 * Generate LLM-powered contextual follow-up question
 */
async function generateFollowUp({
  currentDimensionId,
  currentDimensionName,
  userAnswer,
  previousAnswers,
  interviewContext,
  quickRating,
  conversationHistory,
  corsHeaders,
}: {
  currentDimensionId: string;
  currentDimensionName: string;
  userAnswer: string;
  previousAnswers: Record<string, string>;
  interviewContext: InterviewContext;
  quickRating: number | null;
  conversationHistory: EvaluationMessage[];
  corsHeaders: Record<string, string>;
}) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    // Fall back to simple empathy if no API key
    console.warn("LOVABLE_API_KEY not configured, using fallback response");
    return new Response(
      JSON.stringify({
        success: true,
        empathy: getSimpleEmpathy(userAnswer),
        probeQuestion: null,
        shouldProbeDeeper: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const systemPrompt = buildFollowUpSystemPrompt(interviewContext, quickRating, previousAnswers);
  
  const messages = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
    { 
      role: "user", 
      content: `[User just answered the "${currentDimensionName}" question with: "${userAnswer}"]\n\nGenerate a response following your instructions.`
    },
  ];

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        tools: [
          {
            type: "function",
            function: {
              name: "respond_to_feedback",
              description: "Generate an empathetic acknowledgment and optional probing follow-up question",
              parameters: {
                type: "object",
                properties: {
                  empathy: {
                    type: "string",
                    description: "Brief, warm acknowledgment of what the user shared (1-2 sentences max)",
                  },
                  shouldProbeDeeper: {
                    type: "boolean",
                    description: "Whether the response warrants a follow-up probe (only if vague, interesting, or actionable insight potential)",
                  },
                  probeQuestion: {
                    type: "string",
                    description: "Optional short follow-up question to probe deeper (null if not probing)",
                  },
                  detectedSentiment: {
                    type: "string",
                    enum: ["positive", "neutral", "negative", "mixed"],
                    description: "The sentiment detected in the user's response",
                  },
                  keyInsight: {
                    type: "string",
                    description: "Brief summary of the key insight from this response (for analytics)",
                  },
                },
                required: ["empathy", "shouldProbeDeeper", "detectedSentiment"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "respond_to_feedback" } },
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("AI gateway error:", response.status);
      // Fall back to simple response
      return new Response(
        JSON.stringify({
          success: true,
          empathy: getSimpleEmpathy(userAnswer),
          probeQuestion: null,
          shouldProbeDeeper: false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      console.log("Generated follow-up:", result);
      
      return new Response(
        JSON.stringify({
          success: true,
          empathy: result.empathy,
          probeQuestion: result.shouldProbeDeeper ? result.probeQuestion : null,
          shouldProbeDeeper: result.shouldProbeDeeper,
          detectedSentiment: result.detectedSentiment,
          keyInsight: result.keyInsight,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback if parsing fails
    return new Response(
      JSON.stringify({
        success: true,
        empathy: getSimpleEmpathy(userAnswer),
        probeQuestion: null,
        shouldProbeDeeper: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("LLM call failed:", error);
    return new Response(
      JSON.stringify({
        success: true,
        empathy: getSimpleEmpathy(userAnswer),
        probeQuestion: null,
        shouldProbeDeeper: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

/**
 * Build system prompt for follow-up generation
 */
function buildFollowUpSystemPrompt(
  context: InterviewContext,
  quickRating: number | null,
  previousAnswers: Record<string, string>
): string {
  const themesStr = context.themesDiscussed?.length > 0 
    ? context.themesDiscussed.join(", ") 
    : "their work experience";
  
  const ratingContext = quickRating !== null
    ? `They rated their experience ${quickRating}/5.`
    : "";
  
  const previousAnswersSummary = Object.entries(previousAnswers)
    .map(([dim, answer]) => `- ${dim}: "${answer.slice(0, 100)}..."`)
    .join("\n");

  return `You are Spradley's evaluation assistant, gathering brief feedback about the user's experience with our AI interview tool.

CONTEXT:
- The user just completed an AI-powered interview about: ${themesStr}
- Interview duration: ${Math.round((context.duration || 0) / 60)} minutes
- Their overall sentiment during interview: ${context.overallSentiment || 'neutral'}
${ratingContext}
${previousAnswersSummary ? `\nPrevious evaluation answers:\n${previousAnswersSummary}` : ""}

YOUR ROLE:
Generate a warm, empathetic acknowledgment of what the user shared, and optionally a short probing follow-up if their answer:
- Contains a vague but interesting insight ("it was different" → probe: "Different how?")
- Mentions something actionable but lacks detail
- Shows strong emotion worth exploring

GUIDELINES:
- Empathy should be brief (1-2 sentences max), genuine, not generic
- Reference specific words/themes from their response
- Only probe if it adds value - most responses don't need probing
- Probe questions should be short and focused (under 12 words)
- Never be defensive about Spradley
- Keep conversational, not clinical

EXAMPLES:
- User: "It felt more natural than filling out forms" → Empathy: "That's exactly what we're going for." (no probe needed)
- User: "It was okay I guess" → Empathy: "Thanks for the honest take." Probe: "What would have made it feel better than 'okay'?"
- User: "The AI actually understood what I meant" → Empathy: "Glad that came through!" Probe: "Was there a moment that surprised you?"`;
}

/**
 * Simple empathy fallback without LLM
 */
function getSimpleEmpathy(answer: string): string {
  const lower = answer.toLowerCase();
  
  const positiveWords = ["good", "great", "easy", "natural", "helpful", "better", "love", "nice", "enjoyed"];
  const negativeWords = ["hard", "difficult", "confusing", "bad", "worse", "awkward", "frustrating"];
  
  const hasPositive = positiveWords.some(w => lower.includes(w));
  const hasNegative = negativeWords.some(w => lower.includes(w));
  
  if (hasPositive && !hasNegative) {
    const phrases = ["Glad to hear that!", "That's great feedback.", "Thanks for sharing that."];
    return phrases[Math.floor(Math.random() * phrases.length)];
  }
  if (hasNegative) {
    const phrases = ["Thanks for being honest.", "I appreciate the candid feedback.", "That's helpful to know."];
    return phrases[Math.floor(Math.random() * phrases.length)];
  }
  const phrases = ["Thanks for sharing.", "Got it, appreciate your thoughts.", "Noted, thank you."];
  return phrases[Math.floor(Math.random() * phrases.length)];
}

/**
 * Save evaluation to database
 */
async function saveEvaluation({
  supabase,
  surveyId,
  conversationSessionId,
  userId,
  responses,
  questionsAsked,
  sentiment,
  sentimentScore,
  durationSeconds,
  interviewContext,
  quickRating,
  corsHeaders,
}: {
  supabase: any;
  surveyId: string;
  conversationSessionId: string;
  userId: string | null;
  responses: Record<string, string>;
  questionsAsked: Record<string, string>;
  sentiment: string;
  sentimentScore: number;
  durationSeconds: number;
  interviewContext?: InterviewContext;
  quickRating?: number | null;
  corsHeaders: Record<string, string>;
}) {
  // Format responses for storage
  const formattedResponses = Object.entries(responses).map(([dimensionId, answer]) => ({
    dimension_id: dimensionId,
    question_asked: questionsAsked[dimensionId] || "",
    answer: answer,
  }));

  const { data: evaluation, error: insertError } = await supabase
    .from("spradley_evaluations")
    .insert({
      survey_id: surveyId,
      conversation_session_id: conversationSessionId,
      employee_id: userId,
      evaluation_responses: formattedResponses,
      overall_sentiment: sentiment,
      sentiment_score: sentimentScore,
      key_insights: {
        response_count: formattedResponses.length,
        quick_rating: quickRating || null,
        interview_context: interviewContext || null,
        saved_via: "llm_enhanced_endpoint",
      },
      duration_seconds: durationSeconds,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    console.error("Failed to save evaluation:", insertError);
    throw new Error("Failed to save evaluation: " + insertError.message);
  }

  console.log("Evaluation saved successfully:", evaluation?.id);

  return new Response(
    JSON.stringify({
      success: true,
      evaluationId: evaluation?.id,
      sentiment,
      sentimentScore,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
