-- Add survey_type enum
CREATE TYPE survey_type AS ENUM ('employee_satisfaction', 'course_evaluation');

-- Add survey_type column to surveys table with default
ALTER TABLE public.surveys 
ADD COLUMN survey_type survey_type NOT NULL DEFAULT 'employee_satisfaction';

-- Add course metadata to surveys (using existing structure, no new columns needed)
-- We'll use the schedule JSONB field to store course_code and section when needed

-- Add survey_type to survey_themes table
ALTER TABLE public.survey_themes
ADD COLUMN survey_type survey_type NOT NULL DEFAULT 'employee_satisfaction';

-- Mark existing themes as employee_satisfaction
UPDATE public.survey_themes
SET survey_type = 'employee_satisfaction'
WHERE survey_type IS NULL;

-- Insert 6 new course evaluation themes
INSERT INTO public.survey_themes (name, description, suggested_questions, survey_type, is_active) VALUES
(
  'Learning & Achievement',
  'Evaluate student learning outcomes, skill development, and intellectual growth from this course',
  '["What did you learn in this course that you didn''t know before?", "How has this course changed the way you think about the subject?", "Which learning objectives resonated most with you?", "What skills do you feel you''ve developed?"]'::jsonb,
  'course_evaluation',
  true
),
(
  'Instructor Effectiveness',
  'Assess teaching quality, clarity, responsiveness, and instructor engagement',
  '["How would you describe the instructor''s teaching style?", "What aspects of the instructor''s approach helped you learn?", "How responsive was the instructor to questions and concerns?", "What made the instructor effective or ineffective?"]'::jsonb,
  'course_evaluation',
  true
),
(
  'Course Design & Materials',
  'Evaluate course structure, content organization, textbooks, and resource quality',
  '["How well was the course organized?", "Were the course materials helpful for your learning?", "How appropriate was the workload?", "What resources were most valuable to you?"]'::jsonb,
  'course_evaluation',
  true
),
(
  'Engagement & Interaction',
  'Explore classroom participation, peer collaboration, and active learning opportunities',
  '["How engaged did you feel during class sessions?", "What opportunities for participation were most meaningful?", "How would you describe collaboration with classmates?", "What made you feel more or less engaged?"]'::jsonb,
  'course_evaluation',
  true
),
(
  'Assessment & Feedback',
  'Assess grading fairness, feedback quality, and learning from assignments and exams',
  '["How fair and transparent was the grading?", "What feedback helped you improve the most?", "Did assignments help you learn the material?", "How did assessments align with learning objectives?"]'::jsonb,
  'course_evaluation',
  true
),
(
  'Learning Environment',
  'Evaluate classroom climate, inclusivity, student support, and accessibility',
  '["How would you describe the classroom atmosphere?", "Did you feel comfortable participating and asking questions?", "How inclusive was the learning environment?", "What support resources were available and helpful?"]'::jsonb,
  'course_evaluation',
  true
);