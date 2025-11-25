import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { survey_id, audience = 'executive' } = await req.json();

    if (!survey_id) {
      return new Response(
        JSON.stringify({ error: 'survey_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header for generated_by
    const authHeader = req.headers.get('authorization');
    let userId = null;
    if (authHeader) {
      const { data: { user } } = await createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!)
        .auth.getUser(authHeader.replace('Bearer ', ''));
      userId = user?.id;
    }

    console.log(`Generating narrative report for survey: ${survey_id}`);

    // Fetch all relevant data
    const [
      { data: surveyAnalytics },
      { data: responses },
      { data: sessionInsights },
      { data: sessions },
      { data: survey }
    ] = await Promise.all([
      supabase
        .from('survey_analytics')
        .select('*')
        .eq('survey_id', survey_id)
        .order('analyzed_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('responses')
        .select('*')
        .eq('survey_id', survey_id)
        .order('created_at', { ascending: false }),
      supabase
        .from('session_insights')
        .select('*, conversation_sessions!inner(survey_id)')
        .eq('conversation_sessions.survey_id', survey_id),
      supabase
        .from('conversation_sessions')
        .select('*')
        .eq('survey_id', survey_id)
        .eq('status', 'completed'),
      supabase
        .from('surveys')
        .select('*')
        .eq('id', survey_id)
        .single()
    ]);

    if (!survey) {
      return new Response(
        JSON.stringify({ error: 'Survey not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare context for LLM
    const context = {
      survey_title: survey.title,
      survey_type: survey.survey_type,
      total_sessions: sessions?.length || 0,
      total_responses: responses?.length || 0,
      analytics: surveyAnalytics,
      sample_responses: responses?.slice(0, 50).map(r => ({
        id: r.id,
        content: r.content,
        sentiment: r.sentiment,
        sentiment_score: r.sentiment_score,
        urgency_score: r.urgency_score,
        theme_id: r.theme_id
      })),
      session_insights: sessionInsights?.map(si => ({
        root_cause: si.root_cause,
        sentiment_trajectory: si.sentiment_trajectory,
        key_quotes: si.key_quotes,
        recommended_actions: si.recommended_actions
      }))
    };

    // Generate narrative using Lovable AI
    const prompt = `You are an expert organizational analyst creating an executive narrative report. 

Survey: ${context.survey_title}
Type: ${context.survey_type}
Completed Sessions: ${context.total_sessions}
Total Responses: ${context.total_responses}

Analytics Summary:
${surveyAnalytics ? JSON.stringify(surveyAnalytics, null, 2) : 'No deep analytics available yet'}

Sample Responses:
${JSON.stringify(context.sample_responses || [], null, 2)}

Session Insights:
${JSON.stringify(context.session_insights || [], null, 2)}

Create a compelling 5-chapter narrative report that tells the story of what's happening in this organization. Each chapter should:
1. Be written in engaging, human language (not corporate jargon)
2. Include specific, evidence-backed insights with response IDs for drill-down
3. Have confidence scores (1-5) for each insight

The 5 chapters are:
1. "The Pulse" - Overall organizational health and mood
2. "What's Working" - Strengths and positive patterns
3. "Warning Signs" - Areas of concern that need attention
4. "The Why" - Root causes and deeper patterns
5. "The Path Forward" - Actionable recommendations

${audience === 'executive' ? 'Keep it concise and high-level. Executives want the big picture.' : 'Provide detailed analysis with nuance. Managers need actionable specifics.'}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: 'You are an expert organizational analyst. Create narrative reports that are insightful, evidence-based, and actionable.' },
          { role: 'user', content: prompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'create_narrative_report',
              description: 'Generate a structured narrative report with chapters and insights',
              parameters: {
                type: 'object',
                properties: {
                  chapters: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        key: { type: 'string', enum: ['pulse', 'working', 'warnings', 'why', 'forward'] },
                        narrative: { type: 'string', description: 'The main story prose' },
                        insights: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              text: { type: 'string' },
                              confidence: { type: 'integer', minimum: 1, maximum: 5 },
                              evidence_ids: { 
                                type: 'array', 
                                items: { type: 'string' },
                                description: 'Response IDs that support this insight'
                              },
                              category: { type: 'string' }
                            },
                            required: ['text', 'confidence', 'evidence_ids']
                          }
                        }
                      },
                      required: ['title', 'key', 'narrative', 'insights']
                    }
                  },
                  overall_confidence: { type: 'integer', minimum: 1, maximum: 5 }
                },
                required: ['chapters', 'overall_confidence'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'create_narrative_report' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      throw new Error(`Lovable AI request failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const narrativeData = JSON.parse(toolCall.function.arguments);

    // Mark previous reports as not latest
    await supabase
      .from('narrative_reports')
      .update({ is_latest: false })
      .eq('survey_id', survey_id);

    // Store the generated report
    const { data: savedReport, error: saveError } = await supabase
      .from('narrative_reports')
      .insert({
        survey_id,
        generated_by: userId || '00000000-0000-0000-0000-000000000000',
        chapters: narrativeData.chapters,
        audience_config: { audience },
        data_snapshot: {
          total_sessions: context.total_sessions,
          total_responses: context.total_responses,
          generated_from_analytics: !!surveyAnalytics
        },
        confidence_score: narrativeData.overall_confidence,
        is_latest: true
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving report:', saveError);
      throw saveError;
    }

    console.log('Narrative report generated successfully:', savedReport.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        report: savedReport,
        message: 'Narrative report generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-narrative-report:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
