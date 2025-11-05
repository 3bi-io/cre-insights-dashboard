# Security Quick Start Guide

## For Developers Implementing Phase 1 Security Controls

This guide shows you how to use the new security utilities in your edge functions and frontend code.

---

## 1. Server-Side Authentication (Edge Functions)

### ✅ CORRECT: Server-Side Role Verification

```typescript
// supabase/functions/my-function/index.ts
import { enforceAuth } from '../_shared/serverAuth.ts';

Deno.serve(async (req) => {
  // Verify user is admin or super_admin
  const auth = await enforceAuth(req, ['admin', 'super_admin']);
  
  // If auth failed, return the error response
  if (auth instanceof Response) return auth;
  
  // auth is now verified AuthContext
  const { userId, userRole, organizationId } = auth;
  
  // Proceed with authorized operation
});
```

### ❌ WRONG: Client-Side Role Check

```typescript
// ❌ NEVER DO THIS - easily bypassed
const { userRole } = useAuth(); // Client-side value
if (userRole === 'admin') {
  // Attacker can modify this in browser console
  await dangerousOperation();
}
```

---

## 2. Input Validation

### ✅ CORRECT: Zod Schema Validation

```typescript
import { 
  validateRequest, 
  validationErrorResponse,
  searchApplicationSchema 
} from '../_shared/securitySchemas.ts';

Deno.serve(async (req) => {
  const body = await req.json();
  
  try {
    const validated = validateRequest(searchApplicationSchema, body);
    // validated.email is now sanitized and validated
  } catch (error) {
    return validationErrorResponse(error); // Returns 400
  }
});
```

### ❌ WRONG: No Validation

```typescript
// ❌ NEVER DO THIS - SQL injection risk
const body = await req.json();
const email = body.email; // Unvalidated
await supabase
  .from('applications')
  .select('*')
  .eq('email', email); // Potential injection
```

---

## 3. Accessing Sensitive Data (PII)

### ✅ CORRECT: Use get_application_sensitive_data()

```typescript
// Edge function or frontend
const { data, error } = await supabase.rpc('get_application_sensitive_data', {
  application_id: 'uuid-here',
  access_reason: 'Compliance review for employment verification',
});

// ✅ Automatically logs to audit_logs table
// ✅ Requires admin role (verified server-side)
// ✅ Requires access_reason (minimum 10 characters)
```

### ❌ WRONG: Direct SELECT on applications table

```typescript
// ❌ NEVER DO THIS - bypasses audit logging
const { data } = await supabase
  .from('applications')
  .select('ssn, date_of_birth, government_id') // Direct PII access
  .eq('id', applicationId);

// ❌ No audit trail
// ❌ No access reason recorded
// ❌ Violates GDPR/HIPAA compliance
```

---

## 4. Rate Limiting

### ✅ CORRECT: Check Rate Limit Before Processing

```typescript
const { data: rateLimit } = await supabase.rpc('check_rate_limit', {
  _identifier: userId,
  _endpoint: 'search-applications',
  _max_requests: 100,
  _window_minutes: 60,
});

if (!rateLimit.allowed) {
  return new Response(
    JSON.stringify({ error: 'Rate limit exceeded', retry_after: rateLimit.retry_after }),
    { status: 429 }
  );
}
```

---

## 5. Audit Logging

### ✅ CORRECT: Log Sensitive Operations

```typescript
import { logSecurityEvent, getClientInfo } from '../_shared/serverAuth.ts';

const { ipAddress, userAgent } = getClientInfo(req);

await logSecurityEvent(supabase, auth, 'APPLICATION_UPDATE', {
  table: 'applications',
  recordId: applicationId,
  ipAddress,
  userAgent,
});
```

### Query Audit Logs

```sql
-- Check recent sensitive data access
SELECT 
  user_id,
  action,
  sensitive_fields,
  created_at,
  ip_address
FROM audit_logs
WHERE action LIKE 'SENSITIVE_%'
ORDER BY created_at DESC
LIMIT 100;
```

---

## 6. Frontend: Accessing Sensitive Data

### ✅ CORRECT: Use Hook with Access Reason

