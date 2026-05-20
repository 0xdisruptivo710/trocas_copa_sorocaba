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
