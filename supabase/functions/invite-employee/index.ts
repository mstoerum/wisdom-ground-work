import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate a random invitation token
function generateInvitationToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization')!;

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify HR admin role
    const { data: roles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'hr_admin')
      .single();

    if (roleError || !roles) {
      console.error('HR admin verification failed:', roleError);
      return new Response(
        JSON.stringify({ error: 'Forbidden: HR admin role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { email, full_name, department } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: 'User with this email already exists' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if invitation already exists
    const { data: existingInvitation } = await supabase
      .from('employee_invitations')
      .select('id, status')
      .eq('email', email)
      .in('status', ['pending'])
      .single();

    if (existingInvitation) {
      return new Response(
        JSON.stringify({ error: 'Pending invitation already exists for this email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate invitation token
    const invitationToken = generateInvitationToken();

    // Create invitation record
    const { data: invitation, error: insertError } = await supabase
      .from('employee_invitations')
      .insert({
        email,
        full_name,
        department,
        invited_by: user.id,
        invitation_token: invitationToken,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create invitation:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create invitation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Invitation created successfully:', invitation.id);

    return new Response(
      JSON.stringify({
        success: true,
        invitation_token: invitationToken,
        invitation_id: invitation.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in invite-employee function:', error);
    
    // Map errors to generic messages for client
    let clientMessage = 'An error occurred while creating the invitation';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Authentication')) {
        clientMessage = 'Authentication failed';
        statusCode = 401;
      } else if (error.message.includes('Forbidden') || error.message.includes('admin')) {
        clientMessage = 'Insufficient permissions';
        statusCode = 403;
      } else if (error.message.includes('required') || error.message.includes('Email')) {
        clientMessage = 'Invalid request data';
        statusCode = 400;
      }
    }
    
    return new Response(
      JSON.stringify({ error: clientMessage }),
      { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
