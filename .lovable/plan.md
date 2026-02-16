

# Fix: Founders Pass Voice Agent Volume

## Problem

The `useVoiceAgentConnection` hook never explicitly sets the audio output volume after a WebRTC session starts. The ElevenLabs SDK may default to a lower volume level, causing users to not hear the agent.

## Fix

Set the volume to maximum (`1.0`) immediately after the `onConnect` callback fires.

### File: `src/features/elevenlabs/hooks/useVoiceAgentConnection.ts`

In the `onConnect` handler (line 79), add a `setVolume` call right after the connection is established:

```typescript
onConnect: () => {
  logger.info('Voice agent connected via WebRTC', undefined, 'VoiceAgentConnection');

  // Clear connection timeout
  if (connectionTimeoutRef.current) {
    clearTimeout(connectionTimeoutRef.current);
    connectionTimeoutRef.current = null;
  }

  // Set volume to maximum so users can hear the agent
  conversation.setVolume({ volume: 1 });

  setIsConnected(true);
  setIsConnecting(false);
  setConnectionProgress('connected');
  clearTranscripts();
  options.onConnect?.();
},
```

This is a single-line addition. No other files need changes.

