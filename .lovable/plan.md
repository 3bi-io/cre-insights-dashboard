

## Fix: Pass Logo URL to Thank You Page

### Issue Found

The ThankYou page correctly supports displaying a logo via `logoUrl` in the navigation state. However, neither of the application submission hooks actually passes this value:

| Hook | Current State Passed | Missing |
|------|---------------------|---------|
| `useApplicationForm.ts` | `{ organizationName, hasVoiceAgent }` | `logoUrl` ❌ |
| `useDetailedApplicationForm.ts` | No state passed at all | Everything ❌ |

### Solution

Update both hooks to include `logoUrl` in the navigation state when redirecting to `/thank-you`.

---

### Implementation

#### 1. Update useApplicationForm.ts

**File:** `src/hooks/useApplicationForm.ts` (lines 229-234)

Add `logoUrl` to the navigation state. The hook needs access to the client logo URL from the apply context.

```typescript
// BEFORE
navigate('/thank-you', { 
  state: { 
    organizationName: data.organizationName,
    hasVoiceAgent: data.hasVoiceAgent
  } 
});

// AFTER
navigate('/thank-you', { 
  state: { 
    organizationName: data.organizationName,
    hasVoiceAgent: data.hasVoiceAgent,
    logoUrl: clientLogoUrl  // Pass from context
  } 
});
```

The hook will need to accept `clientLogoUrl` as a parameter or derive it from context.

---

#### 2. Update useDetailedApplicationForm.ts

**File:** `src/hooks/useDetailedApplicationForm.ts` (line 431)

Add full state including logo:

```typescript
// BEFORE
navigate('/thank-you');

// AFTER
navigate('/thank-you', { 
  state: { 
    organizationName: clientName,
    hasVoiceAgent: hasVoiceAgent,
    logoUrl: clientLogoUrl
  } 
});
```

---

#### 3. Verify Context Provides Logo URL

Check that `useApplyContext` exposes `clientLogoUrl` so both hooks can access it.

---

### Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useApplicationForm.ts` | Add `logoUrl` to navigation state |
| `src/hooks/useDetailedApplicationForm.ts` | Add full state with `logoUrl` to navigation |

