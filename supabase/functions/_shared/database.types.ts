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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      notification_events: {
        Row: {
          created_at: string
          event_key: string
          event_type: string
          event_version: number
          id: string
          occurred_at: string
          payload: Json
          title_id: string
        }
        Insert: {
          created_at?: string
          event_key: string
          event_type: string
          event_version: number
          id: string
          occurred_at: string
          payload?: Json
          title_id: string
        }
        Update: {
          created_at?: string
          event_key?: string
          event_type?: string
          event_version?: number
          id?: string
          occurred_at?: string
          payload?: Json
          title_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_events_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          in_app_enabled: boolean
          push_enabled: boolean
          release_approaching_enabled: boolean
          release_date_changed_enabled: boolean
          timing_presets: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          in_app_enabled?: boolean
          push_enabled?: boolean
          release_approaching_enabled?: boolean
          release_date_changed_enabled?: boolean
          timing_presets?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          in_app_enabled?: boolean
          push_enabled?: boolean
          release_approaching_enabled?: boolean
          release_date_changed_enabled?: boolean
          timing_presets?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_records: {
        Row: {
          created_at: string
          destination_kind: string
          destination_title_id: string
          event_id: string
          event_type: string
          id: string
          message: string
          payload: Json
          read_at: string | null
          subtitle: string | null
          title_artwork_url: string | null
          title_id: string
          title_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          destination_kind: string
          destination_title_id: string
          event_id: string
          event_type: string
          id: string
          message: string
          payload?: Json
          read_at?: string | null
          subtitle?: string | null
          title_artwork_url?: string | null
          title_id: string
          title_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          destination_kind?: string
          destination_title_id?: string
          event_id?: string
          event_type?: string
          id?: string
          message?: string
          payload?: Json
          read_at?: string | null
          subtitle?: string | null
          title_artwork_url?: string | null
          title_id?: string
          title_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_records_destination_title_id_fkey"
            columns: ["destination_title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_records_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "notification_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_records_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
        ]
      }
      titles: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          detail_updated_at: string | null
          developers: string[]
          earliest_release_date: string | null
          external_id: string
          genres: string[]
          id: string
          kind: string
          name: string
          platforms: Json
          publishers: string[]
          rawg_added: number | null
          rawg_metacritic: number | null
          rawg_rating: number | null
          rawg_rating_top: number | null
          rawg_ratings_count: number | null
          rawg_reviews_count: number | null
          rawg_suggestions_count: number | null
          releases: Json
          search_name: string
          search_updated_at: string
          slug: string
          source: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          detail_updated_at?: string | null
          developers?: string[]
          earliest_release_date?: string | null
          external_id: string
          genres?: string[]
          id: string
          kind: string
          name: string
          platforms?: Json
          publishers?: string[]
          rawg_added?: number | null
          rawg_metacritic?: number | null
          rawg_rating?: number | null
          rawg_rating_top?: number | null
          rawg_ratings_count?: number | null
          rawg_reviews_count?: number | null
          rawg_suggestions_count?: number | null
          releases?: Json
          search_name: string
          search_updated_at?: string
          slug: string
          source: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          detail_updated_at?: string | null
          developers?: string[]
          earliest_release_date?: string | null
          external_id?: string
          genres?: string[]
          id?: string
          kind?: string
          name?: string
          platforms?: Json
          publishers?: string[]
          rawg_added?: number | null
          rawg_metacritic?: number | null
          rawg_rating?: number | null
          rawg_rating_top?: number | null
          rawg_ratings_count?: number | null
          rawg_reviews_count?: number | null
          rawg_suggestions_count?: number | null
          releases?: Json
          search_name?: string
          search_updated_at?: string
          slug?: string
          source?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      watchlists: {
        Row: {
          created_at: string
          id: string
          title_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          title_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlists_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      watchlist_items: {
        Row: {
          added_at: string | null
          cover_image_url: string | null
          description: string | null
          detail_updated_at: string | null
          developers: string[] | null
          earliest_release_date: string | null
          external_id: string | null
          genres: string[] | null
          id: string | null
          kind: string | null
          name: string | null
          platforms: Json | null
          publishers: string[] | null
          rawg_added: number | null
          rawg_metacritic: number | null
          rawg_rating: number | null
          rawg_rating_top: number | null
          rawg_ratings_count: number | null
          rawg_reviews_count: number | null
          rawg_suggestions_count: number | null
          releases: Json | null
          search_updated_at: string | null
          slug: string | null
          source: string | null
          title_created_at: string | null
          title_id: string | null
          updated_at: string | null
          user_id: string | null
          website_url: string | null
        }
        Relationships: [
          {
            foreignKeyName: "watchlists_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
