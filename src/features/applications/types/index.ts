// Application type definitions
export type { Application, Recruiter, JobListing } from '@/types/common.types';

export interface ApplicationCategory {
  code: 'D' | 'SC' | 'SR' | 'N/A';
  label: string;
  color: string;
}

export type ApplicationStatus = 
  | 'pending' 
  | 'reviewed' 
  | 'interviewed' 
  | 'hired' 
  | 'rejected';

export interface ApplicationStats {
  total: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  bySource: Record<string, number>;
}

export interface ApplicationFormData {
  job_listing_id: string;
  first_name: string;
  last_name: string;
  applicant_email: string;
  phone?: string;
  city?: string;
  state?: string;
  zip?: string;
  cdl?: string;
  exp?: string;
  age?: string;
  source?: string;
  notes?: string;
  // Extended fields
  middle_name?: string;
  ssn?: string;
  date_of_birth?: string;
  address_1?: string;
  address_2?: string;
  country?: string;
  work_authorization?: string;
  education_level?: string;
  military_service?: string;
  veteran?: string;
  [key: string]: any;
}

export interface ApplicationUpdatePayload {
  status?: ApplicationStatus;
  recruiter_id?: string | null;
  notes?: string;
  [key: string]: any;
}

export interface SendSmsParams {
  to: string;
  message: string;
  applicationId?: string;
}

export interface TenstreetSubmission {
  applicationId: string;
  driverId?: string;
  mappings?: Record<string, string>;
}
