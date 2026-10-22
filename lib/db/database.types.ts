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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      change_log: {
        Row: {
          applied_at: string
          id: string
          inverse_operations: Json
          operations: Json
          suggestion_id: string
          undone_at: string | null
          workspace_id: string
        }
        Insert: {
          applied_at?: string
          id?: string
          inverse_operations: Json
          operations: Json
          suggestion_id: string
          undone_at?: string | null
          workspace_id: string
        }
        Update: {
          applied_at?: string
          id?: string
          inverse_operations?: Json
          operations?: Json
          suggestion_id?: string
          undone_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_log_suggestion_workspace_fkey"
            columns: ["suggestion_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "suggestions"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "change_log_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_connections: {
        Row: {
          access_token: string
          calendar_id: string
          created_at: string
          id: string
          last_synced_at: string | null
          provider: string
          refresh_token: string | null
          space_id: string
          token_expires_at: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          access_token: string
          calendar_id?: string
          created_at?: string
          id?: string
          last_synced_at?: string | null
          provider?: string
          refresh_token?: string | null
          space_id: string
          token_expires_at?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          access_token?: string
          calendar_id?: string
          created_at?: string
          id?: string
          last_synced_at?: string | null
          provider?: string
          refresh_token?: string | null
          space_id?: string
          token_expires_at?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_connections_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_connections_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      component_catalog: {
        Row: {
          category: string
          id: string
          sort_order: number
          surfaces: string[]
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          id: string
          sort_order?: number
          surfaces?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          id?: string
          sort_order?: number
          surfaces?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      drafts: {
        Row: {
          body: string
          channel: string
          created_at: string
          entity_id: string
          id: string
          status: string
          suggestion_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          body: string
          channel: string
          created_at?: string
          entity_id: string
          id?: string
          status?: string
          suggestion_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          entity_id?: string
          id?: string
          status?: string
          suggestion_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drafts_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drafts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      entities: {
        Row: {
          aliases: string[]
          archived_at: string | null
          color: string | null
          created_at: string
          excluded_from_suggestions: boolean
          id: string
          kind: string
          last_activity_at: string | null
          name: string
          space_id: string
          typical_gap_days: number | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          aliases?: string[]
          archived_at?: string | null
          color?: string | null
          created_at?: string
          excluded_from_suggestions?: boolean
          id?: string
          kind: string
          last_activity_at?: string | null
          name: string
          space_id: string
          typical_gap_days?: number | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          aliases?: string[]
          archived_at?: string | null
          color?: string | null
          created_at?: string
          excluded_from_suggestions?: boolean
          id?: string
          kind?: string
          last_activity_at?: string | null
          name?: string
          space_id?: string
          typical_gap_days?: number | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entities_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entities_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          id: string
          name: string
          props: Json
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          props?: Json
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          props?: Json
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      field_definitions: {
        Row: {
          created_at: string
          entity_kind: string | null
          id: string
          key: string
          label: string
          options: Json
          position: number
          source: string
          type: string
          visible: boolean
          workspace_id: string
        }
        Insert: {
          created_at?: string
          entity_kind?: string | null
          id?: string
          key: string
          label: string
          options?: Json
          position?: number
          source: string
          type: string
          visible?: boolean
          workspace_id: string
        }
        Update: {
          created_at?: string
          entity_kind?: string | null
          id?: string
          key?: string
          label?: string
          options?: Json
          position?: number
          source?: string
          type?: string
          visible?: boolean
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_definitions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      item_entity_extractions: {
        Row: {
          confidence: number
          created_at: string
          id: string
          kind: string
          matches_existing_id: string | null
          name: string
          space_id: string
          work_item_id: string
          workspace_id: string
        }
        Insert: {
          confidence: number
          created_at?: string
          id?: string
          kind: string
          matches_existing_id?: string | null
          name: string
          space_id: string
          work_item_id: string
          workspace_id: string
        }
        Update: {
          confidence?: number
          created_at?: string
          id?: string
          kind?: string
          matches_existing_id?: string | null
          name?: string
          space_id?: string
          work_item_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_entity_extractions_matches_existing_id_fkey"
            columns: ["matches_existing_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_entity_extractions_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_entity_extractions_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_entity_extractions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      llm_cache: {
        Row: {
          cache_key: string
          created_at: string
          response: Json
        }
        Insert: {
          cache_key: string
          created_at?: string
          response: Json
        }
        Update: {
          cache_key?: string
          created_at?: string
          response?: Json
        }
        Relationships: []
      }
      profile_component_approvals: {
        Row: {
          approved_at: string
          component_id: string
          profile_id: string
        }
        Insert: {
          approved_at?: string
          component_id: string
          profile_id: string
        }
        Update: {
          approved_at?: string
          component_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_component_approvals_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_dashboard_widgets: {
        Row: {
          component_id: string
          config: Json
          profile_id: string
          sort_order: number
        }
        Insert: {
          component_id: string
          config?: Json
          profile_id: string
          sort_order?: number
        }
        Update: {
          component_id?: string
          config?: Json
          profile_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "profile_dashboard_widgets_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_sidebar_pins: {
        Row: {
          component_id: string
          profile_id: string
          sort_order: number
        }
        Insert: {
          component_id: string
          profile_id: string
          sort_order?: number
        }
        Update: {
          component_id?: string
          profile_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "profile_sidebar_pins_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      recurrence_rules: {
        Row: {
          active: boolean
          by_weekday: number[]
          created_at: string
          duration_min: number | null
          ends_on: string | null
          exceptions: string[]
          freq: string
          id: string
          interval_count: number
          space_id: string
          source: string
          starts_on: string
          template_item: Json
          time_of_day: string | null
          workspace_id: string
        }
        Insert: {
          active?: boolean
          by_weekday?: number[]
          created_at?: string
          duration_min?: number | null
          ends_on?: string | null
          exceptions?: string[]
          freq?: string
          id?: string
          interval_count?: number
          space_id: string
          source: string
          starts_on?: string
          template_item: Json
          time_of_day?: string | null
          workspace_id: string
        }
        Update: {
          active?: boolean
          by_weekday?: number[]
          created_at?: string
          duration_min?: number | null
          ends_on?: string | null
          exceptions?: string[]
          freq?: string
          id?: string
          interval_count?: number
          space_id?: string
          source?: string
          starts_on?: string
          template_item?: Json
          time_of_day?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurrence_rules_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          body: Json
          body_text: string
          created_at: string
          id: string
          owner_id: string
          owner_type: string
          page_kind: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          body?: Json
          body_text?: string
          created_at?: string
          id?: string
          owner_id: string
          owner_type: string
          page_kind?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          body?: Json
          body_text?: string
          created_at?: string
          id?: string
          owner_id?: string
          owner_type?: string
          page_kind?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      page_versions: {
        Row: {
          body: Json
          body_text: string
          created_at: string
          id: string
          page_id: string
        }
        Insert: {
          body: Json
          body_text?: string
          created_at?: string
          id?: string
          page_id: string
        }
        Update: {
          body?: Json
          body_text?: string
          created_at?: string
          id?: string
          page_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_versions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_entity_extractions: {
        Row: {
          confidence: number
          created_at: string
          id: string
          kind: string
          matches_existing_id: string | null
          name: string
          page_id: string
          space_id: string
          workspace_id: string
        }
        Insert: {
          confidence: number
          created_at?: string
          id?: string
          kind: string
          matches_existing_id?: string | null
          name: string
          page_id: string
          space_id: string
          workspace_id: string
        }
        Update: {
          confidence?: number
          created_at?: string
          id?: string
          kind?: string
          matches_existing_id?: string | null
          name?: string
          page_id?: string
          space_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_entity_extractions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_move_corrections: {
        Row: {
          created_at: string
          from_space_id: string
          id: string
          item_id: string
          title: string
          to_space_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          from_space_id: string
          id?: string
          item_id: string
          title: string
          to_space_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          from_space_id?: string
          id?: string
          item_id?: string
          title?: string
          to_space_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_move_corrections_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          archived_at: string | null
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_default: boolean
          name: string
          parent_space_id: string | null
          sort_order: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean
          name: string
          parent_space_id?: string | null
          sort_order?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean
          name?: string
          parent_space_id?: string | null
          sort_order?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spaces_parent_space_id_fkey"
            columns: ["parent_space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spaces_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      suggestions: {
        Row: {
          confidence: number
          created_at: string
          dedupe_key: string
          evidence: Json
          id: string
          operations: Json
          reason: string
          resolved_at: string | null
          status: string
          type: string
          workspace_id: string
        }
        Insert: {
          confidence: number
          created_at?: string
          dedupe_key: string
          evidence?: Json
          id?: string
          operations: Json
          reason: string
          resolved_at?: string | null
          status?: string
          type: string
          workspace_id: string
        }
        Update: {
          confidence?: number
          created_at?: string
          dedupe_key?: string
          evidence?: Json
          id?: string
          operations?: Json
          reason?: string
          resolved_at?: string | null
          status?: string
          type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggestions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      view_definitions: {
        Row: {
          calendar_range: string | null
          color_by_field: string | null
          created_at: string
          filters: Json
          group_by_field: string | null
          id: string
          name: string
          position: number
          source: string
          type: string
          visible: boolean
          workspace_id: string
        }
        Insert: {
          calendar_range?: string | null
          color_by_field?: string | null
          created_at?: string
          filters?: Json
          group_by_field?: string | null
          id?: string
          name: string
          position?: number
          source: string
          type: string
          visible?: boolean
          workspace_id: string
        }
        Update: {
          calendar_range?: string | null
          color_by_field?: string | null
          created_at?: string
          filters?: Json
          group_by_field?: string | null
          id?: string
          name?: string
          position?: number
          source?: string
          type?: string
          visible?: boolean
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "view_definitions_group_by_field_fkey"
            columns: ["workspace_id", "group_by_field"]
            isOneToOne: false
            referencedRelation: "field_definitions"
            referencedColumns: ["workspace_id", "key"]
          },
          {
            foreignKeyName: "view_definitions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      work_items: {
        Row: {
          all_day: boolean
          archived_at: string | null
          completed_at: string | null
          created_at: string
          data: Json
          due_date: string | null
          element_kind: string
          end_at: string | null
          external_id: string | null
          external_provider: string | null
          id: string
          notes: string | null
          recurrence_id: string | null
          recurrence_instance_date: string | null
          source: string
          space_confidence: number | null
          space_id: string
          start_at: string | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          all_day?: boolean
          archived_at?: string | null
          completed_at?: string | null
          created_at?: string
          data?: Json
          due_date?: string | null
          element_kind?: string
          end_at?: string | null
          external_id?: string | null
          external_provider?: string | null
          id?: string
          notes?: string | null
          recurrence_id?: string | null
          recurrence_instance_date?: string | null
          source?: string
          space_confidence?: number | null
          space_id: string
          start_at?: string | null
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          all_day?: boolean
          archived_at?: string | null
          completed_at?: string | null
          created_at?: string
          data?: Json
          due_date?: string | null
          element_kind?: string
          end_at?: string | null
          external_id?: string | null
          external_provider?: string | null
          id?: string
          notes?: string | null
          recurrence_id?: string | null
          recurrence_instance_date?: string | null
          source?: string
          space_confidence?: number | null
          space_id?: string
          start_at?: string | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_items_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_list_items: {
        Row: {
          list_id: string
          sort_order: number
          work_item_id: string
        }
        Insert: {
          list_id: string
          sort_order?: number
          work_item_id: string
        }
        Update: {
          list_id?: string
          sort_order?: number
          work_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "workspace_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_list_items_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_lists: {
        Row: {
          created_at: string
          id: string
          name: string
          space_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          space_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          space_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_lists_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_lists_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          business_type: string | null
          created_at: string
          current_period_end: string | null
          deleted_at: string | null
          id: string
          item_label: string
          name: string
          onboarding_answers: Json
          owner_id: string
          plan: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          business_type?: string | null
          created_at?: string
          current_period_end?: string | null
          deleted_at?: string | null
          id?: string
          item_label?: string
          name?: string
          onboarding_answers?: Json
          owner_id: string
          plan?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          business_type?: string | null
          created_at?: string
          current_period_end?: string | null
          deleted_at?: string | null
          id?: string
          item_label?: string
          name?: string
          onboarding_answers?: Json
          owner_id?: string
          plan?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ensure_workspace_for_user: {
        Args: Record<PropertyKey, never>
        Returns: Database['public']['Tables']['workspaces']['Row']
      }
      is_workspace_owner: { Args: { ws: string }; Returns: boolean }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
