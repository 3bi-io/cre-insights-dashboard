/**
 * ElevenLabs Agent Configuration Utilities
 * Helper functions for agent ID validation and normalization
 */

export function normalizeAgentId(agentId: string): string {
  return agentId.trim();
}

export function validateAgentId(agentId: string): boolean {
  return agentId.startsWith('agent_') && agentId.length > 10;
}
