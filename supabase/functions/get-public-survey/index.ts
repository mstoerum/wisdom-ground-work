import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { linkToken } = await req.json();

    if (!linkToken) {
      return new Response(
        JSON.stringify({ error: "Link token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Fetching public survey link:", linkToken);

    // Fetch link and associated survey
    const { data: linkData, error: linkError } = await supabase
      .from("public_survey_links")
      .select(`
        *,
        survey:surveys(
          id,
          title,
          description,
          first_message,
          consent_config
        )
      `)
      .eq("link_token", linkToken)
      .eq("is_active", true)
      .single();

    if (linkError || !linkData) {
      console.error("Link not found:", linkError);
      return new Response(
        JSON.stringify({ error: "Invalid or inactive survey link" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiration
    if (linkData.expires_at && new Date(linkData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "This survey link has expired" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check max responses
    if (linkData.max_responses && linkData.current_responses >= linkData.max_responses) {
      return new Response(
        JSON.stringify({ error: "This survey has reached its maximum number of responses" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Public survey link valid:", linkData.id);

    return new Response(
      JSON.stringify({ success: true, data: linkData }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in get-public-survey:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
