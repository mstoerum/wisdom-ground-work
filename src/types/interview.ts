/**
 * Shared types for interview completion flow
 * Used by both ChatInterface and FocusedInterviewInterface
 */

// Simplified completion phase states: active -> reviewing -> complete
export type InterviewPhase = 'active' | 'reviewing' | 'complete';

// Theme progress from backend
export interface ThemeProgress {
  themes: Array<{
    id: string;
    name: string;
    discussed: boolean;
    current: boolean;
    depth: number; // 0-100
  }>;
  coveragePercent: number;
  discussedCount: number;
  totalCount: number;
}

// Theme coverage summary for UI display
export interface ThemeCoverage {
  discussed: number;
  total: number;
  percentage: number;
}

// Structured summary returned by backend during completion
export interface StructuredSummary {
  opening?: string;           // Personalized acknowledgment
  keyPoints: string[];        // 2-4 bullet points
  sentiment: 'positive' | 'mixed' | 'negative' | 'constructive';
}

// Completion response from backend
export interface CompletionResponse {
  isComplete: boolean;
  isCompletionPrompt?: boolean;
  shouldComplete?: boolean;
  structuredSummary?: StructuredSummary;
  themeProgress?: ThemeProgress;
  message?: string;
  empathy?: string | null;
}

// Session statistics for summary display
export interface SessionStats {
  responseCount: number;
  themesExplored: number;
  totalThemes: number;
  durationMinutes?: number;
}

// Completion decision from backend (for debugging/logging)
export interface CompletionDecision {
  complete: boolean;
  reason: 
    | 'minimum-not-met'
    | 'excellent-coverage'
    | 'good-coverage'
    | 'user-disengaging'
    | 'continue';
}

// Message type for conversation
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}
