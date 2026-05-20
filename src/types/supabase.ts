/**
 * Minimal Database types for TrocasCopa.
 *
 * The Supabase project is shared with other applications (300+ tables).
 * Instead of generating the full schema, we hand-author types for the
 * `trocas_*` tables we own. Run-time queries against other tables are
 * not supported (and would be blocked by RLS anyway).
 *
 * Regenerate this file by hand when migrations add/change trocas_* tables.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      trocas_profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string;
          avatar_url: string | null;
          bio: string | null;
          city: string | null;
          state: string | null;
          location: unknown | null;
          location_updated_at: string | null;
          is_premium: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          full_name: string;
          avatar_url?: string | null;
          bio?: string | null;
          city?: string | null;
          state?: string | null;
          location?: unknown | null;
          location_updated_at?: string | null;
          is_premium?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          full_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          city?: string | null;
          state?: string | null;
          location?: unknown | null;
          location_updated_at?: string | null;
          is_premium?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      trocas_teams: {
        Row: {
          code: string;
          name_pt: string;
          group_letter: string | null;
          sticker_count: number;
          kind: "team" | "fwc" | "special";
          display_order: number;
        };
        Insert: {
          code: string;
          name_pt: string;
          group_letter?: string | null;
          sticker_count: number;
          kind: "team" | "fwc" | "special";
          display_order: number;
        };
        Update: Partial<{
          code: string;
          name_pt: string;
          group_letter: string | null;
          sticker_count: number;
          kind: "team" | "fwc" | "special";
          display_order: number;
        }>;
        Relationships: [];
      };
      trocas_stickers: {
        Row: {
          code: string;
          team_code: string;
          number: number;
          player_name: string | null;
          position: "GK" | "DEF" | "MID" | "FWD" | "COACH" | "BADGE" | "OTHER" | null;
          is_metalic: boolean;
          image_url: string | null;
        };
        Insert: {
          code: string;
          team_code: string;
          number: number;
          player_name?: string | null;
          position?: "GK" | "DEF" | "MID" | "FWD" | "COACH" | "BADGE" | "OTHER" | null;
          is_metalic?: boolean;
          image_url?: string | null;
        };
        Update: Partial<{
          code: string;
          team_code: string;
          number: number;
          player_name: string | null;
          position: "GK" | "DEF" | "MID" | "FWD" | "COACH" | "BADGE" | "OTHER" | null;
          is_metalic: boolean;
          image_url: string | null;
        }>;
        Relationships: [];
      };
      trocas_user_stickers: {
        Row: {
          user_id: string;
          sticker_code: string;
          owned_count: number;
          is_priority: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          sticker_code: string;
          owned_count?: number;
          is_priority?: boolean;
          updated_at?: string;
        };
        Update: Partial<{
          user_id: string;
          sticker_code: string;
          owned_count: number;
          is_priority: boolean;
          updated_at: string;
        }>;
        Relationships: [];
      };
    };
    Views: {
      trocas_public_profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string;
          avatar_url: string | null;
          bio: string | null;
          city: string | null;
          state: string | null;
          is_premium: boolean;
          created_at: string;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
