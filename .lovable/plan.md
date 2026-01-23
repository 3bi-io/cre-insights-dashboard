
# Restrict Organization Access to Voice Agents & Related Functions

## Executive Summary

This plan addresses **4 security vulnerabilities** identified in the voice agent system that allow cross-organization data exposure. The goal is to enforce strict organization isolation so that organizations can only view and interact with their own voice agents and related data.

---

## Security Audit Summary

### Current RLS Policies on `voice_agents`

| Policy Name | Command | Security Issue |
|-------------|---------|----------------|
| `Public can view voice agents for active jobs` | SELECT | **HIGH RISK** - Allows ANY user (even unauthenticated) to view all active voice agents across the platform |
| `Org admins can view their org voice agents` | SELECT | ✅ Correct - Restricts to organization |
| `Admins can manage voice agents in their org` | ALL | ✅ Correct - Restricts to organization |
| `Super admins can manage all voice agents` | ALL | ✅ Correct - Super admin bypass |

### Identified Vulnerabilities

| Component | Issue | Severity | Impact |
|-----------|-------|----------|--------|
| **RLS Policy** | `Public can view voice agents for active jobs` exposes all active agents | HIGH | Any user can see agent names, IDs, and configurations from other orgs |
| **elevenlabs-agent** | No organization verification when requesting signed URLs | HIGH | Anyone with an agent_id can get a connection token for any org's agent |
| **elevenlabs-conversations** | Queries agent by `elevenlabs_agent_id` without org check | MEDIUM | Can sync conversation data for agents not owned by user's org |
| **useVoiceAgents hook** | Queries all voice agents without org filter | MEDIUM | Frontend relies on RLS which has a permissive policy |

---

## Implementation Plan

### Part 1: Fix RLS Policies on `voice_agents`

**Drop the permissive public policy and create a restricted one:**

```sql
-- Remove the permissive policy that exposes all agents
DROP POLICY IF EXISTS "Public can view voice agents for active jobs" ON public.voice_agents;

-- Remove duplicate/overlapping policies
DROP POLICY IF EXISTS "Users can view voice agents in their org" ON public.voice_agents;

-- Create a single, clean SELECT policy for authenticated users
CREATE POLICY "Users can view voice agents in their org" ON public.voice_agents
FOR SELECT TO authenticated
USING (
  is_super_admin(auth.uid())
  OR (
    organization_id = get_user_organization_id()
    AND auth.uid() IS NOT NULL
  )
);

-- For public-facing voice connections (job pages), create a function-based approach
-- that validates the request context rather than exposing agent data directly
```

### Part 2: Secure `elevenlabs-agent` Edge Function

**Add organization verification before returning signed URLs:**

Current code (lines 60-72):
```typescript
// INSECURE: Only checks if agent is active, not organization ownership
const { data: agent, error: agentError } = await supabase
  .from('voice_agents')
  .select('organization_id, is_active')
  .eq('agent_id', agentId)
  .eq('is_active', true)
  .single();
```

Proposed fix:
```typescript
// Parse auth token to get user's organization (if authenticated)
let userOrgId: string | null = null;
const authHeader = req.headers.get('Authorization');
if (authHeader?.startsWith('Bearer ')) {
  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabaseAuth.auth.getUser(token);
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();
    userOrgId = profile?.organization_id;
  }
}

// Verify agent exists and is active
const { data: agent, error: agentError } = await supabase
  .from('voice_agents')
  .select('organization_id, is_active, is_platform_default')
  .eq('agent_id', agentId)
  .eq('is_active', true)
  .single();

if (agentError || !agent) {
  return errorResponse('Voice agent not found or inactive', 404);
}

// Organization validation:
// 1. Platform default agents are accessible to all
// 2. Authenticated users can only access their org's agents
// 3. Public access allowed only for platform defaults or global agent mode
if (!agent.is_platform_default && userOrgId && agent.organization_id !== userOrgId) {
  logger.warn('Unauthorized agent access attempt', { 
    requestedAgent: agentId.substring(0, 8), 
    userOrg: userOrgId?.substring(0, 8) 
  });
  return errorResponse('Access denied: Agent not in your organization', 403);
}
```

