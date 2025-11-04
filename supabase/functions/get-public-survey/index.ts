import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting constants
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;

// Rate limiting map (simple in-memory, production should use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number; failedAttempts: number }>();

/**
 * Check rate limit and track suspicious patterns
 */
const checkRateLimit = (identifier: string): boolean => {
  const now = Date.now();
  const limit = rateLimitMap.get(identifier);
  
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS, failedAttempts: 0 });
    return true;
  }
  
  if (limit.count >= RATE_LIMIT_MAX_REQUESTS) {
    // Log suspicious pattern
    if (limit.failedAttempts > 20) {
      console.warn(`⚠️ Possible token enumeration attack from: ${identifier}`);
    }
    return false;
  }
  
  limit.count++;
  return true;
};

/**
 * Track failed attempts for security monitoring
 */
const trackFailedAttempt = (identifier: string) => {
  const limit = rateLimitMap.get(identifier);
  if (limit) {
    limit.failedAttempts++;
  }
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
        JSON.stringify({ error: "Invalid request" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting based on IP or token
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    const rateLimitKey = `${clientIp}:${linkToken}`;
    
    if (!checkRateLimit(rateLimitKey)) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Fetching public survey link");

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
      console.error("Link validation failed");
      trackFailedAttempt(rateLimitKey);
      
      // Generic error message - don't reveal whether token exists
      return new Response(
        JSON.stringify({ error: "Survey not available" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiration
    if (linkData.expires_at && new Date(linkData.expires_at) < new Date()) {
      trackFailedAttempt(rateLimitKey);
      return new Response(
        JSON.stringify({ error: "Survey not available" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check max responses
    if (linkData.max_responses && linkData.current_responses >= linkData.max_responses) {
      trackFailedAttempt(rateLimitKey);
      return new Response(
        JSON.stringify({ error: "Survey not available" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
