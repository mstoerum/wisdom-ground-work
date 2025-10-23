-- Add unique constraint to survey_themes name for ON CONFLICT to work
ALTER TABLE public.survey_themes ADD CONSTRAINT survey_themes_name_key UNIQUE (name);

-- Now insert the themes (this will skip duplicates if they exist)
INSERT INTO public.survey_themes (name, description, suggested_questions, sentiment_keywords, is_active) VALUES
(
  'Work-Life Balance',
  'Explore workload, flexibility, and boundaries between work and personal life',
  '["How do you feel about your current workload?", "Do you have enough flexibility to manage work and personal commitments?", "What helps you maintain healthy boundaries?"]'::jsonb,
  '{"positive": ["flexible", "balanced", "manageable", "supportive", "autonomy"], "negative": ["overwhelmed", "burnout", "stressed", "exhausting", "impossible"]}'::jsonb,
  true
),
(
  'Team Dynamics',
  'Understand collaboration, communication, and psychological safety within teams',
  '["How would you describe collaboration within your team?", "Do you feel comfortable sharing ideas and concerns?", "What makes team communication effective or challenging?"]'::jsonb,
  '{"positive": ["collaborative", "supportive", "trust", "open", "safe"], "negative": ["siloed", "conflict", "tense", "isolated", "unclear"]}'::jsonb,
  true
),
(
  'Leadership & Management',
  'Gather feedback on manager support, feedback quality, and leadership trust',
  '["How supported do you feel by your direct manager?", "What kind of feedback helps you grow?", "How would you describe leadership transparency?"]'::jsonb,
  '{"positive": ["supportive", "transparent", "empowering", "clear", "accessible"], "negative": ["disconnected", "micromanaging", "unclear", "unavailable", "dismissive"]}'::jsonb,
  true
),
(
  'Career Growth',
  'Assess development opportunities, learning resources, and career progression',
  '["What opportunities do you have for professional development?", "Do you see a clear path for career growth?", "What skills would you like to develop?"]'::jsonb,
  '{"positive": ["opportunities", "learning", "growth", "investment", "mentorship"], "negative": ["stagnant", "limited", "unclear", "blocked", "overlooked"]}'::jsonb,
  true
),
(
  'Recognition & Appreciation',
  'Explore how employees feel valued and acknowledged for their contributions',
  '["How do you experience recognition for your work?", "Do you feel your contributions are valued?", "What makes you feel appreciated?"]'::jsonb,
  '{"positive": ["valued", "appreciated", "recognized", "celebrated", "acknowledged"], "negative": ["invisible", "overlooked", "unappreciated", "ignored", "taken for granted"]}'::jsonb,
  true
),
(
  'Physical & Mental Wellbeing',
  'Understand stress levels, support resources, and workplace safety',
  '["How would you describe your stress level at work?", "What resources support your wellbeing?", "Do you feel safe and healthy in your work environment?"]'::jsonb,
  '{"positive": ["supported", "healthy", "safe", "balanced", "resources"], "negative": ["stressed", "anxious", "unsafe", "exhausted", "unsupported"]}'::jsonb,
  true
),
(
  'Diversity, Equity & Inclusion',
  'Assess belonging, fairness, and representation across the organization',
  '["Do you feel a sense of belonging at work?", "How would you describe fairness in opportunities and treatment?", "What makes you feel included or excluded?"]'::jsonb,
  '{"positive": ["belonging", "inclusive", "fair", "diverse", "respected"], "negative": ["excluded", "biased", "unfair", "tokenized", "discriminated"]}'::jsonb,
  true
),
(
  'Tools & Resources',
  'Evaluate technology, processes, and obstacles to productivity',
  '["Do you have the tools you need to do your job effectively?", "What processes help or hinder your productivity?", "What resources are missing?"]'::jsonb,
  '{"positive": ["efficient", "equipped", "streamlined", "effective", "modern"], "negative": ["outdated", "frustrating", "slow", "lacking", "broken"]}'::jsonb,
  true
),
(
  'Company Culture',
  'Gauge alignment with values and organizational direction',
  '["How aligned do you feel with company values?", "What aspects of the culture energize you?", "Where do you see opportunities for cultural improvement?"]'::jsonb,
  '{"positive": ["aligned", "energized", "proud", "connected", "meaningful"], "negative": ["disconnected", "misaligned", "confused", "cynical", "hollow"]}'::jsonb,
  true
),
(
  'Compensation & Benefits',
  'Understand perceptions of fairness and satisfaction with total rewards',
  '["How do you feel about the fairness of your compensation?", "Which benefits are most valuable to you?", "What would make the rewards package more competitive?"]'::jsonb,
  '{"positive": ["fair", "competitive", "valued", "generous", "equitable"], "negative": ["unfair", "below market", "inadequate", "inequitable", "disappointing"]}'::jsonb,
  true
)
ON CONFLICT (name) DO NOTHING;