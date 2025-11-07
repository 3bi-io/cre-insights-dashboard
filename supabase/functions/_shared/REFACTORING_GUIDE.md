# Edge Functions Refactoring Guide

This guide explains how to refactor existing edge functions to use the new standardized utilities.

## Shared Utilities Overview

### 1. CORS & Response (`cors-config.ts`, `response.ts`)
```typescript
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { successResponse, errorResponse, validationErrorResponse } from '../_shared/response.ts';

// Handle OPTIONS preflight
if (req.method === 'OPTIONS') {
  return new Response(null, { headers: getCorsHeaders(req.headers.get('origin')) });
}

// Return success
return successResponse(data, 'Operation successful', { count: 10 });

// Return error
return errorResponse('Something went wrong', 400);
```

### 2. Authentication (`serverAuth.ts`)
```typescript
import { enforceAuth, AuthContext } from '../_shared/serverAuth.ts';

// Require authentication
const authResult = await enforceAuth(req);
if (authResult instanceof Response) return authResult;
const { userId, userRole, organizationId } = authResult;

// Require specific role
const authResult = await enforceAuth(req, 'admin');
if (authResult instanceof Response) return authResult;
```

### 3. Supabase Client (`supabase-client.ts`)
```typescript
import { getServiceClient, getAuthenticatedClient, verifyUser } from '../_shared/supabase-client.ts';

// Service role client (bypasses RLS)
const supabase = getServiceClient();

// Authenticated client (respects RLS)
const supabase = getAuthenticatedClient(req);

// Just verify user
const { userId, email } = await verifyUser(req);
```

### 4. Error Handling (`error-handler.ts`)
```typescript
import { wrapHandler, ValidationError, logError } from '../_shared/error-handler.ts';

// Wrap entire handler
serve(wrapHandler(async (req: Request) => {
  // Your code here
  throw new ValidationError('Invalid input', [
    { field: 'email', message: 'Invalid email format' }
  ]);
}, { context: 'my-function', logRequests: true }));
```

### 5. HTTP Client (`http-client.ts`)
```typescript
import { createHttpClient, fetchWithRetry } from '../_shared/http-client.ts';

// With retry and timeout
const client = createHttpClient({ timeout: 10000, retries: 3 });
const response = await client.post('https://api.example.com/endpoint', { data: 'value' });

// Quick fetch
const { data } = await fetchWithRetry('https://api.example.com/data', {
  method: 'GET',
  timeout: 5000
});
```

### 6. XML Utilities (`xml-utils.ts`)
```typescript
import { 
  escapeXml, 
  xmlElement, 
  buildJobXmlItem, 
  wrapInRss,
  createXmlResponse 
} from '../_shared/xml-utils.ts';

// Build XML elements
const title = xmlElement('title', jobTitle, true); // with CDATA

// Build job item
const item = buildJobXmlItem({
  title: job.title,
  link: job.url,
  description: job.description,
  pubDate: job.created_at
});

// Return XML response
return createXmlResponse(wrapInRss(channelContent, items));
```

### 7. Logging (`logger.ts`)
```typescript
import { createLogger, measureTime } from '../_shared/logger.ts';

const logger = createLogger('my-function', { organizationId });

logger.info('Processing request', { userId, action: 'sync' });
logger.error('Operation failed', error, { retryCount: 3 });
logger.apiRequest('POST', 'https://api.example.com/endpoint');

// Measure execution time
const result = await measureTime(logger, 'database-query', async () => {
  return await supabase.from('table').select();
});
```

### 8. Validation (`validation-helpers.ts`)
```typescript
import { 
  isValidUuid, 
  isValidEmail, 
  validatePagination,
  sanitizeString,
  validateRequired 
} from '../_shared/validation-helpers.ts';

// Validate fields
if (!isValidUuid(userId)) {
  throw new ValidationError('Invalid user ID');
}

// Pagination
const { page, limit, offset } = validatePagination(
  req.url.searchParams.get('page'),
  req.url.searchParams.get('limit')
);

// Required fields
const { valid, missing } = validateRequired(data, ['email', 'name']);
if (!valid) {
  throw new ValidationError(`Missing fields: ${missing.join(', ')}`);
}
```

## Migration Patterns

### Before: Basic Function
```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data = await req.json();
    // Process data
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
```

### After: Refactored Function
```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import { wrapHandler } from '../_shared/error-handler.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('my-function');

serve(wrapHandler(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(origin) });
  }

  const data = await req.json();
  logger.info('Processing request', { dataSize: JSON.stringify(data).length });
  
  // Process data
  
  return successResponse(data, 'Operation successful', {}, origin);
}, { context: 'my-function', logRequests: true }));
```

## Common Refactoring Tasks

### 1. Replace Manual CORS
❌ **Before:**
```typescript
const corsHeaders = { 'Access-Control-Allow-Origin': '*', ... };
```

✅ **After:**
```typescript
import { getCorsHeaders } from '../_shared/cors-config.ts';
const headers = getCorsHeaders(req.headers.get('origin'));
```

### 2. Replace Manual Auth
❌ **Before:**
```typescript
const token = req.headers.get('authorization')?.replace('Bearer ', '');
const { data: { user } } = await supabase.auth.getUser(token);
```

✅ **After:**
```typescript
import { enforceAuth } from '../_shared/serverAuth.ts';
const authResult = await enforceAuth(req);
if (authResult instanceof Response) return authResult;
```

### 3. Replace Manual Supabase Init
❌ **Before:**
```typescript
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);
```

✅ **After:**
```typescript
import { getServiceClient } from '../_shared/supabase-client.ts';
const supabase = getServiceClient();
```

### 4. Replace Manual XML Escaping
❌ **Before:**
```typescript
function escapeXML(str: string) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;')...
}
```

✅ **After:**
```typescript
import { escapeXml, xmlElement } from '../_shared/xml-utils.ts';
const safe = xmlElement('title', jobTitle, true);
```

### 5. Replace Manual Error Handling
❌ **Before:**
```typescript
try {
  // code
} catch (error) {
  return new Response(JSON.stringify({ error: error.message }), {
    status: 500,
    headers: corsHeaders
  });
}
```

✅ **After:**
```typescript
import { wrapHandler } from '../_shared/error-handler.ts';
serve(wrapHandler(async (req) => {
  // code - errors are handled automatically
}, { context: 'function-name' }));
```

## Testing Checklist

After refactoring, verify:
- [ ] OPTIONS preflight requests work
- [ ] Authentication is properly enforced
- [ ] Errors return proper status codes
- [ ] CORS headers include request origin
- [ ] Logs are structured and searchable
- [ ] Response format is consistent
- [ ] External API calls have retry logic
- [ ] Validation errors are clear

## Rollout Strategy

1. **Start with new functions** - Use new patterns from the start
2. **Refactor by category** - XML feeds first, then integrations
3. **Test thoroughly** - Each function should be tested after refactoring
4. **Update one at a time** - Don't refactor multiple functions simultaneously
5. **Monitor logs** - Watch for errors after deployment
