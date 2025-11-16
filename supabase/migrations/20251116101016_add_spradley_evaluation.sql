-- Add enable_spradley_evaluation to surveys table
-- This field is stored in consent_config JSONB, but we'll add a computed column for easier querying
-- Actually, since it's already in JSONB, we don't need a separate column
-- But we'll create a table to store evaluation responses

-- Create spradley_evaluations table to store evaluation responses
create table public.spradley_evaluations (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid references public.surveys(id) on delete cascade not null,
  conversation_session_id uuid references public.conversation_sessions(id) on delete cascade,
  employee_id uuid references auth.users(id) on delete cascade,
  evaluation_responses jsonb not null,
  overall_sentiment text check (overall_sentiment in ('positive', 'neutral', 'negative')),
  sentiment_score decimal(3,2),
  key_insights jsonb,
  duration_seconds integer,
  completed_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.spradley_evaluations enable row level security;

-- RLS Policies for spradley_evaluations
create policy "Employees can create own evaluations"
on public.spradley_evaluations for insert
with check (auth.uid() = employee_id);

create policy "HR admins can view all evaluations"
on public.spradley_evaluations for select
using (public.has_role(auth.uid(), 'hr_admin') or public.has_role(auth.uid(), 'hr_analyst'));

-- Create index for performance
create index idx_spradley_evaluations_survey on public.spradley_evaluations(survey_id);
create index idx_spradley_evaluations_employee on public.spradley_evaluations(employee_id);
create index idx_spradley_evaluations_completed_at on public.spradley_evaluations(completed_at);
