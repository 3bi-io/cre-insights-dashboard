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
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4-turbo'
  | 'o1'
  | 'o1-mini'
  | 'claude-sonnet-4-5'
  | 'claude-opus-4-1-20250805'
  | 'claude-3-5-haiku-20241022'
  | 'grok-2'
  | 'grok-beta';

export interface LLMModelOption {
  value: LLMModel;
  label: string;
  description?: string;
  category: 'openai' | 'anthropic' | 'xai';
}

export const LLM_MODEL_OPTIONS: LLMModelOption[] = [
  // OpenAI Models
  { value: 'gpt-4o', label: 'GPT-4o (Latest Flagship)', category: 'openai', description: 'Most capable multimodal model' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast)', category: 'openai', description: 'Fast and cost-effective' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (Reliable)', category: 'openai', description: 'Reliable with vision support' },
  { value: 'o1', label: 'O1 (Advanced Reasoning)', category: 'openai', description: 'Best for complex reasoning' },
  { value: 'o1-mini', label: 'O1 Mini (Fast Reasoning)', category: 'openai', description: 'Fast reasoning model' },
  
  // Anthropic Claude
  { value: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5 (Best)', category: 'anthropic', description: 'Most intelligent Claude' },
  { value: 'claude-opus-4-1-20250805', label: 'Claude Opus 4.1', category: 'anthropic', description: 'Highly intelligent, expensive' },
  { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku (Fast)', category: 'anthropic', description: 'Fastest Claude model' },
  
  // xAI Grok
  { value: 'grok-2', label: 'Grok 2 (Latest)', category: 'xai', description: 'Latest Grok model' },
  { value: 'grok-beta', label: 'Grok (Beta)', category: 'xai', description: 'Beta version' },
];

// ============= Error Types =============

export interface VoiceAgentError {
  code: 'MICROPHONE_ACCESS_DENIED' | 'API_KEY_MISSING' | 'INVALID_AGENT_ID' | 'CONNECTION_FAILED' | 'AUDIOWORKLET_NOT_SUPPORTED' | 'BROWSER_NOT_COMPATIBLE' | 'UNKNOWN';
  message: string;
  originalError?: any;
  recoverySteps?: string[];
}
