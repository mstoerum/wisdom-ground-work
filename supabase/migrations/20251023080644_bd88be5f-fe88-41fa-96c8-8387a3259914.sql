-- Create app role enum
create type public.app_role as enum ('employee', 'hr_admin', 'hr_analyst');

-- Create profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  department text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create user_roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);

-- Security definer function to prevent RLS recursion
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- Survey themes catalog
create table public.survey_themes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  suggested_questions jsonb,
  sentiment_keywords jsonb,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- Surveys table
create table public.surveys (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  created_by uuid references auth.users(id) not null,
  themes jsonb not null,
  schedule jsonb not null,
  consent_config jsonb not null,
  first_message text,
  status text check (status in ('draft', 'active', 'completed', 'archived')) default 'draft',
  ai_prompt_overrides jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Survey assignments
create table public.survey_assignments (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid references public.surveys(id) on delete cascade not null,
  employee_id uuid references auth.users(id) on delete cascade not null,
  assigned_at timestamp with time zone default now(),
  completed_at timestamp with time zone,
  status text check (status in ('pending', 'in_progress', 'completed')) default 'pending',
  unique (survey_id, employee_id)
);

-- Anonymous tokens for verified anonymity
create table public.anonymous_tokens (
  id uuid primary key default gen_random_uuid(),
  token_hash text unique not null,
  survey_id uuid references public.surveys(id) on delete cascade not null,
  employee_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default now()
);

-- Conversation sessions
create table public.conversation_sessions (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid references public.surveys(id) on delete cascade not null,
  employee_id uuid references auth.users(id) on delete cascade,
  anonymous_token_hash text,
  mood_selection jsonb,
  started_at timestamp with time zone default now(),
  ended_at timestamp with time zone,
  consent_given boolean default false,
  consent_timestamp timestamp with time zone,
  anonymization_level text check (anonymization_level in ('identified', 'anonymous', 'paraphrased')) default 'identified',
  status text check (status in ('active', 'completed', 'abandoned')) default 'active'
);

-- Responses (will be encrypted)
create table public.responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.conversation_sessions(id) on delete cascade not null,
  survey_id uuid references public.surveys(id) on delete cascade not null,
  theme_id uuid references public.survey_themes(id),
  message_text text not null,
  original_text text,
  sentiment text check (sentiment in ('positive', 'neutral', 'negative', 'urgent')),
  sentiment_score decimal(3,2),
  ai_analysis jsonb,
  is_paraphrased boolean default false,
  urgency_escalated boolean default false,
  created_at timestamp with time zone default now()
);

-- Escalation log for compliance
create table public.escalation_log (
  id uuid primary key default gen_random_uuid(),
  response_id uuid references public.responses(id) on delete cascade not null,
  escalation_type text check (escalation_type in ('harassment', 'safety', 'legal', 'other')) not null,
  escalated_to uuid references auth.users(id),
  escalated_at timestamp with time zone default now(),
  employee_notified boolean default false,
  resolution_notes text,
  resolved_at timestamp with time zone
);

-- Analytics cache
create table public.analytics_cache (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid references public.surveys(id) on delete cascade not null,
  metric_type text not null,
  department text,
  theme_id uuid references public.survey_themes(id),
  value jsonb not null,
  computed_at timestamp with time zone default now()
);

-- Action commitments tracking
create table public.action_commitments (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid references public.surveys(id) on delete cascade not null,
  committed_by uuid references auth.users(id) not null,
  action_description text not null,
  due_date date,
  status text check (status in ('pending', 'in_progress', 'complete')) default 'pending',
  visible_to_employees boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.survey_themes enable row level security;
alter table public.surveys enable row level security;
alter table public.survey_assignments enable row level security;
alter table public.anonymous_tokens enable row level security;
alter table public.conversation_sessions enable row level security;
alter table public.responses enable row level security;
alter table public.escalation_log enable row level security;
alter table public.analytics_cache enable row level security;
alter table public.action_commitments enable row level security;

-- RLS Policies for profiles
create policy "Users can view own profile"
on public.profiles for select
using (auth.uid() = id);

create policy "HR admins can view all profiles"
on public.profiles for select
using (public.has_role(auth.uid(), 'hr_admin') or public.has_role(auth.uid(), 'hr_analyst'));

create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id);

