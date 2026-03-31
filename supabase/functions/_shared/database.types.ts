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
          search_name: string;
          rawg_added: number | null;
          rawg_metacritic: number | null;
          rawg_rating: number | null;
          rawg_rating_top: number | null;
          rawg_ratings_count: number | null;
          rawg_reviews_count: number | null;
          rawg_suggestions_count: number | null;
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
          search_name?: string;
          rawg_added?: number | null;
          rawg_metacritic?: number | null;
          rawg_rating?: number | null;
          rawg_rating_top?: number | null;
          rawg_ratings_count?: number | null;
          rawg_reviews_count?: number | null;
          rawg_suggestions_count?: number | null;
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
          search_name?: string;
          rawg_added?: number | null;
          rawg_metacritic?: number | null;
          rawg_rating?: number | null;
          rawg_rating_top?: number | null;
          rawg_ratings_count?: number | null;
          rawg_reviews_count?: number | null;
          rawg_suggestions_count?: number | null;
          releases?: Json;
          search_updated_at?: string;
          slug?: string;
          source?: string;
          updated_at?: string;
          website_url?: string | null;
        };
        Relationships: [];
      };
      watchlists: {
        Row: {
          created_at: string;
          id: string;
          title_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id: string;
          title_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          title_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      watchlist_items: {
        Row: {
          added_at: string | null;
          cover_image_url: string | null;
          description: string | null;
          detail_updated_at: string | null;
          developers: string[] | null;
          earliest_release_date: string | null;
          external_id: string | null;
          genres: string[] | null;
          id: string | null;
          kind: string | null;
          name: string | null;
          platforms: Json | null;
          publishers: string[] | null;
          rawg_added: number | null;
          rawg_metacritic: number | null;
          rawg_rating: number | null;
          rawg_rating_top: number | null;
          rawg_ratings_count: number | null;
          rawg_reviews_count: number | null;
          rawg_suggestions_count: number | null;
          releases: Json | null;
          search_updated_at: string | null;
          slug: string | null;
          source: string | null;
          title_created_at: string | null;
          title_id: string | null;
          updated_at: string | null;
          user_id: string | null;
          website_url: string | null;
        };
        Relationships: [];
      };
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
