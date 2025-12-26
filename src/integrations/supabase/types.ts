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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agent_access: {
        Row: {
          agent_type: string
          allowed_roles: Database["public"]["Enums"]["app_role"][]
          created_at: string
          id: string
          is_enabled: boolean | null
          organization_id: string
          settings: Json | null
        }
        Insert: {
          agent_type: string
          allowed_roles?: Database["public"]["Enums"]["app_role"][]
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          organization_id: string
          settings?: Json | null
        }
        Update: {
          agent_type?: string
          allowed_roles?: Database["public"]["Enums"]["app_role"][]
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          organization_id?: string
          settings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_access_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_performance: {
        Row: {
          agent_type: string
          avg_confidence_score: number | null
          avg_response_time_seconds: number | null
          avg_satisfaction_score: number | null
          created_at: string
          date: string
          escalated_conversations: number | null
          id: string
          organization_id: string
          resolved_conversations: number | null
          total_conversations: number | null
          total_messages: number | null
        }
        Insert: {
          agent_type: string
          avg_confidence_score?: number | null
          avg_response_time_seconds?: number | null
          avg_satisfaction_score?: number | null
          created_at?: string
          date: string
          escalated_conversations?: number | null
          id?: string
          organization_id: string
          resolved_conversations?: number | null
          total_conversations?: number | null
          total_messages?: number | null
        }
        Update: {
          agent_type?: string
          avg_confidence_score?: number | null
          avg_response_time_seconds?: number | null
          avg_satisfaction_score?: number | null
          created_at?: string
          date?: string
          escalated_conversations?: number | null
          id?: string
          organization_id?: string
          resolved_conversations?: number | null
          total_conversations?: number | null
          total_messages?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_performance_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          agent_type: string | null
          channel: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          organization_id: string | null
          user_id: string | null
        }
        Insert: {
          agent_type?: string | null
          channel?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          user_id?: string | null
        }
        Update: {
          agent_type?: string | null
          channel?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_name: string | null
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          organization_id: string | null
          resource_id: string | null
          resource_type: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_name?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          organization_id?: string | null
          resource_id?: string | null
          resource_type: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_name?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          organization_id?: string | null
          resource_id?: string | null
          resource_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_settings: {
        Row: {
          created_at: string
          frequency: string | null
          id: string
          is_enabled: boolean | null
          last_backup_at: string | null
          next_backup_at: string | null
          organization_id: string
          retention_days: number | null
          tables_to_backup: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          frequency?: string | null
          id?: string
          is_enabled?: boolean | null
          last_backup_at?: string | null
          next_backup_at?: string | null
          organization_id: string
          retention_days?: number | null
          tables_to_backup?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          frequency?: string | null
          id?: string
          is_enabled?: boolean | null
          last_backup_at?: string | null
          next_backup_at?: string | null
          organization_id?: string
          retention_days?: number | null
          tables_to_backup?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "backup_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_routing_rules: {
        Row: {
          agent_type: string
          channel_id: string
          conditions: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          organization_id: string
          priority: number | null
        }
        Insert: {
          agent_type: string
          channel_id: string
          conditions?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          organization_id: string
          priority?: number | null
        }
        Update: {
          agent_type?: string
          channel_id?: string
          conditions?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          organization_id?: string
          priority?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "channel_routing_rules_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "communication_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_routing_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_channels: {
        Row: {
          channel_type: string
          config: Json | null
          created_at: string
          credentials: Json | null
          id: string
          is_enabled: boolean | null
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          channel_type: string
          config?: Json | null
          created_at?: string
          credentials?: Json | null
          id?: string
          is_enabled?: boolean | null
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          channel_type?: string
          config?: Json | null
          created_at?: string
          credentials?: Json | null
          id?: string
          is_enabled?: boolean | null
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_channels_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          agent_type: string
          confidence_score: number | null
          created_at: string
          customer_satisfaction: number | null
          escalation_reason: string | null
          id: string
          is_escalated: boolean | null
          resolution_notes: string | null
          resolved_at: string | null
          sentiment: string | null
          tags: string[] | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_type: string
          confidence_score?: number | null
          created_at?: string
          customer_satisfaction?: number | null
          escalation_reason?: string | null
          id?: string
          is_escalated?: boolean | null
          resolution_notes?: string | null
          resolved_at?: string | null
          sentiment?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_type?: string
          confidence_score?: number | null
          created_at?: string
          customer_satisfaction?: number | null
          escalation_reason?: string | null
          id?: string
          is_escalated?: boolean | null
          resolution_notes?: string | null
          resolved_at?: string | null
          sentiment?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      database_backups: {
        Row: {
          backup_name: string
          backup_type: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          file_path: string | null
          file_size: number | null
          id: string
          organization_id: string
          records_count: number | null
          started_at: string | null
          status: string
          tables_included: string[] | null
        }
        Insert: {
          backup_name: string
          backup_type?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          organization_id: string
          records_count?: number | null
          started_at?: string | null
          status?: string
          tables_included?: string[] | null
        }
        Update: {
          backup_name?: string
          backup_type?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          organization_id?: string
          records_count?: number | null
          started_at?: string | null
          status?: string
          tables_included?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "database_backups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      escalation_tickets: {
        Row: {
          assigned_to: string | null
          conversation_id: string | null
          created_at: string
          description: string | null
          escalated_by: string
          id: string
          notes: Json | null
          organization_id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          conversation_id?: string | null
          created_at?: string
          description?: string | null
          escalated_by: string
          id?: string
          notes?: Json | null
          organization_id: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          conversation_id?: string | null
          created_at?: string
          description?: string | null
          escalated_by?: string
          id?: string
          notes?: Json | null
          organization_id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escalation_tickets_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalation_tickets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base: {
        Row: {
          content: string | null
          created_at: string
          file_path: string | null
          file_type: string | null
          id: string
          is_active: boolean | null
          organization_id: string
          tags: string[] | null
          title: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          file_path?: string | null
          file_type?: string | null
          id?: string
          is_active?: boolean | null
          organization_id: string
          tags?: string[] | null
          title: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          content?: string | null
          created_at?: string
          file_path?: string | null
          file_type?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lecture_documents: {
        Row: {
          content_type: string | null
          created_at: string
          extracted_text: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          user_id: string
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          extracted_text?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          user_id: string
        }
        Update: {
          content_type?: string | null
          created_at?: string
          extracted_text?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      lecturer_reports: {
        Row: {
          content: Json
          created_at: string
          export_format: string | null
          generated_at: string
          id: string
          is_exported: boolean | null
          quiz_id: string | null
          report_type: string
          title: string
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          export_format?: string | null
          generated_at?: string
          id?: string
          is_exported?: boolean | null
          quiz_id?: string | null
          report_type: string
          title: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          export_format?: string | null
          generated_at?: string
          id?: string
          is_exported?: boolean | null
          quiz_id?: string | null
          report_type?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lecturer_reports_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean | null
          message: string | null
          organization_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          organization_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          organization_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          organization_id: string
          permissions: Json | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          organization_id: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          organization_id?: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          max_agents: number | null
          max_messages_per_month: number | null
          max_users: number | null
          messages_used: number | null
          name: string
          owner_id: string
          primary_color: string | null
          settings: Json | null
          slug: string
          subscription_plan: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          max_agents?: number | null
          max_messages_per_month?: number | null
          max_users?: number | null
          messages_used?: number | null
          name: string
          owner_id: string
          primary_color?: string | null
          settings?: Json | null
          slug: string
          subscription_plan?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          max_agents?: number | null
          max_messages_per_month?: number | null
          max_users?: number | null
          messages_used?: number | null
          name?: string
          owner_id?: string
          primary_color?: string | null
          settings?: Json | null
          slug?: string
          subscription_plan?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json
          completed_at: string
          id: string
          quiz_id: string
          score: number
          total_questions: number
          user_id: string
        }
        Insert: {
          answers?: Json
          completed_at?: string
          id?: string
          quiz_id: string
          score?: number
          total_questions?: number
          user_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string
          id?: string
          quiz_id?: string
          score?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          difficulty: string | null
          document_id: string | null
          id: string
          questions: Json
          title: string
          topics: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          difficulty?: string | null
          document_id?: string | null
          id?: string
          questions?: Json
          title: string
          topics?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          difficulty?: string | null
          document_id?: string | null
          id?: string
          questions?: Json
          title?: string
          topics?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "lecture_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_versions: {
        Row: {
          created_at: string
          id: string
          resume_id: string
          snapshot: Json
          title: string
          version_number: number
        }
        Insert: {
          created_at?: string
          id?: string
          resume_id: string
          snapshot: Json
          title: string
          version_number?: number
        }
        Update: {
          created_at?: string
          id?: string
          resume_id?: string
          snapshot?: Json
          title?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "resume_versions_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      resumes: {
        Row: {
          content: Json
          created_at: string
          id: string
          section_order: string[]
          status: string
          template: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          section_order?: string[]
          status?: string
          template?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          section_order?: string[]
          status?: string
          template?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      secretary_calendar_events: {
        Row: {
          attendees: string[] | null
          created_at: string
          description: string | null
          end_time: string
          id: string
          is_all_day: boolean | null
          location: string | null
          reminder_minutes: number | null
          start_time: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attendees?: string[] | null
          created_at?: string
          description?: string | null
          end_time: string
          id?: string
          is_all_day?: boolean | null
          location?: string | null
          reminder_minutes?: number | null
          start_time: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attendees?: string[] | null
          created_at?: string
          description?: string | null
          end_time?: string
          id?: string
          is_all_day?: boolean | null
          location?: string | null
          reminder_minutes?: number | null
          start_time?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      secretary_email_drafts: {
        Row: {
          body: string
          created_at: string
          id: string
          priority: string | null
          recipient_email: string | null
          status: string
          subject: string
          tone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          priority?: string | null
          recipient_email?: string | null
          status?: string
          subject: string
          tone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          priority?: string | null
          recipient_email?: string | null
          status?: string
          subject?: string
          tone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      secretary_reminders: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_completed: boolean | null
          is_recurring: boolean | null
          recurrence_pattern: string | null
          remind_at: string
          task_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean | null
          is_recurring?: boolean | null
          recurrence_pattern?: string | null
          remind_at: string
          task_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean | null
          is_recurring?: boolean | null
          recurrence_pattern?: string | null
          remind_at?: string
          task_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "secretary_reminders_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "secretary_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      secretary_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          source: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          source?: string | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          source?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_brand_profiles: {
        Row: {
          brand_name: string
          brand_voice: string | null
          color_palette: string[] | null
          created_at: string
          do_not_use: string[] | null
          hashtag_groups: Json | null
          id: string
          is_active: boolean | null
          key_topics: string[] | null
          target_audience: string | null
          tone_examples: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_name: string
          brand_voice?: string | null
          color_palette?: string[] | null
          created_at?: string
          do_not_use?: string[] | null
          hashtag_groups?: Json | null
          id?: string
          is_active?: boolean | null
          key_topics?: string[] | null
          target_audience?: string | null
          tone_examples?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_name?: string
          brand_voice?: string | null
          color_palette?: string[] | null
          created_at?: string
          do_not_use?: string[] | null
          hashtag_groups?: Json | null
          id?: string
          is_active?: boolean | null
          key_topics?: string[] | null
          target_audience?: string | null
          tone_examples?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_campaigns: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          goals: Json | null
          id: string
          name: string
          performance_summary: Json | null
          platforms: string[] | null
          start_date: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          goals?: Json | null
          id?: string
          name: string
          performance_summary?: Json | null
          platforms?: string[] | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          goals?: Json | null
          id?: string
          name?: string
          performance_summary?: Json | null
          platforms?: string[] | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_content_calendar: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          campaign_id: string | null
          content: string | null
          created_at: string
          engagement_metrics: Json | null
          hashtags: string[] | null
          id: string
          media_urls: string[] | null
          platform: string
          post_type: string | null
          published_at: string | null
          scheduled_at: string | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          campaign_id?: string | null
          content?: string | null
          created_at?: string
          engagement_metrics?: Json | null
          hashtags?: string[] | null
          id?: string
          media_urls?: string[] | null
          platform: string
          post_type?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          campaign_id?: string | null
          content?: string | null
          created_at?: string
          engagement_metrics?: Json | null
          hashtags?: string[] | null
          id?: string
          media_urls?: string[] | null
          platform?: string
          post_type?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_content_calendar_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "social_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      student_performance: {
        Row: {
          average_score: number | null
          created_at: string
          feedback_notes: string | null
          id: string
          last_attempt_at: string | null
          quiz_id: string | null
          strong_topics: string[] | null
          student_identifier: string
          topic_scores: Json | null
          total_attempts: number | null
          updated_at: string
          user_id: string
          weak_topics: string[] | null
        }
        Insert: {
          average_score?: number | null
          created_at?: string
          feedback_notes?: string | null
          id?: string
          last_attempt_at?: string | null
          quiz_id?: string | null
          strong_topics?: string[] | null
          student_identifier: string
          topic_scores?: Json | null
          total_attempts?: number | null
          updated_at?: string
          user_id: string
          weak_topics?: string[] | null
        }
        Update: {
          average_score?: number | null
          created_at?: string
          feedback_notes?: string | null
          id?: string
          last_attempt_at?: string | null
          quiz_id?: string | null
          strong_topics?: string[] | null
          student_identifier?: string
          topic_scores?: Json | null
          total_attempts?: number | null
          updated_at?: string
          user_id?: string
          weak_topics?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "student_performance_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          features: Json | null
          id: string
          is_active: boolean | null
          max_agents: number
          max_messages: number
          max_users: number
          name: string
          price_monthly: number
          price_yearly: number | null
          slug: string
        }
        Insert: {
          created_at?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_agents: number
          max_messages: number
          max_users: number
          name: string
          price_monthly: number
          price_yearly?: number | null
          slug: string
        }
        Update: {
          created_at?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_agents?: number
          max_messages?: number
          max_users?: number
          name?: string
          price_monthly?: number
          price_yearly?: number | null
          slug?: string
        }
        Relationships: []
      }
      support_documents: {
        Row: {
          content_type: string | null
          created_at: string
          extracted_text: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          user_id: string
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          extracted_text?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          user_id: string
        }
        Update: {
          content_type?: string | null
          created_at?: string
          extracted_text?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      support_resolutions: {
        Row: {
          conversation_id: string | null
          created_at: string
          created_by: string
          customer_satisfaction: number | null
          id: string
          issue_summary: string
          organization_id: string | null
          resolution_steps: Json | null
          resolution_summary: string
          resolution_time_minutes: number | null
          tags: string[] | null
          ticket_id: string | null
          updated_at: string
          was_escalated: boolean | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          created_by: string
          customer_satisfaction?: number | null
          id?: string
          issue_summary: string
          organization_id?: string | null
          resolution_steps?: Json | null
          resolution_summary: string
          resolution_time_minutes?: number | null
          tags?: string[] | null
          ticket_id?: string | null
          updated_at?: string
          was_escalated?: boolean | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          created_by?: string
          customer_satisfaction?: number | null
          id?: string
          issue_summary?: string
          organization_id?: string | null
          resolution_steps?: Json | null
          resolution_summary?: string
          resolution_time_minutes?: number | null
          tags?: string[] | null
          ticket_id?: string | null
          updated_at?: string
          was_escalated?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "support_resolutions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_resolutions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_resolutions_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "escalation_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          is_internal: boolean | null
          ticket_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          ticket_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_notes_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "escalation_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_org_role: {
        Args: { _org_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "org_admin"
        | "staff"
        | "lecturer"
        | "support_agent"
        | "end_user"
      ticket_priority: "low" | "medium" | "high" | "urgent"
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
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
      app_role: [
        "super_admin",
        "org_admin",
        "staff",
        "lecturer",
        "support_agent",
        "end_user",
      ],
      ticket_priority: ["low", "medium", "high", "urgent"],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
    },
  },
} as const
