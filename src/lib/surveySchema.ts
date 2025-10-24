import { z } from "zod";

export const surveyFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  first_message: z.string().min(1, "First message is required"),
  themes: z.array(z.string()).min(1, "At least one theme must be selected"),
  target_type: z.enum(['all', 'department', 'manual', 'public_link']),
  target_departments: z.array(z.string()).optional(),
  target_employees: z.array(z.string()).optional(),
  link_expires_at: z.string().nullable().optional(),
  max_link_responses: z.number().nullable().optional(),
  schedule_type: z.enum(['immediate', 'scheduled']),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  reminder_frequency: z.number().optional(),
  anonymization_level: z.enum(['identified', 'anonymous']),
  consent_message: z.string().min(1, "Consent message is required"),
  data_retention_days: z.enum(['30', '60', '90']),
}).refine((data) => {
  if (data.target_type === 'department') {
    return data.target_departments && data.target_departments.length > 0;
  }
  if (data.target_type === 'manual') {
    return data.target_employees && data.target_employees.length > 0;
  }
  return true;
}, {
  message: "Please select at least one target",
  path: ["target_type"],
}).refine((data) => {
  if (data.schedule_type === 'scheduled') {
    return data.start_date !== null && data.start_date !== undefined;
  }
  return true;
}, {
  message: "Start date is required for scheduled surveys",
  path: ["start_date"],
});

export type SurveyFormData = z.infer<typeof surveyFormSchema>;

export const getDefaultSurveyValues = (defaults?: any): SurveyFormData => ({
  title: "",
  description: "",
  first_message: defaults?.first_message || "Hello! Thank you for taking the time to share your feedback with us. This conversation is confidential and will help us create a better workplace for everyone.",
  themes: [],
  target_type: "all",
  target_departments: [],
  target_employees: [],
  link_expires_at: null,
  max_link_responses: null,
  schedule_type: "immediate",
  start_date: null,
  end_date: null,
  reminder_frequency: 7,
  anonymization_level: defaults?.anonymization_level || "identified",
  consent_message: defaults?.consent_message || "Your responses will be kept confidential and used to improve our workplace. We take your privacy seriously and follow strict data protection guidelines.",
  data_retention_days: defaults?.data_retention_days?.toString() || "60",
});

export const defaultSurveyValues: SurveyFormData = getDefaultSurveyValues();
