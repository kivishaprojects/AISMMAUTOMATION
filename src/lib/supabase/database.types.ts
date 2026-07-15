export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_generation_jobs: {
        Row: {
          cost_cents: number | null
          created_at: string
          created_by: string
          external_job_id: string | null
          id: string
          organization_id: string
          prompt: string
          provider: string
          result_asset_id: string | null
          status: string
          type: string
        }
        Insert: {
          cost_cents?: number | null
          created_at?: string
          created_by: string
          external_job_id?: string | null
          id?: string
          organization_id: string
          prompt: string
          provider: string
          result_asset_id?: string | null
          status?: string
          type: string
        }
        Update: {
          cost_cents?: number | null
          created_at?: string
          created_by?: string
          external_job_id?: string | null
          id?: string
          organization_id?: string
          prompt?: string
          provider?: string
          result_asset_id?: string | null
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_generation_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generation_jobs_result_asset_id_fkey"
            columns: ["result_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          brand_kit_id: string | null
          created_at: string
          created_by: string
          id: string
          metadata: Json | null
          organization_id: string
          storage_path: string
          type: Database["public"]["Enums"]["asset_type"]
          url: string
        }
        Insert: {
          brand_kit_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          metadata?: Json | null
          organization_id: string
          storage_path: string
          type: Database["public"]["Enums"]["asset_type"]
          url: string
        }
        Update: {
          brand_kit_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          metadata?: Json | null
          organization_id?: string
          storage_path?: string
          type?: Database["public"]["Enums"]["asset_type"]
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_brand_kit_id_fkey"
            columns: ["brand_kit_id"]
            isOneToOne: false
            referencedRelation: "brand_kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_kits: {
        Row: {
          colors: Json | null
          created_at: string
          fonts: Json | null
          id: string
          logo_url: string | null
          name: string
          organization_id: string
          tone_of_voice: string | null
        }
        Insert: {
          colors?: Json | null
          created_at?: string
          fonts?: Json | null
          id?: string
          logo_url?: string | null
          name: string
          organization_id: string
          tone_of_voice?: string | null
        }
        Update: {
          colors?: Json | null
          created_at?: string
          fonts?: Json | null
          id?: string
          logo_url?: string | null
          name?: string
          organization_id?: string
          tone_of_voice?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_kits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_notes: {
        Row: {
          created_at: string
          created_by: string
          details: string | null
          id: string
          note_date: string
          notified: boolean
          organization_id: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          details?: string | null
          id?: string
          note_date: string
          notified?: boolean
          organization_id: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          details?: string | null
          id?: string
          note_date?: string
          notified?: boolean
          organization_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      geo_check_results: {
        Row: {
          checked_at: string
          id: string
          mentioned: boolean
          organization_id: string
          provider: string
          response_snippet: string | null
          tracked_prompt_id: string
        }
        Insert: {
          checked_at?: string
          id?: string
          mentioned: boolean
          organization_id: string
          provider?: string
          response_snippet?: string | null
          tracked_prompt_id: string
        }
        Update: {
          checked_at?: string
          id?: string
          mentioned?: boolean
          organization_id?: string
          provider?: string
          response_snippet?: string | null
          tracked_prompt_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "geo_check_results_tracked_prompt_id_fkey"
            columns: ["tracked_prompt_id"]
            isOneToOne: false
            referencedRelation: "geo_tracked_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      geo_tracked_prompts: {
        Row: {
          active: boolean
          brand_name: string
          created_at: string
          created_by: string
          id: string
          organization_id: string
          prompt: string
        }
        Insert: {
          active?: boolean
          brand_name: string
          created_at?: string
          created_by: string
          id?: string
          organization_id: string
          prompt: string
        }
        Update: {
          active?: boolean
          brand_name?: string
          created_at?: string
          created_by?: string
          id?: string
          organization_id?: string
          prompt?: string
        }
        Relationships: [
          {
            foreignKeyName: "geo_tracked_prompts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inbox_messages: {
        Row: {
          ai_suggested_reply: string | null
          body: string
          channel: string
          created_at: string
          external_id: string
          from_name: string | null
          id: string
          organization_id: string
          platform: Database["public"]["Enums"]["platform_type"]
          replied_at: string | null
          status: string
        }
        Insert: {
          ai_suggested_reply?: string | null
          body: string
          channel: string
          created_at?: string
          external_id: string
          from_name?: string | null
          id?: string
          organization_id: string
          platform: Database["public"]["Enums"]["platform_type"]
          replied_at?: string | null
          status?: string
        }
        Update: {
          ai_suggested_reply?: string | null
          body?: string
          channel?: string
          created_at?: string
          external_id?: string
          from_name?: string | null
          id?: string
          organization_id?: string
          platform?: Database["public"]["Enums"]["platform_type"]
          replied_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbox_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      keyword_reports: {
        Row: {
          clusters: Json | null
          created_at: string
          created_by: string
          gaps: string | null
          id: string
          keywords_input: string
          organization_id: string
          topic: string | null
        }
        Insert: {
          clusters?: Json | null
          created_at?: string
          created_by: string
          gaps?: string | null
          id?: string
          keywords_input: string
          organization_id: string
          topic?: string | null
        }
        Update: {
          clusters?: Json | null
          created_at?: string
          created_by?: string
          gaps?: string | null
          id?: string
          keywords_input?: string
          organization_id?: string
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "keyword_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          organization_id: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          organization_id: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          organization_id?: string
          read?: boolean
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
      org_integrations: {
        Row: {
          api_key: string | null
          created_at: string
          id: string
          mode: string
          organization_id: string
          provider: string
          updated_at: string
        }
        Insert: {
          api_key?: string | null
          created_at?: string
          id?: string
          mode?: string
          organization_id: string
          provider: string
          updated_at?: string
        }
        Update: {
          api_key?: string | null
          created_at?: string
          id?: string
          mode?: string
          organization_id?: string
          provider?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_integrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          brand_config: Json | null
          created_at: string
          credits_balance: number
          id: string
          is_white_label: boolean
          name: string
          parent_org_id: string | null
          plan: Database["public"]["Enums"]["plan_type"]
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          updated_at: string
        }
        Insert: {
          brand_config?: Json | null
          created_at?: string
          credits_balance?: number
          id?: string
          is_white_label?: boolean
          name: string
          parent_org_id?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          slug: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Update: {
          brand_config?: Json | null
          created_at?: string
          credits_balance?: number
          id?: string
          is_white_label?: boolean
          name?: string
          parent_org_id?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          slug?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      page_analysis_reports: {
        Row: {
          checklist: Json | null
          created_at: string
          created_by: string
          id: string
          organization_id: string
          page_name: string | null
          recommendations: string | null
          score: number | null
          social_account_id: string
          stats: Json | null
        }
        Insert: {
          checklist?: Json | null
          created_at?: string
          created_by: string
          id?: string
          organization_id: string
          page_name?: string | null
          recommendations?: string | null
          score?: number | null
          social_account_id: string
          stats?: Json | null
        }
        Update: {
          checklist?: Json | null
          created_at?: string
          created_by?: string
          id?: string
          organization_id?: string
          page_name?: string | null
          recommendations?: string | null
          score?: number | null
          social_account_id?: string
          stats?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "page_analysis_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_analysis_reports_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_assets: {
        Row: {
          asset_id: string
          post_id: string
        }
        Insert: {
          asset_id: string
          post_id: string
        }
        Update: {
          asset_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_assets_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_assets_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_targets: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          platform_post_id: string | null
          post_id: string
          social_account_id: string
          status: Database["public"]["Enums"]["post_status"]
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          platform_post_id?: string | null
          post_id: string
          social_account_id: string
          status?: Database["public"]["Enums"]["post_status"]
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          platform_post_id?: string | null
          post_id?: string
          social_account_id?: string
          status?: Database["public"]["Enums"]["post_status"]
        }
        Relationships: [
          {
            foreignKeyName: "post_targets_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_targets_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          approval_state: Database["public"]["Enums"]["approval_state"]
          caption: string | null
          created_at: string
          created_by: string
          hashtags: string[] | null
          id: string
          organization_id: string
          scheduled_for: string | null
          status: Database["public"]["Enums"]["post_status"]
          updated_at: string
        }
        Insert: {
          approval_state?: Database["public"]["Enums"]["approval_state"]
          caption?: string | null
          created_at?: string
          created_by: string
          hashtags?: string[] | null
          id?: string
          organization_id: string
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          updated_at?: string
        }
        Update: {
          approval_state?: Database["public"]["Enums"]["approval_state"]
          caption?: string | null
          created_at?: string
          created_by?: string
          hashtags?: string[] | null
          id?: string
          organization_id?: string
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_audit_fixes: {
        Row: {
          audit_id: string
          created_at: string
          current_value: string | null
          fix_type: string
          id: string
          organization_id: string
          snippet: string
          status: string
          suggested_value: string
          target_ref: string | null
        }
        Insert: {
          audit_id: string
          created_at?: string
          current_value?: string | null
          fix_type: string
          id?: string
          organization_id: string
          snippet: string
          status?: string
          suggested_value: string
          target_ref?: string | null
        }
        Update: {
          audit_id?: string
          created_at?: string
          current_value?: string | null
          fix_type?: string
          id?: string
          organization_id?: string
          snippet?: string
          status?: string
          suggested_value?: string
          target_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_audit_fixes_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "seo_audits"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_audits: {
        Row: {
          alt_text_suggestions: Json | null
          checks: Json | null
          created_at: string
          created_by: string
          fixes_status: Json | null
          id: string
          organization_id: string
          pagespeed: Json | null
          recommendations: string | null
          score: number | null
          suggested_meta_description: string | null
          suggested_title: string | null
          url: string
        }
        Insert: {
          alt_text_suggestions?: Json | null
          checks?: Json | null
          created_at?: string
          created_by: string
          fixes_status?: Json | null
          id?: string
          organization_id: string
          pagespeed?: Json | null
          recommendations?: string | null
          score?: number | null
          suggested_meta_description?: string | null
          suggested_title?: string | null
          url: string
        }
        Update: {
          alt_text_suggestions?: Json | null
          checks?: Json | null
          created_at?: string
          created_by?: string
          fixes_status?: Json | null
          id?: string
          organization_id?: string
          pagespeed?: Json | null
          recommendations?: string | null
          score?: number | null
          suggested_meta_description?: string | null
          suggested_title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_audits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      repo_connections: {
        Row: {
          access_token_encrypted: string
          created_at: string
          id: string
          organization_id: string
          provider: string
          repo_name: string
          repo_owner: string
        }
        Insert: {
          access_token_encrypted: string
          created_at?: string
          id?: string
          organization_id: string
          provider?: string
          repo_name: string
          repo_owner: string
        }
        Update: {
          access_token_encrypted?: string
          created_at?: string
          id?: string
          organization_id?: string
          provider?: string
          repo_name?: string
          repo_owner?: string
        }
        Relationships: [
          {
            foreignKeyName: "repo_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      site_changes: {
        Row: {
          batch_id: string
          change_type: string
          created_at: string
          created_by: string
          current_value: string | null
          file_path: string | null
          id: string
          label: string
          organization_id: string
          page_url: string | null
          pr_url: string | null
          proposed_value: string
          status: string
          updated_at: string
        }
        Insert: {
          batch_id?: string
          change_type: string
          created_at?: string
          created_by: string
          current_value?: string | null
          file_path?: string | null
          id?: string
          label: string
          organization_id: string
          page_url?: string | null
          pr_url?: string | null
          proposed_value: string
          status?: string
          updated_at?: string
        }
        Update: {
          batch_id?: string
          change_type?: string
          created_at?: string
          created_by?: string
          current_value?: string | null
          file_path?: string | null
          id?: string
          label?: string
          organization_id?: string
          page_url?: string | null
          pr_url?: string | null
          proposed_value?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_changes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          access_token_encrypted: string | null
          created_at: string
          external_id: string
          id: string
          organization_id: string
          platform: Database["public"]["Enums"]["platform_type"]
          refresh_token_encrypted: string | null
          status: Database["public"]["Enums"]["connection_status"]
          token_expires_at: string | null
        }
        Insert: {
          access_token_encrypted?: string | null
          created_at?: string
          external_id: string
          id?: string
          organization_id: string
          platform: Database["public"]["Enums"]["platform_type"]
          refresh_token_encrypted?: string | null
          status?: Database["public"]["Enums"]["connection_status"]
          token_expires_at?: string | null
        }
        Update: {
          access_token_encrypted?: string | null
          created_at?: string
          external_id?: string
          id?: string
          organization_id?: string
          platform?: Database["public"]["Enums"]["platform_type"]
          refresh_token_encrypted?: string | null
          status?: Database["public"]["Enums"]["connection_status"]
          token_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          created_at: string
          credits: number
          description: string | null
          id: string
          organization_id: string
          stripe_payment_intent_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          credits: number
          description?: string | null
          id?: string
          organization_id: string
          stripe_payment_intent_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          credits?: number
          description?: string | null
          id?: string
          organization_id?: string
          stripe_payment_intent_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_organization_with_owner: {
        Args: { org_name: string; org_slug: string }
        Returns: Database["public"]["Tables"]["organizations"]["Row"]
      }
      deduct_wallet_credits: {
        Args: { org_id: string; amount: number; description: string }
        Returns: number
      }
      user_has_role: {
        Args: {
          org_id: string
          roles: Database["public"]["Enums"]["org_role"][]
        }
        Returns: boolean
      }
      user_org_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      approval_state: "NOT_REQUIRED" | "PENDING" | "APPROVED" | "REJECTED"
      asset_type: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT"
      connection_status: "ACTIVE" | "EXPIRED" | "REVOKED" | "ERROR"
      org_role: "OWNER" | "ADMIN" | "MANAGER" | "EDITOR" | "APPROVER" | "VIEWER"
      plan_type: "FREE" | "STARTER" | "GROWTH" | "ENTERPRISE" | "AGENCY"
      platform_type:
        | "FACEBOOK"
        | "INSTAGRAM"
        | "LINKEDIN"
        | "X"
        | "THREADS"
        | "PINTEREST"
        | "YOUTUBE"
        | "GOOGLE_BUSINESS"
        | "WHATSAPP"
      post_status: "DRAFT" | "SCHEDULED" | "PUBLISHING" | "PUBLISHED" | "FAILED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  T extends keyof DefaultSchema["Tables"]
> = DefaultSchema["Tables"][T]["Row"]

export type TablesInsert<
  T extends keyof DefaultSchema["Tables"]
> = DefaultSchema["Tables"][T]["Insert"]

export type TablesUpdate<
  T extends keyof DefaultSchema["Tables"]
> = DefaultSchema["Tables"][T]["Update"]

export type Enums<T extends keyof DefaultSchema["Enums"]> = DefaultSchema["Enums"][T]
