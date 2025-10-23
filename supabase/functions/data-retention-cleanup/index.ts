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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Starting data retention cleanup process...");

    // Get all surveys with their retention policies
    const { data: surveys, error: surveysError } = await supabase
      .from("surveys")
      .select("id, created_by, consent_config")
      .eq("status", "active");

    if (surveysError) throw surveysError;

    let totalDeleted = 0;
    const deletionResults = [];

    for (const survey of surveys || []) {
      // Extract retention days from consent_config or use default
      const retentionDays = (survey.consent_config as any)?.dataRetentionDays || 60;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      console.log(`Processing survey ${survey.id} with ${retentionDays} day retention...`);

      // Find responses older than retention period
      const { data: oldResponses, error: responsesError } = await supabase
        .from("responses")
        .select("id, conversation_session_id, created_at")
        .eq("survey_id", survey.id)
        .lt("created_at", cutoffDate.toISOString());

      if (responsesError) {
        console.error(`Error fetching old responses for survey ${survey.id}:`, responsesError);
        continue;
      }

      if (!oldResponses || oldResponses.length === 0) {
        console.log(`No old responses to delete for survey ${survey.id}`);
        continue;
      }

      const responseIds = oldResponses.map(r => r.id);
      const sessionIds = [...new Set(oldResponses.map(r => r.conversation_session_id))];

      // Delete responses
      const { error: deleteResponsesError } = await supabase
        .from("responses")
        .delete()
        .in("id", responseIds);

      if (deleteResponsesError) {
        console.error(`Error deleting responses for survey ${survey.id}:`, deleteResponsesError);
        continue;
      }

      // Delete conversation sessions that have no remaining responses
      for (const sessionId of sessionIds) {
        const { data: remainingResponses } = await supabase
          .from("responses")
          .select("id")
          .eq("conversation_session_id", sessionId)
          .limit(1);

        if (!remainingResponses || remainingResponses.length === 0) {
          await supabase
            .from("conversation_sessions")
            .delete()
            .eq("id", sessionId);
        }
      }

      // Log the deletion
      const { error: logError } = await supabase
        .from("data_retention_log")
        .insert({
          survey_id: survey.id,
          records_deleted_count: responseIds.length,
          retention_policy_days: retentionDays,
          execution_type: "automatic",
          details: {
            cutoff_date: cutoffDate.toISOString(),
            sessions_affected: sessionIds.length,
          },
        });

      if (logError) {
        console.error(`Error logging deletion for survey ${survey.id}:`, logError);
      }

      totalDeleted += responseIds.length;
      deletionResults.push({
        survey_id: survey.id,
        deleted_count: responseIds.length,
        retention_days: retentionDays,
      });

      console.log(`Deleted ${responseIds.length} responses for survey ${survey.id}`);
    }

    console.log(`Data retention cleanup complete. Total responses deleted: ${totalDeleted}`);

    return new Response(
      JSON.stringify({
        success: true,
        totalDeleted,
        results: deletionResults,
        message: `Cleanup complete. Deleted ${totalDeleted} old responses across ${deletionResults.length} surveys.`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Data retention cleanup error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
