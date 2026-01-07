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

/**
 * Calculate intensity from sentiment score variance
 * Higher variance = more strongly held opinions
 */
function calculateIntensity(sentimentScores: number[]): number {
  if (sentimentScores.length === 0) return 0;
  
  const mean = sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length;
  const variance = sentimentScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / sentimentScores.length;
  const stdDev = Math.sqrt(variance);
  
  // Normalize to 0-1 scale (max theoretical stdDev for 0-1 range is 0.5)
  return Math.min(stdDev / 0.5, 1);
}

/**
 * Calculate direction from weighted average sentiment
 * Range: -1 (very negative) to 1 (very positive)
 */
function calculateDirection(sentimentScores: number[]): number {
  if (sentimentScores.length === 0) return 0;
  
  // Scores are 0-1, convert to -1 to 1 range
  const normalizedScores = sentimentScores.map(s => (s - 0.5) * 2);
  return normalizedScores.reduce((a, b) => a + b, 0) / normalizedScores.length;
}

/**
 * Calculate Theme Health Index (0-100)
 * Formula: THI = (intensity × direction × 50) + 50
 */
function calculateTHI(intensity: number, direction: number): number {
  // When direction is positive and intensity is high → higher score
  // When direction is negative and intensity is high → lower score
  const rawScore = (intensity * direction * 50) + 50;
  return Math.round(Math.max(0, Math.min(100, rawScore)));
}

/**
 * Detect polarization (bimodal distribution)
 * Returns 'low', 'medium', or 'high' based on distribution analysis
 */
function detectPolarization(sentimentScores: number[]): { level: 'low' | 'medium' | 'high'; score: number } {
  if (sentimentScores.length < 3) return { level: 'low', score: 0 };
  
  // Check for bimodal distribution by counting responses at extremes vs middle
  const low = sentimentScores.filter(s => s < 0.35).length;
  const mid = sentimentScores.filter(s => s >= 0.35 && s <= 0.65).length;
  const high = sentimentScores.filter(s => s > 0.65).length;
  
  const total = sentimentScores.length;
  const extremeRatio = (low + high) / total;
  const bimodalScore = Math.min(low, high) / total;
  
  // If both extremes have significant presence, it's polarized
  const polarizationScore = bimodalScore * 2 * extremeRatio;
  
  if (polarizationScore > 0.4) return { level: 'high', score: polarizationScore };
  if (polarizationScore > 0.2) return { level: 'medium', score: polarizationScore };
  return { level: 'low', score: polarizationScore };
}

/**
 * Map THI to health status
 */
