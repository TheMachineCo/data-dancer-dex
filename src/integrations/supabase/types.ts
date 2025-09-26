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
      friendship_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          user_a_id: string
          user_b_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          user_a_id: string
          user_b_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          user_a_id?: string
          user_b_id?: string
        }
        Relationships: [
          {
            columns: ["user_a_id"]
            foreignKeyName: "friendship_logs_user_a_id_fkey"
            referencedColumns: ["id"]
            referencedRelation: "profiles"
          },
          {
            columns: ["user_b_id"]
            foreignKeyName: "friendship_logs_user_b_id_fkey"
            referencedColumns: ["id"]
            referencedRelation: "profiles"
          },
        ]
      }
      friendships: {
        Row: {
          ended_at: string | null
          id: string
          started_at: string
          user_a_id: string
          user_b_id: string
        }
        Insert: {
          ended_at?: string | null
          id?: string
          started_at?: string
          user_a_id: string
          user_b_id: string
        }
        Update: {
          ended_at?: string | null
          id?: string
          started_at?: string
          user_a_id?: string
          user_b_id?: string
        }
        Relationships: [
          {
            columns: ["user_a_id"]
            foreignKeyName: "friendships_user_a_id_fkey"
            referencedColumns: ["id"]
            referencedRelation: "profiles"
          },
          {
            columns: ["user_b_id"]
            foreignKeyName: "friendships_user_b_id_fkey"
            referencedColumns: ["id"]
            referencedRelation: "profiles"
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          email: string
          full_name: string
          height: number | null
          id: string
          phone: string | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          email: string
          full_name: string
          height?: number | null
          id?: string
          phone?: string | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          email?: string
          full_name?: string
          height?: number | null
          id?: string
          phone?: string | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: []
      }
      USERS: {
        Row: {
          created_at: string
          id: number
          user_name: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          user_name?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          user_name?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
