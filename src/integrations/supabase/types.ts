export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      action_commitments: {
        Row: {
          action_description: string
          committed_by: string
          created_at: string | null
          due_date: string | null
          id: string
          status: string | null
          survey_id: string
          updated_at: string | null
          visible_to_employees: boolean | null
        }
        Insert: {
          action_description: string
          committed_by: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          status?: string | null
          survey_id: string
          updated_at?: string | null
          visible_to_employees?: boolean | null
        }
        Update: {
          action_description?: string
          committed_by?: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          status?: string | null
          survey_id?: string
          updated_at?: string | null
          visible_to_employees?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "action_commitments_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_cache: {
        Row: {
          computed_at: string | null
          department: string | null
          id: string
          metric_type: string
          survey_id: string
          theme_id: string | null
          value: Json
        }
        Insert: {
          computed_at?: string | null
          department?: string | null
          id?: string
          metric_type: string
          survey_id: string
          theme_id?: string | null
          value: Json
        }
        Update: {
          computed_at?: string | null
          department?: string | null
          id?: string
          metric_type?: string
          survey_id?: string
          theme_id?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "analytics_cache_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_cache_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "survey_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      anonymous_tokens: {
        Row: {
          created_at: string | null
          employee_id: string
          id: string
          survey_id: string
          token_hash: string
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          id?: string
          survey_id: string
          token_hash: string
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          id?: string
          survey_id?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "anonymous_tokens_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          timestamp: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      consent_history: {
        Row: {
          anonymization_level: string
          consent_given_at: string
          consent_revoked_at: string | null
          data_retention_days: number
          id: string
          ip_address: string | null
          survey_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          anonymization_level?: string
          consent_given_at?: string
          consent_revoked_at?: string | null
          data_retention_days?: number
          id?: string
          ip_address?: string | null
          survey_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          anonymization_level?: string
          consent_given_at?: string
          consent_revoked_at?: string | null
          data_retention_days?: number
          id?: string
          ip_address?: string | null
          survey_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_history_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_sessions: {
        Row: {
          anonymization_level: string | null
          anonymous_token_id: string | null
          consent_given: boolean | null
          consent_timestamp: string | null
          employee_id: string | null
          ended_at: string | null
          final_mood: number | null
          id: string
          initial_mood: number | null
          public_link_id: string | null
          started_at: string | null
          status: string | null
          survey_id: string
        }
        Insert: {
          anonymization_level?: string | null
          anonymous_token_id?: string | null
          consent_given?: boolean | null
          consent_timestamp?: string | null
          employee_id?: string | null
          ended_at?: string | null
          final_mood?: number | null
          id?: string
          initial_mood?: number | null
          public_link_id?: string | null
          started_at?: string | null
          status?: string | null
          survey_id: string
        }
        Update: {
          anonymization_level?: string | null
          anonymous_token_id?: string | null
          consent_given?: boolean | null
          consent_timestamp?: string | null
          employee_id?: string | null
          ended_at?: string | null
          final_mood?: number | null
          id?: string
          initial_mood?: number | null
          public_link_id?: string | null
          started_at?: string | null
          status?: string | null
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_sessions_anonymous_token_id_fkey"
            columns: ["anonymous_token_id"]
            isOneToOne: false
            referencedRelation: "anonymous_tokens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_sessions_public_link_id_fkey"
            columns: ["public_link_id"]
            isOneToOne: false
            referencedRelation: "public_survey_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_sessions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      data_retention_log: {
        Row: {
          deleted_at: string
          details: Json | null
          executed_by: string | null
          execution_type: string
          id: string
          records_deleted_count: number
          retention_policy_days: number
          survey_id: string | null
        }
        Insert: {
          deleted_at?: string
          details?: Json | null
          executed_by?: string | null
          execution_type?: string
          id?: string
          records_deleted_count?: number
          retention_policy_days: number
          survey_id?: string | null
        }
        Update: {
          deleted_at?: string
          details?: Json | null
          executed_by?: string | null
          execution_type?: string
          id?: string
          records_deleted_count?: number
          retention_policy_days?: number
          survey_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_retention_log_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          department: string | null
          email: string
          expires_at: string
          full_name: string | null
          id: string
          invitation_token: string
          invited_by: string
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          department?: string | null
          email: string
          expires_at?: string
          full_name?: string | null
          id?: string
          invitation_token: string
          invited_by: string
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          department?: string | null
          email?: string
          expires_at?: string
          full_name?: string | null
          id?: string
          invitation_token?: string
          invited_by?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      escalation_log: {
        Row: {
          employee_notified: boolean | null
          escalated_at: string | null
          escalated_to: string | null
          escalation_type: string
          id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          response_id: string
        }
        Insert: {
          employee_notified?: boolean | null
          escalated_at?: string | null
          escalated_to?: string | null
          escalation_type: string
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          response_id: string
        }
        Update: {
          employee_notified?: boolean | null
          escalated_at?: string | null
          escalated_to?: string | null
          escalation_type?: string
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          response_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "escalation_log_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "anonymized_responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalation_log_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "responses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          department: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
      public_survey_links: {
        Row: {
          created_at: string | null
          created_by: string
          current_responses: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          link_token: string
          max_responses: number | null
          survey_id: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          current_responses?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          link_token: string
          max_responses?: number | null
          survey_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          current_responses?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          link_token?: string
          max_responses?: number | null
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_survey_links_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      responses: {
        Row: {
          ai_analysis: Json | null
          ai_response: string | null
          content: string
          conversation_session_id: string | null
          created_at: string | null
          id: string
          is_paraphrased: boolean | null
          sentiment: string | null
          sentiment_score: number | null
          survey_id: string
          theme_id: string | null
          urgency_escalated: boolean | null
        }
        Insert: {
          ai_analysis?: Json | null
          ai_response?: string | null
          content?: string
          conversation_session_id?: string | null
          created_at?: string | null
          id?: string
          is_paraphrased?: boolean | null
          sentiment?: string | null
          sentiment_score?: number | null
          survey_id: string
          theme_id?: string | null
          urgency_escalated?: boolean | null
        }
        Update: {
          ai_analysis?: Json | null
          ai_response?: string | null
          content?: string
          conversation_session_id?: string | null
          created_at?: string | null
          id?: string
          is_paraphrased?: boolean | null
          sentiment?: string | null
          sentiment_score?: number | null
          survey_id?: string
          theme_id?: string | null
          urgency_escalated?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "responses_conversation_session_id_fkey"
            columns: ["conversation_session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "survey_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_assignments: {
        Row: {
          assigned_at: string | null
          completed_at: string | null
          employee_id: string
          id: string
          status: string | null
          survey_id: string
        }
        Insert: {
          assigned_at?: string | null
          completed_at?: string | null
          employee_id: string
          id?: string
          status?: string | null
          survey_id: string
        }
        Update: {
          assigned_at?: string | null
          completed_at?: string | null
          employee_id?: string
          id?: string
          status?: string | null
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_assignments_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_defaults: {
        Row: {
          anonymization_level: string
          consent_message: string
          created_at: string | null
          created_by: string
          data_retention_days: number
          first_message: string
          id: string
          organization_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          anonymization_level?: string
          consent_message?: string
          created_at?: string | null
          created_by: string
          data_retention_days?: number
          first_message?: string
          id?: string
          organization_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          anonymization_level?: string
          consent_message?: string
          created_at?: string | null
          created_by?: string
          data_retention_days?: number
          first_message?: string
          id?: string
          organization_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      survey_themes: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sentiment_keywords: Json | null
          suggested_questions: Json | null
          survey_type: Database["public"]["Enums"]["survey_type"]
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sentiment_keywords?: Json | null
          suggested_questions?: Json | null
          survey_type?: Database["public"]["Enums"]["survey_type"]
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sentiment_keywords?: Json | null
          suggested_questions?: Json | null
          survey_type?: Database["public"]["Enums"]["survey_type"]
        }
        Relationships: []
      }
      survey_updates: {
        Row: {
          content: string
          created_at: string | null
          created_by: string
          id: string
          published_at: string | null
          survey_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by: string
          id?: string
          published_at?: string | null
          survey_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string
          id?: string
          published_at?: string | null
          survey_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_updates_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          ai_prompt_overrides: Json | null
          consent_config: Json
          created_at: string | null
          created_by: string
          description: string | null
          first_message: string | null
          id: string
          schedule: Json
          status: string | null
          survey_type: Database["public"]["Enums"]["survey_type"]
          themes: Json
          title: string
          updated_at: string | null
        }
        Insert: {
          ai_prompt_overrides?: Json | null
          consent_config: Json
          created_at?: string | null
          created_by: string
          description?: string | null
          first_message?: string | null
          id?: string
          schedule: Json
          status?: string | null
          survey_type?: Database["public"]["Enums"]["survey_type"]
          themes: Json
          title: string
          updated_at?: string | null
        }
        Update: {
          ai_prompt_overrides?: Json | null
          consent_config?: Json
          created_at?: string | null
          created_by?: string
          description?: string | null
          first_message?: string | null
          id?: string
          schedule?: Json
          status?: string | null
          survey_type?: Database["public"]["Enums"]["survey_type"]
          themes?: Json
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      anonymized_responses: {
        Row: {
          ai_analysis: Json | null
          ai_response: string | null
          content: string | null
          conversation_session_id: string | null
          created_at: string | null
          employee_id: string | null
          id: string | null
          is_paraphrased: boolean | null
          sentiment: string | null
          sentiment_score: number | null
          survey_id: string | null
          theme_id: string | null
          urgency_escalated: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "responses_conversation_session_id_fkey"
            columns: ["conversation_session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "survey_themes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      assign_demo_hr_admin: { Args: never; Returns: undefined }
      assign_initial_hr_admin: { Args: never; Returns: undefined }
      get_public_survey_by_token: {
        Args: { link_token_param: string }
        Returns: {
          link_created_at: string
          link_created_by: string
          link_current_responses: number
          link_expires_at: string
          link_id: string
          link_is_active: boolean
          link_max_responses: number
          link_survey_id: string
          link_token: string
          survey_consent_config: Json
          survey_description: string
          survey_first_message: string
          survey_id: string
          survey_title: string
        }[]
      }
      has_any_admin: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_link_responses: {
        Args: { link_id: string }
        Returns: undefined
      }
      log_audit_event: {
        Args: {
          _action_type: string
          _metadata?: Json
          _resource_id?: string
          _resource_type?: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "employee" | "hr_admin" | "hr_analyst"
      survey_type: "employee_satisfaction" | "course_evaluation"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["employee", "hr_admin", "hr_analyst"],
      survey_type: ["employee_satisfaction", "course_evaluation"],
    },
  },
} as const
