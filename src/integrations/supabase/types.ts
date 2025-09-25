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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          traditional_value?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          sensitive_data_processing?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          accident_history: string | null
          ad_id: string | null
          address_1: string | null
          address_2: string | null
          adset_id: string | null
          age: string | null
          agree_privacy_policy: string | null
          applicant_email: string | null
          applied_at: string | null
          background_check_consent: string | null
          campaign_id: string | null
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
          elevenlabs_call_transcript: string | null
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
          ad_id?: string | null
          address_1?: string | null
          address_2?: string | null
          adset_id?: string | null
          age?: string | null
          agree_privacy_policy?: string | null
          applicant_email?: string | null
          applied_at?: string | null
          background_check_consent?: string | null
          campaign_id?: string | null
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
          elevenlabs_call_transcript?: string | null
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
          ad_id?: string | null
          address_1?: string | null
          address_2?: string | null
          adset_id?: string | null
          age?: string | null
          agree_privacy_policy?: string | null
          applicant_email?: string | null
          applied_at?: string | null
          background_check_consent?: string | null
          campaign_id?: string | null
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
          elevenlabs_call_transcript?: string | null
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
      assessment_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string | null
          questions: Json
          scoring_criteria: Json
          status: string
          time_limit: number | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id?: string | null
          questions?: Json
          scoring_criteria?: Json
          status?: string
          time_limit?: number | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          questions?: Json
          scoring_criteria?: Json
          status?: string
          time_limit?: number | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          organization_id: string | null
          record_id: string | null
          sensitive_fields: string[] | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          organization_id?: string | null
          record_id?: string | null
          sensitive_fields?: string[] | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          organization_id?: string | null
          record_id?: string | null
          sensitive_fields?: string[] | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      background_tasks: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          parameters?: Json
          results?: Json | null
          status?: string
          task_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "background_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_allocations: {
        Row: {
          campaign_id: string | null
          category_id: string
          created_at: string
          id: string
          month: number
          monthly_budget: number
          organization_id: string | null
          user_id: string
          year: number
        }
        Insert: {
          campaign_id?: string | null
          category_id: string
          created_at?: string
          id?: string
          month: number
          monthly_budget: number
          organization_id?: string | null
          user_id: string
          year: number
        }
        Update: {
          campaign_id?: string | null
          category_id?: string
          created_at?: string
          id?: string
          month?: number
          monthly_budget?: number
          organization_id?: string | null
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "budget_allocations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_allocations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "job_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_allocations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_job_assignments: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          job_listing_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          job_listing_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          job_listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_job_assignments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_job_assignments_job_listing_id_fkey"
            columns: ["job_listing_id"]
            isOneToOne: false
            referencedRelation: "job_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_assessments: {
        Row: {
          application_id: string | null
          assessment_template_id: string | null
          completed_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          organization_id: string | null
          responses: Json
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          application_id?: string | null
          assessment_template_id?: string | null
          completed_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          organization_id?: string | null
          responses?: Json
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          application_id?: string | null
          assessment_template_id?: string | null
          completed_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          organization_id?: string | null
          responses?: Json
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_assessments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_assessments_assessment_template_id_fkey"
            columns: ["assessment_template_id"]
            isOneToOne: false
            referencedRelation: "assessment_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_assessments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_rankings: {
        Row: {
          application_id: string | null
          created_at: string
          id: string
          job_listing_id: string | null
          last_updated: string
          match_percentage: number
          organization_id: string | null
          overall_score: number
          rank_position: number
          ranking_factors: Json
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          id?: string
          job_listing_id?: string | null
          last_updated?: string
          match_percentage: number
          organization_id?: string | null
          overall_score: number
          rank_position: number
          ranking_factors?: Json
        }
        Update: {
          application_id?: string | null
          created_at?: string
          id?: string
          job_listing_id?: string | null
          last_updated?: string
          match_percentage?: number
          organization_id?: string | null
          overall_score?: number
          rank_position?: number
          ranking_factors?: Json
        }
        Relationships: [
          {
            foreignKeyName: "candidate_rankings_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_rankings_job_listing_id_fkey"
            columns: ["job_listing_id"]
            isOneToOne: false
            referencedRelation: "job_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_rankings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_scores: {
        Row: {
          ai_analysis: Json
          application_id: string | null
          concerns: string[] | null
          confidence_level: number | null
          created_at: string
          factors: Json
          id: string
          model_version: string | null
          organization_id: string | null
          recommendations: string[] | null
          score: number
          score_type: string
          strengths: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_analysis?: Json
          application_id?: string | null
          concerns?: string[] | null
          confidence_level?: number | null
          created_at?: string
          factors?: Json
          id?: string
          model_version?: string | null
          organization_id?: string | null
          recommendations?: string[] | null
          score: number
          score_type: string
          strengths?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_analysis?: Json
          application_id?: string | null
          concerns?: string[] | null
          confidence_level?: number | null
          created_at?: string
          factors?: Json
          id?: string
          model_version?: string | null
          organization_id?: string | null
          recommendations?: string[] | null
          score?: number
          score_type?: string
          strengths?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_scores_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_scores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          organization_id: string | null
          page: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          context?: string | null
          created_at?: string
          id?: string
          organization_id?: string | null
          page?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          context?: string | null
          created_at?: string
          id?: string
          organization_id?: string | null
          page?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          phone?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      job_group_assignments: {
        Row: {
          created_at: string
          id: string
          job_group_id: string
          job_listing_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_group_id: string
          job_listing_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_group_id?: string
          job_listing_id?: string
        }
        Relationships: []
      }
      job_groups: {
        Row: {
          campaign_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string | null
          publisher_endpoint: string | null
          publisher_name: string
          status: string | null
          updated_at: string
          user_id: string
          xml_feed_settings: Json | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id?: string | null
          publisher_endpoint?: string | null
          publisher_name: string
          status?: string | null
          updated_at?: string
          user_id: string
          xml_feed_settings?: Json | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          publisher_endpoint?: string | null
          publisher_name?: string
          status?: string | null
          updated_at?: string
          user_id?: string
          xml_feed_settings?: Json | null
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
          {
            foreignKeyName: "job_listings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          timezone_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meta_ad_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_ad_sets: {
        Row: {
          account_id: string
          adset_id: string
          adset_name: string | null
          bid_amount: number | null
          campaign_id: string
          clicks: number | null
          cpc: number | null
          cpm: number | null
          created_at: string
          created_time: string | null
          ctr: number | null
          daily_budget: number | null
          end_time: string | null
          frequency: number | null
          id: string
          impressions: number | null
          lifetime_budget: number | null
          organization_id: string | null
          reach: number | null
          results: string | null
          spend: number | null
          start_time: string | null
          status: string | null
          targeting: string | null
          updated_at: string
          updated_time: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          adset_id: string
          adset_name?: string | null
          bid_amount?: number | null
          campaign_id: string
          clicks?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string
          created_time?: string | null
          ctr?: number | null
          daily_budget?: number | null
          end_time?: string | null
          frequency?: number | null
          id?: string
          impressions?: number | null
          lifetime_budget?: number | null
          organization_id?: string | null
          reach?: number | null
          results?: string | null
          spend?: number | null
          start_time?: string | null
          status?: string | null
          targeting?: string | null
          updated_at?: string
          updated_time?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          adset_id?: string
          adset_name?: string | null
          bid_amount?: number | null
          campaign_id?: string
          clicks?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string
          created_time?: string | null
          ctr?: number | null
          daily_budget?: number | null
          end_time?: string | null
          frequency?: number | null
          id?: string
          impressions?: number | null
          lifetime_budget?: number | null
          organization_id?: string | null
          reach?: number | null
          results?: string | null
          spend?: number | null
          start_time?: string | null
          status?: string | null
          targeting?: string | null
          updated_at?: string
          updated_time?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meta_ad_sets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_ads: {
        Row: {
          account_id: string
          ad_id: string
          ad_name: string | null
          adset_id: string
          campaign_id: string
          created_at: string
          created_time: string | null
          creative_id: string | null
          id: string
          organization_id: string | null
          preview_url: string | null
          status: string | null
          updated_at: string
          updated_time: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          ad_id: string
          ad_name?: string | null
          adset_id: string
          campaign_id: string
          created_at?: string
          created_time?: string | null
          creative_id?: string | null
          id?: string
          organization_id?: string | null
          preview_url?: string | null
          status?: string | null
          updated_at?: string
          updated_time?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          ad_id?: string
          ad_name?: string | null
          adset_id?: string
          campaign_id?: string
          created_at?: string
          created_time?: string | null
          creative_id?: string | null
          id?: string
          organization_id?: string | null
          preview_url?: string | null
          status?: string | null
          updated_at?: string
          updated_time?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meta_ads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          status?: string | null
          updated_at?: string
          updated_time?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meta_campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          reach?: number | null
          spend?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meta_daily_spend_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_features: {
        Row: {
          created_at: string
          enabled: boolean
          feature_name: string
          id: string
          organization_id: string
          settings: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          feature_name: string
          id?: string
          organization_id: string
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          feature_name?: string
          id?: string
          organization_id?: string
          settings?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_features_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_platform_access: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          organization_id: string
          platform_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          organization_id: string
          platform_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          organization_id?: string
          platform_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_platform_access_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          domain: string | null
          domain_deployed_at: string | null
          domain_dns_records: Json | null
          domain_ssl_status: string | null
          domain_status: string | null
          domain_verification_token: string | null
          id: string
          logo_url: string | null
          name: string
          settings: Json | null
          slug: string
          subscription_status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          domain_deployed_at?: string | null
          domain_dns_records?: Json | null
          domain_ssl_status?: string | null
          domain_status?: string | null
          domain_verification_token?: string | null
          id?: string
          logo_url?: string | null
          name: string
          settings?: Json | null
          slug: string
          subscription_status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          domain_deployed_at?: string | null
          domain_dns_records?: Json | null
          domain_ssl_status?: string | null
          domain_status?: string | null
          domain_verification_token?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          settings?: Json | null
          slug?: string
          subscription_status?: string | null
          updated_at?: string
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
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          api_endpoint?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          api_endpoint?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platforms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          enabled: boolean
          full_name: string | null
          id: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          enabled?: boolean
          full_name?: string | null
          id: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          enabled?: boolean
          full_name?: string | null
          id?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      recruiters: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruiters_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_conversations: {
        Row: {
          application_id: string
          created_at: string
          id: string
          organization_id: string | null
          phone_number: string
          recruiter_id: string
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          organization_id?: string | null
          phone_number: string
          recruiter_id: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          organization_id?: string | null
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
            foreignKeyName: "sms_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          user_id: string | null
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          expires_at: string
          id?: string
          phone_number: string
          token: string
          used?: boolean
          user_id?: string | null
        }
        Update: {
          application_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          phone_number?: string
          token?: string
          used?: boolean
          user_id?: string | null
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
      tenstreet_field_mappings: {
        Row: {
          created_at: string
          field_mappings: Json
          id: string
          is_default: boolean
          mapping_name: string
          organization_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          field_mappings?: Json
          id?: string
          is_default?: boolean
          mapping_name?: string
          organization_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          field_mappings?: Json
          id?: string
          is_default?: boolean
          mapping_name?: string
          organization_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenstreet_field_mappings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          organization_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_agents: {
        Row: {
          agent_id: string
          agent_name: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          organization_id: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          agent_name: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          organization_id: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          agent_name?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_agents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_configurations: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          organization_id: string | null
          updated_at: string
          user_id: string
          webhook_url: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          organization_id?: string | null
          updated_at?: string
          user_id: string
          webhook_url: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          organization_id?: string | null
          updated_at?: string
          user_id?: string
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_configurations_organization_id_fkey"
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
      cleanup_expired_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_sms_links: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_organization: {
        Args: { _admin_email?: string; _name: string; _slug: string }
        Returns: string
      }
      ensure_admin_for_email: {
        Args: { _email: string; _org_slug: string }
        Returns: undefined
      }
      ensure_super_admin_for_email: {
        Args: { _email: string }
        Returns: undefined
      }
      get_application_organization_id: {
        Args: { _application_id: string }
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_dashboard_metrics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_org_id_by_slug: {
        Args: { _slug: string }
        Returns: string
      }
      get_organization_applications: {
        Args: { _limit?: number; _offset?: number; _org_id: string }
        Returns: {
          applicant_email: string
          applied_at: string
          first_name: string
          id: string
          job_listing_id: string
          job_title: string
          last_name: string
          organization_name: string
          phone: string
          status: string
        }[]
      }
      get_organization_platform_access: {
        Args: { _org_id: string }
        Returns: {
          enabled: boolean
          platform_name: string
          updated_at: string
        }[]
      }
      get_organization_with_stats: {
        Args: { _org_id: string }
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
      get_user_organization_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_platform_access: {
        Args: { _platform_name: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      normalize_phone_number: {
        Args: { phone_input: string }
        Returns: string
      }
      organization_has_platform_access: {
        Args: { _org_id: string; _platform_name: string }
        Returns: boolean
      }
      set_organization_platform_access: {
        Args: { _enabled: boolean; _org_id: string; _platform_name: string }
        Returns: undefined
      }
      update_organization_features: {
        Args: { _features: Json; _org_id: string }
        Returns: undefined
      }
      update_user_status: {
        Args: { _enabled: boolean; _user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "super_admin"
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
      app_role: ["admin", "moderator", "user", "super_admin"],
    },
  },
} as const
