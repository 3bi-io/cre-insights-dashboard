/**
 * ElevenLabs Agent Configuration Utilities
 * Helper functions for creating agent configurations and overrides
 */

import { AgentOverrides, JobContext } from '../types';

/**
 * Create a personalized first message for the candidate.
 * The system prompt is managed in the ElevenLabs dashboard;
 * job context is injected via dynamicVariables.
 */
export function createFirstMessage(job: JobContext): string {
  const company = job.company || 'our company';
  const candidateName = job.candidateName;
  
  if (candidateName && candidateName !== 'there') {
    return `Hi ${candidateName}! I can help you apply for the ${job.jobTitle} position at ${company}. Shall we get started?`;
  }
  return `Hi there! I can help you apply for the ${job.jobTitle} position at ${company}. May I start with your first name?`;
}

/**
 * Build agent overrides — only firstMessage and optional TTS.
 * The system prompt is NOT overridden so dashboard-configured
 * instructions (scheduling, data collection, tone) remain intact.
 */
export function createAgentOverrides(job: JobContext, voiceId?: string): AgentOverrides {
  const overrides: AgentOverrides = {
    agent: {
      firstMessage: createFirstMessage(job),
      language: 'en' as const,
    },
  };

  if (voiceId) {
    overrides.tts = { voiceId };
  }

  return overrides;
}

export function normalizeAgentId(agentId: string): string {
  // Remove any whitespace
  return agentId.trim();
}

export function validateAgentId(agentId: string): boolean {
  // Basic validation - should start with 'agent_' and have reasonable length
  return agentId.startsWith('agent_') && agentId.length > 10;
}
