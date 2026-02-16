
# Fix: Founders Pass Voice Agent Error

## Problem
The Founders Pass "Claim Your Founders Pass" button fails on all devices with a "Voice Agent Error" because the hardcoded agent ID (`agent_2501khhvkybyfasbhrtp61s0xvcp`) does not exist in the `voice_agents` database table. The edge function returns a 404 "Voice agent not found or inactive" error.

## Solution
Switch FoundersPassVoiceCTA to use the **global voice agent** (`GLOBAL_VOICE_AGENT_ID` configured server-side) instead of a hardcoded agent ID. This aligns with the existing global agent architecture already used by the apply pages.

## Changes

### File: `src/features/landing/components/FoundersPassVoiceCTA.tsx`

1. Remove the `FOUNDERS_PASS_AGENT_ID` constant
2. Change `handleStart` to call `connect(null, { useGlobalAgent: true })` instead of `connect(FOUNDERS_PASS_AGENT_ID)`

This is a two-line change that routes the request through the global agent path in the edge function, bypassing the `voice_agents` table lookup entirely.
