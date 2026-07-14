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
          id: string
          is_white_label: boolean
          name: string
          parent_org_id: string | null
          plan: Database["public"]["Enums"]["plan_type"]
          slug: string
          updated_at: string
        }
        Insert: {
          brand_config?: Json | null
          created_at?: string
          id?: string
          is_white_label?: boolean
          name: string
          parent_org_id?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          slug: string
          updated_at?: string
        }
        Update: {
          brand_config?: Json | null
          created_at?: string
          id?: string
          is_white_label?: boolean
          name?: string
          parent_org_id?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          slug?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_organization_with_owner: {
        Args: { org_name: string; org_slug: string }
        Returns: Database["public"]["Tables"]["organizations"]["Row"]
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
