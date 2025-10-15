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
│   ├── agentConfig.ts    # Agent configuration helpers
│   └── index.ts          # Barrel export
├── index.ts              # Main barrel export
└── README.md             # This file
```

## 🎯 Key Improvements

### 1. **Centralized Type Safety**
All types are now defined in one place (`types/index.ts`), ensuring consistency across the application.

```typescript
import { VoiceAgent, JobContext, LLMModel } from '@/features/elevenlabs';
```

### 2. **Reusable Connection Hook**
The `useVoiceAgentConnection` hook handles all connection lifecycle logic:

```typescript
const { isConnected, isConnecting, isSpeaking, connect, disconnect } = 
  useVoiceAgentConnection({
    onConnect: () => console.log('Connected!'),
    onDisconnect: () => console.log('Disconnected!'),
    onError: (error) => console.error(error)
  });
```

### 3. **Improved Error Handling**
Error parsing and user-friendly messaging are centralized:

```typescript
import { parseVoiceAgentError, getErrorTitle } from '@/features/elevenlabs';

try {
  await connect(agentId);
} catch (error) {
  const parsedError = parseVoiceAgentError(error);
  console.log(getErrorTitle(parsedError)); // "Microphone Access Required"
}
```

### 4. **Reusable UI Components**

#### VoiceConnectionStatus
```typescript
<VoiceConnectionStatus 
  isConnected={isConnected} 
  isSpeaking={isSpeaking}
/>
```

#### LLMModelSelect
```typescript
<LLMModelSelect
  value={selectedModel}
  onValueChange={setSelectedModel}
  label="AI Model"
  description="Choose the model for your agent"
/>
```

### 5. **Agent Configuration Utilities**
Helper functions for creating agent configurations:

```typescript
import { createAgentOverrides, createJobContextPrompt } from '@/features/elevenlabs';

const overrides = createAgentOverrides(jobContext);
const prompt = createJobContextPrompt(jobContext);
```

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

### Voice Agent with Job Context

```typescript
import { useVoiceAgentConnection, createAgentOverrides, JobContext } from '@/features/elevenlabs';

function JobApplicationVoice() {
  const [job, setJob] = useState<JobContext | null>(null);
  
  const overrides = useMemo(() => 
    job ? createAgentOverrides(job) : undefined,
    [job]
  );

  const { connect } = useVoiceAgentConnection({
    agentOverrides: overrides
  });

  const startApplication = async (jobData: JobContext) => {
    setJob(jobData);
    await connect('agent_id', { jobContext: jobData });
  };

  return <Button onClick={() => startApplication(jobData)}>Apply</Button>;
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
- `VoiceAgent`
- `CreateVoiceAgentData`
- `UpdateVoiceAgentData`
- `Conversation`
- `Transcript`
- `Audio`
- `JobContext`
- `LLMModel`
- `LLM_MODEL_OPTIONS`
- `VoiceAgentError`

### Hooks
- `useVoiceAgentConnection`

### Components
- `VoiceConnectionStatus`
- `LLMModelSelect`

### Utils
- `parseVoiceAgentError`
- `getUserFriendlyErrorMessage`
- `getErrorTitle`
- `createJobContextPrompt`
- `createFirstMessage`
- `createAgentOverrides`
- `validateAgentId`

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

### Configuration Pattern
```typescript
const agentConfig = useMemo(() => {
  if (!context) return undefined;
  return createAgentOverrides(context);
}, [context]);
```

## 🚀 Migration Guide

### Before (Old Pattern)
```typescript
// Scattered types
interface VoiceAgent { ... }

// Inline error handling
catch (error) {
  if (error.includes('microphone')) {
    toast({ title: "Microphone error" });
  }
}

// Duplicate UI code
<div className={isConnected ? 'bg-green' : 'bg-gray'}/>
```

### After (New Pattern)
```typescript
// Centralized types
import { VoiceAgent } from '@/features/elevenlabs';

// Unified error handling
const parsedError = parseVoiceAgentError(error);
toast({ title: getErrorTitle(parsedError) });

// Reusable components
<VoiceConnectionStatus isConnected={isConnected} />
```

## 🧪 Testing

The refactored code is more testable due to:
1. Separated concerns (hooks, components, utils)
2. Pure utility functions
3. Consistent error types
4. Mockable dependencies

## 📚 Future Enhancements

- [ ] Add conversation history management
- [ ] Implement real-time transcript display
- [ ] Add voice agent analytics
- [ ] Create agent performance metrics
- [ ] Add multi-language support utilities

## 🤝 Contributing

When adding new ElevenLabs functionality:

1. **Add types** to `types/index.ts`
2. **Create utilities** in `utils/` for shared logic
3. **Build hooks** in `hooks/` for state management
4. **Make components** in `components/` for UI
5. **Export** through barrel files
6. **Document** in this README

## ⚠️ Breaking Changes

This refactor maintains **100% backward compatibility** with existing code. All existing components will continue to work while gradually adopting the new patterns.

## 📞 Support

For issues or questions about the ElevenLabs feature module, please check:
- The existing implementations in `/components/voice/`
- The edge function at `/supabase/functions/elevenlabs-agent/`
- The database schema for `voice_agents` table
