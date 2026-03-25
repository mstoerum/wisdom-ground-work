import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SemanticInsight {
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  agreement_pct: number;
  voice_count: number;
  confidence: number;
  evidence_ids: string[];
}

interface RootCause {
  cause: string;
  impact_level: 'high' | 'medium' | 'low';
  affected_count: number;
  recommendation: string;
}

interface AnalysisResult {
  insights: {
    frictions: SemanticInsight[];
    strengths: SemanticInsight[];
    patterns: SemanticInsight[];
  };
  root_causes: RootCause[];
  health_status: 'thriving' | 'stable' | 'emerging' | 'friction' | 'critical';
  confidence_score: number;
}

function calculateIntensity(sentimentScores: number[]): number {
  if (sentimentScores.length === 0) return 0;
  const mean = sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length;
  const variance = sentimentScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / sentimentScores.length;
  return Math.min(Math.sqrt(variance) / 0.5, 1);
}

function calculateDirection(sentimentScores: number[]): number {
  if (sentimentScores.length === 0) return 0;
  const normalizedScores = sentimentScores.map(s => (s - 0.5) * 2);
  return normalizedScores.reduce((a, b) => a + b, 0) / normalizedScores.length;
}

function calculateTHI(
  responses: { sentiment: string; sentiment_score: number | null }[],
  polarizationLevel: 'low' | 'medium' | 'high'
): number {
  if (responses.length === 0) return 50;
  const positive = responses.filter(r => r.sentiment === 'positive').length;
  const negative = responses.filter(r => r.sentiment === 'negative').length;
  const total = responses.length;
  const netSentimentScore = ((positive / total - negative / total + 1) / 2) * 100;
  const polarizationPenalty = polarizationLevel === 'high' ? 10 : (polarizationLevel === 'medium' ? 5 : 0);
  return Math.round(Math.max(0, Math.min(100, netSentimentScore - polarizationPenalty)));
}

function detectPolarization(sentimentScores: number[]): { level: 'low' | 'medium' | 'high'; score: number } {
  if (sentimentScores.length < 3) return { level: 'low', score: 0 };
  const low = sentimentScores.filter(s => s < 0.35).length;
  const high = sentimentScores.filter(s => s > 0.65).length;
  const total = sentimentScores.length;
  const extremeRatio = (low + high) / total;
  const bimodalScore = Math.min(low, high) / total;
  const polarizationScore = bimodalScore * 2 * extremeRatio;
  if (polarizationScore > 0.4) return { level: 'high', score: polarizationScore };
  if (polarizationScore > 0.2) return { level: 'medium', score: polarizationScore };
  return { level: 'low', score: polarizationScore };
}

function getHealthStatus(
  thi: number, 
  polarizationLevel: 'low' | 'medium' | 'high'
): 'thriving' | 'stable' | 'emerging' | 'friction' | 'critical' {
  if (polarizationLevel === 'high' && thi >= 50 && thi < 85) return 'friction';
  if (thi >= 85) return 'thriving';
  if (thi >= 70) return 'stable';
  if (thi >= 50) return 'emerging';
  if (thi >= 30) return 'friction';
  return 'critical';
}

function getConfidenceLevel(responseCount: number): number {
  if (responseCount >= 10) return 5;
  if (responseCount >= 5) return 4;
  if (responseCount >= 3) return 3;
  return 2;
}

/**
 * Filter out UI completion signals like [SELECTED: I'm all good]
 */
