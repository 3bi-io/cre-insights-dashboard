/**
 * ElevenLabs Hooks Barrel Export
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
