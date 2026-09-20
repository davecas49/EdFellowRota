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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ahd_sessions: {
        Row: {
          block_number: number | null
          cohort: string | null
          colour_streams: string[] | null
          created_at: string
          fellow_id: string | null
          id: string
          import_batch_id: string | null
          location: string | null
          notes: string | null
          session_date: string
          time_slot: Database["public"]["Enums"]["time_slot"]
          week_number: number | null
        }
        Insert: {
          block_number?: number | null
          cohort?: string | null
          colour_streams?: string[] | null
          created_at?: string
          fellow_id?: string | null
          id?: string
          import_batch_id?: string | null
          location?: string | null
          notes?: string | null
          session_date: string
          time_slot: Database["public"]["Enums"]["time_slot"]
          week_number?: number | null
        }
        Update: {
          block_number?: number | null
          cohort?: string | null
          colour_streams?: string[] | null
          created_at?: string
          fellow_id?: string | null
          id?: string
          import_batch_id?: string | null
          location?: string | null
          notes?: string | null
          session_date?: string
          time_slot?: Database["public"]["Enums"]["time_slot"]
          week_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ahd_sessions_fellow_id_fkey"
            columns: ["fellow_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      block_leads: {
        Row: {
          block_code: string
          id: string
          lead_email: string | null
          lead_name: string
          lead_role: string | null
          rotation_level: string
          specialty_name: string
        }
        Insert: {
          block_code: string
          id?: string
          lead_email?: string | null
          lead_name: string
          lead_role?: string | null
          rotation_level: string
          specialty_name: string
        }
        Update: {
          block_code?: string
          id?: string
          lead_email?: string | null
          lead_name?: string
          lead_role?: string | null
          rotation_level?: string
          specialty_name?: string
        }
        Relationships: []
      }
      excel_import_log: {
        Row: {
          error_log: string | null
          filename: string | null
          id: string
          imported_at: string
          imported_by: string | null
          rows_imported: number | null
          rows_parsed: number | null
          status: string | null
        }
        Insert: {
          error_log?: string | null
          filename?: string | null
          id?: string
          imported_at?: string
          imported_by?: string | null
          rows_imported?: number | null
          rows_parsed?: number | null
          status?: string | null
        }
        Update: {
          error_log?: string | null
          filename?: string | null
          id?: string
          imported_at?: string
          imported_by?: string | null
          rows_imported?: number | null
          rows_parsed?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "excel_import_log_imported_by_fkey"
            columns: ["imported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_feedback_invites: {
        Row: {
          created_at: string
          development_areas: string | null
          expires_at: string
          fellow_id: string
          guest_email: string
          guest_name: string | null
          guest_role: string | null
          id: string
          invited_by: string | null
          message: string | null
          rating: number | null
          rota_entry_id: string
          status: string
          strengths: string | null
          submitted_at: string | null
          token: string
        }
        Insert: {
          created_at?: string
          development_areas?: string | null
          expires_at: string
          fellow_id: string
          guest_email: string
          guest_name?: string | null
          guest_role?: string | null
          id?: string
          invited_by?: string | null
          message?: string | null
          rating?: number | null
          rota_entry_id: string
          status?: string
          strengths?: string | null
          submitted_at?: string | null
          token: string
        }
        Update: {
          created_at?: string
          development_areas?: string | null
          expires_at?: string
          fellow_id?: string
          guest_email?: string
          guest_name?: string | null
          guest_role?: string | null
          id?: string
          invited_by?: string | null
          message?: string | null
          rating?: number | null
          rota_entry_id?: string
          status?: string
          strengths?: string | null
          submitted_at?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_feedback_invites_fellow_id_fkey"
            columns: ["fellow_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_feedback_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_feedback_invites_rota_entry_id_fkey"
            columns: ["rota_entry_id"]
            isOneToOne: false
            referencedRelation: "rota_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_dates: {
        Row: {
          academic_year: string
          created_at: string
          decided_automatically: boolean
          decision_reason: string | null
          fellow_id: string
          id: string
          leave_date: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          note: string | null
          override_note: string | null
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["leave_request_status"]
        }
        Insert: {
          academic_year: string
          created_at?: string
          decided_automatically?: boolean
          decision_reason?: string | null
          fellow_id: string
          id?: string
          leave_date: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          note?: string | null
          override_note?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["leave_request_status"]
        }
        Update: {
          academic_year?: string
          created_at?: string
          decided_automatically?: boolean
          decision_reason?: string | null
          fellow_id?: string
          id?: string
          leave_date?: string
          leave_type?: Database["public"]["Enums"]["leave_type"]
          note?: string | null
          override_note?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["leave_request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "leave_dates_fellow_id_fkey"
            columns: ["fellow_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_dates_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_entitlements: {
        Row: {
          academic_year: string
          carry_over_note: string | null
          days_taken: number
          fellow_id: string
          id: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          total_entitlement: number
        }
        Insert: {
          academic_year: string
          carry_over_note?: string | null
          days_taken?: number
          fellow_id: string
          id?: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          total_entitlement: number
        }
        Update: {
          academic_year?: string
          carry_over_note?: string | null
          days_taken?: number
          fellow_id?: string
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"]
          total_entitlement?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_entitlements_fellow_id_fkey"
            columns: ["fellow_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      peer_feedback: {
        Row: {
          development_areas: string | null
          from_fellow_id: string
          guest_email: string | null
          guest_name: string | null
          guest_role: string | null
          id: string
          rating: number | null
          rota_entry_id: string
          strengths: string | null
          submitted_at: string
          to_fellow_id: string
        }
        Insert: {
          development_areas?: string | null
          from_fellow_id: string
          guest_email?: string | null
          guest_name?: string | null
          guest_role?: string | null
          id?: string
          rating?: number | null
          rota_entry_id: string
          strengths?: string | null
          submitted_at?: string
          to_fellow_id: string
        }
        Update: {
          development_areas?: string | null
          from_fellow_id?: string
          guest_email?: string | null
          guest_name?: string | null
          guest_role?: string | null
          id?: string
          rating?: number | null
          rota_entry_id?: string
          strengths?: string | null
          submitted_at?: string
          to_fellow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "peer_feedback_from_fellow_id_fkey"
            columns: ["from_fellow_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peer_feedback_rota_entry_id_fkey"
            columns: ["rota_entry_id"]
            isOneToOne: false
            referencedRelation: "rota_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peer_feedback_to_fellow_id_fkey"
            columns: ["to_fellow_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          department: string | null
          email: string
          id: string
          initials: string
          is_active: boolean
          name: string
          phone: string | null
          responsibilities: string | null
          role: Database["public"]["Enums"]["user_role"]
          role_title: string | null
          tier: Database["public"]["Enums"]["fellow_tier"] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          department?: string | null
          email: string
          id?: string
          initials: string
          is_active?: boolean
          name: string
          phone?: string | null
          responsibilities?: string | null
          role: Database["public"]["Enums"]["user_role"]
          role_title?: string | null
          tier?: Database["public"]["Enums"]["fellow_tier"] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string
          id?: string
          initials?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          responsibilities?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          role_title?: string | null
          tier?: Database["public"]["Enums"]["fellow_tier"] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      quality_scores: {
        Row: {
          ai_summary: string
          band: string
          created_at: string
          criteria: Json
          fellow_id: string
          id: string
          model: string | null
          overall_score: number
          reviewer_notes: string
          scored_at: string
          scored_by: string | null
          subject_id: string
          subject_type: Database["public"]["Enums"]["quality_subject"]
          updated_at: string
        }
        Insert: {
          ai_summary: string
          band: string
          created_at?: string
          criteria: Json
          fellow_id: string
          id?: string
          model?: string | null
          overall_score: number
          reviewer_notes?: string
          scored_at?: string
          scored_by?: string | null
          subject_id: string
          subject_type: Database["public"]["Enums"]["quality_subject"]
          updated_at?: string
        }
        Update: {
          ai_summary?: string
          band?: string
          created_at?: string
          criteria?: Json
          fellow_id?: string
          id?: string
          model?: string | null
          overall_score?: number
          reviewer_notes?: string
          scored_at?: string
          scored_by?: string | null
          subject_id?: string
          subject_type?: Database["public"]["Enums"]["quality_subject"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quality_scores_fellow_id_fkey"
            columns: ["fellow_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_scores_scored_by_fkey"
            columns: ["scored_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reflection_actions: {
        Row: {
          action_text: string
          created_at: string
          done_at: string | null
          fellow_id: string
          id: string
          is_done: boolean
          reflection_id: string | null
          rota_entry_id: string | null
          updated_at: string
        }
        Insert: {
          action_text: string
          created_at?: string
          done_at?: string | null
          fellow_id: string
          id?: string
          is_done?: boolean
          reflection_id?: string | null
          rota_entry_id?: string | null
          updated_at?: string
        }
        Update: {
          action_text?: string
          created_at?: string
          done_at?: string | null
          fellow_id?: string
          id?: string
          is_done?: boolean
          reflection_id?: string | null
          rota_entry_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reflection_actions_fellow_id_fkey"
            columns: ["fellow_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reflection_actions_reflection_id_fkey"
            columns: ["reflection_id"]
            isOneToOne: false
            referencedRelation: "reflections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reflection_actions_rota_entry_id_fkey"
            columns: ["rota_entry_id"]
            isOneToOne: false
            referencedRelation: "rota_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      reflections: {
        Row: {
          created_at: string
          fellow_id: string
          follow_up_actions: string | null
          id: string
          key_learning_points: string | null
          rota_entry_id: string
          status: Database["public"]["Enums"]["reflection_status"]
          updated_at: string
          what_could_be_improved: string | null
          what_went_well: string | null
        }
        Insert: {
          created_at?: string
          fellow_id: string
          follow_up_actions?: string | null
          id?: string
          key_learning_points?: string | null
          rota_entry_id: string
          status?: Database["public"]["Enums"]["reflection_status"]
          updated_at?: string
          what_could_be_improved?: string | null
          what_went_well?: string | null
        }
        Update: {
          created_at?: string
          fellow_id?: string
          follow_up_actions?: string | null
          id?: string
          key_learning_points?: string | null
          rota_entry_id?: string
          status?: Database["public"]["Enums"]["reflection_status"]
          updated_at?: string
          what_could_be_improved?: string | null
          what_went_well?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reflections_fellow_id_fkey"
            columns: ["fellow_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reflections_rota_entry_id_fkey"
            columns: ["rota_entry_id"]
            isOneToOne: false
            referencedRelation: "rota_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          capacity: number
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          capacity: number
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          capacity?: number
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      rota_changes: {
        Row: {
          action: string
          changed_by: string | null
          changed_by_name: string | null
          created_at: string
          entry_date: string | null
          fellow_id: string | null
          id: string
          rota_entry_id: string | null
          summary: string
        }
        Insert: {
          action: string
          changed_by?: string | null
          changed_by_name?: string | null
          created_at?: string
          entry_date?: string | null
          fellow_id?: string | null
          id?: string
          rota_entry_id?: string | null
          summary: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          changed_by_name?: string | null
          created_at?: string
          entry_date?: string | null
          fellow_id?: string | null
          id?: string
          rota_entry_id?: string | null
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "rota_changes_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rota_changes_fellow_id_fkey"
            columns: ["fellow_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rota_changes_rota_entry_id_fkey"
            columns: ["rota_entry_id"]
            isOneToOne: false
            referencedRelation: "rota_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      rota_entries: {
        Row: {
          activity_label: string
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at: string
          entry_date: string
          fellow_id: string
          id: string
          import_batch_id: string | null
          imported_from_excel: boolean
          notes: string | null
          time_slot: Database["public"]["Enums"]["time_slot"]
          updated_at: string
        }
        Insert: {
          activity_label: string
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          entry_date: string
          fellow_id: string
          id?: string
          import_batch_id?: string | null
          imported_from_excel?: boolean
          notes?: string | null
          time_slot: Database["public"]["Enums"]["time_slot"]
          updated_at?: string
        }
        Update: {
          activity_label?: string
          activity_type?: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          entry_date?: string
          fellow_id?: string
          id?: string
          import_batch_id?: string | null
          imported_from_excel?: boolean
          notes?: string | null
          time_slot?: Database["public"]["Enums"]["time_slot"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rota_entries_fellow_id_fkey"
            columns: ["fellow_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      swap_requests: {
        Row: {
          created_at: string
          id: string
          reason: string | null
          requesting_fellow_id: string
          resolved_at: string | null
          rota_entry_id: string
          status: Database["public"]["Enums"]["swap_status"]
          target_fellow_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string | null
          requesting_fellow_id: string
          resolved_at?: string | null
          rota_entry_id: string
          status?: Database["public"]["Enums"]["swap_status"]
          target_fellow_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string | null
          requesting_fellow_id?: string
          resolved_at?: string | null
          rota_entry_id?: string
          status?: Database["public"]["Enums"]["swap_status"]
          target_fellow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "swap_requests_requesting_fellow_id_fkey"
            columns: ["requesting_fellow_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swap_requests_rota_entry_id_fkey"
            columns: ["rota_entry_id"]
            isOneToOne: false
            referencedRelation: "rota_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swap_requests_target_fellow_id_fkey"
            columns: ["target_fellow_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teaching_assignments: {
        Row: {
          assignment_type: string
          block_code: string | null
          block_name: string | null
          duration_hours: number | null
          fellow_id: string | null
          id: string
          notes: string | null
          rotation_level: string | null
          session_name: string | null
          university: string | null
        }
        Insert: {
          assignment_type: string
          block_code?: string | null
          block_name?: string | null
          duration_hours?: number | null
          fellow_id?: string | null
          id?: string
          notes?: string | null
          rotation_level?: string | null
          session_name?: string | null
          university?: string | null
        }
        Update: {
          assignment_type?: string
          block_code?: string | null
          block_name?: string | null
          duration_hours?: number | null
          fellow_id?: string | null
          id?: string
          notes?: string | null
          rotation_level?: string | null
          session_name?: string | null
          university?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teaching_assignments_fellow_id_fkey"
            columns: ["fellow_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_fellow_id: { Args: never; Returns: string }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_staff: { Args: never; Returns: boolean }
    }
    Enums: {
      activity_type:
        | "education"
        | "clinical"
        | "annual_leave"
        | "study_leave"
        | "nwd"
        | "toil"
        | "induction"
        | "prep_day"
        | "other_leave"
        | "other"
        | "sim"
      fellow_tier: "Lead" | "Senior" | "Core" | "Haematology"
      leave_request_status: "pending" | "approved" | "declined"
      leave_type: "annual" | "study"
      quality_subject: "reflection" | "peer_feedback"
      reflection_status:
        | "not_started"
        | "in_progress"
        | "complete"
        | "dismissed"
      swap_status: "pending" | "accepted" | "declined" | "cancelled" | "expired"
      time_slot: "AM" | "PM" | "ALL_DAY"
      user_role:
        | "fellow"
        | "lead_fellow"
        | "coordinator"
        | "administrator"
        | "faculty"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      activity_type: [
        "education",
        "clinical",
        "annual_leave",
        "study_leave",
        "nwd",
        "toil",
        "induction",
        "prep_day",
        "other_leave",
        "other",
        "sim",
      ],
      fellow_tier: ["Lead", "Senior", "Core", "Haematology"],
      leave_request_status: ["pending", "approved", "declined"],
      leave_type: ["annual", "study"],
      quality_subject: ["reflection", "peer_feedback"],
      reflection_status: [
        "not_started",
        "in_progress",
        "complete",
        "dismissed",
      ],
      swap_status: ["pending", "accepted", "declined", "cancelled", "expired"],
      time_slot: ["AM", "PM", "ALL_DAY"],
      user_role: [
        "fellow",
        "lead_fellow",
        "coordinator",
        "administrator",
        "faculty",
      ],
    },
  },
} as const
