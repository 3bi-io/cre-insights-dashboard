/**
 * ElevenLabs Agent Configuration Utilities
 * Helper functions for creating agent configurations and overrides
 */

import { AgentOverrides, JobContext } from '../types';

export function createJobContextPrompt(job: JobContext): string {
  const company = job.company || 'our company';
  const location = job.location || 'various locations';
  const salary = job.salary || 'competitive compensation package';
  const description = job.jobDescription || 'Details will be collected during application.';

  return `You are assisting a candidate to apply for ${job.jobTitle} at ${company}. 
Location: ${location}. 
Salary: ${salary}. 
Job Description: ${description}

Personalize the conversation to this specific job and guide the applicant through the application process. 
Be professional, friendly, and helpful throughout the conversation.`;
}

export function createFirstMessage(job: JobContext): string {
  const company = job.company || 'our company';
  return `I can help you apply for ${job.jobTitle} at ${company}. May I start with your first name?`;
}

export function createAgentOverrides(job: JobContext): AgentOverrides {
  return {
    agent: {
      prompt: {
        prompt: createJobContextPrompt(job)
      },
      firstMessage: createFirstMessage(job),
      language: 'en'
    }
  };
}

export function normalizeAgentId(agentId: string): string {
  // Remove any whitespace
  return agentId.trim();
}

export function validateAgentId(agentId: string): boolean {
  // Basic validation - should start with 'agent_' and have reasonable length
  return agentId.startsWith('agent_') && agentId.length > 10;
}
