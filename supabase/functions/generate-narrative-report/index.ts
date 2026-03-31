import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- K-Anonymity Helpers ---

function getKThreshold(totalParticipants: number): number {
  return totalParticipants <= 10 ? 3 : 5;
}

function isKAnonymous(sampleSize: number, totalParticipants: number): boolean {
  return sampleSize >= getKThreshold(totalParticipants);
}

function selectSafeQuotes(
  quotes: Array<{ text: string; session_id?: string }>,
  totalParticipants: number
): Array<{ text: string }> {
  const k = getKThreshold(totalParticipants);
  if (quotes.length < k) return []; // Not enough quotes to be safe
  // Return quotes without session_id to prevent linkage
  return quotes.slice(0, 5).map(q => ({ text: q.text }));
}

// --- Evidence Enrichment ---

function enrichInsights(
  chapters: any[],
  clusterMap: Map<string, any>,
  totalParticipants: number
): any[] {
  return chapters.map(chapter => ({
    ...chapter,
    insights: (chapter.insights || []).map((insight: any) => {
      // Cap sample_size at totalParticipants
      const rawSampleSize = insight.sample_size || 0;
      const correctedSampleSize = Math.min(rawSampleSize, totalParticipants);

      // Correct agreement_percentage based on actual sample
      const correctedAgreement = totalParticipants > 0
        ? Math.round((correctedSampleSize / totalParticipants) * 100)
        : 0;

      // If cluster_id provided, validate and enrich evidence
      let evidenceIds = insight.evidence_ids || [];
      if (insight.cluster_id && clusterMap.has(insight.cluster_id)) {
        const cluster = clusterMap.get(insight.cluster_id);
        if (evidenceIds.length === 0) {
          evidenceIds = (cluster.opinion_unit_ids || []).slice(0, 5);
        }
      }

      return {
        ...insight,
        sample_size: correctedSampleSize,
        agreement_percentage: correctedAgreement,
        evidence_ids: evidenceIds,
        is_k_anonymous: isKAnonymous(correctedSampleSize, totalParticipants),
      };
    }),
  }));
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

    // Get user ID from auth header
    const authHeader = req.headers.get('authorization');
    let userId = null;
    if (authHeader) {
      const { data: { user } } = await createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!)
        .auth.getUser(authHeader.replace('Bearer ', ''));
      userId = user?.id;
    }

    console.log(`Generating narrative report v2 for survey: ${survey_id}, audience: ${audience}`);

    // Fetch all pipeline data in parallel
    const [
      { data: survey },
      { data: clusters },
      { data: syntheses },
      { data: surveyAnalytics },
      { data: sessions },
      { data: commitments },
      { data: themeRows }
    ] = await Promise.all([
      supabase.from('surveys').select('*').eq('id', survey_id).single(),
      supabase.from('discovered_clusters')
        .select('*')
        .eq('survey_id', survey_id)
        .order('unit_count', { ascending: false }),
      supabase.from('session_syntheses')
        .select('*')
        .eq('survey_id', survey_id),
      supabase.from('survey_analytics')
        .select('*')
        .eq('survey_id', survey_id)
        .order('analyzed_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from('conversation_sessions')
        .select('id, status, started_at, ended_at')
        .eq('survey_id', survey_id),
      supabase.from('action_commitments')
        .select('*')
        .eq('survey_id', survey_id),
      supabase.from('survey_themes')
        .select('id, name')
    ]);

    // Build theme name lookup
    const themeNameMap = new Map<string, string>();
    for (const t of (themeRows || [])) {
      themeNameMap.set(t.id, t.name);
    }

    if (!survey) {
      return new Response(
        JSON.stringify({ error: 'Survey not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Compute aggregate stats from opinion_units directly
    const { data: ouAggRaw } = await supabase
      .from('opinion_units')
      .select('id, sentiment, intensity, is_actionable, escalation_level')
      .eq('survey_id', survey_id);

    const opinionUnits = ouAggRaw || [];
    const totalUnits = opinionUnits.length;
    const actionableCount = opinionUnits.filter(u => u.is_actionable).length;
    const escalationBreakdown = {
      high: opinionUnits.filter(u => u.escalation_level === 'high').length,
      medium: opinionUnits.filter(u => u.escalation_level === 'medium').length,
      none: opinionUnits.filter(u => u.escalation_level === 'none').length,
    };
    const avgSentiment = totalUnits > 0
      ? opinionUnits.reduce((s, u) => s + (u.sentiment || 0), 0) / totalUnits
      : 0;

    const totalSessions = sessions?.length || 0;
    const completedSessions = (sessions || []).filter(s => s.status === 'completed').length;
    const totalParticipants = totalSessions;
    const k = getKThreshold(totalParticipants);

    // Build cluster map for evidence enrichment
    const clusterMap = new Map<string, any>();
    for (const c of (clusters || [])) {
      clusterMap.set(c.id, c);
    }

    // Build structured context for the LLM (NO raw employee text)
    const clusterContext = (clusters || []).map(c => ({
      id: c.id,
      label: c.cluster_label,
      summary: c.cluster_summary,
      unit_count: c.unit_count,
      avg_sentiment: c.avg_sentiment,
      sentiment_spread: c.sentiment_spread,
      escalation_count: c.escalation_count,
      is_emerging: c.is_emerging,
      related_theme: c.related_theme_id ? themeNameMap.get(c.related_theme_id) || null : null,
      safe_quotes: selectSafeQuotes(
        (c.representative_quotes || []) as Array<{ text: string; session_id?: string }>,
        totalParticipants
      ),
    }));

    const synthesisContext = (syntheses || []).map(s => ({
      narrative: s.narrative_summary,
      trajectory: s.sentiment_trajectory,
      themes_explored: s.themes_explored,
      engagement: s.engagement_quality,
      escalation: s.escalation_summary,
      root_causes: s.root_causes,
      recommended_actions: s.recommended_actions,
      confidence: s.confidence_score,
    }));

    const interpretationContext = surveyAnalytics ? {
      executive_summary: surveyAnalytics.executive_summary,
      top_themes: surveyAnalytics.top_themes,
      risk_factors: surveyAnalytics.risk_factors,
      opportunities: surveyAnalytics.opportunities,
      strategic_recommendations: surveyAnalytics.strategic_recommendations,
      cultural_insights: surveyAnalytics.cultural_insights,
      participation_analysis: surveyAnalytics.participation_analysis,
      confidence: surveyAnalytics.confidence_score,
    } : null;

    const commitmentContext = (commitments || []).map(c => ({
      action: c.action_description,
      status: c.status,
      due_date: c.due_date,
      visible: c.visible_to_employees,
    }));

    // Audience-specific instructions
    const audienceInstructions: Record<string, string> = {
      executive: 'Write for C-suite / VP level. Strategic, concise, focused on organizational impact and ROI. 2-3 key takeaways per chapter.',
      hr_leadership: 'Write for HR directors and people analytics leads. Balance strategic insight with operational detail. Include specific team/department patterns.',
      detailed: 'Write for HR managers who will act on findings. Maximum detail, specific recommendations with timelines, direct quotes where k-anonymous.',
    };

    const prompt = `You are an expert organizational narrative writer. ALL ANALYSIS IS ALREADY DONE — your job is to WRITE compelling prose that synthesizes the pre-analyzed data below into a readable narrative report.

DO NOT re-analyze or contradict the findings. Transform structured data into human-readable narrative.

SURVEY: "${survey.title}" (${survey.survey_type})
PARTICIPANTS: ${totalParticipants} people, ${completedSessions} completed sessions
OPINION UNITS: ${totalUnits} extracted (${actionableCount} actionable, ${escalationBreakdown.high} high-escalation)
AVG SENTIMENT: ${avgSentiment.toFixed(2)} (-1 to 1 scale)
K-ANONYMITY THRESHOLD: ${k} (suppress any finding with fewer than ${k} supporting voices)

AUDIENCE: ${audience}
${audienceInstructions[audience] || audienceInstructions.executive}

--- DISCOVERED CLUSTERS (grouped patterns from employee feedback) ---
${JSON.stringify(clusterContext, null, 2)}

--- SESSION NARRATIVES (per-participant synthesis) ---
${JSON.stringify(synthesisContext, null, 2)}

${interpretationContext ? `--- STRATEGIC INTERPRETATION (survey-level analysis) ---
${JSON.stringify(interpretationContext, null, 2)}` : ''}

--- EXISTING COMMITMENTS (actions HR has already pledged) ---
${JSON.stringify(commitmentContext, null, 2)}

CRITICAL RULES:
1. There are exactly ${totalParticipants} participants. Use exact counts: "${3} of ${totalParticipants}" not percentages.
2. Every insight MUST reference a cluster_id from the clusters above.
3. sample_size must equal the cluster's unit_count (or sum of clusters if spanning multiple).
4. If sample_size < ${k}, mark the insight but DO NOT include direct quotes.
5. The "commitment" chapter should reference existing commitments and suggest new ones based on findings.
6. Generate a report_summary: 2-3 sentences capturing the most important finding for a busy executive.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: 'You are an expert organizational narrative writer. You transform structured analytics data into compelling, evidence-based narrative reports. Never fabricate statistics — use only the data provided.' },
          { role: 'user', content: prompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'create_narrative_report',
              description: 'Generate a structured narrative report with chapters, insights, and executive summary',
              parameters: {
                type: 'object',
                properties: {
                  report_summary: {
                    type: 'string',
                    description: '2-3 sentence executive summary of the most critical finding'
                  },
                  chapters: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        key: { type: 'string', enum: ['voices', 'landscape', 'frictions', 'root_causes', 'forward', 'commitment'] },
                        narrative: { type: 'string', description: 'The main story prose for this chapter' },
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
                                description: 'Opinion unit IDs or cluster IDs supporting this insight'
                              },
                              cluster_id: {
                                type: 'string',
                                description: 'The discovered_cluster ID this insight is grounded in'
                              },
                              category: { type: 'string' },
                              agreement_percentage: {
                                type: 'integer', minimum: 0, maximum: 100
                              },
                              sample_size: {
                                type: 'integer', minimum: 0
                              }
                            },
                            required: ['text', 'confidence', 'evidence_ids', 'sample_size']
                          }
                        }
                      },
                      required: ['title', 'key', 'narrative', 'insights']
                    }
                  },
                  overall_confidence: { type: 'integer', minimum: 1, maximum: 5 }
                },
                required: ['report_summary', 'chapters', 'overall_confidence']
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
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required, please add credits.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`AI request failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const narrativeData = JSON.parse(toolCall.function.arguments);

    // Post-LLM evidence enrichment and k-anonymity enforcement
    const enrichedChapters = enrichInsights(
      narrativeData.chapters,
      clusterMap,
      totalParticipants
    );

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
        chapters: enrichedChapters,
        report_summary: narrativeData.report_summary || null,
        audience_config: { audience },
        data_snapshot: {
          total_sessions: totalSessions,
          total_participants: totalParticipants,
          completed_sessions: completedSessions,
          total_opinion_units: totalUnits,
          actionable_units: actionableCount,
          escalation_breakdown: escalationBreakdown,
          avg_sentiment: avgSentiment,
          clusters_analyzed: (clusters || []).length,
          syntheses_analyzed: (syntheses || []).length,
          has_interpretation: !!surveyAnalytics,
          k_threshold: k,
          pipeline_version: 2,
        },
        confidence_score: narrativeData.overall_confidence,
        is_latest: true,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving report:', saveError);
      throw saveError;
    }

    // Update pipeline_runs if exists
    await supabase
      .from('pipeline_runs')
      .update({ report_generated_at: new Date().toISOString() })
      .eq('survey_id', survey_id);

    console.log('Narrative report v2 generated:', savedReport.id);

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
