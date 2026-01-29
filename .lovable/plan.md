

# Public Voice Interaction Share Page

## Overview

Create a shareable public page that displays a single voice conversation, allowing users to listen to the audio recording and read the transcript without requiring authentication. This enables organizations to share voice interactions for training, review, or demonstration purposes.

## Current State Analysis

### Existing Resources
- **Conversation Data**: `elevenlabs_conversations` table stores conversation metadata (agent_id, duration, status, timestamps)
- **Transcripts**: `elevenlabs_transcripts` table stores conversation messages with speaker, message, and timestamps
- **Audio**: `elevenlabs_audio` table stores references to audio files (format: `conversations/{conversation_id}/audio.mp3`)
- **Existing Components**: `AudioPlayer`, `TranscriptDisplay`, and `ConversationDetailsDialog` provide reusable UI elements

### Current Limitations
- All tables have RLS policies requiring authentication (super_admin or org admin roles)
- No public-facing view or edge function to serve conversation data to unauthenticated users
- Audio URLs reference ElevenLabs storage paths, requiring authenticated edge function calls

## Implementation Plan

### 1. Database Schema Changes

**Add a shareable link tracking table:**
```sql
CREATE TABLE shared_voice_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES elevenlabs_conversations(id) ON DELETE CASCADE,
  share_code VARCHAR(12) UNIQUE NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  created_by UUID REFERENCES profiles(id),
  expires_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  hide_caller_info BOOLEAN DEFAULT false,
  custom_title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Create a public view for safe data exposure:**
```sql
CREATE VIEW public_shared_conversation_info AS
SELECT 
  svc.share_code,
  svc.custom_title,
  svc.hide_caller_info,
  svc.expires_at,
  ec.started_at,
  ec.duration_seconds,
  ec.status,
  va.agent_name,
  o.name AS organization_name,
  o.logo_url AS organization_logo
FROM shared_voice_conversations svc
JOIN elevenlabs_conversations ec ON svc.conversation_id = ec.id
LEFT JOIN voice_agents va ON ec.voice_agent_id = va.id
LEFT JOIN organizations o ON ec.organization_id = o.id
WHERE svc.is_active = true
AND (svc.expires_at IS NULL OR svc.expires_at > now());
```

**RLS Policies:**
- Allow authenticated admins to create/manage share links for their organization's conversations
- Allow public read access to the `public_shared_conversation_info` view

### 2. Edge Function: `get-shared-conversation`

Create an edge function that serves conversation data publicly by share code:

**Endpoint**: `GET /functions/v1/get-shared-conversation?code={share_code}`

**Response**:
```json
{
  "success": true,
  "conversation": {
    "title": "CDL Qualification Call",
    "agent_name": "Hiring Assistant",
    "organization": { "name": "Acme Trucking", "logo_url": "..." },
    "started_at": "2025-12-19T10:00:00Z",
    "duration_seconds": 180,
    "transcript": [
      { "speaker": "agent", "message": "Hello...", "timestamp": "...", "sequence_number": 0 }
    ],
    "audio_url": "https://.../signed-audio-url"
  }
}
```

**Features**:
- Validates share code existence and expiration
- Increments view count
- Fetches audio from ElevenLabs API and returns a short-lived signed URL or streams it directly
- Optionally redacts caller info if `hide_caller_info` is true

### 3. Frontend Page: `src/pages/public/SharedVoicePage.tsx`

**Route**: `/voice/:shareCode`

**UI Components**:
- Organization branding (logo, name)
- Conversation metadata (date, duration, agent name)
- Audio player with full playback controls
- Synchronized transcript display (highlights current speaker while audio plays)
- Share/copy link button
- Back to landing page CTA

**Layout**:
```
+--------------------------------------------------+
|  [Logo] Organization Name                        |
+--------------------------------------------------+
|                                                  |
|  Voice Conversation: CDL Qualification Call      |
|  Dec 19, 2025 • 3:00 min • Hiring Assistant      |
|                                                  |
|  +--------------------------------------------+  |
|  |  [▶️ Play]  ▬▬▬▬▬▬▬▬▬▬▬▬  0:45 / 3:00  🔊 |  |
|  +--------------------------------------------+  |
|                                                  |
|  +--------------------------------------------+  |
|  |  TRANSCRIPT                                 |  |
|  |  ----------------------------------------   |  |
|  |  🤖 Agent (0:00)                          |  |
|  |  "Hello, this is a follow-up call..."     |  |
|  |                                           |  |
|  |  👤 Caller (0:12)              |  |
|  |  "Yes, that sounds correct."              |  |
|  +--------------------------------------------+  |
|                                                  |
|  [Copy Link]  [Browse Jobs →]                    |
+--------------------------------------------------+
```

### 4. Admin UI: Create Share Link

Add a "Share" button to `ConversationDetailsDialog.tsx` and `ConversationHistoryTable.tsx`:

**Share Dialog**:
- Toggle: Set expiration (1 day, 7 days, 30 days, never)
- Toggle: Hide caller info
- Text input: Custom title (optional)
- Generate shareable URL: `https://ats.me/voice/abc123xyz`

### 5. Hook: `useSharedConversation`

```typescript
export function useSharedConversation(shareCode: string) {
  return useQuery({
    queryKey: ['shared-conversation', shareCode],
    queryFn: async () => {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/get-shared-conversation?code=${shareCode}`
      );
      if (!response.ok) throw new Error('Conversation not found');
      return response.json();
    },
    enabled: !!shareCode,
  });
}
```

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/xxx.sql` | Create | Add `shared_voice_conversations` table and public view |
| `supabase/functions/get-shared-conversation/index.ts` | Create | Serve conversation data publicly |
| `src/pages/public/SharedVoicePage.tsx` | Create | Public voice interaction display page |
| `src/hooks/useSharedConversation.ts` | Create | Hook to fetch shared conversation data |
| `src/components/voice/ShareConversationDialog.tsx` | Create | Admin dialog to create share links |
| `src/components/voice/ConversationDetailsDialog.tsx` | Modify | Add "Share" button |
| `src/components/voice/ConversationHistoryTable.tsx` | Modify | Add share action to row menu |
| `src/components/routing/AppRoutes.tsx` | Modify | Add `/voice/:shareCode` route |

## Security Considerations

1. **Time-limited access**: Share links can have optional expiration dates
2. **No PII exposure**: `hide_caller_info` option redacts personal information
3. **View tracking**: View counts help organizations monitor link usage
4. **Organization isolation**: Only org admins can create share links for their conversations
5. **Soft-delete support**: `is_active` flag allows disabling links without deleting data

## Audio Handling Strategy

The edge function will fetch audio from ElevenLabs and either:
1. **Stream directly** - Proxy the audio response through the edge function
2. **Return signed URL** - Generate a time-limited signed URL for client-side playback

Option 1 is recommended for simplicity, as it doesn't require additional storage bucket configuration.

