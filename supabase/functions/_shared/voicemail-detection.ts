/**
 * Shared Voicemail Detection Logic
 * 
 * Two-pronged detection:
 * 1. ElevenLabs voicemail_detection tool call check
 * 2. Transcript keyword fallback
 */

const VM_PHRASES = [
  'leave a message', 'leave your message', 'after the tone', 'after the beep',
  'not available', 'unavailable right now', 'please record your message',
  'voicemail', 'mailbox', 'press one', 'press 1 for',
  'at the tone', 'cannot take your call', "can't come to the phone",
  'not able to take', 'record a message', 'leave your name',
];

export interface VoicemailResult {
  detected: boolean;
  toolTriggered: boolean;
  transcriptMatch: boolean;
}

/**
 * Detect voicemail from ElevenLabs tool calls and transcript text.
 * 
 * @param toolCalls - Array of tool call objects from ElevenLabs analysis
 * @param transcriptText - Lowercased transcript text to scan for VM phrases
 */
export function detectVoicemail(
  toolCalls: Array<Record<string, unknown>> | undefined | null,
  transcriptText: string,
): VoicemailResult {
  const toolTriggered = Array.isArray(toolCalls) && toolCalls.some(
    (tc) => tc.tool_name === 'voicemail_detection' || tc.name === 'voicemail_detection'
  );

  const lower = transcriptText.toLowerCase();
  const transcriptMatch = VM_PHRASES.some(phrase => lower.includes(phrase));

  return {
    detected: toolTriggered || transcriptMatch,
    toolTriggered,
    transcriptMatch,
  };
}
