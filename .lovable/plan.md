
# Fix Voice Apply Error for /jobs Page

## Problem Summary
The "Apply with Voice" feature is failing with a cascading error loop on the /jobs page. The root causes are:

1. **Invalid Agent ID in Secret**: The `GLOBAL_VOICE_AGENT_ID` environment variable contains an incorrect agent ID (`agent_30...`) instead of the correct one (`agent_9201kegcfrw8fctvawnqa8v80wx0`)
2. **Poor Error Serialization in Edge Function**: Errors from ElevenLabs API are logged as `[object Object]`, making debugging difficult
3. **Exception Loop in Frontend**: Failed voice connections trigger a cascade of unhandled exceptions that flood the console

## Technical Details

### Issue 1: Wrong Agent ID Secret
The edge function logs show:
```
"Using global voice agent", { agentId: "agent_30..." }
"ElevenLabs API error", { error: { message: "[object Object]" } }
```

The secret `GLOBAL_VOICE_AGENT_ID` needs to be updated to the correct value.

### Issue 2: Edge Function Error Handling
In `supabase/functions/elevenlabs-agent/index.ts`, the outer catch block (line 188-198) passes the raw error object to the logger incorrectly:

```typescript
catch (error) {
  logger.error('Error in elevenlabs-agent function', error, { durationMs: duration });
```

The logger's `error` method signature expects: `error(message: string, error?: unknown, context?: LogContext)` - the arguments are correct, but the ElevenLabs API response error object isn't being properly extracted. When the API returns a non-200 response, the error text is already logged at line 144, so this is a secondary issue.

### Issue 3: Frontend Error Loop Prevention
The hook `useVoiceAgentConnection.ts` correctly handles errors but the toast notifications and Sentry integration may be causing infinite re-renders when errors occur rapidly.

## Implementation Plan

### Step 1: Update GLOBAL_VOICE_AGENT_ID Secret
**Action Required (User)**: Update the secret value to `agent_9201kegcfrw8fctvawnqa8v80wx0` in Supabase Dashboard.

### Step 2: Improve Edge Function Error Handling
**File**: `supabase/functions/elevenlabs-agent/index.ts`

Changes:
- Improve error response from ElevenLabs API to include proper JSON parsing
- Add explicit error message extraction in the outer catch block
- Return more descriptive error messages to the frontend

```typescript
// Line 142-150: Improve error response handling
if (!response.ok) {
  let errorMessage = `ElevenLabs API error (${response.status})`;
  try {
    const errorJson = await response.json();
    errorMessage = errorJson.detail?.message || errorJson.message || errorJson.error || errorMessage;
  } catch {
    const errorText = await response.text();
    errorMessage = errorText || errorMessage;
  }
  logger.error('ElevenLabs API error', { status: response.status, error: errorMessage });
  return errorResponse(errorMessage, response.status, undefined, origin ?? undefined);
}

// Line 188-197: Improve outer catch error handling
catch (error) {
  const duration = Date.now() - startTime;
  const errorMessage = error instanceof Error ? error.message : String(error);
  logger.error('Error in elevenlabs-agent function', { durationMs: duration, error: errorMessage });
  
  return errorResponse(
    errorMessage || 'Internal server error',
    500,
    undefined,
    origin ?? undefined
  );
}
```

### Step 3: Add Error Loop Prevention in Frontend
**File**: `src/features/elevenlabs/hooks/useVoiceAgentConnection.ts`

Changes:
- Add a connection attempt tracking ref to prevent multiple simultaneous connection attempts
- Add debouncing to error handling to prevent rapid error cascades
- Make 404/403 errors non-retryable (permanent configuration errors)

```typescript
// Update isRetryableError function (lines 27-38)
function isRetryableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  
  // Never retry on permanent configuration errors
  if (message.includes('404') || 
      message.includes('403') || 
      message.includes('not found') ||
      message.includes('not configured') ||
      message.includes('Access denied')) {
    return false;
  }
  
  // Retry on network errors, timeouts, and temporary server errors
  return (
    message.includes('timeout') ||
    message.includes('network') ||
    message.includes('502') ||
    message.includes('503') ||
    message.includes('504') ||
    message.includes('fetch')
  );
}

// Add connection attempt guard ref after line 52
const isAttemptingConnectionRef = useRef(false);

// Add guard at start of connect function (after line 231)
if (isAttemptingConnectionRef.current) {
  logger.warn('Connection already in progress, ignoring duplicate request', undefined, 'VoiceAgentConnection');
  return;
}
isAttemptingConnectionRef.current = true;

// Reset guard when connection completes or fails (add before line 302 return and in catch block)
isAttemptingConnectionRef.current = false;
```

### Step 4: Add Better Error Parsing for ElevenLabs Responses
**File**: `src/features/elevenlabs/utils/errorHandling.ts`

Add handling for ElevenLabs-specific error responses:

```typescript
// Add after line 99 (Agent ID errors section)
// ElevenLabs API specific errors
if (errorString.includes('ElevenLabs API error') || 
    errorString.includes('404') ||
    errorString.includes('agent not found')) {
  return {
    code: 'INVALID_AGENT_ID',
    message: 'Voice agent is temporarily unavailable. Please use the application form.',
    originalError: error,
    recoverySteps: [
      'Use the "Apply Now" button to submit your application',
      'Voice features will be restored soon'
    ]
  };
}
```

## Sequence of Changes

1. **First**: User updates the `GLOBAL_VOICE_AGENT_ID` secret in Supabase Dashboard
2. **Second**: Update edge function error handling for better debugging
3. **Third**: Update frontend hook with connection guard and improved retry logic
4. **Fourth**: Update error handling utility for ElevenLabs-specific errors

## Testing After Fix

1. Navigate to /jobs page
2. Click "Apply with Voice" on any job
3. Verify edge function logs show correct agent ID (`agent_9201...`)
4. Verify connection succeeds or shows user-friendly error message
5. Confirm no exception cascade in console