-- RLS Policies for user_roles
create policy "Users can view own roles"
on public.user_roles for select
using (auth.uid() = user_id);

-- RLS Policies for survey_themes
create policy "Everyone can view active themes"
on public.survey_themes for select
using (is_active = true);

create policy "HR admins manage themes"
on public.survey_themes for all
using (public.has_role(auth.uid(), 'hr_admin'));

-- RLS Policies for surveys
create policy "HR admins full access to surveys"
on public.surveys for all
using (public.has_role(auth.uid(), 'hr_admin'));

create policy "HR analysts read surveys"
on public.surveys for select
using (public.has_role(auth.uid(), 'hr_analyst'));

create policy "Employees see assigned surveys"
on public.surveys for select
using (
  exists (
    select 1 from public.survey_assignments
    where survey_id = surveys.id
    and employee_id = auth.uid()
  )
);

-- RLS Policies for survey_assignments
create policy "Employees see own assignments"
on public.survey_assignments for select
using (auth.uid() = employee_id);

create policy "HR admins see all assignments"
on public.survey_assignments for select
using (public.has_role(auth.uid(), 'hr_admin') or public.has_role(auth.uid(), 'hr_analyst'));

create policy "HR admins manage assignments"
on public.survey_assignments for all
using (public.has_role(auth.uid(), 'hr_admin'));

-- RLS Policies for anonymous_tokens
create policy "No direct access to tokens"
on public.anonymous_tokens for select
using (false);

-- RLS Policies for conversation_sessions
create policy "Employees see own sessions"
on public.conversation_sessions for select
using (auth.uid() = employee_id);

create policy "Employees create own sessions"
on public.conversation_sessions for insert
with check (auth.uid() = employee_id);

create policy "Employees update own sessions"
on public.conversation_sessions for update
using (auth.uid() = employee_id);

create policy "HR admins view all sessions"
on public.conversation_sessions for select
using (public.has_role(auth.uid(), 'hr_admin') or public.has_role(auth.uid(), 'hr_analyst'));

-- RLS Policies for responses (CRITICAL - employees cannot read raw responses)
create policy "No direct employee access to responses"
on public.responses for select
using (false);

create policy "HR analysts read responses"
on public.responses for select
using (public.has_role(auth.uid(), 'hr_analyst') or public.has_role(auth.uid(), 'hr_admin'));

create policy "System can insert responses"
on public.responses for insert
with check (true);

-- RLS Policies for escalation_log
create policy "HR access to escalations"
on public.escalation_log for all
using (public.has_role(auth.uid(), 'hr_admin') or public.has_role(auth.uid(), 'hr_analyst'));

-- RLS Policies for analytics_cache
create policy "HR access to analytics"
on public.analytics_cache for all
using (public.has_role(auth.uid(), 'hr_admin') or public.has_role(auth.uid(), 'hr_analyst'));

-- RLS Policies for action_commitments
create policy "HR manage commitments"
on public.action_commitments for all
using (public.has_role(auth.uid(), 'hr_admin'));

create policy "Employees view visible commitments"
on public.action_commitments for select
using (visible_to_employees = true);

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_profiles_updated_at
before update on public.profiles
for each row
execute function public.update_updated_at_column();

create trigger update_surveys_updated_at
before update on public.surveys
for each row
execute function public.update_updated_at_column();

create trigger update_action_commitments_updated_at
before update on public.action_commitments
for each row
execute function public.update_updated_at_column();

-- Create indexes for performance
create index idx_survey_assignments_employee on public.survey_assignments(employee_id);
create index idx_survey_assignments_survey on public.survey_assignments(survey_id);
create index idx_responses_survey on public.responses(survey_id);
create index idx_responses_session on public.responses(session_id);
create index idx_conversation_sessions_survey on public.conversation_sessions(survey_id);
create index idx_conversation_sessions_employee on public.conversation_sessions(employee_id);