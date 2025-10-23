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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify authentication
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify HR admin role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isHRAdmin = roles?.some(r => r.role === 'hr_admin');
    if (!isHRAdmin) {
      console.error('User does not have hr_admin role');
      return new Response(JSON.stringify({ error: 'Forbidden: HR admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { survey_id } = await req.json();

    if (!survey_id) {
      return new Response(JSON.stringify({ error: 'survey_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Deploying survey:', survey_id);

    // Fetch survey details
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', survey_id)
      .single();

    if (surveyError || !survey) {
      console.error('Survey not found:', surveyError);
      return new Response(JSON.stringify({ error: 'Survey not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (survey.status !== 'draft') {
      return new Response(JSON.stringify({ error: 'Survey must be in draft status to deploy' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse schedule config
    const schedule = survey.schedule as any;
    const targetType = schedule.target_type;
    const targetDepartments = schedule.target_departments || [];
    const targetEmployees = schedule.target_employees || [];

    // Determine target employees
    let employeeIds: string[] = [];

    if (targetType === 'all') {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id');
      employeeIds = profiles?.map(p => p.id) || [];
    } else if (targetType === 'department') {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .in('department', targetDepartments);
      employeeIds = profiles?.map(p => p.id) || [];
    } else if (targetType === 'manual') {
      employeeIds = targetEmployees;
    }

    if (employeeIds.length === 0) {
      return new Response(JSON.stringify({ error: 'No employees targeted' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Creating assignments for ${employeeIds.length} employees`);

    // Create survey assignments
    const assignments = employeeIds.map(employeeId => ({
      survey_id,
      employee_id: employeeId,
      status: 'pending',
    }));

    const { error: assignmentError } = await supabase
      .from('survey_assignments')
      .insert(assignments);

    if (assignmentError) {
      console.error('Failed to create assignments:', assignmentError);
      return new Response(JSON.stringify({ error: 'Failed to create assignments' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update survey status to active
    const { error: updateError } = await supabase
      .from('surveys')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', survey_id);

    if (updateError) {
      console.error('Failed to update survey status:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update survey status' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Survey deployed successfully with ${employeeIds.length} assignments`);

    return new Response(
      JSON.stringify({
        success: true,
        assignment_count: employeeIds.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in deploy-survey function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
