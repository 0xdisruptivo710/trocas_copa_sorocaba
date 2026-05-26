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
      trocas_billing: {
        Row: {
          id: string;
          user_id: string;
          abacate_charge_id: string;
          product: "premium";
          amount_cents: number;
          status: "PENDING" | "PAID" | "CANCELLED" | "EXPIRED" | "REFUNDED";
          br_code: string | null;
          br_code_base64: string | null;
          referral_code: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
          updated_at: string;
          paid_at: string | null;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          abacate_charge_id: string;
          product: "premium";
          amount_cents: number;
          status?: "PENDING" | "PAID" | "CANCELLED" | "EXPIRED" | "REFUNDED";
          br_code?: string | null;
          br_code_base64?: string | null;
          referral_code?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
          paid_at?: string | null;
          expires_at?: string | null;
        };
        Update: Partial<{
          status: "PENDING" | "PAID" | "CANCELLED" | "EXPIRED" | "REFUNDED";
          paid_at: string | null;
          metadata: Record<string, unknown>;
          updated_at: string;
        }>;
        Relationships: [];
      };
      trocas_referrals: {
        Row: {
          id: string;
          referrer_id: string;
          referred_id: string;
          source: "coupon" | "signup_link";
          effective_at: string | null;
          rewarded_at: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      trocas_completed_trades: {
        Row: {
          id: string;
          proposal_msg_id: string;
          chat_id: string;
          author_id: string;
          partner_id: string;
          give_codes: string[];
          receive_codes: string[];
          author_confirmed_at: string | null;
          partner_confirmed_at: string | null;
          applied_at: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      trocas_trade_ratings: {
        Row: {
          id: string;
          trade_id: string;
          rater_id: string;
          rated_id: string;
          score: 1 | -1;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trade_id: string;
          rater_id: string;
          rated_id: string;
          score: 1 | -1;
          comment?: string | null;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      trocas_chats: {
        Row: {
          id: string;
          user_a: string;
          user_b: string;
          created_at: string;
          last_message_at: string;
        };
        Insert: {
          id?: string;
          user_a: string;
          user_b: string;
          created_at?: string;
          last_message_at?: string;
        };
        Update: Partial<{
          id: string;
          user_a: string;
          user_b: string;
          created_at: string;
          last_message_at: string;
        }>;
        Relationships: [];
      };
      trocas_messages: {
        Row: {
          id: string;
          chat_id: string;
          sender_id: string;
          body: string;
          created_at: string;
          read_at: string | null;
          kind: "text" | "sticker_card" | "proposal" | "system";
          metadata: Record<string, unknown>;
        };
        Insert: {
          id?: string;
          chat_id: string;
          sender_id: string;
          body: string;
          created_at?: string;
          read_at?: string | null;
          kind?: "text" | "sticker_card" | "proposal" | "system";
          metadata?: Record<string, unknown>;
        };
        Update: Partial<{
          id: string;
          chat_id: string;
          sender_id: string;
          body: string;
          created_at: string;
          read_at: string | null;
          kind: "text" | "sticker_card" | "proposal" | "system";
          metadata: Record<string, unknown>;
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
      trocas_blocks: {
        Row: {
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          blocker_id: string;
          blocked_id: string;
          created_at?: string;
        };
        Update: Partial<{
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        }>;
        Relationships: [];
      };
      trocas_notifications: {
        Row: {
          id: string;
          user_id: string;
          kind:
            | "message"
            | "proposal_new"
            | "proposal_reply"
            | "trade_completed";
          chat_id: string | null;
          actor_id: string | null;
          payload: Json;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind:
            | "message"
            | "proposal_new"
            | "proposal_reply"
            | "trade_completed";
          chat_id?: string | null;
          actor_id?: string | null;
          payload?: Json;
          read_at?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          read_at: string | null;
        }>;
        Relationships: [];
      };
      trocas_partners: {
        Row: {
          id: string;
          slug: string;
          name: string;
          instagram: string | null;
          email: string | null;
          pix_key: string | null;
          commission_cents: number;
          dashboard_token: string;
          dashboard_token_expires_at: string;
          status: "active" | "paused" | "terminated";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          instagram?: string | null;
          email?: string | null;
          pix_key?: string | null;
          commission_cents?: number;
          dashboard_token?: string;
          dashboard_token_expires_at?: string;
          status?: "active" | "paused" | "terminated";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          slug: string;
          name: string;
          instagram: string | null;
          email: string | null;
          pix_key: string | null;
          commission_cents: number;
          dashboard_token: string;
          dashboard_token_expires_at: string;
          status: "active" | "paused" | "terminated";
          notes: string | null;
        }>;
        Relationships: [];
      };
      trocas_partner_attributions: {
        Row: {
          user_id: string;
          partner_id: string;
          source: "cookie" | "coupon";
          created_at: string;
        };
        Insert: {
          user_id: string;
          partner_id: string;
          source: "cookie" | "coupon";
          created_at?: string;
        };
        Update: Partial<{
          partner_id: string;
          source: "cookie" | "coupon";
          created_at: string;
        }>;
        Relationships: [];
      };
      trocas_reports: {
        Row: {
          id: string;
          reporter_id: string;
          reported_id: string;
          reason:
            | "spam"
            | "assedio"
            | "fraude_troca"
            | "conteudo_improprio"
            | "perfil_falso"
            | "menor_de_idade"
            | "outro";
          details: string | null;
          context_chat_id: string | null;
          status: "open" | "reviewing" | "resolved" | "dismissed";
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          reported_id: string;
          reason:
            | "spam"
            | "assedio"
            | "fraude_troca"
            | "conteudo_improprio"
            | "perfil_falso"
            | "menor_de_idade"
            | "outro";
          details?: string | null;
          context_chat_id?: string | null;
          status?: "open" | "reviewing" | "resolved" | "dismissed";
          created_at?: string;
          resolved_at?: string | null;
        };
        Update: Partial<{
          status: "open" | "reviewing" | "resolved" | "dismissed";
          resolved_at: string | null;
        }>;
        Relationships: [];
      };
    };
    Views: {
      trocas_referral_stats: {
        Row: {
          user_id: string;
          username: string;
          total_referrals: number;
          effective_referrals: number;
          rewarded_referrals: number;
        };
        Relationships: [];
      };
      trocas_user_reputation: {
        Row: {
          user_id: string;
          username: string;
          positive_count: number;
          negative_count: number;
          total_ratings: number;
          positive_pct: number | null;
        };
        Relationships: [];
      };
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
      trocas_my_blocks: {
        Row: {
          blocker_id: string;
          blocked_id: string;
          created_at: string;
          username: string;
          full_name: string;
          avatar_url: string | null;
          city: string | null;
          state: string | null;
        };
        Relationships: [];
      };
      trocas_partner_public: {
        Row: {
          id: string;
          slug: string;
          name: string;
          instagram: string | null;
          status: "active" | "paused" | "terminated";
        };
        Relationships: [];
      };
    };
    Functions: {
      trocas_find_matches: {
        Args: {
          p_radius_km?: number;
          p_limit?: number;
          p_search?: string | null;
          p_state?: string | null;
          p_only_with_matches?: boolean;
        };
        Returns: {
          other_user: string;
          username: string;
          full_name: string;
          avatar_url: string | null;
          city: string | null;
          state: string | null;
          distance_km: number | null;
          i_can_give: number;
          i_can_get: number;
          match_score: number;
          lat_approx: number | null;
          lng_approx: number | null;
        }[];
      };
      trocas_open_chat: {
        Args: {
          other_user: string;
        };
        Returns: string;
      };
      trocas_respond_to_proposal: {
        Args: {
          p_proposal_msg_id: string;
          p_response: "accepted" | "rejected" | "cancelled";
        };
        Returns: string;
      };
      trocas_init_trade: {
        Args: { p_proposal_msg_id: string };
        Returns: string;
      };
      trocas_confirm_trade: {
        Args: { p_trade_id: string };
        Returns: { status: string; trade_id?: string; me_confirmed?: boolean };
      };
      trocas_register_referral: {
        Args: { p_referrer_username: string; p_source?: "coupon" | "signup_link" };
        Returns: string;
      };
      trocas_check_referral_effective: {
        Args: Record<string, never>;
        Returns: null;
      };
      trocas_block_user: {
        Args: { p_other: string };
        Returns: null;
      };
      trocas_unblock_user: {
        Args: { p_other: string };
        Returns: null;
      };
      trocas_report_user: {
        Args: {
          p_other: string;
          p_reason:
            | "spam"
            | "assedio"
            | "fraude_troca"
            | "conteudo_improprio"
            | "perfil_falso"
            | "menor_de_idade"
            | "outro";
          p_details?: string | null;
          p_chat_id?: string | null;
        };
        Returns: string;
      };
      trocas_blocked_pair: {
        Args: { p_a: string; p_b: string };
        Returns: boolean;
      };
      trocas_my_approx_latlng: {
        Args: Record<string, never>;
        Returns: { lat: number | null; lng: number | null }[];
      };
      trocas_mark_notification_read: {
        Args: { p_id: string };
        Returns: null;
      };
      trocas_mark_all_notifications_read: {
        Args: Record<string, never>;
        Returns: number;
      };
      trocas_attribute_signup: {
        Args: { p_slug: string; p_source?: "cookie" | "coupon" };
        Returns: boolean;
      };
      trocas_admin_create_partner: {
        Args: {
          p_slug: string;
          p_name: string;
          p_instagram?: string | null;
          p_email?: string | null;
          p_pix_key?: string | null;
          p_commission_cents?: number;
        };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