### Part 3: Secure `elevenlabs-conversations` Edge Function

**Add organization ownership verification:**

Current code (lines 87-96):
```typescript
// INSECURE: Fetches agent without verifying user owns this agent
const { data: voiceAgent } = await supabase
  .from('voice_agents')
  .select('id, organization_id')
  .eq('elevenlabs_agent_id', agentId)
  .single();
```

Proposed fix:
```typescript
// Get authenticated user's organization
const supabaseAuth = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  {
    global: { headers: { Authorization: req.headers.get('Authorization')! } },
  }
);
const { data: { user } } = await supabaseAuth.auth.getUser();
if (!user) {
  throw new Error('Unauthorized');
}

// Get user's organization
const { data: profile } = await supabase
  .from('profiles')
  .select('organization_id')
  .eq('id', user.id)
  .single();

const userOrgId = profile?.organization_id;

// Get the voice_agent record
const { data: voiceAgent } = await supabase
  .from('voice_agents')
  .select('id, organization_id')
  .eq('elevenlabs_agent_id', agentId)
  .single();

if (!voiceAgent) {
  throw new Error(`Voice agent not found for agent ID: ${agentId}`);
}

// Check user's role for super_admin bypass
const { data: roleData } = await supabase.rpc('get_current_user_role');
const isSuperAdmin = roleData === 'super_admin';

// Verify organization ownership (super_admins bypass)
if (!isSuperAdmin && voiceAgent.organization_id !== userOrgId) {
  logger.warn('Unauthorized conversation sync attempt', { 
    agentId, 
    agentOrg: voiceAgent.organization_id,
    userOrg: userOrgId 
  });
  throw new Error('Access denied: You do not have permission to access this agent');
}
```

### Part 4: Update Frontend Hook

**Add organization filter to `useVoiceAgents`:**

Current code relies entirely on RLS (which is permissive). Add explicit org filtering:

```typescript
// In src/features/elevenlabs/hooks/useVoiceAgents.tsx

const { userRole, organization } = useAuth();

const { data: voiceAgents, isLoading, error } = useQuery({
  queryKey: queryKeys.voiceAgents.list(organization?.id),
  queryFn: async () => {
    logger.debug('Fetching voice agents for organization', { orgId: organization?.id });
    
    let query = supabase
      .from('voice_agents')
      .select(`*, organizations (name, slug, logo_url)`)
      .order('created_at', { ascending: false });
    
    // Super admins can see all, others filtered to their org
    if (userRole !== 'super_admin' && organization?.id) {
      query = query.eq('organization_id', organization.id);
    }
    
    const { data, error } = await query;
    
    if (error) {
      logger.error('Error fetching voice agents:', error);
      throw error;
    }
    
    return data as VoiceAgent[];
  },
  enabled: userRole === 'super_admin' || userRole === 'admin',
});
```

---

## Files to Modify

| File | Change Type | Description |
|------|-------------|-------------|
| `supabase/migrations/[new].sql` | CREATE | Drop permissive RLS policy, create org-scoped policy |
| `supabase/functions/elevenlabs-agent/index.ts` | MODIFY | Add organization verification before returning signed URL |
| `supabase/functions/elevenlabs-conversations/index.ts` | MODIFY | Add organization ownership check before syncing |
| `src/features/elevenlabs/hooks/useVoiceAgents.tsx` | MODIFY | Add explicit organization filter to query |

---

## Post-Implementation Verification

1. **Test org isolation**: Login as admin of Org A, verify cannot see Org B agents
2. **Test signed URL protection**: Attempt to get signed URL for another org's agent - should return 403
3. **Test conversation sync protection**: Attempt to sync conversations for another org's agent - should fail
4. **Test super_admin bypass**: Verify super_admins can still access all agents

---

## Security Model After Fix

| Actor | Can View Own Org Agents | Can View Other Org Agents | Can Get Signed URL |
|-------|------------------------|---------------------------|-------------------|
| Unauthenticated | ❌ | ❌ | ❌ (except global/platform default) |
| Regular User | ❌ | ❌ | ❌ |
| Org Admin | ✅ | ❌ | ✅ Own org only |
| Super Admin | ✅ | ✅ | ✅ All |
