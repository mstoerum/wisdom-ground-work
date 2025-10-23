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

    // System prompt for empathetic conversational AI
    const systemPrompt = `You are a compassionate, empathetic AI assistant conducting a confidential employee feedback conversation. 

Your goals:
- Create a safe, non-judgmental space for honest feedback
- Ask thoughtful follow-up questions to understand nuances
- Show empathy and active listening
- Guide conversation naturally through work experience, challenges, and suggestions
- Keep responses warm, concise, and conversational (2-3 sentences max)
- Probe deeper on important topics without being repetitive
- Recognize emotional cues and respond appropriately

Conversation flow:
1. Start with open-ended questions about their current experience
2. Explore challenges with curiosity and care
3. Ask about positive aspects to balance the conversation
4. Invite suggestions for improvement
5. Naturally conclude when sufficient depth is reached (after 8-12 exchanges)

Remember: Your tone should be warm, professional, and genuinely interested in understanding their perspective.`;

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

    // Store response in database
    await supabase.from("responses").insert({
      conversation_session_id: conversationId,
      content: messages[messages.length - 1].content,
      ai_response: aiMessage,
    });

    return new Response(
      JSON.stringify({ message: aiMessage }),
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
