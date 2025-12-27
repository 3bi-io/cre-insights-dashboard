/**
 * ElevenLabs Voice Agent Types
 * Centralized type definitions for all voice agent features
 */

// ============= Core Voice Agent Types =============

export interface VoiceAgent {
  id: string;
  organization_id: string;
  agent_name: string;
  agent_id: string;
  elevenlabs_agent_id: string;
  voice_id?: string;
  description: string | null;
  is_active: boolean;
  llm_model?: string;
  agent_phone_number_id?: string | null;
  is_outbound_enabled?: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  organizations?: OrganizationInfo;
}

export interface OrganizationInfo {
  name: string;
  slug: string;
  logo_url?: string;
}

export interface CreateVoiceAgentData {
  organization_id: string;
  agent_name: string;
  agent_id: string;
  elevenlabs_agent_id: string;
  voice_id?: string;
  description?: string;
  is_active?: boolean;
  llm_model?: string;
  agent_phone_number_id?: string;
  is_outbound_enabled?: boolean;
}

export interface UpdateVoiceAgentData extends Partial<CreateVoiceAgentData> {
  id: string;
}

// ============= Conversation Types =============

export interface Conversation {
  id: string;
  organization_id: string;
  voice_agent_id: string;
  conversation_id: string;
  agent_id: string;
  status: ConversationStatus;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  metadata: Record<string, any>;
  voice_agents?: {
    agent_name: string;
    organizations?: {
      name: string;
    };
  };
}

export type ConversationStatus = 'active' | 'completed' | 'failed';

export interface Transcript {
  id: string;
  conversation_id: string;
  speaker: 'user' | 'agent';
  message: string;
  timestamp: string;
  sequence_number: number;
  confidence_score: number | null;
  metadata?: Record<string, any>;
}

export interface Audio {
  id: string;
  conversation_id: string;
  audio_url: string;
  duration_seconds: number | null;
  file_size_bytes: number | null;
  format: string;
  storage_path?: string;
}

// ============= Job Context Types =============

export interface JobContext {
  jobId: string;
  jobTitle: string;
  jobDescription?: string;
  company?: string;
  location?: string;
  salary?: string;
}

// ============= Connection Types =============

export interface SignedUrlResponse {
  success: boolean;
  signedUrl?: string;
  error?: string;
}

export interface ConversationSession {
  signedUrl: string;
  jobContext?: JobContext;
}

// ============= Agent Configuration =============

export interface AgentOverrides {
  agent: {
    prompt: {
      prompt: string;
    };
    firstMessage: string;
    language: string;
  };
}

// ============= LLM Model Options =============

export type LLMModel = 
  // OpenAI Models
  | 'gpt-5-2025-08-07'
  | 'gpt-5-mini-2025-08-07'
  | 'gpt-5-nano-2025-08-07'
  | 'gpt-4.1-2025-04-14'
  | 'gpt-4.1-mini-2025-04-14'
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'o3-2025-04-16'
  | 'o4-mini-2025-04-16'
  // Anthropic Models
  | 'claude-sonnet-4-20250514'
  | 'claude-opus-4-5-20251101'
  | 'claude-3-5-haiku-20241022'
  // xAI Grok Models
  | 'grok-4-0709'
  | 'grok-3'
  | 'grok-3-mini';

export interface LLMModelOption {
  value: LLMModel;
  label: string;
  description?: string;
  category: 'openai' | 'anthropic' | 'xai';
}

export const LLM_MODEL_OPTIONS: LLMModelOption[] = [
  // OpenAI GPT-5 Series (Latest)
  { value: 'gpt-5-2025-08-07', label: 'GPT-5 (Flagship)', category: 'openai', description: 'Most capable flagship model' },
  { value: 'gpt-5-mini-2025-08-07', label: 'GPT-5 Mini', category: 'openai', description: 'Fast, cost-efficient' },
  { value: 'gpt-5-nano-2025-08-07', label: 'GPT-5 Nano', category: 'openai', description: 'Fastest, cheapest' },
  { value: 'gpt-4.1-2025-04-14', label: 'GPT-4.1', category: 'openai', description: 'Reliable GPT-4 flagship' },
  { value: 'gpt-4.1-mini-2025-04-14', label: 'GPT-4.1 Mini', category: 'openai', description: 'Vision support, cost-effective' },
  { value: 'o3-2025-04-16', label: 'O3 (Reasoning)', category: 'openai', description: 'Advanced multi-step reasoning' },
  { value: 'o4-mini-2025-04-16', label: 'O4 Mini', category: 'openai', description: 'Fast reasoning, coding & vision' },
  { value: 'gpt-4o', label: 'GPT-4o (Legacy)', category: 'openai', description: 'Legacy multimodal model' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Legacy)', category: 'openai', description: 'Legacy fast model' },
  
  // Anthropic Claude (Latest)
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4', category: 'anthropic', description: 'High-performance, superior reasoning' },
  { value: 'claude-opus-4-5-20251101', label: 'Claude Opus 4.5', category: 'anthropic', description: 'Most intelligent, expensive' },
  { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku', category: 'anthropic', description: 'Fastest Claude model' },
  
  // xAI Grok (Latest)
  { value: 'grok-4-0709', label: 'Grok 4 (Latest)', category: 'xai', description: 'Latest Grok flagship' },
  { value: 'grok-3', label: 'Grok 3', category: 'xai', description: 'Powerful reasoning' },
  { value: 'grok-3-mini', label: 'Grok 3 Mini', category: 'xai', description: 'Fast and efficient' },
];

// ============= Live Transcript Types =============

export interface LiveTranscriptMessage {
  id: string;
  speaker: 'user' | 'agent';
  text: string;
  timestamp: Date;
  isFinal: boolean;
}

// ============= Error Types =============

export interface VoiceAgentError {
  code: 'MICROPHONE_ACCESS_DENIED' | 'API_KEY_MISSING' | 'INVALID_AGENT_ID' | 'CONNECTION_FAILED' | 'AUDIOWORKLET_NOT_SUPPORTED' | 'BROWSER_NOT_COMPATIBLE' | 'UNKNOWN';
  message: string;
  originalError?: any;
  recoverySteps?: string[];
}
