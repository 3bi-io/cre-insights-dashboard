

## Phone Number Format Analysis

**Finding: Not a bug — the system is consistent.**

The `normalizePhoneNumber()` function in this edge function (line 1161) intentionally normalizes to **bare 10 digits** (not E.164). The `+1` prefix is only added at the point of the ElevenLabs API call (line 970: `to_number: \`+1${normalizedPhone}\``).

All outbound call records — both original calls and after-hours callbacks — store bare 10-digit numbers. This is by design in the current architecture.

### Flow for After-Hours Callbacks

1. Callback stored with `phone_number: "8109646088"` (line 1121)
2. Queue processor reads it back (line 663)
3. `normalizePhoneNumber()` confirms it's valid 10 digits (line 733)
4. `+1` prepended at API call time (line 970)
5. ElevenLabs receives `+18109646088` ✓

### Optional Improvement

The edge function's `normalizePhoneNumber()` (lines 1160-1173) differs from the shared `_shared/phone-utils.ts` `normalizePhone()` which returns full E.164 (`+1XXXXXXXXXX`), and the frontend's `src/utils/phoneNormalizer.ts` which also returns E.164. This inconsistency is cosmetic but could be unified:

- **Change**: Update the edge function's `normalizePhoneNumber()` to return E.164 format (`+1XXXXXXXXXX`)
- **Update line 970**: Change `to_number: \`+1${normalizedPhone}\`` to `to_number: normalizedPhone`
- **Benefit**: All phone numbers stored in `outbound_calls` would be E.164, matching the shared utility and frontend conventions

This is a cleanup/consistency improvement, not a functional fix. The calls work correctly as-is.

