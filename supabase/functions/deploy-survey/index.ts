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

  // Public link surveys don't create assignments upfront
  if (targetType === 'public_link') {
    return [];
  }

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
 * Generate random token for public link
 */
const generateLinkToken = (): string => {
  return crypto.randomUUID().replace(/-/g, '').substring(0, 16);
};

/**
 * Create public survey link
 */
const createPublicLink = async (
  supabase: any, 
  surveyId: string, 
  userId: string,
  schedule: any
) => {
  const linkToken = generateLinkToken();
  
  const { data: linkData, error } = await supabase
    .from('public_survey_links')
    .insert({
      survey_id: surveyId,
      link_token: linkToken,
      created_by: userId,
      expires_at: schedule.link_expires_at || null,
      max_responses: schedule.max_link_responses || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create public link:', error);
    throw new Error('Failed to create public survey link');
  }

  return linkData;
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
    const targetType = schedule.target_type;

    let publicLink = null;
    let assignmentCount = 0;

    // Handle public link surveys
    if (targetType === 'public_link') {
      console.log('Creating public survey link');
      publicLink = await createPublicLink(supabase, survey_id, user.id, schedule);
      console.log('Public link created:', publicLink.link_token);
    } else {
      // Handle traditional employee targeting
      const employeeIds = await getTargetEmployees(supabase, schedule);

      if (employeeIds.length === 0) {
        return new Response(JSON.stringify({ 
          error: 'No employees targeted. Please ensure there are employees in the system before deploying.' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`Creating assignments for ${employeeIds.length} employees`);

      // Create survey assignments
      await createAssignments(supabase, survey_id, employeeIds);
      assignmentCount = employeeIds.length;
    }

    // Activate survey
    await activateSurvey(supabase, survey_id);

    console.log(`Survey deployed successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        assignment_count: assignmentCount,
        public_link: publicLink ? {
          token: publicLink.link_token,
          url: `${Deno.env.get('SUPABASE_URL')?.replace('https://', 'https://').replace('.supabase.co', '.lovableproject.com')}/survey/${publicLink.link_token}`,
          expires_at: publicLink.expires_at,
          max_responses: publicLink.max_responses,
        } : null,
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