function isSubstantiveResponse(content: string): boolean {
  if (!content || !content.trim()) return false;
  if (content.trim().startsWith('[SELECTED:')) return false;
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { survey_id, theme_id } = await req.json();

    if (!survey_id) {
      return new Response(
        JSON.stringify({ error: "survey_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[analyze-theme] Starting analysis for survey: ${survey_id}, theme: ${theme_id || 'all'}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch responses WITH ai_response (the question that prompted each answer) and session info
    let query = supabase
      .from("responses")
      .select(`
        id,
        content,
        ai_response,
        sentiment,
        sentiment_score,
        theme_id,
        conversation_session_id,
        survey_themes!inner(id, name, description)
      `)
      .eq("survey_id", survey_id);

    if (theme_id) {
      query = query.eq("theme_id", theme_id);
    }

    const { data: responses, error: responsesError } = await query;

    if (responsesError) {
      console.error("[analyze-theme] Error fetching responses:", responsesError);
      throw responsesError;
    }

    if (!responses || responses.length === 0) {
      console.log("[analyze-theme] No responses found for analysis");
      return new Response(
        JSON.stringify({ message: "No responses to analyze" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Also fetch survey metadata for context
    const { data: survey } = await supabase
      .from("surveys")
      .select("title, survey_type, description")
      .eq("id", survey_id)
      .single();

    // Count unique sessions for accurate participant count
    const uniqueSessions = new Set(responses.map((r: any) => r.conversation_session_id).filter(Boolean));
    const sessionCount = uniqueSessions.size;

    // Group responses by theme
    interface ResponseWithTheme {
      id: string;
      content: string;
      ai_response: string | null;
      sentiment: string;
      sentiment_score: number | null;
      theme_id: string;
      conversation_session_id: string | null;
      survey_themes: { id: string; name: string; description: string };
    }
    
    const themeGroups = new Map<string, ResponseWithTheme[]>();
    for (const response of responses as unknown as ResponseWithTheme[]) {
      if (!response.theme_id) continue;
      const group = themeGroups.get(response.theme_id) || [];
      group.push(response);
      themeGroups.set(response.theme_id, group);
    }

    console.log(`[analyze-theme] Found ${themeGroups.size} themes to analyze across ${sessionCount} sessions`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const results: any[] = [];

    for (const [currentThemeId, themeResponses] of themeGroups) {
      const themeData = themeResponses[0].survey_themes;
      
      // Filter out completion signals for analysis, but keep all for metrics
      const substantiveResponses = themeResponses.filter(r => isSubstantiveResponse(r.content));
      const filteredCount = themeResponses.length - substantiveResponses.length;
      
      console.log(`[analyze-theme] Processing theme: ${themeData.name} (${substantiveResponses.length} substantive / ${themeResponses.length} total, ${filteredCount} completion signals filtered)`);

      // Calculate base metrics using ALL responses for accurate THI
      const sentimentScores = themeResponses
        .filter(r => r.sentiment_score !== null && r.sentiment_score !== undefined)
        .map(r => Number(r.sentiment_score) / 100);

      const intensity = calculateIntensity(sentimentScores);
      const direction = calculateDirection(sentimentScores);
      const polarization = detectPolarization(sentimentScores);
      const thi = calculateTHI(themeResponses, polarization.level);
      const baseHealthStatus = getHealthStatus(thi, polarization.level);
      const baseConfidence = getConfidenceLevel(substantiveResponses.length);

      // Group substantive responses by session for context-aware analysis
      const sessionGroups = new Map<string, ResponseWithTheme[]>();
      for (const r of substantiveResponses) {
        const sessionId = r.conversation_session_id || 'unknown';
        const group = sessionGroups.get(sessionId) || [];
        group.push(r);
        sessionGroups.set(sessionId, group);
      }

      // Build session-grouped Q&A pairs for the prompt
      const sessionTexts: string[] = [];
      let sessionIndex = 0;
      for (const [, sessionResponses] of sessionGroups) {
        sessionIndex++;
        const qaPairs = sessionResponses.map(r => {
          const question = r.ai_response ? `Q: "${r.ai_response}"` : 'Q: [question not recorded]';
          const answer = `A: "${r.content}" [ID:${r.id}] (sentiment: ${r.sentiment}, score: ${r.sentiment_score ?? 'N/A'})`;
          return `  ${question}\n  ${answer}`;
        }).join('\n');
        sessionTexts.push(`--- Session ${sessionIndex} (${sessionResponses.length} exchanges) ---\n${qaPairs}`);
      }

      const uniqueSessionsForTheme = sessionGroups.size;

      // Build improved prompt with full context
      const systemPrompt = `You are an expert organizational psychologist analyzing employee feedback. You must be evidence-based and use ONLY the actual voice counts from the data provided. Do NOT extrapolate percentages to a hypothetical larger population.`;

      const userPrompt = `Analyze these responses for the theme "${themeData.name}" from the survey "${survey?.title || 'Unknown'}".

CONTEXT:
- Survey type: ${survey?.survey_type || 'employee_satisfaction'}
- Theme description: ${themeData.description || 'No description provided'}
- Total participants (unique sessions): ${uniqueSessionsForTheme}
- Substantive responses for this theme: ${substantiveResponses.length}
- Average Sentiment Direction: ${direction.toFixed(2)} (-1 = very negative, 1 = very positive)
- Polarization Level: ${polarization.level}

IMPORTANT RULES:
- voice_count must reflect ACTUAL number of responses supporting an insight, not estimates
- agreement_pct should be calculated as (voice_count / ${substantiveResponses.length}) * 100
- With only ${uniqueSessionsForTheme} participants, be precise about what was actually said
- Look for patterns ACROSS sessions (did multiple people mention similar things?)
- Consider the AI's questions when interpreting answers — context matters

CONVERSATION DATA (grouped by session, showing Q&A pairs):
${sessionTexts.join('\n\n')}

Identify:
1. Key friction patterns (issues, concerns) with exact voice counts
2. Key strength patterns (positives) with exact voice counts
3. Cross-session patterns (themes that appear across multiple conversations)
4. Root causes behind the top frictions with specific, actionable recommendations`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          tools: [{
            type: "function",
            function: {
              name: "analyze_theme",
              description: "Return structured analysis of theme feedback",
              parameters: {
                type: "object",
                properties: {
                  insights: {
                    type: "object",
                    properties: {
                      frictions: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            text: { type: "string", description: "Concise statement of the friction pattern" },
                            agreement_pct: { type: "number", description: "Actual percentage: (voice_count / total_responses) * 100" },
                            voice_count: { type: "number", description: "Actual number of responses supporting this" },
                            confidence: { type: "number", description: "Confidence in this insight (1-5)" },
                            evidence_ids: { type: "array", items: { type: "string" }, description: "IDs of supporting responses" }
                          },
                          required: ["text", "agreement_pct", "voice_count", "confidence", "evidence_ids"]
                        }
                      },
                      strengths: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            text: { type: "string", description: "Concise statement of the strength pattern" },
                            agreement_pct: { type: "number", description: "Actual percentage: (voice_count / total_responses) * 100" },
                            voice_count: { type: "number", description: "Actual number of responses supporting this" },
                            confidence: { type: "number", description: "Confidence in this insight (1-5)" },
                            evidence_ids: { type: "array", items: { type: "string" }, description: "IDs of supporting responses" }
                          },
                          required: ["text", "agreement_pct", "voice_count", "confidence", "evidence_ids"]
                        }
                      },
                      patterns: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            text: { type: "string" },
                            agreement_pct: { type: "number" },
                            voice_count: { type: "number" },
                            confidence: { type: "number" },
                            evidence_ids: { type: "array", items: { type: "string" } }
                          },
                          required: ["text", "agreement_pct", "voice_count", "confidence", "evidence_ids"]
                        },
                        description: "Cross-session patterns or emerging themes"
                      }
                    },
                    required: ["frictions", "strengths", "patterns"]
                  },
                  root_causes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        cause: { type: "string", description: "Root cause behind frictions" },
                        impact_level: { type: "string", enum: ["high", "medium", "low"] },
                        affected_count: { type: "number", description: "Actual number of people affected" },
                        recommendation: { type: "string", description: "Specific actionable recommendation" }
                      },
                      required: ["cause", "impact_level", "affected_count", "recommendation"]
                    }
                  },
                  confidence_score: { type: "number", description: "Overall confidence in analysis (1-5)" }
                },
                required: ["insights", "root_causes", "confidence_score"]
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "analyze_theme" } }
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error(`[analyze-theme] AI API error for ${themeData.name}:`, aiResponse.status, errorText);
        
        // Use fallback analysis
        const fallbackAnalysis: AnalysisResult = {
          insights: { frictions: [], strengths: [], patterns: [] },
          root_causes: [],
          health_status: baseHealthStatus,
          confidence_score: 2
        };

        const negativeResponses = substantiveResponses.filter(r => r.sentiment === 'negative');
        const positiveResponses = substantiveResponses.filter(r => r.sentiment === 'positive');

        if (negativeResponses.length > 0) {
          fallbackAnalysis.insights.frictions.push({
            text: `${negativeResponses.length} response(s) expressed concerns about ${themeData.name.toLowerCase()}`,
            sentiment: 'negative',
            agreement_pct: Math.round((negativeResponses.length / substantiveResponses.length) * 100),
            voice_count: negativeResponses.length,
            confidence: 2,
            evidence_ids: negativeResponses.slice(0, 3).map(r => r.id)
          });
        }

        if (positiveResponses.length > 0) {
          fallbackAnalysis.insights.strengths.push({
            text: `${positiveResponses.length} response(s) showed satisfaction with ${themeData.name.toLowerCase()}`,
            sentiment: 'positive',
            agreement_pct: Math.round((positiveResponses.length / substantiveResponses.length) * 100),
            voice_count: positiveResponses.length,
            confidence: 2,
            evidence_ids: positiveResponses.slice(0, 3).map(r => r.id)
          });
        }

        const { error: upsertError } = await supabase
          .from("theme_analytics")
          .upsert({
            survey_id,
            theme_id: currentThemeId,
            health_index: thi,
            health_status: baseHealthStatus,
            intensity_score: intensity,
            direction_score: direction,
            polarization_level: polarization.level,
            polarization_score: polarization.score,
            insights: fallbackAnalysis.insights,
            root_causes: fallbackAnalysis.root_causes,
            confidence_score: baseConfidence,
            response_count: substantiveResponses.length,
            analyzed_at: new Date().toISOString()
          }, {
            onConflict: 'survey_id,theme_id'
          });

        if (upsertError) {
          console.error(`[analyze-theme] Error upserting fallback for ${themeData.name}:`, upsertError);
        }

        results.push({
          theme_id: currentThemeId,
          theme_name: themeData.name,
          health_index: thi,
          status: 'fallback',
          error: 'AI analysis failed, using basic metrics'
        });
        continue;
      }

      const aiData = await aiResponse.json();
      let analysisResult: AnalysisResult;

      try {
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall?.function?.arguments) {
          const parsed = JSON.parse(toolCall.function.arguments);
          analysisResult = {
            insights: {
              frictions: (parsed.insights?.frictions || []).map((f: any) => ({
                ...f,
                sentiment: 'negative' as const
              })),
              strengths: (parsed.insights?.strengths || []).map((s: any) => ({
                ...s,
                sentiment: 'positive' as const
              })),
              patterns: (parsed.insights?.patterns || []).map((p: any) => ({
                ...p,
                sentiment: 'neutral' as const
              }))
            },
            root_causes: parsed.root_causes || [],
            health_status: baseHealthStatus,
            confidence_score: parsed.confidence_score || 3
          };
        } else {
          throw new Error("No tool call in response");
        }
      } catch (parseError) {
        console.error(`[analyze-theme] Error parsing AI response for ${themeData.name}:`, parseError);
        analysisResult = {
          insights: { frictions: [], strengths: [], patterns: [] },
          root_causes: [],
          health_status: baseHealthStatus,
          confidence_score: 2
        };
      }

      const finalConfidence = Math.round(analysisResult.confidence_score) || baseConfidence;
      const { error: upsertError } = await supabase
        .from("theme_analytics")
        .upsert({
          survey_id,
          theme_id: currentThemeId,
          health_index: thi,
          health_status: analysisResult.health_status,
          intensity_score: intensity,
          direction_score: direction,
          polarization_level: polarization.level,
          polarization_score: polarization.score,
          insights: analysisResult.insights,
          root_causes: analysisResult.root_causes,
          confidence_score: finalConfidence,
          response_count: substantiveResponses.length,
          analyzed_at: new Date().toISOString()
        }, {
          onConflict: 'survey_id,theme_id'
        });

      if (upsertError) {
        console.error(`[analyze-theme] Error upserting analysis for ${themeData.name}:`, upsertError);
        throw upsertError;
      }

      results.push({
        theme_id: currentThemeId,
        theme_name: themeData.name,
        health_index: thi,
        health_status: analysisResult.health_status,
        intensity_score: intensity,
        direction_score: direction,
        polarization_level: polarization.level,
        frictions_count: analysisResult.insights.frictions.length,
        strengths_count: analysisResult.insights.strengths.length,
        root_causes_count: analysisResult.root_causes.length,
        confidence_score: analysisResult.confidence_score
      });

      console.log(`[analyze-theme] Successfully analyzed ${themeData.name}: THI=${thi}, ${analysisResult.insights.frictions.length} frictions, ${analysisResult.insights.strengths.length} strengths`);
    }

    console.log(`[analyze-theme] Completed analysis for ${results.length} themes`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        themes_analyzed: results.length,
        results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[analyze-theme] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
