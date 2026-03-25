import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Filter out UI completion signals like [SELECTED: I'm all good]
 */
function isSubstantiveResponse(content: string): boolean {
  if (!content || !content.trim()) return false;
  if (content.trim().startsWith('[SELECTED:')) return false;
  return true;
}

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

    // Fetch all relevant data INCLUDING theme_analytics
    const [
      { data: surveyAnalytics },
      { data: allResponses },
      { data: sessionInsights },
      { data: sessions },
      { data: survey },
      { data: themeAnalytics }
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
        .select('*, survey_themes(name)')
        .eq('survey_id', survey_id)
        .order('created_at', { ascending: true }),
      supabase
        .from('session_insights')
        .select('*, conversation_sessions!inner(survey_id)')
        .eq('conversation_sessions.survey_id', survey_id),
      supabase
        .from('conversation_sessions')
        .select('*')
        .eq('survey_id', survey_id),
      supabase
        .from('surveys')
        .select('*')
        .eq('id', survey_id)
        .single(),
      supabase
        .from('theme_analytics')
        .select('*, survey_themes!inner(name, description)')
        .eq('survey_id', survey_id)
    ]);

    if (!survey) {
      return new Response(
        JSON.stringify({ error: 'Survey not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter substantive responses and count accurately
    const substantiveResponses = (allResponses || []).filter((r: any) => isSubstantiveResponse(r.content));
    const completedSessions = (sessions || []).filter((s: any) => s.status === 'completed');
    const totalSessions = sessions?.length || 0;
    const totalParticipants = totalSessions; // Each session = 1 participant

    // Build theme analytics summary for the prompt
    const themeInsightsSummary = (themeAnalytics || []).map((ta: any) => ({
      theme_name: ta.survey_themes?.name || 'Unknown',
      theme_description: ta.survey_themes?.description || '',
      health_index: ta.health_index,
      health_status: ta.health_status,
      response_count: ta.response_count,
      polarization_level: ta.polarization_level,
      frictions: ta.insights?.frictions || [],
      strengths: ta.insights?.strengths || [],
      patterns: ta.insights?.patterns || [],
      root_causes: ta.root_causes || []
    }));

    // Build Q&A paired response data grouped by session
    const sessionResponseMap = new Map<string, any[]>();
    for (const r of substantiveResponses) {
      const sessionId = r.conversation_session_id || 'unknown';
      const list = sessionResponseMap.get(sessionId) || [];
      list.push(r);
      sessionResponseMap.set(sessionId, list);
    }

    const sessionSummaries: string[] = [];
    let sessionIdx = 0;
    for (const [, resps] of sessionResponseMap) {
      sessionIdx++;
      const pairs = resps.map((r: any) => {
        const q = r.ai_response ? `Q: "${r.ai_response}"` : '';
        const themeName = r.survey_themes?.name || 'Unassigned';
        return `${q}\nA: "${r.content}" [ID:${r.id}] (theme: ${themeName}, sentiment: ${r.sentiment})`;
      }).join('\n');
      sessionSummaries.push(`--- Participant ${sessionIdx} (${resps.length} exchanges) ---\n${pairs}`);
    }

    // Build the prompt with all available data
    const hasThemeAnalytics = themeInsightsSummary.length > 0;
    
    const prompt = `You are an expert organizational analyst creating a narrative report for HR leadership.

SURVEY CONTEXT:
- Title: "${survey.title}"
- Type: ${survey.survey_type}
- Total participants (unique conversations): ${totalParticipants}
- Substantive response exchanges: ${substantiveResponses.length}
- Completed sessions: ${completedSessions.length} of ${totalSessions}

${hasThemeAnalytics ? `
THEME ANALYSIS (pre-computed, use as foundation):
${JSON.stringify(themeInsightsSummary, null, 2)}
` : ''}

${surveyAnalytics ? `
DEEP ANALYTICS:
${JSON.stringify(surveyAnalytics, null, 2)}
` : ''}

SESSION INSIGHTS:
${(sessionInsights || []).length > 0 ? JSON.stringify(sessionInsights?.map((si: any) => ({
  root_cause: si.root_cause,
  sentiment_trajectory: si.sentiment_trajectory,
  key_quotes: si.key_quotes,
  recommended_actions: si.recommended_actions
})), null, 2) : 'No session-level insights available'}

CONVERSATION DATA (Q&A pairs grouped by participant):
${sessionSummaries.join('\n\n')}

CRITICAL RULES:
1. There are ${totalParticipants} participants, NOT ${substantiveResponses.length}. Each participant had a multi-turn conversation.
2. Use ACTUAL voice counts: "3 of ${totalParticipants} participants" not fabricated percentages.
3. sample_size must reflect the actual number of responses supporting each insight.
4. agreement_percentage should be (sample_size / total_relevant_responses) * 100, based on actual data.
5. Reference specific response IDs (evidence_ids) for drill-down.
6. ${hasThemeAnalytics ? 'Build on the pre-computed theme analysis above — don\'t contradict its findings, extend them into a narrative.' : 'Analyze the raw conversation data to extract insights.'}

Create a 5-chapter narrative report:
1. "The Voices" (key: voices) - Who participated and the quality of dialogue. ${totalParticipants} people shared ${substantiveResponses.length} substantive exchanges.
2. "The Landscape" (key: landscape) - The organizational terrain across themes. Show what's working and where energy is.
3. "Frictions" (key: frictions) - Points of tension. Be specific about what people actually said.
4. "Root Causes" (key: root_causes) - Why patterns exist. ${hasThemeAnalytics ? 'Use the pre-computed root causes as starting points.' : 'Infer from the conversation data.'}
5. "The Path Forward" (key: forward) - Concrete, actionable recommendations prioritized by impact.

${audience === 'executive' ? 'Keep it concise and strategic. Executives want the big picture and key actions.' : 'Provide detailed analysis. Managers need specifics they can act on with their teams.'}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: 'You are an expert organizational analyst. Create narrative reports that are insightful, evidence-based, and actionable. Always use actual voice counts from the data, never fabricate statistics.' },
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
                        key: { type: 'string', enum: ['voices', 'landscape', 'frictions', 'root_causes', 'forward'] },
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
                              category: { type: 'string' },
                              agreement_percentage: { 
                                type: 'integer', 
                                minimum: 0, 
                                maximum: 100,
                                description: 'Actual percentage based on real voice counts'
                              },
                              sample_size: { 
                                type: 'integer',
                                minimum: 0,
                                description: 'Actual number of responses supporting this insight'
                              }
                            },
                            required: ['text', 'confidence', 'evidence_ids', 'agreement_percentage', 'sample_size']
                          }
                        }
                      },
                      required: ['title', 'key', 'narrative', 'insights']
                    }
                  },
                  overall_confidence: { type: 'integer', minimum: 1, maximum: 5 }
                },
                required: ['chapters', 'overall_confidence']
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
          total_sessions: totalSessions,
          total_participants: totalParticipants,
          total_responses: substantiveResponses.length,
          generated_from_analytics: !!surveyAnalytics,
          has_theme_analytics: hasThemeAnalytics,
          themes_analyzed: themeInsightsSummary.length
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
