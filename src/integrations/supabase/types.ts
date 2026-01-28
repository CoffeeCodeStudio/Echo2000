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
      friends: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          is_best_friend: boolean
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          is_best_friend?: boolean
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          is_best_friend?: boolean
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      good_vibe_allowances: {
        Row: {
          created_at: string
          id: string
          is_paid_user: boolean
          last_reset_at: string
          monthly_allowance: number
          updated_at: string
          user_id: string
          vibes_used_this_month: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_paid_user?: boolean
          last_reset_at?: string
          monthly_allowance?: number
          updated_at?: string
          user_id: string
          vibes_used_this_month?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_paid_user?: boolean
          last_reset_at?: string
          monthly_allowance?: number
          updated_at?: string
          user_id?: string
          vibes_used_this_month?: number
        }
        Relationships: []
      }
      good_vibes: {
        Row: {
          created_at: string
          giver_id: string
          id: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          giver_id: string
          id?: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          giver_id?: string
          id?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      guestbook_entries: {
        Row: {
          author_avatar: string | null
          author_name: string
          created_at: string
          id: string
          message: string
          user_id: string
        }
        Insert: {
          author_avatar?: string | null
          author_name: string
          created_at?: string
          id?: string
          message: string
          user_id: string
        }
        Update: {
          author_avatar?: string | null
          author_name?: string
          created_at?: string
          id?: string
          message?: string
          user_id?: string
        }
        Relationships: []
      }
      lajv_messages: {
        Row: {
          avatar_url: string | null
          created_at: string
          expires_at: string
          id: string
          message: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          message: string
          user_id: string
          username?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          message?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          deleted_by_recipient: boolean
          deleted_by_sender: boolean
          id: string
          is_read: boolean
          is_starred: boolean
          recipient_id: string
          sender_id: string
          subject: string
        }
        Insert: {
          content: string
          created_at?: string
          deleted_by_recipient?: boolean
          deleted_by_sender?: boolean
          id?: string
          is_read?: boolean
          is_starred?: boolean
          recipient_id: string
          sender_id: string
          subject: string
        }
        Update: {
          content?: string
          created_at?: string
          deleted_by_recipient?: boolean
          deleted_by_sender?: boolean
          id?: string
          is_read?: boolean
          is_starred?: boolean
          recipient_id?: string
          sender_id?: string
          subject?: string
        }
        Relationships: []
      }
      profile_guestbook: {
        Row: {
          author_avatar: string | null
          author_id: string
          author_name: string
          created_at: string
          id: string
          message: string
          profile_owner_id: string
        }
        Insert: {
          author_avatar?: string | null
          author_id: string
          author_name: string
          created_at?: string
          id?: string
          message: string
          profile_owner_id: string
        }
        Update: {
          author_avatar?: string | null
          author_id?: string
          author_name?: string
          created_at?: string
          id?: string
          message?: string
          profile_owner_id?: string
        }
        Relationships: []
      }
      profile_visits: {
        Row: {
          id: string
          profile_owner_id: string
          visited_at: string
          visitor_id: string
        }
        Insert: {
          id?: string
          profile_owner_id: string
          visited_at?: string
          visitor_id: string
        }
        Update: {
          id?: string
          profile_owner_id?: string
          visited_at?: string
          visitor_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          body_type: string | null
          city: string | null
          clothing: string | null
          created_at: string
          eats: string | null
          gender: string | null
          hair_color: string | null
          id: string
          interests: string | null
          is_admin: boolean
          likes: string | null
          listens_to: string | null
          looking_for: string[] | null
          occupation: string | null
          personality: string | null
          prefers: string | null
          relationship: string | null
          spanar_in: string | null
          status_message: string | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          body_type?: string | null
          city?: string | null
          clothing?: string | null
          created_at?: string
          eats?: string | null
          gender?: string | null
          hair_color?: string | null
          id?: string
          interests?: string | null
          is_admin?: boolean
          likes?: string | null
          listens_to?: string | null
          looking_for?: string[] | null
          occupation?: string | null
          personality?: string | null
          prefers?: string | null
          relationship?: string | null
          spanar_in?: string | null
          status_message?: string | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          body_type?: string | null
          city?: string | null
          clothing?: string | null
          created_at?: string
          eats?: string | null
          gender?: string | null
          hair_color?: string | null
          id?: string
          interests?: string | null
          is_admin?: boolean
          likes?: string | null
          listens_to?: string | null
          looking_for?: string[] | null
          occupation?: string | null
          personality?: string | null
          prefers?: string | null
          relationship?: string | null
          spanar_in?: string | null
          status_message?: string | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
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
          role: Database["public"]["Enums"]["app_role"]
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
      count_good_vibes: {
        Args: { p_target_id: string; p_target_type: string }
        Returns: number
      }
      delete_expired_lajv_messages: { Args: never; Returns: undefined }
      give_good_vibe: {
        Args: { p_target_id: string; p_target_type: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_user_vibed: {
        Args: { p_target_id: string; p_target_type: string }
        Returns: boolean
      }
      reset_monthly_vibes_if_needed: {
        Args: { p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
