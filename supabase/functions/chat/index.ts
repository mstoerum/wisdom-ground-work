import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, messages } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch conversation and survey details with themes
    const { data: session } = await supabase
      .from("conversation_sessions")
      .select(`
        survey_id, 
        surveys(
          themes, 
          first_message
        )
      `)
      .eq("id", conversationId)
      .single();

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
    const shouldComplete = turnCount >= 8;

    // Build conversation context summary
    let conversationContext = "";
    if (previousResponses && previousResponses.length > 0) {
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
      
      conversationContext = `
CONVERSATION CONTEXT:
- Topics already discussed: ${discussedThemes.size > 0 ? Array.from(discussedThemes).join(", ") : "None yet"}
- Recent sentiment pattern: ${sentimentPattern.join(" → ")}
- Exchange count: ${previousResponses.length}
${previousResponses.length > 0 ? `- Key points mentioned earlier: "${previousResponses.slice(0, 2).map(r => r.content.substring(0, 60)).join('"; "')}"` : ""}

ADAPTIVE INSTRUCTIONS:
${sentimentPattern[sentimentPattern.length - 1] === "negative" ? 
  "- The employee is sharing challenges. Use empathetic, validating language. Acknowledge their feelings." : ""}
${sentimentPattern[sentimentPattern.length - 1] === "positive" ? 
  "- The employee is positive. Great! Also gently explore if there are any challenges to ensure balanced feedback." : ""}
${discussedThemes.size > 0 && discussedThemes.size < themeIds.length ? 
  `- Themes not yet covered: ${themeIds.filter((id: any) => !Array.from(discussedThemes).includes(themes?.find((t: any) => t.id === id)?.name)).map((id: any) => themes?.find((t: any) => t.id === id)?.name).filter(Boolean).join(", ")}. Transition naturally to explore these.` : ""}
${previousResponses.length >= 3 ? "- Reference earlier points when relevant to show you're listening and building on what they've shared." : ""}
`;
    }

    // System prompt for empathetic conversational AI with adaptive behavior
    const systemPrompt = `You are a compassionate, empathetic AI assistant conducting a confidential employee feedback conversation. 

Your goals:
- Create a safe, non-judgmental space for honest feedback
- Ask thoughtful follow-up questions to understand nuances
- Show empathy and active listening
- Guide conversation naturally through work experience, challenges, and suggestions
- Keep responses warm, concise, and conversational (2-3 sentences max)
- Probe deeper on important topics without being repetitive
- Recognize emotional cues and respond appropriately
- Reference earlier points naturally when building on topics

Conversation flow:
1. Start with open-ended questions about their current experience
2. Explore challenges with curiosity and care
3. Ask about positive aspects to balance the conversation
4. Invite suggestions for improvement
5. Naturally transition between themes after 3-4 exchanges on one topic
6. Naturally conclude when sufficient depth is reached (after 8-12 exchanges)

${conversationContext}

Remember: Your tone should be warm, professional, and genuinely interested in understanding their perspective. Adapt your approach based on their sentiment and what they've already shared.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        temperature: 0.8,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("AI gateway error:", response.status, error);
      throw new Error("Failed to get AI response");
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message.content;

    // Analyze sentiment
    const sentimentResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Analyze sentiment. Reply with only: positive, neutral, or negative" },
          { role: "user", content: messages[messages.length - 1].content }
        ],
        temperature: 0.3,
        max_tokens: 10,
      }),
    });

    const sentimentData = await sentimentResponse.json();
    const sentiment = sentimentData.choices[0].message.content.toLowerCase().trim();
    const sentimentScore = sentiment === "positive" ? 75 : sentiment === "negative" ? 25 : 50;

    // Detect theme
    let detectedThemeId = null;
    if (themes && themes.length > 0) {
      const themePrompt = `Classify this employee feedback into ONE of these themes:
${themes.map(t => `- ${t.name}: ${t.description}`).join('\n')}

Employee feedback: "${messages[messages.length - 1].content}"

Reply with only the exact theme name.`;

      const themeResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [{ role: "user", content: themePrompt }],
          temperature: 0.2,
          max_tokens: 20,
        }),
      });

      if (themeResponse.ok) {
        const themeData = await themeResponse.json();
        const themeName = themeData.choices[0].message.content.trim();
        const matchedTheme = themes.find(t => 
          themeName.toLowerCase().includes(t.name.toLowerCase())
        );
        if (matchedTheme) {
          detectedThemeId = matchedTheme.id;
        }
      }
    }

    // Detect urgency
    const urgencyPrompt = `Analyze if this employee feedback indicates an URGENT issue requiring immediate HR attention. 
Urgent issues include: harassment, safety concerns, severe mental health crisis, threats, discrimination, or illegal activity.

Employee feedback: "${messages[messages.length - 1].content}"

Reply with only: urgent OR not-urgent`;

    const urgencyResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: urgencyPrompt }],
        temperature: 0.1,
        max_tokens: 10,
      }),
    });

    const urgencyData = await urgencyResponse.json();
    const isUrgent = urgencyData.choices[0].message.content.toLowerCase().includes('urgent');

    // Store response in database with theme and urgency
    const { data: insertedResponse, error: insertError } = await supabase
      .from("responses")
      .insert({
        conversation_session_id: conversationId,
        survey_id: session?.survey_id,
        content: messages[messages.length - 1].content,
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

    return new Response(
      JSON.stringify({ 
        message: aiMessage,
        shouldComplete: shouldComplete 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
