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
      adzuna_analytics: {
        Row: {
          applications: number | null
          campaign_id: string
          clicks: number | null
          cpc: number | null
          created_at: string | null
          ctr: number | null
          date: string
          id: string
          impressions: number | null
          job_id: string | null
          organization_id: string | null
          spend: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          applications?: number | null
          campaign_id: string
          clicks?: number | null
          cpc?: number | null
          created_at?: string | null
          ctr?: number | null
          date: string
          id?: string
          impressions?: number | null
          job_id?: string | null
          organization_id?: string | null
          spend?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          applications?: number | null
          campaign_id?: string
          clicks?: number | null
          cpc?: number | null
          created_at?: string | null
          ctr?: number | null
          date?: string
          id?: string
          impressions?: number | null
          job_id?: string | null
          organization_id?: string | null
          spend?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "adzuna_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adzuna_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
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
      ai_decision_tracking: {
        Row: {
          ai_provider: string | null
          application_id: string
          created_at: string
          decision_type: string
          hire_outcome: string | null
          hire_outcome_date: string | null
          id: string
          organization_id: string | null
          quality_score: number | null
          time_to_decision_minutes: number | null
          updated_at: string
          used_ai: boolean
        }
        Insert: {
          ai_provider?: string | null
          application_id: string
          created_at?: string
          decision_type: string
          hire_outcome?: string | null
          hire_outcome_date?: string | null
          id?: string
          organization_id?: string | null
          quality_score?: number | null
          time_to_decision_minutes?: number | null
          updated_at?: string
          used_ai?: boolean
        }
        Update: {
          ai_provider?: string | null
          application_id?: string
          created_at?: string
          decision_type?: string
          hire_outcome?: string | null
          hire_outcome_date?: string | null
          id?: string
          organization_id?: string | null
          quality_score?: number | null
          time_to_decision_minutes?: number | null
          updated_at?: string
          used_ai?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ai_decision_tracking_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_decision_tracking_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_basic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_decision_tracking_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_decision_tracking_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_sensitive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_decision_tracking_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_decision_tracking_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_interaction_logs: {
        Row: {
          ai_provider: string | null
          application_id: string | null
          created_at: string
          error_message: string | null
          id: string
          interaction_type: string
          job_listing_id: string | null
          organization_id: string | null
          response_time_ms: number | null
          success: boolean
          user_id: string | null
        }
        Insert: {
          ai_provider?: string | null
          application_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          interaction_type: string
          job_listing_id?: string | null
          organization_id?: string | null
          response_time_ms?: number | null
          success?: boolean
          user_id?: string | null
        }
        Update: {
          ai_provider?: string | null
          application_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          interaction_type?: string
          job_listing_id?: string | null
          organization_id?: string | null
          response_time_ms?: number | null
          success?: boolean
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_interaction_logs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interaction_logs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_basic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interaction_logs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interaction_logs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_sensitive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interaction_logs_job_listing_id_fkey"
            columns: ["job_listing_id"]
            isOneToOne: false
            referencedRelation: "job_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interaction_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interaction_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "ai_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_performance_metrics: {
        Row: {
          ai_applications_processed: number | null
          ai_avg_cost_per_hire: number | null
          ai_avg_quality_score: number | null
          ai_avg_time_to_hire_hours: number | null
          created_at: string
          id: string
          metric_date: string
          organization_id: string | null
          traditional_applications_processed: number | null
          traditional_avg_cost_per_hire: number | null
          traditional_avg_quality_score: number | null
          traditional_avg_time_to_hire_hours: number | null
          updated_at: string
        }
        Insert: {
          ai_applications_processed?: number | null
          ai_avg_cost_per_hire?: number | null
          ai_avg_quality_score?: number | null
          ai_avg_time_to_hire_hours?: number | null
          created_at?: string
          id?: string
          metric_date?: string
          organization_id?: string | null
          traditional_applications_processed?: number | null
          traditional_avg_cost_per_hire?: number | null
          traditional_avg_quality_score?: number | null
          traditional_avg_time_to_hire_hours?: number | null
          updated_at?: string
        }
        Update: {
          ai_applications_processed?: number | null
          ai_avg_cost_per_hire?: number | null
          ai_avg_quality_score?: number | null
          ai_avg_time_to_hire_hours?: number | null
          created_at?: string
          id?: string
          metric_date?: string
          organization_id?: string | null
          traditional_applications_processed?: number | null
          traditional_avg_cost_per_hire?: number | null
          traditional_avg_quality_score?: number | null
          traditional_avg_time_to_hire_hours?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_performance_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_performance_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
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
          {
            foreignKeyName: "ai_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      api_request_logs: {
        Row: {
          api_key_id: string
          created_at: string
          endpoint: string
          id: string
          organization_id: string
          origin: string | null
          response_status: number | null
          response_time_ms: number | null
        }
        Insert: {
          api_key_id: string
          created_at?: string
          endpoint: string
          id?: string
          organization_id: string
          origin?: string | null
          response_status?: number | null
          response_time_ms?: number | null
        }
        Update: {
          api_key_id?: string
          created_at?: string
          endpoint?: string
          id?: string
          organization_id?: string
          origin?: string | null
          response_status?: number | null
          response_time_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "api_request_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "org_api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_request_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_request_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      application_documents: {
        Row: {
          application_id: string
          created_at: string
          document_type: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          metadata: Json | null
          mime_type: string | null
          screening_request_id: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          application_id: string
          created_at?: string
          document_type: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          screening_request_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          screening_request_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_basic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_sensitive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_documents_screening_request_id_fkey"
            columns: ["screening_request_id"]
            isOneToOne: false
            referencedRelation: "screening_requests"
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
          ats_readiness_score: number | null
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
          driver_type: string | null
          driverreach_applied_via: string | null
          driverreach_last_sync: string | null
          driverreach_sync_status: string | null
          driving_experience_years: number | null
          drug: string | null
          education_level: string | null
          elevenlabs_call_transcript: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          employment_history: Json | null
          enrichment_status: string | null
          exp: string | null
          felony_details: string | null
          first_name: string | null
          first_response_at: string | null
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
          tenstreet_applied_via: string | null
          tenstreet_last_sync: string | null
          tenstreet_sync_status: string | null
          twic_card: string | null
          updated_at: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
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
          ats_readiness_score?: number | null
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
          driver_type?: string | null
          driverreach_applied_via?: string | null
          driverreach_last_sync?: string | null
          driverreach_sync_status?: string | null
          driving_experience_years?: number | null
          drug?: string | null
          education_level?: string | null
          elevenlabs_call_transcript?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          employment_history?: Json | null
          enrichment_status?: string | null
          exp?: string | null
          felony_details?: string | null
          first_name?: string | null
          first_response_at?: string | null
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
          tenstreet_applied_via?: string | null
          tenstreet_last_sync?: string | null
          tenstreet_sync_status?: string | null
          twic_card?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
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
          ats_readiness_score?: number | null
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
          driver_type?: string | null
          driverreach_applied_via?: string | null
          driverreach_last_sync?: string | null
          driverreach_sync_status?: string | null
          driving_experience_years?: number | null
          drug?: string | null
          education_level?: string | null
          elevenlabs_call_transcript?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          employment_history?: Json | null
          enrichment_status?: string | null
          exp?: string | null
          felony_details?: string | null
          first_name?: string | null
          first_response_at?: string | null
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
          tenstreet_applied_via?: string | null
          tenstreet_last_sync?: string | null
          tenstreet_sync_status?: string | null
          twic_card?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
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
          {
            foreignKeyName: "assessment_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      ats_connections: {
        Row: {
          ats_system_id: string
          auto_post_on_status: string[] | null
          client_id: string | null
          created_at: string | null
          credentials: Json
          id: string
          is_auto_post_enabled: boolean | null
          last_error: string | null
          last_sync_at: string | null
          metadata: Json | null
          mode: string
          name: string
          organization_id: string
          status: string
          sync_stats: Json | null
          updated_at: string | null
        }
        Insert: {
          ats_system_id: string
          auto_post_on_status?: string[] | null
          client_id?: string | null
          created_at?: string | null
          credentials?: Json
          id?: string
          is_auto_post_enabled?: boolean | null
          last_error?: string | null
          last_sync_at?: string | null
          metadata?: Json | null
          mode?: string
          name: string
          organization_id: string
          status?: string
          sync_stats?: Json | null
          updated_at?: string | null
        }
        Update: {
          ats_system_id?: string
          auto_post_on_status?: string[] | null
          client_id?: string | null
          created_at?: string | null
          credentials?: Json
          id?: string
          is_auto_post_enabled?: boolean | null
          last_error?: string | null
          last_sync_at?: string | null
          metadata?: Json | null
          mode?: string
          name?: string
          organization_id?: string
          status?: string
          sync_stats?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ats_connections_ats_system_id_fkey"
            columns: ["ats_system_id"]
            isOneToOne: false
            referencedRelation: "ats_systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ats_connections_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ats_connections_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "public_client_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ats_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ats_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      ats_field_mappings: {
        Row: {
          ats_connection_id: string
          created_at: string | null
          field_mappings: Json
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          transform_rules: Json | null
          updated_at: string | null
        }
        Insert: {
          ats_connection_id: string
          created_at?: string | null
          field_mappings?: Json
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          transform_rules?: Json | null
          updated_at?: string | null
        }
        Update: {
          ats_connection_id?: string
          created_at?: string | null
          field_mappings?: Json
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          transform_rules?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ats_field_mappings_ats_connection_id_fkey"
            columns: ["ats_connection_id"]
            isOneToOne: false
            referencedRelation: "ats_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ats_field_mappings_ats_connection_id_fkey"
            columns: ["ats_connection_id"]
            isOneToOne: false
            referencedRelation: "ats_sync_overview"
            referencedColumns: ["connection_id"]
          },
        ]
      }
      ats_sync_logs: {
        Row: {
          action: string
          application_id: string | null
          ats_connection_id: string
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          request_payload: Json | null
          response_data: Json | null
          retry_count: number | null
          status: string
        }
        Insert: {
          action: string
          application_id?: string | null
          ats_connection_id: string
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          request_payload?: Json | null
          response_data?: Json | null
          retry_count?: number | null
          status: string
        }
        Update: {
          action?: string
          application_id?: string | null
          ats_connection_id?: string
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          request_payload?: Json | null
          response_data?: Json | null
          retry_count?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ats_sync_logs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ats_sync_logs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_basic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ats_sync_logs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ats_sync_logs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_sensitive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ats_sync_logs_ats_connection_id_fkey"
            columns: ["ats_connection_id"]
            isOneToOne: false
            referencedRelation: "ats_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ats_sync_logs_ats_connection_id_fkey"
            columns: ["ats_connection_id"]
            isOneToOne: false
            referencedRelation: "ats_sync_overview"
            referencedColumns: ["connection_id"]
          },
        ]
      }
      ats_systems: {
        Row: {
          api_type: string
          base_endpoint: string | null
          category: string | null
          created_at: string | null
          credential_schema: Json
          documentation_url: string | null
          field_schema: Json | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          slug: string
          supports_test_mode: boolean | null
          updated_at: string | null
        }
        Insert: {
          api_type: string
          base_endpoint?: string | null
          category?: string | null
          created_at?: string | null
          credential_schema?: Json
          documentation_url?: string | null
          field_schema?: Json | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          slug: string
          supports_test_mode?: boolean | null
          updated_at?: string | null
        }
        Update: {
          api_type?: string
          base_endpoint?: string | null
          category?: string | null
          created_at?: string | null
          credential_schema?: Json
          documentation_url?: string | null
          field_schema?: Json | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          slug?: string
          supports_test_mode?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
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
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      background_check_providers: {
        Row: {
          api_type: string
          auth_type: string
          base_url: string
          created_at: string | null
          documentation_url: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          pricing: Json | null
          slug: string
          supported_checks: Json
          updated_at: string | null
          webhook_config: Json | null
        }
        Insert: {
          api_type?: string
          auth_type?: string
          base_url: string
          created_at?: string | null
          documentation_url?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          pricing?: Json | null
          slug: string
          supported_checks?: Json
          updated_at?: string | null
          webhook_config?: Json | null
        }
        Update: {
          api_type?: string
          auth_type?: string
          base_url?: string
          created_at?: string | null
          documentation_url?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          pricing?: Json | null
          slug?: string
          supported_checks?: Json
          updated_at?: string | null
          webhook_config?: Json | null
        }
        Relationships: []
      }
      background_check_requests: {
        Row: {
          application_id: string | null
          candidate_id: string | null
          candidate_portal_url: string | null
          check_type: string
          completed_at: string | null
          connection_id: string | null
          cost_cents: number | null
          created_at: string | null
          external_id: string | null
          id: string
          initiated_by: string | null
          organization_id: string
          package_name: string | null
          provider_id: string
          report_url: string | null
          result: string | null
          result_data: Json | null
          status: string
          updated_at: string | null
        }
        Insert: {
          application_id?: string | null
          candidate_id?: string | null
          candidate_portal_url?: string | null
          check_type: string
          completed_at?: string | null
          connection_id?: string | null
          cost_cents?: number | null
          created_at?: string | null
          external_id?: string | null
          id?: string
          initiated_by?: string | null
          organization_id: string
          package_name?: string | null
          provider_id: string
          report_url?: string | null
          result?: string | null
          result_data?: Json | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          application_id?: string | null
          candidate_id?: string | null
          candidate_portal_url?: string | null
          check_type?: string
          completed_at?: string | null
          connection_id?: string | null
          cost_cents?: number | null
          created_at?: string | null
          external_id?: string | null
          id?: string
          initiated_by?: string | null
          organization_id?: string
          package_name?: string | null
          provider_id?: string
          report_url?: string | null
          result?: string | null
          result_data?: Json | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "background_check_requests_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "background_check_requests_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_basic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "background_check_requests_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "background_check_requests_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_sensitive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "background_check_requests_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "organization_bgc_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "background_check_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "background_check_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "background_check_requests_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "background_check_providers"
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
          {
            foreignKeyName: "background_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      benefits_catalog: {
        Row: {
          category: string
          created_at: string
          icon: string
          id: string
          is_active: boolean
          keywords: string[]
          label: string
          social_copy: Json
          sort_order: number
        }
        Insert: {
          category?: string
          created_at?: string
          icon?: string
          id: string
          is_active?: boolean
          keywords?: string[]
          label: string
          social_copy?: Json
          sort_order?: number
        }
        Update: {
          category?: string
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          keywords?: string[]
          label?: string
          social_copy?: Json
          sort_order?: number
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          category: string | null
          content: string
          created_at: string
          description: string | null
          faqs: Json | null
          featured_image: string | null
          howto_steps: Json | null
          id: string
          published: boolean | null
          published_at: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content: string
          created_at?: string
          description?: string | null
          faqs?: Json | null
          featured_image?: string | null
          howto_steps?: Json | null
          id?: string
          published?: boolean | null
          published_at?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: string
          created_at?: string
          description?: string | null
          faqs?: Json | null
          featured_image?: string | null
          howto_steps?: Json | null
          id?: string
          published?: boolean | null
          published_at?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          {
            foreignKeyName: "budget_allocations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_invitations: {
        Row: {
          client_id: string | null
          completed_at: string | null
          created_at: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          recruiter_email: string
          status: string
          token: string
        }
        Insert: {
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          invited_by: string
          organization_id: string
          recruiter_email: string
          status?: string
          token: string
        }
        Update: {
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          recruiter_email?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_invitations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_invitations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "public_client_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      call_webhook_logs: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          event_type: string
          id: string
          outbound_call_id: string
          request_payload: Json
          response_body: string | null
          response_status: number | null
          webhook_id: string
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          event_type: string
          id?: string
          outbound_call_id: string
          request_payload: Json
          response_body?: string | null
          response_status?: number | null
          webhook_id: string
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          event_type?: string
          id?: string
          outbound_call_id?: string
          request_payload?: Json
          response_body?: string | null
          response_status?: number | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_webhook_logs_outbound_call_id_fkey"
            columns: ["outbound_call_id"]
            isOneToOne: false
            referencedRelation: "outbound_calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "call_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      call_webhooks: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          event_types: string[] | null
          id: string
          last_error: string | null
          last_success_at: string | null
          last_triggered_at: string | null
          organization_id: string
          secret_key: string | null
          updated_at: string | null
          webhook_url: string
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          event_types?: string[] | null
          id?: string
          last_error?: string | null
          last_success_at?: string | null
          last_triggered_at?: string | null
          organization_id: string
          secret_key?: string | null
          updated_at?: string | null
          webhook_url: string
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          event_types?: string[] | null
          id?: string
          last_error?: string | null
          last_success_at?: string | null
          last_triggered_at?: string | null
          organization_id?: string
          secret_key?: string | null
          updated_at?: string | null
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_webhooks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_webhooks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_ai_analysis: {
        Row: {
          ai_provider: string
          analysis_type: string
          campaign_id: string | null
          confidence_score: number | null
          created_at: string
          expires_at: string
          id: string
          insights: Json
          metrics: Json
          organization_id: string | null
          recommendations: Json
          updated_at: string
        }
        Insert: {
          ai_provider: string
          analysis_type: string
          campaign_id?: string | null
          confidence_score?: number | null
          created_at?: string
          expires_at: string
          id?: string
          insights?: Json
          metrics?: Json
          organization_id?: string | null
          recommendations?: Json
          updated_at?: string
        }
        Update: {
          ai_provider?: string
          analysis_type?: string
          campaign_id?: string | null
          confidence_score?: number | null
          created_at?: string
          expires_at?: string
          id?: string
          insights?: Json
          metrics?: Json
          organization_id?: string | null
          recommendations?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_ai_analysis_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_ai_analysis_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_ai_analysis_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
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
      campaign_sponsorship_mappings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          jobreferrer: string
          label: string | null
          organization_id: string | null
          tier: Database["public"]["Enums"]["sponsorship_tier"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          jobreferrer: string
          label?: string | null
          organization_id?: string | null
          tier?: Database["public"]["Enums"]["sponsorship_tier"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          jobreferrer?: string
          label?: string | null
          organization_id?: string | null
          tier?: Database["public"]["Enums"]["sponsorship_tier"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_sponsorship_mappings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_sponsorship_mappings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
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
          {
            foreignKeyName: "campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_activities: {
        Row: {
          activity_type: string
          application_id: string | null
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          organization_id: string
          title: string
          user_id: string | null
        }
        Insert: {
          activity_type: string
          application_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          title: string
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          application_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_activities_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_activities_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_basic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_activities_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_activities_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_sensitive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
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
            foreignKeyName: "candidate_assessments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_basic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_assessments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_assessments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_sensitive"
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
          {
            foreignKeyName: "candidate_assessments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_profiles: {
        Row: {
          cdl_class: string | null
          cdl_endorsements: string[] | null
          city: string | null
          created_at: string | null
          desired_job_title: string | null
          desired_salary_max: number | null
          desired_salary_min: number | null
          email: string | null
          first_name: string | null
          headline: string | null
          id: string
          last_name: string | null
          open_to_opportunities: boolean | null
          phone: string | null
          profile_completion_percentage: number | null
          profile_visibility: string | null
          resume_url: string | null
          state: string | null
          summary: string | null
          updated_at: string | null
          user_id: string
          years_experience: number | null
          zip: string | null
        }
        Insert: {
          cdl_class?: string | null
          cdl_endorsements?: string[] | null
          city?: string | null
          created_at?: string | null
          desired_job_title?: string | null
          desired_salary_max?: number | null
          desired_salary_min?: number | null
          email?: string | null
          first_name?: string | null
          headline?: string | null
          id?: string
          last_name?: string | null
          open_to_opportunities?: boolean | null
          phone?: string | null
          profile_completion_percentage?: number | null
          profile_visibility?: string | null
          resume_url?: string | null
          state?: string | null
          summary?: string | null
          updated_at?: string | null
          user_id: string
          years_experience?: number | null
          zip?: string | null
        }
        Update: {
          cdl_class?: string | null
          cdl_endorsements?: string[] | null
          city?: string | null
          created_at?: string | null
          desired_job_title?: string | null
          desired_salary_max?: number | null
          desired_salary_min?: number | null
          email?: string | null
          first_name?: string | null
          headline?: string | null
          id?: string
          last_name?: string | null
          open_to_opportunities?: boolean | null
          phone?: string | null
          profile_completion_percentage?: number | null
          profile_visibility?: string | null
          resume_url?: string | null
          state?: string | null
          summary?: string | null
          updated_at?: string | null
          user_id?: string
          years_experience?: number | null
          zip?: string | null
        }
        Relationships: []
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
            foreignKeyName: "candidate_rankings_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_basic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_rankings_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_rankings_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_sensitive"
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
          {
            foreignKeyName: "candidate_rankings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_saved_jobs: {
        Row: {
          candidate_profile_id: string
          created_at: string
          id: string
          job_listing_id: string
          notes: string | null
        }
        Insert: {
          candidate_profile_id: string
          created_at?: string
          id?: string
          job_listing_id: string
          notes?: string | null
        }
        Update: {
          candidate_profile_id?: string
          created_at?: string
          id?: string
          job_listing_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_saved_jobs_candidate_profile_id_fkey"
            columns: ["candidate_profile_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_saved_jobs_job_listing_id_fkey"
            columns: ["job_listing_id"]
            isOneToOne: false
            referencedRelation: "job_listings"
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
            foreignKeyName: "candidate_scores_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_basic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_scores_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_scores_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_sensitive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_scores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_scores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      cdl_jobcast_analytics: {
        Row: {
          applications: number | null
          campaign_id: string
          clicks: number | null
          cpc: number | null
          created_at: string | null
          ctr: number | null
          date: string
          id: string
          impressions: number | null
          job_id: string | null
          organization_id: string | null
          spend: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          applications?: number | null
          campaign_id: string
          clicks?: number | null
          cpc?: number | null
          created_at?: string | null
          ctr?: number | null
          date: string
          id?: string
          impressions?: number | null
          job_id?: string | null
          organization_id?: string | null
          spend?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          applications?: number | null
          campaign_id?: string
          clicks?: number | null
          cpc?: number | null
          created_at?: string | null
          ctr?: number | null
          date?: string
          id?: string
          impressions?: number | null
          job_id?: string | null
          organization_id?: string | null
          spend?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cdl_jobcast_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cdl_jobcast_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
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
          {
            foreignKeyName: "chat_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      client_application_fields: {
        Row: {
          client_id: string
          created_at: string
          enabled: boolean
          field_key: string
          id: string
          organization_id: string
          required: boolean
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          enabled?: boolean
          field_key: string
          id?: string
          organization_id: string
          required?: boolean
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          enabled?: boolean
          field_key?: string
          id?: string
          organization_id?: string
          required?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_application_fields_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_application_fields_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "public_client_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_application_fields_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_application_fields_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      client_webhook_logs: {
        Row: {
          application_id: string
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          event_type: string
          id: string
          request_payload: Json
          response_body: string | null
          response_status: number | null
          webhook_id: string
        }
        Insert: {
          application_id: string
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          event_type: string
          id?: string
          request_payload: Json
          response_body?: string | null
          response_status?: number | null
          webhook_id: string
        }
        Update: {
          application_id?: string
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          event_type?: string
          id?: string
          request_payload?: Json
          response_body?: string | null
          response_status?: number | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_webhook_logs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_webhook_logs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_basic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_webhook_logs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_webhook_logs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_sensitive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "client_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      client_webhooks: {
        Row: {
          client_id: string | null
          created_at: string | null
          enabled: boolean
          event_types: string[] | null
          id: string
          last_error: string | null
          last_success_at: string | null
          last_triggered_at: string | null
          organization_id: string
          secret_key: string | null
          source_filter: string[] | null
          updated_at: string | null
          user_id: string
          webhook_url: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          enabled?: boolean
          event_types?: string[] | null
          id?: string
          last_error?: string | null
          last_success_at?: string | null
          last_triggered_at?: string | null
          organization_id: string
          secret_key?: string | null
          source_filter?: string[] | null
          updated_at?: string | null
          user_id: string
          webhook_url: string
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          enabled?: boolean
          event_types?: string[] | null
          id?: string
          last_error?: string | null
          last_success_at?: string | null
          last_triggered_at?: string | null
          organization_id?: string
          secret_key?: string | null
          source_filter?: string[] | null
          updated_at?: string | null
          user_id?: string
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_webhooks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_webhooks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "public_client_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_webhooks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_webhooks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
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
          logo_url: string | null
          name: string
          notes: string | null
          organization_id: string
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
          logo_url?: string | null
          name: string
          notes?: string | null
          organization_id?: string
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
          logo_url?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
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
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_logs: {
        Row: {
          application_id: string | null
          body_preview: string | null
          channel: string
          clicked_at: string | null
          delivered_at: string | null
          direction: string
          external_id: string | null
          id: string
          metadata: Json | null
          opened_at: string | null
          organization_id: string
          recipient: string
          sent_at: string
          sent_by: string | null
          status: string | null
          subject: string | null
        }
        Insert: {
          application_id?: string | null
          body_preview?: string | null
          channel: string
          clicked_at?: string | null
          delivered_at?: string | null
          direction: string
          external_id?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          organization_id: string
          recipient: string
          sent_at?: string
          sent_by?: string | null
          status?: string | null
          subject?: string | null
        }
        Update: {
          application_id?: string | null
          body_preview?: string | null
          channel?: string
          clicked_at?: string | null
          delivered_at?: string | null
          direction?: string
          external_id?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          organization_id?: string
          recipient?: string
          sent_at?: string
          sent_by?: string | null
          status?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_logs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_logs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_basic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_logs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_logs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_sensitive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          company: string | null
          company_size: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          job_title: string | null
          last_name: string
          message: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          company?: string | null
          company_size?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          job_title?: string | null
          last_name: string
          message: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          company?: string | null
          company_size?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          job_title?: string | null
          last_name?: string
          message?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      craigslist_analytics: {
        Row: {
          city: string | null
          created_at: string | null
          date: string
          id: string
          organization_id: string | null
          posting_id: string
          replies: number | null
          updated_at: string | null
          user_id: string
          views: number | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          date: string
          id?: string
          organization_id?: string | null
          posting_id: string
          replies?: number | null
          updated_at?: string | null
          user_id: string
          views?: number | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          date?: string
          id?: string
          organization_id?: string | null
          posting_id?: string
          replies?: number | null
          updated_at?: string | null
          user_id?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "craigslist_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "craigslist_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
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
      driverreach_credentials: {
        Row: {
          api_endpoint: string
          api_key: string
          company_id: string
          company_name: string | null
          created_at: string
          id: string
          mode: string
          organization_id: string
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          api_endpoint?: string
          api_key: string
          company_id: string
          company_name?: string | null
          created_at?: string
          id?: string
          mode?: string
          organization_id: string
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          api_endpoint?: string
          api_key?: string
          company_id?: string
          company_name?: string | null
          created_at?: string
          id?: string
          mode?: string
          organization_id?: string
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driverreach_credentials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driverreach_credentials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      driverreach_field_mappings: {
        Row: {
          created_at: string
          field_mappings: Json
          id: string
          is_default: boolean
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          field_mappings?: Json
          id?: string
          is_default?: boolean
          name?: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          field_mappings?: Json
          id?: string
          is_default?: boolean
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driverreach_field_mappings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driverreach_field_mappings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      elevenlabs_audio: {
        Row: {
          audio_url: string
          conversation_id: string
          created_at: string | null
          duration_seconds: number | null
          file_size_bytes: number | null
          format: string | null
          id: string
          storage_path: string | null
        }
        Insert: {
          audio_url: string
          conversation_id: string
          created_at?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          format?: string | null
          id?: string
          storage_path?: string | null
        }
        Update: {
          audio_url?: string
          conversation_id?: string
          created_at?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          format?: string | null
          id?: string
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "elevenlabs_audio_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "elevenlabs_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      elevenlabs_conversations: {
        Row: {
          agent_id: string
          conversation_id: string
          created_at: string | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          metadata: Json | null
          organization_id: string | null
          started_at: string | null
          status: string | null
          updated_at: string | null
          voice_agent_id: string | null
        }
        Insert: {
          agent_id: string
          conversation_id: string
          created_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          voice_agent_id?: string | null
        }
        Update: {
          agent_id?: string
          conversation_id?: string
          created_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          voice_agent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "elevenlabs_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elevenlabs_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elevenlabs_conversations_voice_agent_id_fkey"
            columns: ["voice_agent_id"]
            isOneToOne: false
            referencedRelation: "voice_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      elevenlabs_transcripts: {
        Row: {
          confidence_score: number | null
          conversation_id: string
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          sequence_number: number
          speaker: string
          timestamp: string | null
        }
        Insert: {
          confidence_score?: number | null
          conversation_id: string
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          sequence_number: number
          speaker: string
          timestamp?: string | null
        }
        Update: {
          confidence_score?: number | null
          conversation_id?: string
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          sequence_number?: number
          speaker?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "elevenlabs_transcripts_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "elevenlabs_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_preferences: {
        Row: {
          application_updates: boolean | null
          created_at: string | null
          email: string
          id: string
          marketing_emails: boolean | null
          system_notifications: boolean | null
          unsubscribe_token: string | null
          unsubscribed_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          application_updates?: boolean | null
          created_at?: string | null
          email: string
          id?: string
          marketing_emails?: boolean | null
          system_notifications?: boolean | null
          unsubscribe_token?: string | null
          unsubscribed_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          application_updates?: boolean | null
          created_at?: string | null
          email?: string
          id?: string
          marketing_emails?: boolean | null
          system_notifications?: boolean | null
          unsubscribe_token?: string | null
          unsubscribed_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      embed_tokens: {
        Row: {
          allowed_domains: string[] | null
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          impression_count: number
          is_active: boolean
          job_listing_id: string
          organization_id: string
          token: string
          updated_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          allowed_domains?: string[] | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          impression_count?: number
          is_active?: boolean
          job_listing_id: string
          organization_id: string
          token: string
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          allowed_domains?: string[] | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          impression_count?: number
          is_active?: boolean
          job_listing_id?: string
          organization_id?: string
          token?: string
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "embed_tokens_job_listing_id_fkey"
            columns: ["job_listing_id"]
            isOneToOne: false
            referencedRelation: "job_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "embed_tokens_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "embed_tokens_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_access_logs: {
        Row: {
          client_id: string | null
          created_at: string | null
          feed_type: string
          format: string | null
          id: string
          job_count: number | null
          job_group_id: string | null
          organization_id: string | null
          platform: string | null
          request_ip: string | null
          response_time_ms: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          feed_type: string
          format?: string | null
          id?: string
          job_count?: number | null
          job_group_id?: string | null
          organization_id?: string | null
          platform?: string | null
          request_ip?: string | null
          response_time_ms?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          feed_type?: string
          format?: string | null
          id?: string
          job_count?: number | null
          job_group_id?: string | null
          organization_id?: string | null
          platform?: string | null
          request_ip?: string | null
          response_time_ms?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_access_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_access_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "public_client_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_access_logs_job_group_id_fkey"
            columns: ["job_group_id"]
            isOneToOne: false
            referencedRelation: "job_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_access_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_access_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_quality_alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          created_at: string | null
          current_value: number | null
          id: string
          message: string | null
          metric_name: string
          organization_id: string | null
          severity: string | null
          threshold_value: number | null
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          created_at?: string | null
          current_value?: number | null
          id?: string
          message?: string | null
          metric_name: string
          organization_id?: string | null
          severity?: string | null
          threshold_value?: number | null
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          created_at?: string | null
          current_value?: number | null
          id?: string
          message?: string | null
          metric_name?: string
          organization_id?: string | null
          severity?: string | null
          threshold_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_quality_alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_quality_alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_sync_logs: {
        Row: {
          client_id: string | null
          client_name: string
          created_at: string | null
          error: string | null
          feed_url: string | null
          id: string
          jobs_deactivated: number | null
          jobs_in_feed: number | null
          jobs_inserted: number | null
          jobs_updated: number | null
          jobs_with_feed_data: number | null
          sync_duration_ms: number | null
          sync_type: string | null
          triggered_by: string | null
        }
        Insert: {
          client_id?: string | null
          client_name: string
          created_at?: string | null
          error?: string | null
          feed_url?: string | null
          id?: string
          jobs_deactivated?: number | null
          jobs_in_feed?: number | null
          jobs_inserted?: number | null
          jobs_updated?: number | null
          jobs_with_feed_data?: number | null
          sync_duration_ms?: number | null
          sync_type?: string | null
          triggered_by?: string | null
        }
        Update: {
          client_id?: string | null
          client_name?: string
          created_at?: string | null
          error?: string | null
          feed_url?: string | null
          id?: string
          jobs_deactivated?: number | null
          jobs_in_feed?: number | null
          jobs_inserted?: number | null
          jobs_updated?: number | null
          jobs_with_feed_data?: number | null
          sync_duration_ms?: number | null
          sync_type?: string | null
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_sync_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_sync_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "public_client_info"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_ad_creatives: {
        Row: {
          aspect_ratio: string | null
          benefits: string[]
          body: string
          created_at: string | null
          created_by: string | null
          hashtags: string[] | null
          headline: string
          id: string
          job_type: string
          media_type: string | null
          media_url: string | null
          organization_id: string | null
          platforms_published: string[] | null
          published_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          aspect_ratio?: string | null
          benefits?: string[]
          body: string
          created_at?: string | null
          created_by?: string | null
          hashtags?: string[] | null
          headline: string
          id?: string
          job_type: string
          media_type?: string | null
          media_url?: string | null
          organization_id?: string | null
          platforms_published?: string[] | null
          published_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          aspect_ratio?: string | null
          benefits?: string[]
          body?: string
          created_at?: string | null
          created_by?: string | null
          hashtags?: string[] | null
          headline?: string
          id?: string
          job_type?: string
          media_type?: string | null
          media_url?: string | null
          organization_id?: string | null
          platforms_published?: string[] | null
          published_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_ad_creatives_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_ad_creatives_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      indeed_analytics: {
        Row: {
          applications: number | null
          clicks: number | null
          cpc: number | null
          created_at: string | null
          ctr: number | null
          date: string
          employer_id: string
          id: string
          impressions: number | null
          job_id: string | null
          organization_id: string | null
          spend: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          applications?: number | null
          clicks?: number | null
          cpc?: number | null
          created_at?: string | null
          ctr?: number | null
          date: string
          employer_id: string
          id?: string
          impressions?: number | null
          job_id?: string | null
          organization_id?: string | null
          spend?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          applications?: number | null
          clicks?: number | null
          cpc?: number | null
          created_at?: string | null
          ctr?: number | null
          date?: string
          employer_id?: string
          id?: string
          impressions?: number | null
          job_id?: string | null
          organization_id?: string | null
          spend?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "indeed_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indeed_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      indeed_campaign_jobs: {
        Row: {
          applies: number | null
          campaign_id: string
          clicks: number | null
          created_at: string
          id: string
          impressions: number | null
          indeed_job_key: string | null
          job_listing_id: string
          last_synced_at: string | null
          spend: number | null
          status: string | null
        }
        Insert: {
          applies?: number | null
          campaign_id: string
          clicks?: number | null
          created_at?: string
          id?: string
          impressions?: number | null
          indeed_job_key?: string | null
          job_listing_id: string
          last_synced_at?: string | null
          spend?: number | null
          status?: string | null
        }
        Update: {
          applies?: number | null
          campaign_id?: string
          clicks?: number | null
          created_at?: string
          id?: string
          impressions?: number | null
          indeed_job_key?: string | null
          job_listing_id?: string
          last_synced_at?: string | null
          spend?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "indeed_campaign_jobs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "indeed_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indeed_campaign_jobs_job_listing_id_fkey"
            columns: ["job_listing_id"]
            isOneToOne: false
            referencedRelation: "job_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      indeed_campaigns: {
        Row: {
          budget_monthly_limit: number | null
          budget_onetime_limit: number | null
          campaign_id: string | null
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          jobs_query: string | null
          jobs_source_id: string | null
          jobs_to_include: string | null
          last_synced_at: string | null
          metadata: Json | null
          name: string
          objective: string | null
          organization_id: string
          start_date: string | null
          status: string
          total_applies: number | null
          total_clicks: number | null
          total_impressions: number | null
          total_spend: number | null
          tracking_token: string | null
          updated_at: string
        }
        Insert: {
          budget_monthly_limit?: number | null
          budget_onetime_limit?: number | null
          campaign_id?: string | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          jobs_query?: string | null
          jobs_source_id?: string | null
          jobs_to_include?: string | null
          last_synced_at?: string | null
          metadata?: Json | null
          name: string
          objective?: string | null
          organization_id: string
          start_date?: string | null
          status?: string
          total_applies?: number | null
          total_clicks?: number | null
          total_impressions?: number | null
          total_spend?: number | null
          tracking_token?: string | null
          updated_at?: string
        }
        Update: {
          budget_monthly_limit?: number | null
          budget_onetime_limit?: number | null
          campaign_id?: string | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          jobs_query?: string | null
          jobs_source_id?: string | null
          jobs_to_include?: string | null
          last_synced_at?: string | null
          metadata?: Json | null
          name?: string
          objective?: string | null
          organization_id?: string
          start_date?: string | null
          status?: string
          total_applies?: number | null
          total_clicks?: number | null
          total_impressions?: number | null
          total_spend?: number | null
          tracking_token?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "indeed_campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indeed_campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      industry_templates: {
        Row: {
          ai_prompt_hints: Json | null
          created_at: string | null
          default_features: Json | null
          default_platforms: Json | null
          description: string | null
          display_name: string
          icon: string | null
          id: string
          updated_at: string | null
          vertical: string
        }
        Insert: {
          ai_prompt_hints?: Json | null
          created_at?: string | null
          default_features?: Json | null
          default_platforms?: Json | null
          description?: string | null
          display_name: string
          icon?: string | null
          id?: string
          updated_at?: string | null
          vertical: string
        }
        Update: {
          ai_prompt_hints?: Json | null
          created_at?: string | null
          default_features?: Json | null
          default_platforms?: Json | null
          description?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          updated_at?: string | null
          vertical?: string
        }
        Relationships: []
      }
      international_waitlist: {
        Row: {
          country: string | null
          country_code: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          job_listing_id: string | null
          message: string | null
        }
        Insert: {
          country?: string | null
          country_code?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          job_listing_id?: string | null
          message?: string | null
        }
        Update: {
          country?: string | null
          country_code?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          job_listing_id?: string | null
          message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "international_waitlist_job_listing_id_fkey"
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
      job_feed_metadata: {
        Row: {
          created_at: string
          extracted_at: string
          id: string
          job_listing_id: string
          raw_feed_xml: string | null
          raw_indeed_data: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          extracted_at?: string
          id?: string
          job_listing_id: string
          raw_feed_xml?: string | null
          raw_indeed_data?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          extracted_at?: string
          id?: string
          job_listing_id?: string
          raw_feed_xml?: string | null
          raw_indeed_data?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_feed_metadata_job_listing_id_fkey"
            columns: ["job_listing_id"]
            isOneToOne: true
            referencedRelation: "job_listings"
            referencedColumns: ["id"]
          },
        ]
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
      job_group_suggestions: {
        Row: {
          ai_provider: string
          campaign_id: string | null
          confidence_score: number | null
          created_at: string
          expires_at: string
          id: string
          organization_id: string | null
          reasoning: Json
          status: string
          suggested_groups: Json
          updated_at: string
        }
        Insert: {
          ai_provider: string
          campaign_id?: string | null
          confidence_score?: number | null
          created_at?: string
          expires_at: string
          id?: string
          organization_id?: string | null
          reasoning?: Json
          status?: string
          suggested_groups?: Json
          updated_at?: string
        }
        Update: {
          ai_provider?: string
          campaign_id?: string | null
          confidence_score?: number | null
          created_at?: string
          expires_at?: string
          id?: string
          organization_id?: string | null
          reasoning?: Json
          status?: string
          suggested_groups?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_group_suggestions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_group_suggestions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_group_suggestions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
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
      job_listing_benefits: {
        Row: {
          benefit_id: string
          custom_value: string | null
          job_id: string
        }
        Insert: {
          benefit_id: string
          custom_value?: string | null
          job_id: string
        }
        Update: {
          benefit_id?: string
          custom_value?: string | null
          job_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_listing_benefits_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "benefits_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_listing_benefits_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_listings"
            referencedColumns: ["id"]
          },
        ]
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
          feed_date: string | null
          id: string
          indeed_apply_api_token: string | null
          indeed_apply_job_id: string | null
          indeed_apply_post_url: string | null
          is_hidden: boolean | null
          is_sponsored: boolean | null
          job_description: string | null
          job_id: string | null
          job_summary: string | null
          job_title: string | null
          job_type: string | null
          jobreferrer: string | null
          last_google_indexed_at: string | null
          last_tenstreet_sync: string | null
          location: string | null
          min_experience_months: number | null
          organization_id: string | null
          radius: number | null
          remote_type: string | null
          salary_max: number | null
          salary_min: number | null
          salary_type: string | null
          sponsorship_tier: string | null
          state: string | null
          status: string | null
          tenstreet_apply_url: string | null
          tenstreet_company_id: string | null
          tenstreet_job_id: string | null
          tenstreet_source: string | null
          title: string
          tracking_pixel_url: string | null
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
          feed_date?: string | null
          id?: string
          indeed_apply_api_token?: string | null
          indeed_apply_job_id?: string | null
          indeed_apply_post_url?: string | null
          is_hidden?: boolean | null
          is_sponsored?: boolean | null
          job_description?: string | null
          job_id?: string | null
          job_summary?: string | null
          job_title?: string | null
          job_type?: string | null
          jobreferrer?: string | null
          last_google_indexed_at?: string | null
          last_tenstreet_sync?: string | null
          location?: string | null
          min_experience_months?: number | null
          organization_id?: string | null
          radius?: number | null
          remote_type?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salary_type?: string | null
          sponsorship_tier?: string | null
          state?: string | null
          status?: string | null
          tenstreet_apply_url?: string | null
          tenstreet_company_id?: string | null
          tenstreet_job_id?: string | null
          tenstreet_source?: string | null
          title: string
          tracking_pixel_url?: string | null
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
          feed_date?: string | null
          id?: string
          indeed_apply_api_token?: string | null
          indeed_apply_job_id?: string | null
          indeed_apply_post_url?: string | null
          is_hidden?: boolean | null
          is_sponsored?: boolean | null
          job_description?: string | null
          job_id?: string | null
          job_summary?: string | null
          job_title?: string | null
          job_type?: string | null
          jobreferrer?: string | null
          last_google_indexed_at?: string | null
          last_tenstreet_sync?: string | null
          location?: string | null
          min_experience_months?: number | null
          organization_id?: string | null
          radius?: number | null
          remote_type?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salary_type?: string | null
          sponsorship_tier?: string | null
          state?: string | null
          status?: string | null
          tenstreet_apply_url?: string | null
          tenstreet_company_id?: string | null
          tenstreet_job_id?: string | null
          tenstreet_source?: string | null
          title?: string
          tracking_pixel_url?: string | null
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_job_listings_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_job_listings_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "public_client_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "job_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_listings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_listings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
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
      job_publishers: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          documentation_url: string | null
          feed_format: string | null
          feed_schema: Json | null
          feed_url_template: string | null
          id: string
          industries: string[] | null
          integration_type: string
          is_active: boolean | null
          is_premium: boolean | null
          logo_url: string | null
          name: string
          notes: string | null
          requires_partnership: boolean | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          documentation_url?: string | null
          feed_format?: string | null
          feed_schema?: Json | null
          feed_url_template?: string | null
          id?: string
          industries?: string[] | null
          integration_type: string
          is_active?: boolean | null
          is_premium?: boolean | null
          logo_url?: string | null
          name: string
          notes?: string | null
          requires_partnership?: boolean | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          documentation_url?: string | null
          feed_format?: string | null
          feed_schema?: Json | null
          feed_url_template?: string | null
          id?: string
          industries?: string[] | null
          integration_type?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          logo_url?: string | null
          name?: string
          notes?: string | null
          requires_partnership?: boolean | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      job_short_links: {
        Row: {
          click_count: number | null
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          job_listing_id: string
          organization_id: string | null
          short_code: string
          updated_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          click_count?: number | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          job_listing_id: string
          organization_id?: string | null
          short_code: string
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          click_count?: number | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          job_listing_id?: string
          organization_id?: string | null
          short_code?: string
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_short_links_job_listing_id_fkey"
            columns: ["job_listing_id"]
            isOneToOne: false
            referencedRelation: "job_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_short_links_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_short_links_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
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
          {
            foreignKeyName: "meta_ad_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
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
          {
            foreignKeyName: "meta_ad_sets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
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
          {
            foreignKeyName: "meta_ads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
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
          {
            foreignKeyName: "meta_campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
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
          {
            foreignKeyName: "meta_daily_spend_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string | null
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      org_api_keys: {
        Row: {
          allowed_origins: string[] | null
          api_key: string
          created_at: string | null
          id: string
          is_active: boolean | null
          label: string | null
          last_used_at: string | null
          organization_id: string
          rate_limit_per_minute: number | null
          updated_at: string | null
        }
        Insert: {
          allowed_origins?: string[] | null
          api_key?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string | null
          last_used_at?: string | null
          organization_id: string
          rate_limit_per_minute?: number | null
          updated_at?: string | null
        }
        Update: {
          allowed_origins?: string[] | null
          api_key?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string | null
          last_used_at?: string | null
          organization_id?: string
          rate_limit_per_minute?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_api_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_api_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_bgc_connections: {
        Row: {
          created_at: string | null
          credentials: Json
          id: string
          is_default: boolean | null
          is_enabled: boolean | null
          last_used_at: string | null
          mode: string
          organization_id: string
          package_mappings: Json | null
          provider_id: string
          updated_at: string | null
          webhook_secret: string | null
        }
        Insert: {
          created_at?: string | null
          credentials?: Json
          id?: string
          is_default?: boolean | null
          is_enabled?: boolean | null
          last_used_at?: string | null
          mode?: string
          organization_id: string
          package_mappings?: Json | null
          provider_id: string
          updated_at?: string | null
          webhook_secret?: string | null
        }
        Update: {
          created_at?: string | null
          credentials?: Json
          id?: string
          is_default?: boolean | null
          is_enabled?: boolean | null
          last_used_at?: string | null
          mode?: string
          organization_id?: string
          package_mappings?: Json | null
          provider_id?: string
          updated_at?: string | null
          webhook_secret?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_bgc_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_bgc_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_bgc_connections_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "background_check_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_call_settings: {
        Row: {
          auto_follow_up_enabled: boolean
          business_days: number[]
          business_hours_end: string
          business_hours_start: string
          business_hours_timezone: string
          callback_reference_enabled: boolean
          client_id: string | null
          cooldown_hours: number
          created_at: string
          follow_up_delay_hours: number
          follow_up_delay_minutes: number
          follow_up_escalation_multiplier: number
          follow_up_on_busy: boolean
          follow_up_on_failed: boolean
          follow_up_on_no_answer: boolean
          id: string
          max_attempts: number
          organization_id: string
          preferred_call_windows: Json
          smart_scheduling_enabled: boolean
          time_rotation_enabled: boolean
          updated_at: string
        }
        Insert: {
          auto_follow_up_enabled?: boolean
          business_days?: number[]
          business_hours_end?: string
          business_hours_start?: string
          business_hours_timezone?: string
          callback_reference_enabled?: boolean
          client_id?: string | null
          cooldown_hours?: number
          created_at?: string
          follow_up_delay_hours?: number
          follow_up_delay_minutes?: number
          follow_up_escalation_multiplier?: number
          follow_up_on_busy?: boolean
          follow_up_on_failed?: boolean
          follow_up_on_no_answer?: boolean
          id?: string
          max_attempts?: number
          organization_id: string
          preferred_call_windows?: Json
          smart_scheduling_enabled?: boolean
          time_rotation_enabled?: boolean
          updated_at?: string
        }
        Update: {
          auto_follow_up_enabled?: boolean
          business_days?: number[]
          business_hours_end?: string
          business_hours_start?: string
          business_hours_timezone?: string
          callback_reference_enabled?: boolean
          client_id?: string | null
          cooldown_hours?: number
          created_at?: string
          follow_up_delay_hours?: number
          follow_up_delay_minutes?: number
          follow_up_escalation_multiplier?: number
          follow_up_on_busy?: boolean
          follow_up_on_failed?: boolean
          follow_up_on_no_answer?: boolean
          id?: string
          max_attempts?: number
          organization_id?: string
          preferred_call_windows?: Json
          smart_scheduling_enabled?: boolean
          time_rotation_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_call_settings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_call_settings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "public_client_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_call_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_call_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
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
          {
            foreignKeyName: "organization_features_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_holidays: {
        Row: {
          created_at: string
          holiday_date: string
          id: string
          name: string
          organization_id: string | null
          recurring: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          holiday_date: string
          id?: string
          name: string
          organization_id?: string | null
          recurring?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          holiday_date?: string
          id?: string
          name?: string
          organization_id?: string | null
          recurring?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_holidays_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_holidays_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
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
          {
            foreignKeyName: "organization_platform_access_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_publisher_access: {
        Row: {
          api_credentials: Json | null
          created_at: string | null
          feed_url: string | null
          id: string
          is_enabled: boolean | null
          last_sync_at: string | null
          organization_id: string
          publisher_id: string
          sync_error: string | null
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          api_credentials?: Json | null
          created_at?: string | null
          feed_url?: string | null
          id?: string
          is_enabled?: boolean | null
          last_sync_at?: string | null
          organization_id: string
          publisher_id: string
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          api_credentials?: Json | null
          created_at?: string | null
          feed_url?: string | null
          id?: string
          is_enabled?: boolean | null
          last_sync_at?: string | null
          organization_id?: string
          publisher_id?: string
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_publisher_access_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_publisher_access_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_publisher_access_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "job_publishers"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_usage: {
        Row: {
          ai_analytics_queries: number | null
          ai_screenings_performed: number | null
          applications_processed: number | null
          applications_received: number | null
          ats_syncs_performed: number | null
          created_at: string | null
          id: string
          jobs_active: number | null
          jobs_posted: number | null
          organization_id: string
          period_end: string
          period_start: string
          updated_at: string | null
          voice_agent_minutes: number | null
          webhook_calls_made: number | null
        }
        Insert: {
          ai_analytics_queries?: number | null
          ai_screenings_performed?: number | null
          applications_processed?: number | null
          applications_received?: number | null
          ats_syncs_performed?: number | null
          created_at?: string | null
          id?: string
          jobs_active?: number | null
          jobs_posted?: number | null
          organization_id: string
          period_end: string
          period_start: string
          updated_at?: string | null
          voice_agent_minutes?: number | null
          webhook_calls_made?: number | null
        }
        Update: {
          ai_analytics_queries?: number | null
          ai_screenings_performed?: number | null
          applications_processed?: number | null
          applications_received?: number | null
          ats_syncs_performed?: number | null
          created_at?: string | null
          id?: string
          jobs_active?: number | null
          jobs_posted?: number | null
          organization_id?: string
          period_end?: string
          period_start?: string
          updated_at?: string | null
          voice_agent_minutes?: number | null
          webhook_calls_made?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_webhooks: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: string
          last_error: string | null
          last_success_at: string | null
          last_triggered_at: string | null
          organization_id: string
          secret_key: string | null
          updated_at: string | null
          webhook_url: string
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          last_error?: string | null
          last_success_at?: string | null
          last_triggered_at?: string | null
          organization_id: string
          secret_key?: string | null
          updated_at?: string | null
          webhook_url: string
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          last_error?: string | null
          last_success_at?: string | null
          last_triggered_at?: string | null
          organization_id?: string
          secret_key?: string | null
          updated_at?: string | null
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_webhooks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_webhooks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "public_organization_info"
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
          industry_vertical: string | null
          logo_url: string | null
          name: string
          plan_type: string
          screening_questions: Json | null
          settings: Json | null
          slug: string
          subscription_status: string | null
          subscription_tier: string | null
          updated_at: string
          usage_limits: Json | null
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
          industry_vertical?: string | null
          logo_url?: string | null
          name: string
          plan_type?: string
          screening_questions?: Json | null
          settings?: Json | null
          slug: string
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string
          usage_limits?: Json | null
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
          industry_vertical?: string | null
          logo_url?: string | null
          name?: string
          plan_type?: string
          screening_questions?: Json | null
          settings?: Json | null
          slug?: string
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string
          usage_limits?: Json | null
        }
        Relationships: []
      }
      outbound_calls: {
        Row: {
          application_id: string | null
          call_sid: string | null
          completed_at: string | null
          created_at: string
          duration_seconds: number | null
          elevenlabs_conversation_id: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          organization_id: string | null
          phone_number: string
          retry_count: number | null
          scheduled_at: string | null
          sms_followup_sent: boolean
          status: string
          updated_at: string
          voice_agent_id: string | null
          voicemail_detected: boolean
        }
        Insert: {
          application_id?: string | null
          call_sid?: string | null
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          elevenlabs_conversation_id?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          phone_number: string
          retry_count?: number | null
          scheduled_at?: string | null
          sms_followup_sent?: boolean
          status?: string
          updated_at?: string
          voice_agent_id?: string | null
          voicemail_detected?: boolean
        }
        Update: {
          application_id?: string | null
          call_sid?: string | null
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          elevenlabs_conversation_id?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          phone_number?: string
          retry_count?: number | null
          scheduled_at?: string | null
          sms_followup_sent?: boolean
          status?: string
          updated_at?: string
          voice_agent_id?: string | null
          voicemail_detected?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "outbound_calls_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_calls_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_basic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_calls_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_calls_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_sensitive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_calls_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_calls_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_calls_voice_agent_id_fkey"
            columns: ["voice_agent_id"]
            isOneToOne: false
            referencedRelation: "voice_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          country: string | null
          created_at: string | null
          device_type: string | null
          id: string
          organization_id: string | null
          page_path: string
          page_title: string | null
          referrer: string | null
          session_id: string
          user_agent: string | null
          visitor_id: string
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          organization_id?: string | null
          page_path: string
          page_title?: string | null
          referrer?: string | null
          session_id: string
          user_agent?: string | null
          visitor_id: string
        }
        Update: {
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          organization_id?: string | null
          page_path?: string
          page_title?: string | null
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_views_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_views_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      pii_access_logs: {
        Row: {
          access_reason: string | null
          accessed_at: string
          fields_accessed: string[]
          id: string
          ip_address: unknown
          record_id: string
          table_name: string
          user_id: string | null
        }
        Insert: {
          access_reason?: string | null
          accessed_at?: string
          fields_accessed: string[]
          id?: string
          ip_address?: unknown
          record_id: string
          table_name: string
          user_id?: string | null
        }
        Update: {
          access_reason?: string | null
          accessed_at?: string
          fields_accessed?: string[]
          id?: string
          ip_address?: unknown
          record_id?: string
          table_name?: string
          user_id?: string | null
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
          {
            foreignKeyName: "platforms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          author_bio: string | null
          author_title: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          enabled: boolean
          full_name: string | null
          id: string
          organization_id: string | null
          updated_at: string
          user_type: string | null
        }
        Insert: {
          author_bio?: string | null
          author_title?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          enabled?: boolean
          full_name?: string | null
          id: string
          organization_id?: string | null
          updated_at?: string
          user_type?: string | null
        }
        Update: {
          author_bio?: string | null
          author_title?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          enabled?: boolean
          full_name?: string | null
          id?: string
          organization_id?: string | null
          updated_at?: string
          user_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      publisher_performance_metrics: {
        Row: {
          calculation_date: string
          created_at: string
          id: string
          metadata: Json | null
          metric_type: string
          metric_value: number
          organization_id: string | null
          publisher_name: string
          time_period: string
          updated_at: string
        }
        Insert: {
          calculation_date: string
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_type: string
          metric_value: number
          organization_id?: string | null
          publisher_name: string
          time_period: string
          updated_at?: string
        }
        Update: {
          calculation_date?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: number
          organization_id?: string | null
          publisher_name?: string
          time_period?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "publisher_performance_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publisher_performance_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_config: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          max_requests: number
          organization_id: string | null
          updated_at: string
          user_role: string | null
          window_minutes: number
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          max_requests?: number
          organization_id?: string | null
          updated_at?: string
          user_role?: string | null
          window_minutes?: number
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          max_requests?: number
          organization_id?: string | null
          updated_at?: string
          user_role?: string | null
          window_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "rate_limit_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rate_limit_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          identifier: string
          request_count: number
          updated_at: string
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          identifier: string
          request_count?: number
          updated_at?: string
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      recruiter_availability_preferences: {
        Row: {
          allow_same_day_booking: boolean
          auto_accept_bookings: boolean
          buffer_after_minutes: number
          buffer_before_minutes: number
          created_at: string
          default_call_duration_minutes: number
          id: string
          max_daily_callbacks: number
          min_booking_notice_hours: number
          organization_id: string | null
          timezone: string
          updated_at: string
          user_id: string
          working_days: number[]
          working_hours_end: string
          working_hours_start: string
        }
        Insert: {
          allow_same_day_booking?: boolean
          auto_accept_bookings?: boolean
          buffer_after_minutes?: number
          buffer_before_minutes?: number
          created_at?: string
          default_call_duration_minutes?: number
          id?: string
          max_daily_callbacks?: number
          min_booking_notice_hours?: number
          organization_id?: string | null
          timezone?: string
          updated_at?: string
          user_id: string
          working_days?: number[]
          working_hours_end?: string
          working_hours_start?: string
        }
        Update: {
          allow_same_day_booking?: boolean
          auto_accept_bookings?: boolean
          buffer_after_minutes?: number
          buffer_before_minutes?: number
          created_at?: string
          default_call_duration_minutes?: number
          id?: string
          max_daily_callbacks?: number
          min_booking_notice_hours?: number
          organization_id?: string | null
          timezone?: string
          updated_at?: string
          user_id?: string
          working_days?: number[]
          working_hours_end?: string
          working_hours_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruiter_availability_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiter_availability_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      recruiter_calendar_connections: {
        Row: {
          calendar_id: string | null
          client_id: string | null
          connected_at: string
          created_at: string
          email: string | null
          expires_at: string | null
          id: string
          metadata: Json | null
          nylas_grant_id: string
          organization_id: string | null
          provider: string
          provider_type: string | null
          scopes: string[] | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          calendar_id?: string | null
          client_id?: string | null
          connected_at?: string
          created_at?: string
          email?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          nylas_grant_id: string
          organization_id?: string | null
          provider?: string
          provider_type?: string | null
          scopes?: string[] | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          calendar_id?: string | null
          client_id?: string | null
          connected_at?: string
          created_at?: string
          email?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          nylas_grant_id?: string
          organization_id?: string | null
          provider?: string
          provider_type?: string | null
          scopes?: string[] | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruiter_calendar_connections_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiter_calendar_connections_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "public_client_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiter_calendar_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiter_calendar_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
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
          {
            foreignKeyName: "recruiters_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_filters: {
        Row: {
          created_at: string
          filter_config: Json
          id: string
          is_default: boolean
          name: string
          organization_id: string | null
          updated_at: string
          user_id: string
          view_type: string
        }
        Insert: {
          created_at?: string
          filter_config?: Json
          id?: string
          is_default?: boolean
          name: string
          organization_id?: string | null
          updated_at?: string
          user_id: string
          view_type?: string
        }
        Update: {
          created_at?: string
          filter_config?: Json
          id?: string
          is_default?: boolean
          name?: string
          organization_id?: string | null
          updated_at?: string
          user_id?: string
          view_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_filters_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_filters_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_callbacks: {
        Row: {
          application_id: string | null
          booking_source: string | null
          calendar_connection_id: string | null
          created_at: string
          digest_email_sent: boolean | null
          driver_name: string | null
          driver_phone: string | null
          duration_minutes: number
          id: string
          metadata: Json | null
          notes: string | null
          nylas_event_id: string | null
          organization_id: string | null
          recruiter_user_id: string
          scheduled_end: string
          scheduled_start: string
          sms_confirmation_sent: boolean | null
          status: string
          updated_at: string
        }
        Insert: {
          application_id?: string | null
          booking_source?: string | null
          calendar_connection_id?: string | null
          created_at?: string
          digest_email_sent?: boolean | null
          driver_name?: string | null
          driver_phone?: string | null
          duration_minutes?: number
          id?: string
          metadata?: Json | null
          notes?: string | null
          nylas_event_id?: string | null
          organization_id?: string | null
          recruiter_user_id: string
          scheduled_end: string
          scheduled_start: string
          sms_confirmation_sent?: boolean | null
          status?: string
          updated_at?: string
        }
        Update: {
          application_id?: string | null
          booking_source?: string | null
          calendar_connection_id?: string | null
          created_at?: string
          digest_email_sent?: boolean | null
          driver_name?: string | null
          driver_phone?: string | null
          duration_minutes?: number
          id?: string
          metadata?: Json | null
          notes?: string | null
          nylas_event_id?: string | null
          organization_id?: string | null
          recruiter_user_id?: string
          scheduled_end?: string
          scheduled_start?: string
          sms_confirmation_sent?: boolean | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_callbacks_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_callbacks_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_basic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_callbacks_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_callbacks_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_sensitive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_callbacks_calendar_connection_id_fkey"
            columns: ["calendar_connection_id"]
            isOneToOne: false
            referencedRelation: "recruiter_calendar_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_callbacks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_callbacks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      screening_requests: {
        Row: {
          application_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          notes: string | null
          provider_name: string | null
          provider_reference_id: string | null
          request_data: Json | null
          request_type: Database["public"]["Enums"]["screening_request_type"]
          sent_at: string | null
          status: Database["public"]["Enums"]["screening_request_status"]
          updated_at: string
        }
        Insert: {
          application_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          provider_name?: string | null
          provider_reference_id?: string | null
          request_data?: Json | null
          request_type: Database["public"]["Enums"]["screening_request_type"]
          sent_at?: string | null
          status?: Database["public"]["Enums"]["screening_request_status"]
          updated_at?: string
        }
        Update: {
          application_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          provider_name?: string | null
          provider_reference_id?: string | null
          request_data?: Json | null
          request_type?: Database["public"]["Enums"]["screening_request_type"]
          sent_at?: string | null
          status?: Database["public"]["Enums"]["screening_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "screening_requests_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screening_requests_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_basic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screening_requests_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screening_requests_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_sensitive"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_voice_conversations: {
        Row: {
          conversation_id: string
          created_at: string | null
          created_by: string | null
          custom_title: string | null
          expires_at: string | null
          hide_caller_info: boolean | null
          id: string
          is_active: boolean | null
          organization_id: string | null
          share_code: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          created_by?: string | null
          custom_title?: string | null
          expires_at?: string | null
          hide_caller_info?: boolean | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          share_code: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          created_by?: string | null
          custom_title?: string | null
          expires_at?: string | null
          hide_caller_info?: boolean | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          share_code?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_voice_conversations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "elevenlabs_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_voice_conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_voice_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_voice_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      simulation_events: {
        Row: {
          country: string | null
          country_code: string | null
          created_at: string
          event_type: string
          id: string
          job_listing_id: string | null
          metadata: Json | null
          session_id: string
          step_name: string | null
          step_number: number | null
          time_on_step_ms: number | null
          total_steps_completed: number | null
        }
        Insert: {
          country?: string | null
          country_code?: string | null
          created_at?: string
          event_type: string
          id?: string
          job_listing_id?: string | null
          metadata?: Json | null
          session_id: string
          step_name?: string | null
          step_number?: number | null
          time_on_step_ms?: number | null
          total_steps_completed?: number | null
        }
        Update: {
          country?: string | null
          country_code?: string | null
          created_at?: string
          event_type?: string
          id?: string
          job_listing_id?: string | null
          metadata?: Json | null
          session_id?: string
          step_name?: string | null
          step_number?: number | null
          time_on_step_ms?: number | null
          total_steps_completed?: number | null
        }
        Relationships: []
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
            foreignKeyName: "sms_conversations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_basic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_conversations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_conversations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_sensitive"
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
            foreignKeyName: "sms_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
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
      sms_logs: {
        Row: {
          application_id: string | null
          body: string | null
          conversation_id: string | null
          created_at: string | null
          direction: string
          duration_ms: number | null
          error_code: number | null
          error_message: string | null
          from_number: string
          id: string
          message_id: string | null
          metadata: Json | null
          session_id: string | null
          status: string | null
          to_number: string
          twilio_sid: string | null
        }
        Insert: {
          application_id?: string | null
          body?: string | null
          conversation_id?: string | null
          created_at?: string | null
          direction: string
          duration_ms?: number | null
          error_code?: number | null
          error_message?: string | null
          from_number: string
          id?: string
          message_id?: string | null
          metadata?: Json | null
          session_id?: string | null
          status?: string | null
          to_number: string
          twilio_sid?: string | null
        }
        Update: {
          application_id?: string | null
          body?: string | null
          conversation_id?: string | null
          created_at?: string | null
          direction?: string
          duration_ms?: number | null
          error_code?: number | null
          error_message?: string | null
          from_number?: string
          id?: string
          message_id?: string | null
          metadata?: Json | null
          session_id?: string | null
          status?: string | null
          to_number?: string
          twilio_sid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_logs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_logs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_basic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_logs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_logs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_sensitive"
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
          {
            foreignKeyName: "sms_magic_links_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_basic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_magic_links_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_magic_links_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_sensitive"
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
      sms_verification_sessions: {
        Row: {
          applicant_first_name: string | null
          application_id: string
          client_name: string | null
          created_at: string
          expires_at: string
          id: string
          job_listing_id: string | null
          job_title: string | null
          outbound_call_id: string
          phone_number: string
          status: Database["public"]["Enums"]["sms_verification_status"]
          updated_at: string
          verification_message: string | null
        }
        Insert: {
          applicant_first_name?: string | null
          application_id: string
          client_name?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          job_listing_id?: string | null
          job_title?: string | null
          outbound_call_id: string
          phone_number: string
          status?: Database["public"]["Enums"]["sms_verification_status"]
          updated_at?: string
          verification_message?: string | null
        }
        Update: {
          applicant_first_name?: string | null
          application_id?: string
          client_name?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          job_listing_id?: string | null
          job_title?: string | null
          outbound_call_id?: string
          phone_number?: string
          status?: Database["public"]["Enums"]["sms_verification_status"]
          updated_at?: string
          verification_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_verification_sessions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_verification_sessions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_basic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_verification_sessions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_verification_sessions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_sensitive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_verification_sessions_job_listing_id_fkey"
            columns: ["job_listing_id"]
            isOneToOne: false
            referencedRelation: "job_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_verification_sessions_outbound_call_id_fkey"
            columns: ["outbound_call_id"]
            isOneToOne: false
            referencedRelation: "outbound_calls"
            referencedColumns: ["id"]
          },
        ]
      }
      social_beacon_configurations: {
        Row: {
          ad_creative_enabled: boolean | null
          auto_engage_enabled: boolean | null
          created_at: string | null
          created_by: string | null
          id: string
          oauth_client_id: string | null
          oauth_redirect_uri: string | null
          oauth_scopes: string[] | null
          organization_id: string | null
          platform: string
          settings: Json | null
          updated_at: string | null
          webhook_secret: string | null
          webhook_url: string | null
          webhook_verified_at: string | null
        }
        Insert: {
          ad_creative_enabled?: boolean | null
          auto_engage_enabled?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          oauth_client_id?: string | null
          oauth_redirect_uri?: string | null
          oauth_scopes?: string[] | null
          organization_id?: string | null
          platform: string
          settings?: Json | null
          updated_at?: string | null
          webhook_secret?: string | null
          webhook_url?: string | null
          webhook_verified_at?: string | null
        }
        Update: {
          ad_creative_enabled?: boolean | null
          auto_engage_enabled?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          oauth_client_id?: string | null
          oauth_redirect_uri?: string | null
          oauth_scopes?: string[] | null
          organization_id?: string | null
          platform?: string
          settings?: Json | null
          updated_at?: string | null
          webhook_secret?: string | null
          webhook_url?: string | null
          webhook_verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_beacon_configurations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_beacon_configurations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      social_engagement_metrics: {
        Row: {
          auto_responses_sent: number | null
          avg_response_time_seconds: number | null
          conversion_to_application: number | null
          created_at: string | null
          date: string
          escalated_count: number | null
          id: string
          interactions_received: number | null
          job_inquiries_received: number | null
          manual_responses_sent: number | null
          organization_id: string
          platform: string
          sentiment_negative: number | null
          sentiment_neutral: number | null
          sentiment_positive: number | null
          top_intents: Json | null
          updated_at: string | null
        }
        Insert: {
          auto_responses_sent?: number | null
          avg_response_time_seconds?: number | null
          conversion_to_application?: number | null
          created_at?: string | null
          date: string
          escalated_count?: number | null
          id?: string
          interactions_received?: number | null
          job_inquiries_received?: number | null
          manual_responses_sent?: number | null
          organization_id: string
          platform: string
          sentiment_negative?: number | null
          sentiment_neutral?: number | null
          sentiment_positive?: number | null
          top_intents?: Json | null
          updated_at?: string | null
        }
        Update: {
          auto_responses_sent?: number | null
          avg_response_time_seconds?: number | null
          conversion_to_application?: number | null
          created_at?: string | null
          date?: string
          escalated_count?: number | null
          id?: string
          interactions_received?: number | null
          job_inquiries_received?: number | null
          manual_responses_sent?: number | null
          organization_id?: string
          platform?: string
          sentiment_negative?: number | null
          sentiment_neutral?: number | null
          sentiment_positive?: number | null
          top_intents?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_engagement_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_engagement_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      social_interactions: {
        Row: {
          auto_responded: boolean | null
          connection_id: string | null
          content: string
          created_at: string | null
          extracted_entities: Json | null
          id: string
          intent_classification: string | null
          intent_confidence: number | null
          interaction_type: string
          is_job_related: boolean | null
          media_urls: Json | null
          metadata: Json | null
          organization_id: string
          parent_id: string | null
          platform: string
          platform_conversation_id: string | null
          platform_message_id: string | null
          post_content: string | null
          post_id: string | null
          requires_human_review: boolean | null
          requires_response: boolean | null
          responded_at: string | null
          response_id: string | null
          review_reason: string | null
          sender_avatar_url: string | null
          sender_handle: string | null
          sender_id: string
          sender_name: string | null
          sender_profile_url: string | null
          sentiment_label: string | null
          sentiment_score: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          auto_responded?: boolean | null
          connection_id?: string | null
          content: string
          created_at?: string | null
          extracted_entities?: Json | null
          id?: string
          intent_classification?: string | null
          intent_confidence?: number | null
          interaction_type: string
          is_job_related?: boolean | null
          media_urls?: Json | null
          metadata?: Json | null
          organization_id: string
          parent_id?: string | null
          platform: string
          platform_conversation_id?: string | null
          platform_message_id?: string | null
          post_content?: string | null
          post_id?: string | null
          requires_human_review?: boolean | null
          requires_response?: boolean | null
          responded_at?: string | null
          response_id?: string | null
          review_reason?: string | null
          sender_avatar_url?: string | null
          sender_handle?: string | null
          sender_id: string
          sender_name?: string | null
          sender_profile_url?: string | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_responded?: boolean | null
          connection_id?: string | null
          content?: string
          created_at?: string | null
          extracted_entities?: Json | null
          id?: string
          intent_classification?: string | null
          intent_confidence?: number | null
          interaction_type?: string
          is_job_related?: boolean | null
          media_urls?: Json | null
          metadata?: Json | null
          organization_id?: string
          parent_id?: string | null
          platform?: string
          platform_conversation_id?: string | null
          platform_message_id?: string | null
          post_content?: string | null
          post_id?: string | null
          requires_human_review?: boolean | null
          requires_response?: boolean | null
          responded_at?: string | null
          response_id?: string | null
          review_reason?: string | null
          sender_avatar_url?: string | null
          sender_handle?: string | null
          sender_id?: string
          sender_name?: string | null
          sender_profile_url?: string | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_interactions_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "social_platform_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_interactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_interactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_interactions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "social_interactions"
            referencedColumns: ["id"]
          },
        ]
      }
      social_platform_connections: {
        Row: {
          access_token: string | null
          auto_respond_enabled: boolean | null
          created_at: string | null
          id: string
          is_active: boolean | null
          organization_id: string
          page_id: string | null
          page_name: string | null
          permissions: Json | null
          platform: string
          platform_user_id: string | null
          platform_username: string | null
          refresh_token: string | null
          settings: Json | null
          token_expires_at: string | null
          updated_at: string | null
          webhook_secret: string | null
        }
        Insert: {
          access_token?: string | null
          auto_respond_enabled?: boolean | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          organization_id: string
          page_id?: string | null
          page_name?: string | null
          permissions?: Json | null
          platform: string
          platform_user_id?: string | null
          platform_username?: string | null
          refresh_token?: string | null
          settings?: Json | null
          token_expires_at?: string | null
          updated_at?: string | null
          webhook_secret?: string | null
        }
        Update: {
          access_token?: string | null
          auto_respond_enabled?: boolean | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string
          page_id?: string | null
          page_name?: string | null
          permissions?: Json | null
          platform?: string
          platform_user_id?: string | null
          platform_username?: string | null
          refresh_token?: string | null
          settings?: Json | null
          token_expires_at?: string | null
          updated_at?: string | null
          webhook_secret?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_platform_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_platform_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      social_response_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          intent_type: string
          is_active: boolean | null
          last_used_at: string | null
          name: string
          organization_id: string
          platform: string | null
          priority: number | null
          template_content: string
          updated_at: string | null
          usage_count: number | null
          variables: Json | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          intent_type: string
          is_active?: boolean | null
          last_used_at?: string | null
          name: string
          organization_id: string
          platform?: string | null
          priority?: number | null
          template_content: string
          updated_at?: string | null
          usage_count?: number | null
          variables?: Json | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          intent_type?: string
          is_active?: boolean | null
          last_used_at?: string | null
          name?: string
          organization_id?: string
          platform?: string | null
          priority?: number | null
          template_content?: string
          updated_at?: string | null
          usage_count?: number | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "social_response_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_response_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      social_responses: {
        Row: {
          ai_model: string | null
          ai_provider: string | null
          approved_by: string | null
          content: string
          created_at: string | null
          edited_by: string | null
          error_message: string | null
          id: string
          interaction_id: string
          metadata: Json | null
          organization_id: string
          original_ai_content: string | null
          platform: string
          platform_response_id: string | null
          response_type: string | null
          retry_count: number | null
          sent_at: string | null
          status: string | null
          template_id: string | null
          tokens_used: number | null
          updated_at: string | null
        }
        Insert: {
          ai_model?: string | null
          ai_provider?: string | null
          approved_by?: string | null
          content: string
          created_at?: string | null
          edited_by?: string | null
          error_message?: string | null
          id?: string
          interaction_id: string
          metadata?: Json | null
          organization_id: string
          original_ai_content?: string | null
          platform: string
          platform_response_id?: string | null
          response_type?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
          tokens_used?: number | null
          updated_at?: string | null
        }
        Update: {
          ai_model?: string | null
          ai_provider?: string | null
          approved_by?: string | null
          content?: string
          created_at?: string | null
          edited_by?: string | null
          error_message?: string | null
          id?: string
          interaction_id?: string
          metadata?: Json | null
          organization_id?: string
          original_ai_content?: string | null
          platform?: string
          platform_response_id?: string | null
          response_type?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
          tokens_used?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_responses_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "social_interactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      source_cost_config: {
        Row: {
          cost_per_click: number | null
          created_at: string
          id: string
          monthly_cost: number | null
          organization_id: string
          period_end: string
          period_start: string
          source: string
          updated_at: string
        }
        Insert: {
          cost_per_click?: number | null
          created_at?: string
          id?: string
          monthly_cost?: number | null
          organization_id: string
          period_end: string
          period_start: string
          source: string
          updated_at?: string
        }
        Update: {
          cost_per_click?: number | null
          created_at?: string
          id?: string
          monthly_cost?: number | null
          organization_id?: string
          period_end?: string
          period_start?: string
          source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_cost_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_cost_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_pool_members: {
        Row: {
          added_at: string
          added_by: string | null
          application_id: string
          id: string
          notes: string | null
          pool_id: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          application_id: string
          id?: string
          notes?: string | null
          pool_id: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          application_id?: string
          id?: string
          notes?: string | null
          pool_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_pool_members_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_pool_members_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_basic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_pool_members_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_pool_members_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_sensitive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_pool_members_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "talent_pools"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_pools: {
        Row: {
          created_at: string
          created_by: string | null
          criteria: Json | null
          description: string | null
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          criteria?: Json | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          criteria?: Json | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_pools_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_pools_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      talroo_analytics: {
        Row: {
          applications: number | null
          campaign_id: string
          clicks: number | null
          cost_per_application: number | null
          cpc: number | null
          created_at: string | null
          ctr: number | null
          date: string
          id: string
          impressions: number | null
          job_id: string | null
          organization_id: string | null
          spend: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          applications?: number | null
          campaign_id: string
          clicks?: number | null
          cost_per_application?: number | null
          cpc?: number | null
          created_at?: string | null
          ctr?: number | null
          date: string
          id?: string
          impressions?: number | null
          job_id?: string | null
          organization_id?: string | null
          spend?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          applications?: number | null
          campaign_id?: string
          clicks?: number | null
          cost_per_application?: number | null
          cpc?: number | null
          created_at?: string | null
          ctr?: number | null
          date?: string
          id?: string
          impressions?: number | null
          job_id?: string | null
          organization_id?: string | null
          spend?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talroo_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talroo_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      tenstreet_bulk_operations: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_log: Json | null
          failed_records: number | null
          file_url: string | null
          id: string
          metadata: Json | null
          operation_type: string
          organization_id: string | null
          processed_records: number | null
          started_at: string | null
          status: string
          success_records: number | null
          total_records: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_log?: Json | null
          failed_records?: number | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          operation_type: string
          organization_id?: string | null
          processed_records?: number | null
          started_at?: string | null
          status?: string
          success_records?: number | null
          total_records?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_log?: Json | null
          failed_records?: number | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          operation_type?: string
          organization_id?: string | null
          processed_records?: number | null
          started_at?: string | null
          status?: string
          success_records?: number | null
          total_records?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenstreet_bulk_operations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenstreet_bulk_operations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      tenstreet_credentials: {
        Row: {
          account_name: string
          api_endpoint: string | null
          app_referrer: string | null
          apply_base_url: string | null
          client_id: string
          company_ids: string[] | null
          company_name: string | null
          created_at: string | null
          id: string
          job_store_client_id: string | null
          job_store_password_encrypted: string | null
          mode: string | null
          organization_id: string | null
          password: string | null
          referral_code: string | null
          service: string | null
          source: string | null
          status: string | null
          updated_at: string | null
          xml_feed_url: string | null
        }
        Insert: {
          account_name: string
          api_endpoint?: string | null
          app_referrer?: string | null
          apply_base_url?: string | null
          client_id: string
          company_ids?: string[] | null
          company_name?: string | null
          created_at?: string | null
          id?: string
          job_store_client_id?: string | null
          job_store_password_encrypted?: string | null
          mode?: string | null
          organization_id?: string | null
          password?: string | null
          referral_code?: string | null
          service?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          xml_feed_url?: string | null
        }
        Update: {
          account_name?: string
          api_endpoint?: string | null
          app_referrer?: string | null
          apply_base_url?: string | null
          client_id?: string
          company_ids?: string[] | null
          company_name?: string | null
          created_at?: string | null
          id?: string
          job_store_client_id?: string | null
          job_store_password_encrypted?: string | null
          mode?: string | null
          organization_id?: string | null
          password?: string | null
          referral_code?: string | null
          service?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          xml_feed_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenstreet_credentials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenstreet_credentials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
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
          {
            foreignKeyName: "tenstreet_field_mappings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      tenstreet_webhook_logs: {
        Row: {
          created_at: string | null
          driver_id: string | null
          duplicate: boolean | null
          error: string | null
          id: string
          organization_id: string | null
          packet_id: string
          parsed_data: Json | null
          processed: boolean | null
          received_at: string | null
          soap_payload: string
        }
        Insert: {
          created_at?: string | null
          driver_id?: string | null
          duplicate?: boolean | null
          error?: string | null
          id?: string
          organization_id?: string | null
          packet_id: string
          parsed_data?: Json | null
          processed?: boolean | null
          received_at?: string | null
          soap_payload: string
        }
        Update: {
          created_at?: string | null
          driver_id?: string | null
          duplicate?: boolean | null
          error?: string | null
          id?: string
          organization_id?: string | null
          packet_id?: string
          parsed_data?: Json | null
          processed?: boolean | null
          received_at?: string | null
          soap_payload?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenstreet_webhook_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenstreet_webhook_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      tenstreet_xchange_requests: {
        Row: {
          api_type: string | null
          application_id: string
          completion_date: string | null
          cost_cents: number | null
          created_at: string | null
          created_by: string | null
          driver_id: string
          extract_url: string | null
          id: string
          notes: string | null
          organization_id: string
          provider: string | null
          reference_number: string | null
          request_date: string
          request_type: string
          result_data: Json | null
          status: string
          tenstreet_request_id: string | null
          updated_at: string | null
        }
        Insert: {
          api_type?: string | null
          application_id: string
          completion_date?: string | null
          cost_cents?: number | null
          created_at?: string | null
          created_by?: string | null
          driver_id: string
          extract_url?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          provider?: string | null
          reference_number?: string | null
          request_date?: string
          request_type: string
          result_data?: Json | null
          status?: string
          tenstreet_request_id?: string | null
          updated_at?: string | null
        }
        Update: {
          api_type?: string | null
          application_id?: string
          completion_date?: string | null
          cost_cents?: number | null
          created_at?: string | null
          created_by?: string | null
          driver_id?: string
          extract_url?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          provider?: string | null
          reference_number?: string | null
          request_date?: string
          request_type?: string
          result_data?: Json | null
          status?: string
          tenstreet_request_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenstreet_xchange_requests_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenstreet_xchange_requests_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_basic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenstreet_xchange_requests_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenstreet_xchange_requests_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications_sensitive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenstreet_xchange_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenstreet_xchange_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      universal_feed_configs: {
        Row: {
          access_count: number | null
          client_id: string | null
          created_at: string | null
          created_by: string | null
          feed_format: string
          feed_name: string
          id: string
          is_active: boolean | null
          last_accessed_at: string | null
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          access_count?: number | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          feed_format?: string
          feed_name: string
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          access_count?: number | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          feed_format?: string
          feed_name?: string
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "universal_feed_configs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "universal_feed_configs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "public_client_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "universal_feed_configs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "universal_feed_configs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      user_client_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          client_id: string
          id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          client_id: string
          id?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          client_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_client_assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_client_assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "public_client_info"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          organization_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          token: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          token?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          chatbot_preferences: Json | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chatbot_preferences?: Json | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chatbot_preferences?: Json | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_sessions: {
        Row: {
          bounced: boolean | null
          country: string | null
          device_type: string | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          organization_id: string | null
          page_count: number | null
          session_id: string
          source: string | null
          started_at: string | null
          visitor_id: string
        }
        Insert: {
          bounced?: boolean | null
          country?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          organization_id?: string | null
          page_count?: number | null
          session_id: string
          source?: string | null
          started_at?: string | null
          visitor_id: string
        }
        Update: {
          bounced?: boolean | null
          country?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          organization_id?: string | null
          page_count?: number | null
          session_id?: string
          source?: string | null
          started_at?: string | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitor_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitor_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_agents: {
        Row: {
          agent_id: string
          agent_name: string
          agent_phone_number_id: string | null
          channels: string[]
          client_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          elevenlabs_agent_id: string | null
          id: string
          is_active: boolean
          is_outbound_enabled: boolean | null
          is_platform_default: boolean | null
          llm_model: string | null
          organization_id: string | null
          updated_at: string
          voice_id: string | null
          whatsapp_phone_number_id: string | null
        }
        Insert: {
          agent_id: string
          agent_name: string
          agent_phone_number_id?: string | null
          channels?: string[]
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          elevenlabs_agent_id?: string | null
          id?: string
          is_active?: boolean
          is_outbound_enabled?: boolean | null
          is_platform_default?: boolean | null
          llm_model?: string | null
          organization_id?: string | null
          updated_at?: string
          voice_id?: string | null
          whatsapp_phone_number_id?: string | null
        }
        Update: {
          agent_id?: string
          agent_name?: string
          agent_phone_number_id?: string | null
          channels?: string[]
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          elevenlabs_agent_id?: string | null
          id?: string
          is_active?: boolean
          is_outbound_enabled?: boolean | null
          is_platform_default?: boolean | null
          llm_model?: string | null
          organization_id?: string | null
          updated_at?: string
          voice_id?: string | null
          whatsapp_phone_number_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_agents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_agents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "public_client_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_agents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_agents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
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
          {
            foreignKeyName: "webhook_configurations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      applications_basic: {
        Row: {
          applied_at: string | null
          city: string | null
          created_at: string | null
          first_name: string | null
          full_name: string | null
          id: string | null
          job_listing_id: string | null
          last_name: string | null
          recruiter_id: string | null
          source: string | null
          state: string | null
          status: string | null
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          applied_at?: string | null
          city?: string | null
          created_at?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string | null
          job_listing_id?: string | null
          last_name?: string | null
          recruiter_id?: string | null
          source?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          applied_at?: string | null
          city?: string | null
          created_at?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string | null
          job_listing_id?: string | null
          last_name?: string | null
          recruiter_id?: string | null
          source?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
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
      applications_contact: {
        Row: {
          address_1: string | null
          address_2: string | null
          applicant_email: string | null
          city: string | null
          country: string | null
          first_name: string | null
          full_name: string | null
          id: string | null
          job_listing_id: string | null
          last_name: string | null
          phone: string | null
          preferred_contact_method: string | null
          secondary_phone: string | null
          state: string | null
          zip: string | null
        }
        Insert: {
          address_1?: string | null
          address_2?: string | null
          applicant_email?: string | null
          city?: string | null
          country?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string | null
          job_listing_id?: string | null
          last_name?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          secondary_phone?: string | null
          state?: string | null
          zip?: string | null
        }
        Update: {
          address_1?: string | null
          address_2?: string | null
          applicant_email?: string | null
          city?: string | null
          country?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string | null
          job_listing_id?: string | null
          last_name?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          secondary_phone?: string | null
          state?: string | null
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
        ]
      }
      applications_sensitive: {
        Row: {
          accident_history: string | null
          convicted_felony: string | null
          date_of_birth: string | null
          felony_details: string | null
          government_id: string | null
          government_id_type: string | null
          id: string | null
          job_listing_id: string | null
          ssn: string | null
          violation_history: string | null
        }
        Insert: {
          accident_history?: string | null
          convicted_felony?: string | null
          date_of_birth?: string | null
          felony_details?: string | null
          government_id?: string | null
          government_id_type?: string | null
          id?: string | null
          job_listing_id?: string | null
          ssn?: string | null
          violation_history?: string | null
        }
        Update: {
          accident_history?: string | null
          convicted_felony?: string | null
          date_of_birth?: string | null
          felony_details?: string | null
          government_id?: string | null
          government_id_type?: string | null
          id?: string | null
          job_listing_id?: string | null
          ssn?: string | null
          violation_history?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_listing_id_fkey"
            columns: ["job_listing_id"]
            isOneToOne: false
            referencedRelation: "job_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      ats_sync_overview: {
        Row: {
          ats_name: string | null
          ats_slug: string | null
          connection_id: string | null
          connection_name: string | null
          created_at: string | null
          failed_syncs: number | null
          is_auto_post_enabled: boolean | null
          last_error: string | null
          last_sync_at: string | null
          mode: string | null
          organization_id: string | null
          organization_name: string | null
          status: string | null
          successful_syncs: number | null
          total_syncs: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ats_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ats_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organization_info"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_data_coverage: {
        Row: {
          campaign_coverage_pct: number | null
          client_id: string | null
          date_coverage_pct: number | null
          indeed_apply_coverage_pct: number | null
          jobs_with_campaign: number | null
          jobs_with_date: number | null
          jobs_with_indeed_apply: number | null
          jobs_with_tracking: number | null
          total_jobs: number | null
          tracking_coverage_pct: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_job_listings_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_job_listings_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "public_client_info"
            referencedColumns: ["id"]
          },
        ]
      }
      public_client_info: {
        Row: {
          city: string | null
          id: string | null
          industry_vertical: string | null
          job_count: number | null
          logo_url: string | null
          name: string | null
          state: string | null
        }
        Relationships: []
      }
      public_organization_info: {
        Row: {
          id: string | null
          logo_url: string | null
          name: string | null
          slug: string | null
        }
        Insert: {
          id?: string | null
          logo_url?: string | null
          name?: string | null
          slug?: string | null
        }
        Update: {
          id?: string | null
          logo_url?: string | null
          name?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      public_shared_conversation_info: {
        Row: {
          agent_name: string | null
          conversation_id: string | null
          custom_title: string | null
          duration_seconds: number | null
          expires_at: string | null
          hide_caller_info: boolean | null
          id: string | null
          organization_logo: string | null
          organization_name: string | null
          share_code: string | null
          started_at: string | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_voice_conversations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "elevenlabs_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      apply_industry_template: {
        Args: { _org_id: string; _reset_existing?: boolean; _vertical: string }
        Returns: undefined
      }
      can_access_sensitive_applicant_data: {
        Args: { app_job_listing_id: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          _endpoint: string
          _identifier: string
          _max_requests?: number
          _window_minutes?: number
        }
        Returns: Json
      }
      check_usage_limit: {
        Args: { p_metric: string; p_organization_id: string }
        Returns: boolean
      }
      classify_traffic_source: { Args: { referrer: string }; Returns: string }
      cleanup_expired_cache: { Args: never; Returns: undefined }
      cleanup_expired_sms_links: { Args: never; Returns: undefined }
      cleanup_old_api_request_logs: { Args: never; Returns: undefined }
      cleanup_old_feed_logs: { Args: never; Returns: undefined }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      create_application_with_audit: {
        Args: { application_data: Json; created_by_reason?: string }
        Returns: Json
      }
      create_organization:
        | {
            Args: { _admin_email?: string; _name: string; _slug: string }
            Returns: string
          }
        | {
            Args: {
              _admin_email?: string
              _industry_vertical?: string
              _name: string
              _slug: string
            }
            Returns: string
          }
      delete_organization_holiday: {
        Args: { p_holiday_id: string; p_org_id: string }
        Returns: boolean
      }
      ensure_admin_for_email: {
        Args: {
          _email: string
          _org_slug: string
          _role?: Database["public"]["Enums"]["app_role"]
        }
        Returns: Json
      }
      ensure_super_admin_for_email: {
        Args: { _email: string }
        Returns: undefined
      }
      generate_embed_token: { Args: never; Returns: string }
      generate_share_code: { Args: never; Returns: string }
      generate_short_code: { Args: { length?: number }; Returns: string }
      get_active_ats_connections: {
        Args: { p_client_id?: string; p_organization_id: string }
        Returns: {
          api_type: string
          ats_name: string
          ats_slug: string
          ats_system_id: string
          auto_post_on_status: string[]
          base_endpoint: string
          connection_id: string
          credentials: Json
          is_auto_post_enabled: boolean
          mode: string
        }[]
      }
      get_application_basic_data: {
        Args: { application_id: string }
        Returns: {
          applicant_email: string
          applied_at: string
          cdl: string
          city: string
          education_level: string
          exp: string
          first_name: string
          id: string
          job_listing_id: string
          last_name: string
          notes: string
          phone: string
          source: string
          state: string
          status: string
          work_authorization: string
          zip: string
        }[]
      }
      get_application_organization_id: {
        Args: { _application_id: string }
        Returns: string
      }
      get_application_sensitive_data: {
        Args: { access_reason?: string; application_id: string }
        Returns: {
          date_of_birth: string
          employment_history: Json
          felony_details: string
          full_address: string
          government_id: string
          government_id_type: string
          id: string
          medical_card_expiration: string
          military_history: Json
          ssn: string
        }[]
      }
      get_application_summary: {
        Args: { application_id: string }
        Returns: {
          applied_at: string
          can_start_soon: boolean
          candidate_name: string
          experience_level: string
          has_required_credentials: boolean
          id: string
          job_title: string
          location: string
          status: string
        }[]
      }
      get_application_with_audit: {
        Args: {
          access_reason?: string
          application_id: string
          include_pii?: boolean
        }
        Returns: Json
      }
      get_application_xchange_summary: {
        Args: { app_id: string }
        Returns: {
          completed_requests: number
          latest_request_date: string
          pending_requests: number
          total_cost_cents: number
          total_requests: number
        }[]
      }
      get_applications_list_with_audit: {
        Args: { access_reason?: string; filters?: Json }
        Returns: {
          applicant_email: string
          applied_at: string
          cdl: string
          city: string
          created_at: string
          education_level: string
          exp: string
          first_name: string
          id: string
          job_listing_id: string
          job_location: string
          job_title: string
          last_name: string
          notes: string
          phone: string
          source: string
          state: string
          status: string
          total_count: number
          updated_at: string
          work_authorization: string
          zip: string
        }[]
      }
      get_client_application_fields: {
        Args: { p_client_id: string }
        Returns: {
          enabled: boolean
          field_key: string
          required: boolean
        }[]
      }
      get_conversation_message_counts: {
        Args: { conversation_ids: string[] }
        Returns: {
          conversation_id: string
          message_count: number
        }[]
      }
      get_current_user_role: { Args: never; Returns: string }
      get_dashboard_metrics: { Args: never; Returns: Json }
      get_next_business_hours_start:
        | { Args: { p_org_id?: string }; Returns: string }
        | { Args: { p_client_id?: string; p_org_id?: string }; Returns: string }
      get_org_id_by_slug: { Args: { _slug: string }; Returns: string }
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
      get_organization_with_stats: { Args: { _org_id: string }; Returns: Json }
      get_organizations_credentials_summary: {
        Args: never
        Returns: {
          api_endpoint: string
          connection_health: string
          created_at: string
          credential_id: string
          credential_status: string
          credentials_updated: string
          id: string
          last_sync_time: string
          mode: string
          name: string
          slug: string
          synced_count: number
          total_applications: number
        }[]
      }
      get_platform_breakdown_data: { Args: never; Returns: Json }
      get_public_organization_by_slug: {
        Args: { org_slug: string }
        Returns: {
          id: string
          logo_url: string
          name: string
          slug: string
        }[]
      }
      get_public_organization_info: {
        Args: { org_id: string }
        Returns: {
          id: string
          logo_url: string
          name: string
          slug: string
        }[]
      }
      get_public_voice_agent_client_ids: {
        Args: { _org_ids: string[] }
        Returns: {
          client_id: string
          organization_id: string
        }[]
      }
      get_publisher_feed_config: {
        Args: { p_organization_id: string; p_publisher_slug: string }
        Returns: {
          api_credentials: Json
          feed_format: string
          feed_url: string
          is_enabled: boolean
          publisher_id: string
          publisher_name: string
          publisher_slug: string
        }[]
      }
      get_random_jobs:
        | {
            Args: {
              _client_id?: string
              _limit?: number
              _location?: string
              _offset?: number
              _search?: string
              _seed: string
            }
            Returns: {
              apply_url: string
              category_id: string
              city: string
              client_id: string
              created_at: string
              dest_city: string
              dest_state: string
              experience_level: string
              id: string
              is_hidden: boolean
              job_summary: string
              job_title: string
              job_type: string
              location: string
              organization_id: string
              remote_type: string
              salary_max: number
              salary_min: number
              salary_type: string
              state: string
              status: string
              title: string
              total_count: number
              updated_at: string
              url: string
              user_id: string
            }[]
          }
        | {
            Args: {
              _category_id?: string
              _client_id?: string
              _limit?: number
              _location?: string
              _offset?: number
              _search?: string
              _seed: string
            }
            Returns: {
              apply_url: string
              category_id: string
              city: string
              client_id: string
              created_at: string
              dest_city: string
              dest_state: string
              experience_level: string
              id: string
              is_hidden: boolean
              job_description: string
              job_summary: string
              job_title: string
              job_type: string
              location: string
              organization_id: string
              remote_type: string
              salary_max: number
              salary_min: number
              salary_type: string
              state: string
              status: string
              title: string
              total_count: number
              updated_at: string
              url: string
              user_id: string
            }[]
          }
      get_screening_questions_for_job: {
        Args: { p_job_listing_id: string }
        Returns: Json
      }
      get_spend_chart_data: { Args: never; Returns: Json }
      get_sponsorship_tier: { Args: { referrer: string }; Returns: string }
      get_user_organization_id: { Args: never; Returns: string }
      get_user_platform_access: {
        Args: { _platform_name: string }
        Returns: boolean
      }
      has_active_subscription: { Args: { org_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_or_higher: {
        Args: { _min_role: string; _user_id: string }
        Returns: boolean
      }
      increment_ats_sync_stats: {
        Args: { p_connection_id: string; p_success: boolean }
        Returns: undefined
      }
      increment_share_view_count: {
        Args: { p_share_code: string }
        Returns: undefined
      }
      increment_short_link_click: {
        Args: { p_short_code: string }
        Returns: undefined
      }
      increment_usage: {
        Args: { p_amount?: number; p_metric: string; p_organization_id: string }
        Returns: undefined
      }
      is_assigned_to_client: {
        Args: { _client_id: string; _user_id: string }
        Returns: boolean
      }
      is_holiday: {
        Args: { p_date: string; p_org_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      is_within_business_hours:
        | { Args: { p_org_id?: string }; Returns: boolean }
        | {
            Args: { p_client_id?: string; p_org_id?: string }
            Returns: boolean
          }
      next_business_datetime: {
        Args: { p_client_id?: string; p_from?: string; p_org_id: string }
        Returns: string
      }
      normalize_phone_number: { Args: { phone_input: string }; Returns: string }
      organization_has_platform_access: {
        Args: { _org_id: string; _platform_name: string }
        Returns: boolean
      }
      set_organization_platform_access: {
        Args: { _enabled: boolean; _org_id: string; _platform_name: string }
        Returns: undefined
      }
      update_application_with_audit: {
        Args: {
          application_id: string
          update_data: Json
          update_reason?: string
        }
        Returns: Json
      }
      update_organization_features: {
        Args: { _features: Json; _org_id: string }
        Returns: undefined
      }
      update_user_status: {
        Args: { _enabled: boolean; _user_id: string }
        Returns: undefined
      }
      upsert_call_schedule_settings:
        | {
            Args: {
              p_auto_follow_up_enabled?: boolean
              p_business_days?: number[]
              p_business_hours_end?: string
              p_business_hours_start?: string
              p_business_hours_timezone?: string
              p_client_id?: string
              p_follow_up_delay_hours?: number
              p_max_attempts?: number
              p_organization_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_auto_follow_up_enabled?: boolean
              p_business_days?: number[]
              p_business_hours_end?: string
              p_business_hours_start?: string
              p_business_hours_timezone?: string
              p_callback_reference_enabled?: boolean
              p_client_id?: string
              p_cooldown_hours?: number
              p_follow_up_delay_hours?: number
              p_follow_up_delay_minutes?: number
              p_follow_up_escalation_multiplier?: number
              p_follow_up_on_busy?: boolean
              p_follow_up_on_failed?: boolean
              p_follow_up_on_no_answer?: boolean
              p_max_attempts?: number
              p_organization_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_auto_follow_up_enabled?: boolean
              p_business_days?: number[]
              p_business_hours_end?: string
              p_business_hours_start?: string
              p_business_hours_timezone?: string
              p_callback_reference_enabled?: boolean
              p_client_id?: string
              p_cooldown_hours?: number
              p_follow_up_delay_hours?: number
              p_follow_up_delay_minutes?: number
              p_follow_up_escalation_multiplier?: number
              p_follow_up_on_busy?: boolean
              p_follow_up_on_failed?: boolean
              p_follow_up_on_no_answer?: boolean
              p_max_attempts?: number
              p_organization_id: string
              p_preferred_call_windows?: Json
              p_smart_scheduling_enabled?: boolean
              p_time_rotation_enabled?: boolean
            }
            Returns: Json
          }
      upsert_organization_holiday: {
        Args: {
          p_date: string
          p_name: string
          p_org_id: string
          p_recurring?: boolean
        }
        Returns: string
      }
      validate_phone_number: { Args: { phone: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "recruiter"
        | "user"
        | "super_admin"
        | "client"
      screening_request_status:
        | "pending"
        | "sent"
        | "completed"
        | "failed"
        | "expired"
      screening_request_type:
        | "background_check"
        | "employment_application"
        | "drug_screening"
      sms_verification_status:
        | "pending_confirmation"
        | "confirmed"
        | "edit_requested"
        | "expired"
      sponsorship_tier: "premium" | "standard" | "organic"
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
      app_role: [
        "admin",
        "moderator",
        "recruiter",
        "user",
        "super_admin",
        "client",
      ],
      screening_request_status: [
        "pending",
        "sent",
        "completed",
        "failed",
        "expired",
      ],
      screening_request_type: [
        "background_check",
        "employment_application",
        "drug_screening",
      ],
      sms_verification_status: [
        "pending_confirmation",
        "confirmed",
        "edit_requested",
        "expired",
      ],
      sponsorship_tier: ["premium", "standard", "organic"],
    },
  },
} as const
