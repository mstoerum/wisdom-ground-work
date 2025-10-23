import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limiting (max 1 export per 24 hours)
    const { data: recentExports } = await supabase
      .from('audit_logs')
      .select('timestamp')
      .eq('user_id', user.id)
      .eq('action_type', 'data_export')
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false })
      .limit(1);

    if (recentExports && recentExports.length > 0) {
      return new Response(
        JSON.stringify({ error: 'You can only export your data once every 24 hours' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Fetch user roles
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    // Fetch consent history
    const { data: consents } = await supabase
      .from('consent_history')
      .select('*')
      .eq('user_id', user.id)
      .order('consent_given_at', { ascending: false });

    // Fetch conversation sessions (identified ones only)
    const { data: sessions } = await supabase
      .from('conversation_sessions')
      .select('*')
      .eq('employee_id', user.id)
      .eq('anonymization_level', 'identified')
      .order('started_at', { ascending: false });

    // Fetch responses (identified ones only)
    const sessionIds = sessions?.map(s => s.id) || [];
    const { data: responses } = await supabase
      .from('responses')
      .select('*')
      .in('conversation_session_id', sessionIds)
      .order('created_at', { ascending: false });

    // Compile export data
    const exportData = {
      export_date: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      profile,
      roles: roles?.map(r => r.role) || [],
      consent_history: consents || [],
      conversation_sessions: sessions || [],
      responses: responses || [],
      note: 'Anonymized survey responses are not included in this export as they cannot be linked to your identity.',
    };

    // Log the export action
    await supabase.rpc('log_audit_event', {
      _action_type: 'data_export',
      _resource_type: 'user_data',
      _resource_id: user.id,
    });

    return new Response(
      JSON.stringify(exportData),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
        } 
      }
    );

  } catch (error: any) {
    console.error('Error in export-user-data:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
