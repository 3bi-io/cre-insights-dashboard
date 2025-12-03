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
  | 'gpt-5-2025-08-07'
  | 'gpt-5-mini-2025-08-07'
  | 'gpt-5-nano-2025-08-07'
  | 'gpt-4.1-2025-04-14'
  | 'o3-2025-04-16'
  | 'o4-mini-2025-04-16'
  | 'gpt-4o-mini'
  | 'gpt-4o'
  | 'claude-sonnet-4-5'
  | 'claude-opus-4-1-20250805'
  | 'claude-sonnet-4-20250514'
  | 'grok-beta'
  | 'grok-2-latest';

export interface LLMModelOption {
  value: LLMModel;
  label: string;
  description?: string;
  category: 'openai' | 'anthropic' | 'xai';
}

export const LLM_MODEL_OPTIONS: LLMModelOption[] = [
  // OpenAI GPT-5 Series
  { value: 'gpt-5-2025-08-07', label: 'GPT-5 (Latest Flagship)', category: 'openai', description: 'Most capable flagship model' },
  { value: 'gpt-5-mini-2025-08-07', label: 'GPT-5 Mini (Fast & Efficient)', category: 'openai', description: 'Fast and cost-effective' },
  { value: 'gpt-5-nano-2025-08-07', label: 'GPT-5 Nano (Fastest)', category: 'openai', description: 'Fastest for simple tasks' },
  
  // OpenAI GPT-4 Series
  { value: 'gpt-4.1-2025-04-14', label: 'GPT-4.1 (Reliable)', category: 'openai', description: 'Reliable flagship GPT-4' },
  
  // OpenAI O Series
  { value: 'o3-2025-04-16', label: 'O3 (Reasoning)', category: 'openai', description: 'Advanced reasoning model' },
  { value: 'o4-mini-2025-04-16', label: 'O4 Mini (Fast Reasoning)', category: 'openai', description: 'Fast reasoning model' },
  
  // OpenAI Legacy
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Legacy)', category: 'openai', description: 'Legacy fast model' },
  { value: 'gpt-4o', label: 'GPT-4o (Legacy Vision)', category: 'openai', description: 'Legacy with vision' },
  
  // Anthropic Claude
  { value: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5', category: 'anthropic', description: 'Most intelligent Claude' },
  { value: 'claude-opus-4-1-20250805', label: 'Claude Opus 4.1', category: 'anthropic', description: 'Highly intelligent, expensive' },
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4', category: 'anthropic', description: 'High performance model' },
  
  // xAI Grok
  { value: 'grok-beta', label: 'Grok (Beta)', category: 'xai', description: 'Beta version' },
  { value: 'grok-2-latest', label: 'Grok 2 (Latest)', category: 'xai', description: 'Latest Grok model' },
];

// ============= Error Types =============

export interface VoiceAgentError {
  code: 'MICROPHONE_ACCESS_DENIED' | 'API_KEY_MISSING' | 'INVALID_AGENT_ID' | 'CONNECTION_FAILED' | 'AUDIOWORKLET_NOT_SUPPORTED' | 'BROWSER_NOT_COMPATIBLE' | 'UNKNOWN';
  message: string;
  originalError?: any;
  recoverySteps?: string[];
}
