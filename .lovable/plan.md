
# Refactor "Accounts" to "Clients" for CR England Organization

## Overview

This plan consolidates the terminology across the codebase to ensure that all references to CR England's sub-entities (Dollar Tree, Sysco, Kroger, etc.) consistently use "Client" terminology instead of "Account". 

The current system already uses a `clients` table and a Clients management page, but there are several UI locations and code comments where "Account" is used when referring to these entities.

---

## Current State Analysis

**What's Already Correct:**
- Database: The `clients` table properly stores CR England's sub-entities
- Navigation: Uses "Clients" label (`/admin/clients`)
- ClientsPage: All components use "Client" terminology
- Types: Uses `Client` interface with proper naming

**Areas Requiring Refactor:**

| Location | Current Text | Target Text |
|----------|--------------|-------------|
| `MetaPlatformActions.tsx:328` | "CR England Account" | "CR England Client" |
| `MetaPlatformActions.tsx:362` | "Sync CR England Account" | "Sync CR England Client" |
| `MetaPlatformActions.tsx:364` | "Import CR England Meta ad account..." | "Import CR England Meta client data..." |
| `metaAccountAlias.ts` comments | References to "account" | References to "client" |
| `Support.tsx:347` | "client accounts" | "clients" |
| `Support.tsx:351` | "client accounts" | "clients" |

---

## Implementation Plan

### Phase 1: Update UI Text in Meta Platform Actions

**File: `src/components/platforms/MetaPlatformActions.tsx`**

Update UI labels to use "Client" terminology for CR England:

```text
Line 328: "CR England Account" → "CR England Client"
Line 362: "Sync CR England Account" → "Sync CR England Client"
Line 364: "Import CR England Meta ad account and basic information" → "Import CR England Meta client data and basic information"
Line 377: "Sync Account" → "Sync Client"
Line 385: "Sync CR England Campaigns" → (keep as-is, campaigns are separate concept)
```

### Phase 2: Update Support Page Documentation

**File: `src/pages/Support.tsx`**

Simplify "client accounts" to "clients" for consistency:

```text
Line 347: "Manage client accounts and relationships." → "Manage clients and relationships."
Line 351: "Create and manage client accounts with contact information..." → "Create and manage clients with contact information..."
```

### Phase 3: Update Meta Account Alias Utility

**File: `src/utils/metaAccountAlias.ts`**

While the Meta API uses "account_id" (this is their API terminology), update comments and JSDoc to clarify the client context:

```typescript
/**
 * Meta Client Alias System (for CR England)
 * 
 * This system maps Meta ad account IDs to CR England client identifiers
 * for display purposes while using the actual account ID for API calls.
 */
```

### Phase 4: Add Organization-Specific Display Logic

**File: `src/utils/jobDisplayUtils.ts`**

Enhance the display utility to properly show "CR England" branding for all sub-clients:

```typescript
export const getDisplayCompanyName = (job: {
  clients?: { name?: string | null } | null;
  client?: string | null;
  organizations?: { name?: string | null } | null;
}): string => {
  const clientName = job.clients?.name || job.client;
  const orgName = job.organizations?.name;
  
  // If client name is "Unassigned" or empty, use organization name
  if (!clientName || clientName === 'Unassigned') {
    return orgName || 'Company';
  }
  
  // For CR England, show "CR England - ClientName" format
  if (orgName === 'CR England' && clientName !== 'CR England') {
    return `CR England - ${clientName}`;
  }
  
  return clientName;
};
```

---

## Files to Modify

1. **`src/components/platforms/MetaPlatformActions.tsx`** - Update 4-5 UI text strings
2. **`src/pages/Support.tsx`** - Update 2 description strings
3. **`src/utils/metaAccountAlias.ts`** - Update JSDoc comments
4. **`src/utils/jobDisplayUtils.ts`** - Add CR England specific branding logic

---

## Technical Notes

- **Third-party API fields remain unchanged**: Fields like `account_id` for HireRight, Fountain, and Meta APIs are external identifiers and will retain their original naming as these are API-defined fields
- **Personal Account Settings unchanged**: The `AccountSettings` page for candidate profiles is a separate concept (user account) and remains unchanged
- **Tenstreet `account_name` unchanged**: This refers to Tenstreet's system account identifier, not CR England's clients
- **Database schema unchanged**: The `clients` table is already correctly named

---

## Expected Outcome

After implementation:
- All CR England sub-entities (Dollar Tree, Sysco, Kroger, etc.) are consistently referred to as "Clients"
- Job listings display as "CR England - Dollar Tree" instead of just "Dollar Tree"
- Meta integration UI uses "Client" terminology for CR England context
- Support documentation reflects consistent terminology