```typescript
// src/hooks/useSecureApplicationData.tsx
import { useSensitiveApplicationData } from '@/hooks/useSecureApplicationData';

function ApplicationDetails({ applicationId }) {
  const { 
    accessSensitiveData, 
    isAccessingSensitiveData 
  } = useSensitiveApplicationData(applicationId, 'Background check review');
  
  const handleViewSensitive = async () => {
    try {
      const data = await accessSensitiveData({
        applicationId,
        reason: 'Employment verification for client XYZ',
      });
      // data.ssn, data.date_of_birth, etc.
    } catch (error) {
      console.error('Access denied:', error);
    }
  };
  
  return (
    <Button onClick={handleViewSensitive} disabled={isAccessingSensitiveData}>
      View Sensitive Data
    </Button>
  );
}
```

---

## 7. Creating Custom Validation Schemas

```typescript
// For new features, create custom Zod schemas
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { uuidSchema, emailSchema } from '../_shared/securitySchemas.ts';

const customSchema = z.object({
  user_id: uuidSchema,
  email: emailSchema,
  department: z.enum(['HR', 'IT', 'Sales', 'Operations']),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  salary: z.number().positive().max(1000000),
});

// Use in edge function
const validated = validateRequest(customSchema, body);
```

---

## 8. Testing Security Controls

### Test Authentication

```bash
# Should fail with 401
curl -X POST https://your-project.supabase.co/functions/v1/admin-endpoint \
  -H "Content-Type: application/json"
  
# Should succeed with valid token
curl -X POST https://your-project.supabase.co/functions/v1/admin-endpoint \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Test Input Validation

```bash
# Should fail with 400 - invalid email
curl -X POST https://your-project.supabase.co/functions/v1/search \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"email": "not-an-email"}'
  
# Should succeed
curl -X POST https://your-project.supabase.co/functions/v1/search \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"email": "valid@example.com"}'
```

### Test Rate Limiting

```bash
# Make 101 requests rapidly - 101st should return 429
for i in {1..101}; do
  curl -X POST https://your-project.supabase.co/functions/v1/endpoint \
    -H "Authorization: Bearer YOUR_TOKEN"
done
```

---

## 9. Common Patterns

### Pattern: Protected Admin Endpoint

```typescript
import { enforceAuth } from '../_shared/serverAuth.ts';
import { validateRequest, uuidSchema } from '../_shared/securitySchemas.ts';

Deno.serve(async (req) => {
  // 1. Verify admin role
  const auth = await enforceAuth(req, 'admin');
  if (auth instanceof Response) return auth;
  
  // 2. Validate input
  const body = await req.json();
  const validated = validateRequest(z.object({ id: uuidSchema }), body);
  
  // 3. Rate limit
  const { data: rateLimit } = await supabase.rpc('check_rate_limit', {
    _identifier: auth.userId,
    _endpoint: 'admin-action',
  });
  if (!rateLimit.allowed) return new Response('Rate limited', { status: 429 });
  
  // 4. Perform operation with audit logging
  await logSecurityEvent(supabase, auth, 'ADMIN_ACTION', { recordId: validated.id });
  
  // ... business logic
});
```

### Pattern: Public Endpoint with Rate Limiting

```typescript
Deno.serve(async (req) => {
  // No authentication required, but rate limit by IP
  const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
  
  const { data: rateLimit } = await supabase.rpc('check_rate_limit', {
    _identifier: ipAddress,
    _endpoint: 'public-endpoint',
    _max_requests: 10,
    _window_minutes: 60,
  });
  
  if (!rateLimit.allowed) {
    return new Response('Too many requests', { status: 429 });
  }
  
  // ... public operation
});
```

---

## 10. Migration Checklist for Existing Functions

When updating an existing edge function:

- [ ] Add `import { enforceAuth } from '../_shared/serverAuth.ts'`
- [ ] Replace any client-side role checks with `enforceAuth()`
- [ ] Import validation schemas from `securitySchemas.ts`
- [ ] Wrap `req.json()` with `validateRequest(schema, body)`
- [ ] Add rate limiting with `check_rate_limit()`
- [ ] Replace direct `SELECT` on PII fields with `get_application_sensitive_data()`
- [ ] Add audit logging with `logSecurityEvent()` for sensitive operations
- [ ] Test with invalid inputs, missing auth, rate limit exceeded
- [ ] Update function documentation with security notes

---

## Questions?

**See full documentation**: `SECURITY_PHASE1_COMPLETE.md`

**Example implementation**: `supabase/functions/_examples/secure-endpoint-example.ts`

**Security team**: [contact info]
