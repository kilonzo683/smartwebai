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
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          organization_id: string | null
          resource_id: string | null
          resource_type: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          organization_id?: string | null
          resource_id?: string | null
          resource_type: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
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
      conversations: {
        Row: {
          agent_type: string
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_type: string
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_type?: string
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          document_id: string | null
          id: string
          questions: Json
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          id?: string
          questions?: Json
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string | null
          id?: string
          questions?: Json
          title?: string
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
