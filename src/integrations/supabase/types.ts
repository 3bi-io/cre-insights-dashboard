export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_analysis_cache: {
        Row: {
          analysis_result: Json
          cache_key: string
          confidence_score: number | null
          created_at: string
          expires_at: string
          id: string
          processing_type: string
          provider: string
        }
        Insert: {
          analysis_result: Json
          cache_key: string
          confidence_score?: number | null
          created_at?: string
          expires_at: string
          id?: string
          processing_type: string
          provider: string
        }
        Update: {
          analysis_result?: Json
          cache_key?: string
          confidence_score?: number | null
          created_at?: string
          expires_at?: string
          id?: string
          processing_type?: string
          provider?: string
        }
        Relationships: []
      }
      ai_metrics: {
        Row: {
          ai_value: number | null
          created_at: string
          date: string
          id: string
          improvement_percentage: number | null
          metric_type: string
          traditional_value: number | null
          user_id: string
        }
        Insert: {
          ai_value?: number | null
          created_at?: string
          date?: string
          id?: string
          improvement_percentage?: number | null
          metric_type: string
          traditional_value?: number | null
          user_id: string
        }
        Update: {
          ai_value?: number | null
          created_at?: string
          date?: string
          id?: string
          improvement_percentage?: number | null
          metric_type?: string
          traditional_value?: number | null
          user_id?: string
        }
        Relationships: []
      }
      ai_settings: {
        Row: {
          ai_processing_enabled: boolean | null
          audit_enabled: boolean | null
          bias_reduction_level: number | null
          created_at: string
          data_retention_days: number | null
          data_sharing_level: string | null
          experience_sensitivity: number | null
          explainability_level: string | null
          id: string
          industry_focus: string | null
          sensitive_data_processing: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_processing_enabled?: boolean | null
          audit_enabled?: boolean | null
          bias_reduction_level?: number | null
          created_at?: string
          data_retention_days?: number | null
          data_sharing_level?: string | null
          experience_sensitivity?: number | null
          explainability_level?: string | null
          id?: string
          industry_focus?: string | null
          sensitive_data_processing?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_processing_enabled?: boolean | null
          audit_enabled?: boolean | null
          bias_reduction_level?: number | null
          created_at?: string
          data_retention_days?: number | null
          data_sharing_level?: string | null
          experience_sensitivity?: number | null
          explainability_level?: string | null
          id?: string
          industry_focus?: string | null
          sensitive_data_processing?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          accident_history: string | null
          address_1: string | null
          address_2: string | null
          age: string | null
          agree_privacy_policy: string | null
          applicant_email: string | null
          applied_at: string | null
          background_check_consent: string | null
          can_pass_drug_test: string | null
          can_pass_physical: string | null
          can_work_nights: string | null
          can_work_weekends: string | null
          cdl: string | null
          cdl_class: string | null
          cdl_endorsements: string[] | null
          cdl_expiration_date: string | null
          cdl_state: string | null
          city: string | null
          consent: string | null
          consent_to_email: string | null
          consent_to_sms: string | null
          convicted_felony: string | null
          country: string | null
          created_at: string | null
          custom_questions: Json | null
          date_of_birth: string | null
          display_fields: Json | null
          dot_physical_date: string | null
          driver_id: string | null
          driving_experience_years: number | null
          drug: string | null
          education_level: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          employment_history: Json | null
          exp: string | null
          felony_details: string | null
          first_name: string | null
          full_name: string | null
          government_id: string | null
          government_id_type: string | null
          hazmat_endorsement: string | null
          how_did_you_hear: string | null
          id: string
          job_id: string | null
          job_listing_id: string | null
          last_name: string | null
          medical_card_expiration: string | null
          middle_name: string | null
          military_branch: string | null
          military_end_date: string | null
          military_service: string | null
          military_start_date: string | null
          months: string | null
          notes: string | null
          over_21: string | null
          passport_card: string | null
          phone: string | null
          preferred_contact_method: string | null
          preferred_start_date: string | null
          prefix: string | null
          privacy: string | null
          recruiter_id: string | null
          referral_source: string | null
          salary_expectations: string | null
          secondary_phone: string | null
          source: string | null
          ssn: string | null
          state: string | null
          status: string | null
          suffix: string | null
          twic_card: string | null
          updated_at: string | null
          veteran: string | null
          violation_history: string | null
          willing_to_relocate: string | null
          work_authorization: string | null
          zip: string | null
        }
        Insert: {
          accident_history?: string | null
          address_1?: string | null
          address_2?: string | null
          age?: string | null
          agree_privacy_policy?: string | null
          applicant_email?: string | null
          applied_at?: string | null
          background_check_consent?: string | null
          can_pass_drug_test?: string | null
          can_pass_physical?: string | null
          can_work_nights?: string | null
          can_work_weekends?: string | null
          cdl?: string | null
          cdl_class?: string | null
          cdl_endorsements?: string[] | null
          cdl_expiration_date?: string | null
          cdl_state?: string | null
          city?: string | null
          consent?: string | null
          consent_to_email?: string | null
          consent_to_sms?: string | null
          convicted_felony?: string | null
          country?: string | null
          created_at?: string | null
          custom_questions?: Json | null
          date_of_birth?: string | null
          display_fields?: Json | null
          dot_physical_date?: string | null
          driver_id?: string | null
          driving_experience_years?: number | null
          drug?: string | null
          education_level?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          employment_history?: Json | null
          exp?: string | null
          felony_details?: string | null
          first_name?: string | null
          full_name?: string | null
          government_id?: string | null
          government_id_type?: string | null
          hazmat_endorsement?: string | null
          how_did_you_hear?: string | null
          id?: string
          job_id?: string | null
          job_listing_id?: string | null
          last_name?: string | null
          medical_card_expiration?: string | null
          middle_name?: string | null
          military_branch?: string | null
          military_end_date?: string | null
          military_service?: string | null
          military_start_date?: string | null
          months?: string | null
          notes?: string | null
          over_21?: string | null
          passport_card?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          preferred_start_date?: string | null
          prefix?: string | null
          privacy?: string | null
          recruiter_id?: string | null
          referral_source?: string | null
          salary_expectations?: string | null
          secondary_phone?: string | null
          source?: string | null
          ssn?: string | null
          state?: string | null
          status?: string | null
          suffix?: string | null
          twic_card?: string | null
          updated_at?: string | null
          veteran?: string | null
          violation_history?: string | null
          willing_to_relocate?: string | null
          work_authorization?: string | null
          zip?: string | null
        }
        Update: {
          accident_history?: string | null
          address_1?: string | null
          address_2?: string | null
          age?: string | null
          agree_privacy_policy?: string | null
          applicant_email?: string | null
          applied_at?: string | null
          background_check_consent?: string | null
          can_pass_drug_test?: string | null
          can_pass_physical?: string | null
          can_work_nights?: string | null
          can_work_weekends?: string | null
          cdl?: string | null
          cdl_class?: string | null
          cdl_endorsements?: string[] | null
          cdl_expiration_date?: string | null
          cdl_state?: string | null
          city?: string | null
          consent?: string | null
          consent_to_email?: string | null
          consent_to_sms?: string | null
          convicted_felony?: string | null
          country?: string | null
          created_at?: string | null
          custom_questions?: Json | null
          date_of_birth?: string | null
          display_fields?: Json | null
          dot_physical_date?: string | null
          driver_id?: string | null
          driving_experience_years?: number | null
          drug?: string | null
          education_level?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          employment_history?: Json | null
          exp?: string | null
          felony_details?: string | null
          first_name?: string | null
          full_name?: string | null
          government_id?: string | null
          government_id_type?: string | null
          hazmat_endorsement?: string | null
          how_did_you_hear?: string | null
          id?: string
          job_id?: string | null
          job_listing_id?: string | null
          last_name?: string | null
          medical_card_expiration?: string | null
          middle_name?: string | null
          military_branch?: string | null
          military_end_date?: string | null
          military_service?: string | null
          military_start_date?: string | null
          months?: string | null
          notes?: string | null
          over_21?: string | null
          passport_card?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          preferred_start_date?: string | null
          prefix?: string | null
          privacy?: string | null
          recruiter_id?: string | null
          referral_source?: string | null
          salary_expectations?: string | null
          secondary_phone?: string | null
          source?: string | null
          ssn?: string | null
          state?: string | null
          status?: string | null
          suffix?: string | null
          twic_card?: string | null
          updated_at?: string | null
          veteran?: string | null
          violation_history?: string | null
          willing_to_relocate?: string | null
          work_authorization?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_listing_id_fkey"
            columns: ["job_listing_id"]
            isOneToOne: false
            referencedRelation: "job_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "recruiters"
            referencedColumns: ["id"]
          },
        ]
      }
      background_tasks: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          parameters: Json
          results: Json | null
          status: string
          task_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          parameters?: Json
          results?: Json | null
          status?: string
          task_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          parameters?: Json
          results?: Json | null
          status?: string
          task_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      budget_allocations: {
        Row: {
          category_id: string
          created_at: string
          id: string
          month: number
          monthly_budget: number
          user_id: string
          year: number
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          month: number
          monthly_budget: number
          user_id: string
          year: number
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          month?: number
          monthly_budget?: number
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "budget_allocations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "job_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          id: string
          is_analytics: boolean | null
          message: string
          sender: string
          session_id: string
          timestamp: string
        }
        Insert: {
          id?: string
          is_analytics?: boolean | null
          message: string
          sender: string
          session_id: string
          timestamp?: string
        }
        Update: {
          id?: string
          is_analytics?: boolean | null
          message?: string
          sender?: string
          session_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          context: string | null
          created_at: string
          id: string
          page: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          context?: string | null
          created_at?: string
          id?: string
          page?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          context?: string | null
          created_at?: string
          id?: string
          page?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          city: string | null
          company: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          state: string | null
          status: string
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      daily_spend: {
        Row: {
          amount: number
          clicks: number | null
          created_at: string
          date: string
          id: string
          job_listing_id: string
          views: number | null
        }
        Insert: {
          amount?: number
          clicks?: number | null
          created_at?: string
          date: string
          id?: string
          job_listing_id: string
          views?: number | null
        }
        Update: {
          amount?: number
          clicks?: number | null
          created_at?: string
          date?: string
          id?: string
          job_listing_id?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_spend_job_listing_id_fkey"
            columns: ["job_listing_id"]
            isOneToOne: false
            referencedRelation: "job_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      job_listings: {
        Row: {
          apply_url: string | null
          budget: number | null
          category_id: string
          city: string | null
          client: string | null
          client_id: string | null
          created_at: string
          dest_city: string | null
          dest_state: string | null
          experience_level: string | null
          id: string
          job_id: string | null
          job_summary: string | null
          job_title: string | null
          job_type: string | null
          location: string | null
          radius: number | null
          remote_type: string | null
          salary_max: number | null
          salary_min: number | null
          salary_type: string | null
          state: string | null
          status: string | null
          title: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          apply_url?: string | null
          budget?: number | null
          category_id: string
          city?: string | null
          client?: string | null
          client_id?: string | null
          created_at?: string
          dest_city?: string | null
          dest_state?: string | null
          experience_level?: string | null
          id?: string
          job_id?: string | null
          job_summary?: string | null
          job_title?: string | null
          job_type?: string | null
          location?: string | null
          radius?: number | null
          remote_type?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salary_type?: string | null
          state?: string | null
          status?: string | null
          title: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          apply_url?: string | null
          budget?: number | null
          category_id?: string
          city?: string | null
          client?: string | null
          client_id?: string | null
          created_at?: string
          dest_city?: string | null
          dest_state?: string | null
          experience_level?: string | null
          id?: string
          job_id?: string | null
          job_summary?: string | null
          job_title?: string | null
          job_type?: string | null
          location?: string | null
          radius?: number | null
          remote_type?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salary_type?: string | null
          state?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "job_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_listings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      job_platform_associations: {
        Row: {
          created_at: string
          id: string
          job_listing_id: string
          platform_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_listing_id: string
          platform_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_listing_id?: string
          platform_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_platform_associations_job_listing_id_fkey"
            columns: ["job_listing_id"]
            isOneToOne: false
            referencedRelation: "job_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_platform_associations_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_ad_accounts: {
        Row: {
          account_id: string
          account_name: string | null
          created_at: string
          currency: string | null
          id: string
          timezone_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          account_name?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          timezone_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          account_name?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          timezone_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meta_campaigns: {
        Row: {
          account_id: string
          campaign_id: string
          campaign_name: string | null
          created_at: string
          created_time: string | null
          id: string
          objective: string | null
          status: string | null
          updated_at: string
          updated_time: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          campaign_id: string
          campaign_name?: string | null
          created_at?: string
          created_time?: string | null
          id?: string
          objective?: string | null
          status?: string | null
          updated_at?: string
          updated_time?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          campaign_id?: string
          campaign_name?: string | null
          created_at?: string
          created_time?: string | null
          id?: string
          objective?: string | null
          status?: string | null
          updated_at?: string
          updated_time?: string | null
          user_id?: string
        }
        Relationships: []
      }
      meta_daily_spend: {
        Row: {
          account_id: string
          ad_id: string | null
          adset_id: string | null
          campaign_id: string | null
          clicks: number | null
          cpc: number | null
          cpm: number | null
          created_at: string
          ctr: number | null
          date_start: string
          date_stop: string
          frequency: number | null
          id: string
          impressions: number | null
          reach: number | null
          spend: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          ad_id?: string | null
          adset_id?: string | null
          campaign_id?: string | null
          clicks?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string
          ctr?: number | null
          date_start: string
          date_stop: string
          frequency?: number | null
          id?: string
          impressions?: number | null
          reach?: number | null
          spend?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          ad_id?: string | null
          adset_id?: string | null
          campaign_id?: string | null
          clicks?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string
          ctr?: number | null
          date_start?: string
          date_stop?: string
          frequency?: number | null
          id?: string
          impressions?: number | null
          reach?: number | null
          spend?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      platforms: {
        Row: {
          api_endpoint: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          api_endpoint?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          api_endpoint?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      recruiters: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sms_conversations: {
        Row: {
          application_id: string
          created_at: string
          id: string
          phone_number: string
          recruiter_id: string
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          phone_number: string
          recruiter_id: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          phone_number?: string
          recruiter_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_conversations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_conversations_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "recruiters"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_magic_links: {
        Row: {
          application_id: string | null
          created_at: string
          expires_at: string
          id: string
          phone_number: string
          token: string
          used: boolean
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          expires_at: string
          id?: string
          phone_number: string
          token: string
          used?: boolean
        }
        Update: {
          application_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          phone_number?: string
          token?: string
          used?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "sms_magic_links_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_messages: {
        Row: {
          conversation_id: string
          created_at: string
          direction: string
          id: string
          message: string
          sender_type: string
          status: string
          twilio_sid: string | null
        }
        Insert: {
          conversation_id: string
          created_at?: string
          direction: string
          id?: string
          message: string
          sender_type: string
          status?: string
          twilio_sid?: string | null
        }
        Update: {
          conversation_id?: string
          created_at?: string
          direction?: string
          id?: string
          message?: string
          sender_type?: string
          status?: string
          twilio_sid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "sms_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_sms_links: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_dashboard_metrics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_platform_breakdown_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_spend_chart_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
