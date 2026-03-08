export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      titles: {
        Row: {
          cover_image_url: string | null;
          created_at: string;
          description: string | null;
          detail_updated_at: string | null;
          developers: string[];
          earliest_release_date: string | null;
          external_id: string;
          genres: string[];
          id: string;
          kind: string;
          name: string;
          platforms: Json;
          publishers: string[];
          releases: Json;
          search_updated_at: string;
          slug: string;
          source: string;
          updated_at: string;
          website_url: string | null;
        };
        Insert: {
          cover_image_url?: string | null;
          created_at?: string;
          description?: string | null;
          detail_updated_at?: string | null;
          developers?: string[];
          earliest_release_date?: string | null;
          external_id: string;
          genres?: string[];
          id: string;
          kind: string;
          name: string;
          platforms?: Json;
          publishers?: string[];
          releases?: Json;
          search_updated_at?: string;
          slug: string;
          source: string;
          updated_at?: string;
          website_url?: string | null;
        };
        Update: {
          cover_image_url?: string | null;
          created_at?: string;
          description?: string | null;
          detail_updated_at?: string | null;
          developers?: string[];
          earliest_release_date?: string | null;
          external_id?: string;
          genres?: string[];
          id?: string;
          kind?: string;
          name?: string;
          platforms?: Json;
          publishers?: string[];
          releases?: Json;
          search_updated_at?: string;
          slug?: string;
          source?: string;
          updated_at?: string;
          website_url?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
