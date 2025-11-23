import { useMemo } from "react";

export type SurveyType = "employee_satisfaction" | "course_evaluation";

export interface ContextualTerms {
  participant: string;
  participants: string;
  Participant: string;
  Participants: string;
  facilitator: string;
  context: string;
  feedback: string;
  Feedback: string;
  targetLabel: string;
  previewLabel: string;
  dashboardTitle: string;
  participationLabel: string;
  urgentLabel: string;
  sentimentLabel: string;
  consentDescription: string;
  privacyMessage: string;
  responseLabel: string;
  identifiedDescription: string;
  anonymousDescription: string;
  voice: string;
  voiceGallery: string;
  avgDuration: string;
  avgSentiment: string;
  participationRate: string;
  completedCount: string;
  analyticsTitle: string;
  exportPrefix: string;
}

export const terminology: Record<SurveyType, ContextualTerms> = {
  employee_satisfaction: {
    participant: "employee",
    participants: "employees",
    Participant: "Employee",
    Participants: "Employees",
    facilitator: "HR admin",
    context: "workplace",
    feedback: "feedback",
    Feedback: "Feedback",
    targetLabel: "Employee Targeting",
    previewLabel: "Preview as Employee",
    dashboardTitle: "Employee Analytics",
    participationLabel: "Employee Participation",
    urgentLabel: "Urgent HR Flags",
    sentimentLabel: "Employee Sentiment",
    consentDescription: "Configure privacy settings and employee consent requirements",
    privacyMessage: "All surveys require explicit employee consent. Data is encrypted and handled according to GDPR standards.",
    responseLabel: "Response Anonymization",
    identifiedDescription: "Responses are linked to employee profiles. Allows for personalized follow-up and demographic analysis.",
    anonymousDescription: "Responses use anonymous tokens. No way to trace back to individual employees. Use for sensitive topics.",
    voice: "Employee Voice",
    voiceGallery: "Employee Voice Gallery",
    avgDuration: "Avg Conversation Duration",
    avgSentiment: "Avg Employee Sentiment",
    participationRate: "Employee Participation Rate",
    completedCount: "employees",
    analyticsTitle: "Employee Feedback Analytics",
    exportPrefix: "employee-feedback",
  },
  course_evaluation: {
    participant: "student",
    participants: "students",
    Participant: "Student",
    Participants: "Students",
    facilitator: "professor/instructor",
    context: "course",
    feedback: "evaluation",
    Feedback: "Evaluation",
    targetLabel: "Student Targeting",
    previewLabel: "Preview as Student",
    dashboardTitle: "Course Analytics",
    participationLabel: "Student Response Rate",
    urgentLabel: "Instructor Attention Needed",
    sentimentLabel: "Student Experience",
    consentDescription: "Configure privacy settings and student consent requirements",
    privacyMessage: "All evaluations require explicit student consent. Responses are encrypted and handled according to academic privacy standards.",
    responseLabel: "Response Anonymization",
    identifiedDescription: "Responses are linked to student enrollment. Allows for learning outcome analysis and personalized follow-up.",
    anonymousDescription: "Responses use anonymous tokens. No way to trace back to individual students. Encourages honest, constructive feedback.",
    voice: "Student Voice",
    voiceGallery: "Student Voice Gallery",
    avgDuration: "Avg Evaluation Duration",
    avgSentiment: "Student Sentiment",
    participationRate: "Student Response Rate",
    completedCount: "students",
    analyticsTitle: "Course Evaluation Analytics",
    exportPrefix: "course-evaluation",
  },
};

/**
 * React hook to get contextual terminology based on survey type
 */
export const useContextualTerms = (surveyType: SurveyType | undefined): ContextualTerms => {
  return useMemo(() => {
    return terminology[surveyType || "employee_satisfaction"];
  }, [surveyType]);
};

/**
 * Get terminology without React hook (for edge functions and utilities)
 */
export const getTerminology = (surveyType: SurveyType | undefined): ContextualTerms => {
  return terminology[surveyType || "employee_satisfaction"];
};
