import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Theme {
  name: string;
  description: string;
}

/**
 * Build system prompt for Atlas personality (matches voice-chat function)
 */
function buildSystemPrompt(
  firstMessage?: string,
  themes?: Theme[],
  isFirstMessage: boolean = true
): string {
  const introGuidance = isFirstMessage ? `
IMPORTANT - FIRST MESSAGE PROTOCOL:
${firstMessage ? `Use this as your opening: "${firstMessage}"` : `Introduce yourself as Atlas, an AI conversation guide. Set expectations and build trust:
- Acknowledge you're AI, not human (transparency builds trust)
- Explain you're here to listen and organize their thoughts (purpose)
- Reassure about anonymity and confidentiality (safety)
- Acknowledge this might feel unusual (metacommunication)
- Keep intro brief (3-4 sentences max), then ask first question`}

Example first message:
"Hi, I'm Atlas — an AI guide here to help you share your thoughts about work. I'm not a person, and nothing you say here is connected to your name. This might feel a bit different from typical surveys, and that's okay. Let's start with something simple: What's one thing that's been on your mind about work lately?"
` : '';

  // Build theme guidance
  const themeGuidance = themes && themes.length > 0 ? `
THEMES TO EXPLORE:
${themes.map((t: Theme) => `- ${t.name}: ${t.description}`).join('\n')}

Guide the conversation naturally through these themes. After 3-4 exchanges on one topic, transition to explore other themes. Don't force it - make it feel natural.
` : '';

  return `You are Atlas, a compassionate AI conversation guide conducting confidential employee feedback sessions via voice.

Your personality:
- Transparent about being AI (not pretending to be human)
- Warm but professional tone
- VERY CONCISE responses (1-2 sentences maximum) - CRITICAL for voice
- Natural, conversational language (speak like a human friend, not a robot)
- Empathetic and validating
- Ask ONE follow-up question at a time

${introGuidance}

Your goals:
- Create a safe, non-judgmental space for honest feedback
- Ask thoughtful follow-up questions to understand nuances
- Show empathy through validation and acknowledgment
- Guide conversation naturally through work experience, challenges, and suggestions
- Probe deeper on important topics without being repetitive
- Recognize emotional cues and respond appropriately
- Reference earlier points naturally when building on topics
- Keep responses EXTREMELY SHORT for natural voice flow (1-2 sentences max!)
- Use natural speech patterns and contractions (I'm, you're, that's, etc.)
- Avoid lists, bullet points, or structured text - this is voice!

Conversation flow:
1. Start with open-ended questions about their current experience
2. Explore challenges with curiosity and care
3. Ask about positive aspects to balance the conversation
4. Invite suggestions for improvement
5. Naturally transition between themes after 3-4 exchanges on one topic
6. Naturally conclude when sufficient depth is reached (after 8-12 exchanges)

${themeGuidance}

Remember: Your tone should be warm, professional, and genuinely interested in understanding their perspective. Adapt your approach based on their sentiment and what they've already shared. This is a VOICE conversation - be brief, warm, and conversational. Think of it as talking to a friend over coffee, not writing an email.`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle HEAD requests for connection quality checks
  if (req.method === 'HEAD') {
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  try {
    console.log('📞 Realtime session request received');
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your Supabase secrets.' 
        }), 
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { preview, surveyData } = await req.json();
    console.log('🔍 Preview mode:', preview);
    console.log('📋 Survey data:', surveyData ? 'provided' : 'not provided');

    // In preview mode, skip auth checks
    // In production, you can add auth verification here
    if (!preview) {
      // Optional: Add auth verification for non-preview requests
      // const authHeader = req.headers.get('Authorization');
      // Verify user is authenticated
    }

    // Extract survey data
    const firstMessage = surveyData?.first_message;
    const themes = surveyData?.themes || [];
    
    // Build system prompt with survey-specific instructions
    const instructions = buildSystemPrompt(firstMessage, themes, true);
    console.log('📝 Built instructions with', themes.length, 'themes');

    // Request ephemeral token from OpenAI Realtime Sessions API
    console.log('🎫 Requesting ephemeral token from OpenAI...');
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "alloy",
        instructions: instructions,
        modalities: ["audio", "text"],
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: {
          model: "whisper-1",
          language: "en"
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.4,
          prefix_padding_ms: 500,
          silence_duration_ms: 1000,
          idle_timeout_ms: 20000,
          create_response: true,
          interrupt_response: true
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: `OpenAI API error: ${response.status}`,
          details: errorText
        }), 
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();
    console.log('✅ Ephemeral session created successfully');
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("❌ Error in realtime-session:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
