# ElevenLabs Voice Agent Feature

This module provides a complete, type-safe implementation of ElevenLabs voice agent functionality with improved organization, reusability, and error handling.

## 📁 Structure

```
elevenlabs/
├── types/
│   └── index.ts          # Centralized type definitions
├── hooks/
│   ├── useVoiceAgentConnection.ts  # Connection lifecycle management
│   └── index.ts          # Barrel export
├── components/
│   ├── VoiceConnectionStatus.tsx   # Reusable status indicator
│   ├── LLMModelSelect.tsx          # Model selection dropdown
│   └── index.ts          # Barrel export
├── utils/
│   ├── errorHandling.ts  # Error parsing and user-friendly messages
│   ├── agentConfig.ts    # Agent ID validation helpers
│   └── index.ts          # Barrel export
├── index.ts              # Main barrel export
└── README.md             # This file
```

## 🎯 Architecture

### Dashboard-Managed Prompts

Agent prompts, first messages, and voice settings are managed exclusively in the **ElevenLabs dashboard**. The client does **not** send `firstMessage`, `voiceId`, or prompt overrides — this prevents initialization glitches and "double greeting" issues.

### Dynamic Variables

Personalization is achieved via `dynamicVariables` injected at connection time:

```typescript
// Web channel — injected client-side
await conversation.startSession({
  agentId: agent.elevenlabs_agent_id,
  dynamicVariables: {
    candidate_name: 'John',
    job_title: 'CDL Driver',
    company_name: 'Acme Trucking',
  },
});

// Outbound phone channel — injected server-side in edge function
```

### Per-Agent Telephony Tuning

The `first_message_delay_ms` (default 2000ms) is tunable per agent via the `metadata` JSON field in the `voice_agents` table. This stabilizes the audio path during the Twilio-ElevenLabs WebSocket handshake.

## 📝 Usage Examples

### Basic Voice Agent Connection

```typescript
import { useVoiceAgentConnection } from '@/features/elevenlabs';

function MyComponent() {
  const { isConnected, connect, disconnect } = useVoiceAgentConnection({
    onConnect: () => toast({ title: "Connected!" }),
  });

  return (
    <>
      <Button onClick={() => connect('agent_id')}>Connect</Button>
      <Button onClick={disconnect}>Disconnect</Button>
    </>
  );
}
```

### Creating a Voice Agent Form

```typescript
import { LLMModelSelect, CreateVoiceAgentData } from '@/features/elevenlabs';

function VoiceAgentForm() {
  const [formData, setFormData] = useState<CreateVoiceAgentData>({
    organization_id: '',
    agent_name: '',
    elevenlabs_agent_id: '',
    llm_model: 'gpt-4o-mini',
    is_active: true
  });

  return (
    <form>
      <LLMModelSelect
        value={formData.llm_model}
        onValueChange={(model) => setFormData({ ...formData, llm_model: model })}
      />
    </form>
  );
}
```

## 🔧 Available Exports

### Types
- `VoiceAgent`, `CreateVoiceAgentData`, `UpdateVoiceAgentData`
- `Conversation`, `Transcript`, `Audio`
- `JobContext`, `ConnectionProgress`
- `LLMModel`, `LLM_MODEL_OPTIONS`
- `VoiceAgentError`
- `LiveTranscriptMessage`, `StreamingTranscriptState`

### Hooks
- `useVoiceAgentConnection`

### Components
- `VoiceConnectionStatus`
- `LLMModelSelect`

### Utils
- `parseVoiceAgentError`
- `getUserFriendlyErrorMessage`
- `getErrorTitle`
- `validateAgentId`
- `normalizeAgentId`

## 🎨 Design Patterns

### Error Handling Pattern
```typescript
try {
  await connect(agentId);
} catch (error) {
  const parsedError = parseVoiceAgentError(error);
  toast({
    title: getErrorTitle(parsedError),
    description: getUserFriendlyErrorMessage(parsedError),
    variant: 'destructive'
  });
}
```

## 🧪 Testing

The refactored code is more testable due to:
1. Separated concerns (hooks, components, utils)
2. Pure utility functions
3. Consistent error types
4. Mockable dependencies

## 🤝 Contributing

When adding new ElevenLabs functionality:

1. **Add types** to `types/index.ts`
2. **Create utilities** in `utils/` for shared logic
3. **Build hooks** in `hooks/` for state management
4. **Make components** in `components/` for UI
5. **Export** through barrel files
6. **Document** in this README

**Important**: Do NOT add client-side prompt/voice overrides. All agent behavior is managed in the ElevenLabs dashboard. Use `dynamicVariables` for personalization only.
