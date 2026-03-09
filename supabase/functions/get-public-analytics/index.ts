import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shareToken } = await req.json();

    if (!shareToken) {
      return new Response(JSON.stringify({ error: "Missing shareToken" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Validate token
    const { data: link, error: linkError } = await supabase
      .from("public_analytics_links")
      .select("*")
      .eq("share_token", shareToken)
      .eq("is_active", true)
      .single();

    if (linkError || !link) {
      return new Response(JSON.stringify({ error: "Invalid or expired link" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check expiry
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Link has expired" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const surveyId = link.survey_id;

    // Fetch survey info
    const { data: survey } = await supabase
      .from("surveys")
      .select("id, title, description, survey_type")
      .eq("id", surveyId)
      .single();

    // Fetch participation data
    const { count: responseCount } = await supabase
      .from("responses")
      .select("*", { count: "exact", head: true })
      .eq("survey_id", surveyId);

    const { count: sessionCount } = await supabase
      .from("conversation_sessions")
      .select("*", { count: "exact", head: true })
      .eq("survey_id", surveyId);

    const { count: completedCount } = await supabase
      .from("conversation_sessions")
      .select("*", { count: "exact", head: true })
      .eq("survey_id", surveyId)
      .eq("status", "completed");

    const { count: activeCount } = await supabase
      .from("conversation_sessions")
      .select("*", { count: "exact", head: true })
      .eq("survey_id", surveyId)
      .eq("status", "active");

    // Fetch responses for sentiment
    const { data: responses } = await supabase
      .from("responses")
      .select("sentiment, sentiment_score, theme_id, content, urgency_escalated")
      .eq("survey_id", surveyId);

    // Calculate sentiment metrics
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    let totalScore = 0;
    let scoredCount = 0;
    let urgentCount = 0;

    (responses || []).forEach((r: any) => {
      if (r.sentiment === "positive") sentimentCounts.positive++;
      else if (r.sentiment === "negative") sentimentCounts.negative++;
      else sentimentCounts.neutral++;

      if (r.sentiment_score != null) {
        totalScore += Number(r.sentiment_score);
        scoredCount++;
      }
      if (r.urgency_escalated) urgentCount++;
    });

    // Fetch latest narrative report
    const { data: narrativeReport } = await supabase
      .from("narrative_reports")
      .select("*")
      .eq("survey_id", surveyId)
      .eq("is_latest", true)
      .single();

    // Fetch theme analytics
    const { data: themeAnalytics } = await supabase
      .from("theme_analytics")
      .select("*")
      .eq("survey_id", surveyId)
      .order("analyzed_at", { ascending: false });

    // Fetch theme names
    const { data: surveyThemes } = await supabase
      .from("survey_themes")
      .select("id, name, description");

    // Build theme insights
    const themeMap = new Map((surveyThemes || []).map((t: any) => [t.id, t]));
    const themeCounts: Record<string, number> = {};
    (responses || []).forEach((r: any) => {
      if (r.theme_id) {
        themeCounts[r.theme_id] = (themeCounts[r.theme_id] || 0) + 1;
      }
    });

    const themes = Object.entries(themeCounts).map(([themeId, count]) => {
      const theme = themeMap.get(themeId);
      const analytics = (themeAnalytics || []).find((a: any) => a.theme_id === themeId);
      return {
        themeId,
        themeName: theme?.name || "Unknown",
        description: theme?.description || "",
        responseCount: count,
        sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
        healthIndex: analytics?.health_index,
        healthStatus: analytics?.health_status,
        insights: analytics?.insights,
      };
    });

    const totalResponses = responses?.length || 0;

    const result = {
      survey: survey || { id: surveyId, title: "Survey" },
      participation: {
        responseCount: responseCount || 0,
        sessionCount: sessionCount || 0,
        completed: completedCount || 0,
        pending: activeCount || 0,
        totalAssigned: sessionCount || 0,
        activeSessionCount: activeCount || 0,
        completionRate: sessionCount ? Math.round(((completedCount || 0) / sessionCount) * 100) : 0,
      },
      sentiment: {
        positive: sentimentCounts.positive,
        neutral: sentimentCounts.neutral,
        negative: sentimentCounts.negative,
        averageScore: scoredCount > 0 ? totalScore / scoredCount : 0,
        urgentCount,
        total: totalResponses,
      },
      themes,
      narrativeReport: narrativeReport || null,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in get-public-analytics:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
