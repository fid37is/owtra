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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          activity_type: string
          application_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          user_id: string
        }
        Insert: {
          activity_type: string
          application_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          user_id: string
        }
        Update: {
          activity_type?: string
          application_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          applied_date: string | null
          company_id: string | null
          company_info: Json | null
          company_name: string
          company_website: string | null
          created_at: string | null
          id: string
          interview_dates: Json | null
          interview_prep_enabled: boolean | null
          interview_prep_generated_at: string | null
          interview_prep_notes: string | null
          interview_questions: Json | null
          job_description: string | null
          job_title: string
          job_url: string
          key_requirements: string[] | null
          last_follow_up: string | null
          location: string | null
          match_analysis: Json | null
          match_score: number | null
          next_follow_up_reminder: string | null
          notes: string | null
          offer_details: Json | null
          status: string | null
          updated_at: string | null
          user_id: string
          user_interest_level: number | null
        }
        Insert: {
          applied_date?: string | null
          company_id?: string | null
          company_info?: Json | null
          company_name: string
          company_website?: string | null
          created_at?: string | null
          id?: string
          interview_dates?: Json | null
          interview_prep_enabled?: boolean | null
          interview_prep_generated_at?: string | null
          interview_prep_notes?: string | null
          interview_questions?: Json | null
          job_description?: string | null
          job_title: string
          job_url: string
          key_requirements?: string[] | null
          last_follow_up?: string | null
          location?: string | null
          match_analysis?: Json | null
          match_score?: number | null
          next_follow_up_reminder?: string | null
          notes?: string | null
          offer_details?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          user_interest_level?: number | null
        }
        Update: {
          applied_date?: string | null
          company_id?: string | null
          company_info?: Json | null
          company_name?: string
          company_website?: string | null
          created_at?: string | null
          id?: string
          interview_dates?: Json | null
          interview_prep_enabled?: boolean | null
          interview_prep_generated_at?: string | null
          interview_prep_notes?: string | null
          interview_questions?: Json | null
          job_description?: string | null
          job_title?: string
          job_url?: string
          key_requirements?: string[] | null
          last_follow_up?: string | null
          location?: string | null
          match_analysis?: Json | null
          match_score?: number | null
          next_follow_up_reminder?: string | null
          notes?: string | null
          offer_details?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          user_interest_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          ai_analysis: string | null
          company_size: string | null
          cons: Json | null
          created_at: string | null
          culture_summary: string | null
          description: string | null
          founded_year: number | null
          glassdoor_url: string | null
          headquarters: string | null
          id: string
          industry: string | null
          key_values: string[] | null
          last_researched_at: string | null
          linkedin_url: string | null
          logo_url: string | null
          name: string
          overall_rating: number | null
          pros: Json | null
          slug: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          ai_analysis?: string | null
          company_size?: string | null
          cons?: Json | null
          created_at?: string | null
          culture_summary?: string | null
          description?: string | null
          founded_year?: number | null
          glassdoor_url?: string | null
          headquarters?: string | null
          id?: string
          industry?: string | null
          key_values?: string[] | null
          last_researched_at?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          name: string
          overall_rating?: number | null
          pros?: Json | null
          slug: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          ai_analysis?: string | null
          company_size?: string | null
          cons?: Json | null
          created_at?: string | null
          culture_summary?: string | null
          description?: string | null
          founded_year?: number | null
          glassdoor_url?: string | null
          headquarters?: string | null
          id?: string
          industry?: string | null
          key_values?: string[] | null
          last_researched_at?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          name?: string
          overall_rating?: number | null
          pros?: Json | null
          slug?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          status: string | null
          subject: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          status?: string | null
          subject: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string | null
          subject?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      deletion_log: {
        Row: {
          application_id: string
          created_at: string
          deleted_at: string
          id: string
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          deleted_at?: string
          id?: string
          user_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          deleted_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          dodo_payment_id: string | null
          id: string
          invoice_pdf: string | null
          period_end: string
          period_start: string
          status: string
          stripe_invoice_id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          dodo_payment_id?: string | null
          id?: string
          invoice_pdf?: string | null
          period_end: string
          period_start: string
          status: string
          stripe_invoice_id: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          dodo_payment_id?: string | null
          id?: string
          invoice_pdf?: string | null
          period_end?: string
          period_start?: string
          status?: string
          stripe_invoice_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          brand: string
          created_at: string | null
          exp_month: number
          exp_year: number
          id: string
          is_default: boolean | null
          last4: string
          stripe_payment_method_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          brand: string
          created_at?: string | null
          exp_month: number
          exp_year: number
          id?: string
          is_default?: boolean | null
          last4: string
          stripe_payment_method_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          brand?: string
          created_at?: string | null
          exp_month?: number
          exp_year?: number
          id?: string
          is_default?: boolean | null
          last4?: string
          stripe_payment_method_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string | null
          career_goals: string | null
          created_at: string | null
          current_job_title: string | null
          deal_breakers: Json | null
          deletion_scheduled_at: string | null
          email: string | null
          experience_level: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          long_term_goal: string | null
          management_style_preference: string | null
          onboarding_completed: boolean | null
          preferred_company_size: string[] | null
          preferred_industries: string[] | null
          profile_completed: boolean | null
          resumes: Json | null
          short_term_goal: string | null
          skills: string[] | null
          subscription_tier: string | null
          top_values: Json | null
          updated_at: string | null
          work_location_preference: string | null
        }
        Insert: {
          account_status?: string | null
          career_goals?: string | null
          created_at?: string | null
          current_job_title?: string | null
          deal_breakers?: Json | null
          deletion_scheduled_at?: string | null
          email?: string | null
          experience_level?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          long_term_goal?: string | null
          management_style_preference?: string | null
          onboarding_completed?: boolean | null
          preferred_company_size?: string[] | null
          preferred_industries?: string[] | null
          profile_completed?: boolean | null
          resumes?: Json | null
          short_term_goal?: string | null
          skills?: string[] | null
          subscription_tier?: string | null
          top_values?: Json | null
          updated_at?: string | null
          work_location_preference?: string | null
        }
        Update: {
          account_status?: string | null
          career_goals?: string | null
          created_at?: string | null
          current_job_title?: string | null
          deal_breakers?: Json | null
          deletion_scheduled_at?: string | null
          email?: string | null
          experience_level?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          long_term_goal?: string | null
          management_style_preference?: string | null
          onboarding_completed?: boolean | null
          preferred_company_size?: string[] | null
          preferred_industries?: string[] | null
          profile_completed?: boolean | null
          resumes?: Json | null
          short_term_goal?: string | null
          skills?: string[] | null
          subscription_tier?: string | null
          top_values?: Json | null
          updated_at?: string | null
          work_location_preference?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          approved: boolean | null
          created_at: string | null
          id: string
          name: string
          quote: string
          rating: number
          role: string | null
          updated_at: string | null
        }
        Insert: {
          approved?: boolean | null
          created_at?: string | null
          id?: string
          name: string
          quote: string
          rating: number
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          approved?: boolean | null
          created_at?: string | null
          id?: string
          name?: string
          quote?: string
          rating?: number
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          description: string | null
          discount_percentage: number | null
          display_order: number | null
          dodo_product_id: string
          features: Json | null
          id: string
          interval: string
          is_active: boolean | null
          name: string
          plan_id: string
          price_cents: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          display_order?: number | null
          dodo_product_id: string
          features?: Json | null
          id?: string
          interval: string
          is_active?: boolean | null
          name: string
          plan_id: string
          price_cents: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          display_order?: number | null
          dodo_product_id?: string
          features?: Json | null
          id?: string
          interval?: string
          is_active?: boolean | null
          name?: string
          plan_id?: string
          price_cents?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_cycle: string | null
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          dodo_customer_id: string | null
          dodo_subscription_id: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_cycle?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          dodo_customer_id?: string | null
          dodo_subscription_id?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_cycle?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          dodo_customer_id?: string | null
          dodo_subscription_id?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      email_exists: { Args: { p_email: string }; Returns: boolean }
      get_or_create_company: {
        Args: { p_name: string; p_website?: string }
        Returns: string
      }
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
