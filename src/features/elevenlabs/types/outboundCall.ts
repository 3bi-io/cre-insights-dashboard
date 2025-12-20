/**
 * Types for ElevenLabs Outbound Call functionality
 */

export interface OutboundCall {
  id: string;
  application_id: string | null;
  voice_agent_id: string | null;
  organization_id: string | null;
  phone_number: string;
  status: OutboundCallStatus;
  call_sid: string | null;
  elevenlabs_conversation_id: string | null;
  duration_seconds: number | null;
  error_message: string | null;
  metadata: OutboundCallMetadata;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
}

export type OutboundCallStatus = 
  | 'queued'
  | 'initiating'
  | 'initiated'
  | 'ringing'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'no_answer'
  | 'busy'
  | 'cancelled';

export interface OutboundCallMetadata {
  applicant_name?: string;
  triggered_by?: 'status_change' | 'api_call' | 'manual';
  previous_status?: string;
  [key: string]: unknown;
}

export interface InitiateOutboundCallRequest {
  application_id?: string;
  outbound_call_id?: string;
  voice_agent_id?: string;
  phone_number?: string;
}

export interface InitiateOutboundCallResponse {
  success: boolean;
  call_id?: string;
  call_sid?: string;
  conversation_id?: string;
  phone_number?: string;
  message?: string;
  error?: string;
  details?: string;
}

export interface OutboundCallWithDetails extends OutboundCall {
  voice_agent?: {
    id: string;
    name: string;
  } | null;
  application?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  } | null;
}
