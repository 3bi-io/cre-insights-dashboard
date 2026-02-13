

# ElevenLabs Integration Upgrade -- Best-in-Class Experience

## Overview

The current ElevenLabs integration has strong backend infrastructure but the user-facing views are fragmented across two overlapping admin pages (`/admin/voice-agent` and `/admin/elevenlabs-admin`) with inconsistent UX. Key features like inline audio playback, transcript viewing, and conversation analytics are available but buried. This plan consolidates and upgrades all views for admin, org-admin, and public users.

## Current State Assessment

**What works well:**
- Edge functions for conversations, transcripts, audio, webhook, agent tokens
- Live transcript panel during active voice sessions
- Share conversation system with public links
- Outbound call tracking and analytics
- Voice Library with preview playback
- TTS panel with voice settings
- API usage/subscription analytics

**What needs improvement:**
- Two overlapping admin pages: `/admin/voice-agent` (basic CRUD) and `/admin/elevenlabs-admin` (full-featured) -- should be unified
- ConversationDetailsDialog lacks inline audio player (audio data exists but only shows `<audio>` tag referencing stored URL, which may not work)
- No inline audio playback in conversation list (only "Download Audio" button)
- Conversation table downloads audio as file instead of playing inline
- No waveform visualization for recorded conversations (only live sessions)
- Outbound call history component exists but is not wired into the main admin page
- TTS panel uses `atob()` for audio decoding which can corrupt binary data (per ElevenLabs docs)

## Changes

### Phase 1: Consolidate Admin Pages

**Merge `/admin/voice-agent` into `/admin/elevenlabs-admin`**

The VoiceAgent page (`src/pages/VoiceAgent.tsx`) duplicates the "Agents" tab in `ElevenLabsAdmin.tsx` with less functionality. Remove the standalone page and redirect `/admin/voice-agent` to `/admin/elevenlabs-admin?tab=agents`.

Files to modify:
- `src/components/routing/AppRoutes.tsx` -- redirect `/admin/voice-agent` to `/admin/elevenlabs-admin`
- `src/features/ai-tools/components/AIFeaturesList.tsx` -- update "Setup Voice Agent" link to `/admin/elevenlabs-admin`
- `src/pages/VoiceAgent.tsx` -- convert to redirect component

### Phase 2: Inline Audio Player for Conversations

**Replace download-only audio with inline playback**

Create a new `ConversationAudioPlayer` component that fetches and plays conversation audio inline with a waveform-style progress bar. This replaces the current "Download Audio" button with a "Play/Pause" toggle and progress indicator.

Files to create:
- `src/components/voice/ConversationAudioPlayer.tsx` -- inline audio player with progress bar, play/pause, download, and duration display

Files to modify:
- `src/components/voice/ConversationHistoryTable.tsx` -- replace Download button with expandable audio player row
- `src/components/voice/ConversationDetailsDialog.tsx` -- replace raw `<audio>` tag with `ConversationAudioPlayer`, fetch audio from ElevenLabs API when not in DB

### Phase 3: Enhanced Transcript Viewer

**Upgrade transcript display in ConversationDetailsDialog**

Add synchronized transcript highlighting during audio playback, search within transcripts, and copy-to-clipboard for full transcript text.

Files to modify:
- `src/components/voice/ConversationDetailsDialog.tsx`:
  - Add transcript search/filter input
  - Add "Copy Transcript" button that formats as text
  - Add message count and word count stats
  - Sync transcript scroll position with audio playback time (when timestamps available)
  - Show data collection results (candidate info extracted) if available in metadata

### Phase 4: Add Outbound Calls Tab to ElevenLabs Admin

**Wire outbound call history and analytics into main admin**

The `OutboundCallHistory` and `OutboundCallAnalytics` components exist but are not accessible from the main ElevenLabs admin page.

Files to modify:
- `src/pages/ElevenLabsAdmin.tsx`:
  - Add "Outbound Calls" tab with `OutboundCallHistory` and `OutboundCallAnalytics`
  - Move outbound call management into the unified view

### Phase 5: Fix TTS Audio Handling

**Fix base64 audio decoding to prevent corruption**

The current `TextToSpeechPanel` uses `atob()` which can corrupt audio data. Switch to data URI approach per ElevenLabs best practices.

Files to modify:
- `src/components/voice/TextToSpeechPanel.tsx`:
  - Replace `atob()` + manual byte conversion with data URI (`data:audio/mpeg;base64,...`)
  - Add native `<audio>` element with controls instead of custom play/stop buttons
  - Add waveform visualization using Web Audio API

### Phase 6: Conversation List Enhancements

**Add richer data to conversation table rows**

Files to modify:
- `src/components/voice/ConversationHistoryTable.tsx`:
  - Add expandable row detail with transcript preview (first 2 messages)
  - Add candidate name column (from metadata/data_collection_results when available)
  - Add pagination for large conversation lists
  - Add bulk sync button for selected conversations

## Technical Details

### Edge Function Updates
- `supabase/functions/elevenlabs-conversations/index.ts`: Add `get_audio_stream` action that returns audio as a streaming response with proper content headers for inline playback (instead of download-only). Currently the `get_audio` action returns audio with `Content-Disposition: attachment` header which forces download.

### Component Architecture

```text
ElevenLabsAdmin (unified page)
+-- Summary Stats (agents, conversations, duration)
+-- Tabs
    +-- Conversations (filters, table with inline audio, detail dialog)
    +-- Analytics (charts, completion rate, volume trends)
    +-- Outbound Calls (call history, call analytics)  [NEW TAB]
    +-- Voice Agents (CRUD cards with live connect)
    +-- Voices (voice library with preview)
    +-- TTS (text-to-speech with fixed audio handling)
    +-- API (connection status, usage, subscription)
    +-- Org Assignments (super_admin only)
    +-- Webhooks (super_admin only)
```

### New Components
- `ConversationAudioPlayer` -- Reusable inline audio player with progress bar

### Modified Components (8 files)
- `ConversationHistoryTable` -- expandable rows, inline audio
- `ConversationDetailsDialog` -- transcript search, copy, audio player
- `TextToSpeechPanel` -- fix audio decoding, add native controls
- `ElevenLabsAdmin` -- add Outbound Calls tab
- `AppRoutes` -- redirect voice-agent route
- `AIFeaturesList` -- fix navigation link
- `VoiceAgent.tsx` -- convert to redirect
- `elevenlabs-conversations/index.ts` -- add streaming audio action

### New Edge Function Action
- `get_audio_stream` in `elevenlabs-conversations` -- returns audio with `Content-Type: audio/mpeg` without `Content-Disposition: attachment` so browsers can play inline

## Deployment
- Redeploy `elevenlabs-conversations` edge function after adding streaming action
- No database changes required -- all data tables already exist

