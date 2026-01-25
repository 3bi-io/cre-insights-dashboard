
# Fix AI Tools Page Issues

## Problems

1. **ElevenLabs shows "Disconnected"**: The connection manager uses a hardcoded agent ID (`agent_3901k7s5pyt9fsfb17w72f8hf59z`) that doesn't exist in the database
2. **"No AI Features Available" message**: The check excludes ElevenLabs and Voice Agent features, even though they're valid AI capabilities

## Solution

### Part 1: Fix ElevenLabs Connection Test

Update `aiConnectionManager.ts` to use the `useGlobalAgent` flag instead of a hardcoded agent ID.

**File**: `src/services/aiConnectionManager.ts`

Change the ElevenLabs connection check (around line 85-93):

```typescript
case 'elevenlabs':
  // Use global agent flag for reliable connection testing
  response = await supabase.functions.invoke('elevenlabs-agent', {
    body: {
      useGlobalAgent: true
    }
  });
  // ElevenLabs returns { success: true, data: { signedUrl } } on success
  isConnected = !response.error && response.data?.success === true;
  break;
```

### Part 2: Fix AI Features Check

Update `AIToolsOverview.tsx` to include ElevenLabs and Voice Agent in the AI access check.

**File**: `src/features/ai-tools/components/AIToolsOverview.tsx`

```typescript
const { hasAIAccess, hasVoiceAgent, hasElevenLabsAccess, isLoading } = useOrganizationFeatures();

// Include voice/elevenlabs as valid AI features
const hasAnyAIFeature = () => hasAIAccess() || hasVoiceAgent() || hasElevenLabsAccess();

if (isLoading) {
  return <LoadingState />;
}

if (!hasAnyAIFeature()) {
  return <NoFeaturesState />;
}
```

### Part 3: Update useAIFeatures Hook

Update the hook to include ElevenLabs and Voice Agent in the `hasAnyFeatures` check.

**File**: `src/features/ai-tools/hooks/useAIFeatures.tsx`

```typescript
const getFeatureStatus = () => {
  const features = [...];
  
  return {
    features,
    enabledCount,
    totalCount,
    // Include voice features in the "any features" check
    hasAnyFeatures: hasAIAccess() || hasVoiceAgent() || hasElevenLabsAccess(),
    completionPercentage: Math.round((enabledCount / totalCount) * 100)
  };
};
```

## Files to Modify

| File | Change |
|------|--------|
| `src/services/aiConnectionManager.ts` | Use `useGlobalAgent: true` for ElevenLabs test |
| `src/features/ai-tools/components/AIToolsOverview.tsx` | Expand AI access check to include voice features, add loading state |
| `src/features/ai-tools/hooks/useAIFeatures.tsx` | Include voice features in `hasAnyFeatures` |

## Expected Result

1. ElevenLabs will show as "Connected" (using the global platform agent)
2. AI Tools Overview will display correctly when user has voice/ElevenLabs access
3. Proper loading state while features are fetched
