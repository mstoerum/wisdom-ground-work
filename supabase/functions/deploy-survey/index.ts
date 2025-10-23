import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Verify user authentication
 */
const verifyAuth = async (supabase: any, authHeader: string) => {
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error('Unauthorized');
  }

  return user;
};

/**
 * Verify user has HR admin role
 */
const verifyHRAdmin = async (supabase: any, userId: string) => {
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  const isHRAdmin = roles?.some((r: any) => r.role === 'hr_admin');
  
  if (!isHRAdmin) {
    throw new Error('Forbidden: HR admin access required');
  }
};

/**
 * Fetch survey by ID and validate status
 */
const fetchSurvey = async (supabase: any, surveyId: string) => {
  const { data: survey, error } = await supabase
    .from('surveys')
    .select('*')
    .eq('id', surveyId)
    .single();

  if (error || !survey) {
    throw new Error('Survey not found');
  }

  if (survey.status !== 'draft') {
    throw new Error('Survey must be in draft status to deploy');
  }

  return survey;
};

/**
 * Get target employee IDs based on survey configuration
 */
const getTargetEmployees = async (supabase: any, schedule: any): Promise<string[]> => {
  const targetType = schedule.target_type;
  const targetDepartments = schedule.target_departments || [];
  const targetEmployees = schedule.target_employees || [];

  if (targetType === 'all') {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id');
    return profiles?.map((p: any) => p.id) || [];
  }
  
  if (targetType === 'department') {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .in('department', targetDepartments);
    return profiles?.map((p: any) => p.id) || [];
  }
  
  if (targetType === 'manual') {
    return targetEmployees;
  }

  return [];
};

/**
 * Create survey assignments for target employees
 */
const createAssignments = async (supabase: any, surveyId: string, employeeIds: string[]) => {
  const assignments = employeeIds.map(employeeId => ({
    survey_id: surveyId,
    employee_id: employeeId,
    status: 'pending',
  }));

  const { error } = await supabase
    .from('survey_assignments')
    .insert(assignments);

  if (error) {
    throw new Error('Failed to create assignments');
  }
};

/**
 * Update survey status to active
 */
const activateSurvey = async (supabase: any, surveyId: string) => {
  const { error } = await supabase
    .from('surveys')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', surveyId);

  if (error) {
    throw new Error('Failed to update survey status');
  }
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const user = await verifyAuth(supabase, authHeader);
    console.log('User authenticated:', user.id);

    // Verify HR admin role
    await verifyHRAdmin(supabase, user.id);
    console.log('HR admin verified');

    const { survey_id } = await req.json();

    if (!survey_id) {
      return new Response(JSON.stringify({ error: 'survey_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Deploying survey:', survey_id);

    // Fetch and validate survey
    const survey = await fetchSurvey(supabase, survey_id);
    console.log('Survey fetched:', survey.title);

    // Get target employees
    const schedule = survey.schedule as any;
    const employeeIds = await getTargetEmployees(supabase, schedule);

    if (employeeIds.length === 0) {
      return new Response(JSON.stringify({ error: 'No employees targeted' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Creating assignments for ${employeeIds.length} employees`);

    // Create survey assignments
    await createAssignments(supabase, survey_id, employeeIds);

    // Activate survey
    await activateSurvey(supabase, survey_id);

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
    const statusCode = errorMessage.includes('Unauthorized') ? 401 
      : errorMessage.includes('Forbidden') ? 403
      : errorMessage.includes('not found') ? 404
      : errorMessage.includes('required') || errorMessage.includes('No employees') || errorMessage.includes('must be') ? 400
      : 500;

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
