/**
 * ElevenLabs Hooks Barrel Export
 * Consolidated voice AI hooks for ElevenLabs integration
 */

// Core connection hook
export { useVoiceAgentConnection } from './useVoiceAgentConnection';

// API hooks
export { 
  useElevenLabsConnection,
  useElevenLabsSubscription,
  useElevenLabsVoices,
  useElevenLabsModels,
  useElevenLabsHistory,
  useElevenLabsAgents,
  useTextToSpeech,
  useConnectionTest
} from './useElevenLabsAPI';
export type { 
  ElevenLabsVoice, 
  ElevenLabsSubscription, 
  ElevenLabsUser, 
  ElevenLabsModel 
} from './useElevenLabsAPI';

// Conversation hooks
export { useElevenLabsConversations } from './useElevenLabsConversations';
// Note: Conversation, Transcript, Audio types are in '@/features/elevenlabs/types'

// Voice application hook
export { useElevenLabsVoice } from './useElevenLabsVoice';

// Voice agents CRUD hook
export { useVoiceAgents } from './useVoiceAgents';

// Outbound calls hooks
export { useOutboundCalls } from './useOutboundCalls';
export { 
  useOutboundCallAnalytics,
  type OutboundCallMetrics,
  type DailyCallVolume,
  type StatusDistribution
} from './useOutboundCallAnalytics';

// Call schedule settings hook
export { useCallScheduleSettings } from './useCallScheduleSettings';
export type { CallScheduleSettings } from './useCallScheduleSettings';