function getHealthStatus(thi: number): 'thriving' | 'stable' | 'emerging' | 'friction' | 'critical' {
  if (thi >= 85) return 'thriving';
  if (thi >= 70) return 'stable';
  if (thi >= 50) return 'emerging';
  if (thi >= 30) return 'friction';
  return 'critical';
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

    // Fetch responses with theme data
    let query = supabase
      .from("responses")
      .select(`
        id,
        content,
        sentiment,
        sentiment_score,
        theme_id,
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

    // Group responses by theme
    interface ResponseWithTheme {
      id: string;
      content: string;
      sentiment: string;
      sentiment_score: number | null;
      theme_id: string;
      survey_themes: { id: string; name: string; description: string };
    }
    
    const themeGroups = new Map<string, ResponseWithTheme[]>();
    for (const response of responses as unknown as ResponseWithTheme[]) {
      if (!response.theme_id) continue;
      const group = themeGroups.get(response.theme_id) || [];
      group.push(response);
      themeGroups.set(response.theme_id, group);
    }

    console.log(`[analyze-theme] Found ${themeGroups.size} themes to analyze`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const results: any[] = [];

    for (const [currentThemeId, themeResponses] of themeGroups) {
      const themeData = themeResponses[0].survey_themes;
      console.log(`[analyze-theme] Processing theme: ${themeData.name} (${themeResponses.length} responses)`);

      // Calculate base metrics
      const sentimentScores = themeResponses
        .filter(r => r.sentiment_score !== null && r.sentiment_score !== undefined)
        .map(r => Number(r.sentiment_score));

      const intensity = calculateIntensity(sentimentScores);
      const direction = calculateDirection(sentimentScores);
      const thi = calculateTHI(intensity, direction);
      const polarization = detectPolarization(sentimentScores);
      const baseHealthStatus = getHealthStatus(thi);

      console.log(`[analyze-theme] ${themeData.name}: THI=${thi}, intensity=${intensity.toFixed(2)}, direction=${direction.toFixed(2)}, polarization=${polarization.level}`);

      // Prepare content for AI analysis
      const responseTexts = themeResponses
        .filter(r => r.content && r.content.trim())
        .map(r => ({
          id: r.id,
          content: r.content,
          sentiment: r.sentiment,
          sentiment_score: r.sentiment_score
        }));

      // Call AI for semantic analysis
      const systemPrompt = `You are an expert organizational psychologist analyzing employee feedback for patterns and root causes. Be direct, evidence-based, and actionable.`;

      const userPrompt = `Analyze these ${responseTexts.length} responses for the theme "${themeData.name}".

Theme Description: ${themeData.description || 'No description provided'}
Average Sentiment Direction: ${direction.toFixed(2)} (-1 = very negative, 1 = very positive)
Polarization Level: ${polarization.level}
Response Count: ${responseTexts.length}

Responses (with sentiment scores 0-1):
${responseTexts.map(r => `[ID:${r.id}] (score: ${r.sentiment_score?.toFixed(2) || 'N/A'}) "${r.content}"`).join('\n')}

Identify:
1. Key friction patterns (issues, concerns) - what % would agree with each?
2. Key strength patterns (positives) - what % would agree with each?
3. Root causes behind the top frictions with specific recommendations`;

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
                            text: { type: "string", description: "Concise statement of the friction pattern (not a quote)" },
                            agreement_pct: { type: "number", description: "Estimated % who would agree (0-100)" },
                            voice_count: { type: "number", description: "Number of responses supporting this" },
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
                            agreement_pct: { type: "number", description: "Estimated % who would agree (0-100)" },
                            voice_count: { type: "number", description: "Number of responses supporting this" },
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
                        description: "Other notable patterns or emerging themes"
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
                        affected_count: { type: "number", description: "Approximate number affected" },
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
          insights: {
            frictions: [],
            strengths: [],
            patterns: []
          },
          root_causes: [],
          health_status: baseHealthStatus,
          confidence_score: 2
        };

        // Extract simple insights from responses
        const negativeResponses = themeResponses.filter(r => r.sentiment === 'negative');
        const positiveResponses = themeResponses.filter(r => r.sentiment === 'positive');

        if (negativeResponses.length > 0) {
          fallbackAnalysis.insights.frictions.push({
            text: `${negativeResponses.length} response(s) expressed concerns about ${themeData.name.toLowerCase()}`,
            sentiment: 'negative',
            agreement_pct: Math.round((negativeResponses.length / themeResponses.length) * 100),
            voice_count: negativeResponses.length,
            confidence: 2,
            evidence_ids: negativeResponses.slice(0, 3).map(r => r.id)
          });
        }

        if (positiveResponses.length > 0) {
          fallbackAnalysis.insights.strengths.push({
            text: `${positiveResponses.length} response(s) showed satisfaction with ${themeData.name.toLowerCase()}`,
            sentiment: 'positive',
            agreement_pct: Math.round((positiveResponses.length / themeResponses.length) * 100),
            voice_count: positiveResponses.length,
            confidence: 2,
            evidence_ids: positiveResponses.slice(0, 3).map(r => r.id)
          });
        }

        // Upsert fallback to database
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
            confidence_score: fallbackAnalysis.confidence_score,
            response_count: themeResponses.length,
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

      // Upsert to database
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
          confidence_score: analysisResult.confidence_score,
          response_count: themeResponses.length,
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
