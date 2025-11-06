# Tenstreet Integration - API Reference

## Overview

This document provides technical reference for developers working with the Tenstreet integration. It covers edge functions, database schema, React hooks, and component APIs.

---

## Edge Functions

### 1. tenstreet-integration

**Path:** `/supabase/functions/tenstreet-integration/index.ts`

**Purpose:** Main integration endpoint for posting applications and testing connections

**Authentication:** Required (JWT)

**Endpoints:**

#### POST /tenstreet-integration

**Action: Post Application**

```typescript
// Request Body
{
  action: 'postApplication',
  applicationId: string,
  fieldMappings?: Record<string, string>
}

// Response
{
  success: boolean,
  message: string,
  tenstreetId?: string,
  error?: string
}
```

**Action: Test Connection**

```typescript
// Request Body
{
  action: 'testConnection',
  credentials: {
    clientId: string,
    apiKey: string,
    accountCode: string,
    environment: 'production' | 'staging'
  }
}

// Response
{
  success: boolean,
  message: string,
  error?: string
}
```

**Error Codes:**
- `400`: Invalid request parameters
- `401`: Authentication failed
- `403`: Insufficient permissions
- `500`: Server error or Tenstreet API error

---

### 2. tenstreet-explorer

**Path:** `/supabase/functions/tenstreet-explorer/index.ts`

**Purpose:** API discovery and testing tool

**Authentication:** Required (JWT)

**Endpoints:**

#### POST /tenstreet-explorer

**Action: Discover Endpoints**

```typescript
// Request Body
{
  action: 'discover'
}

// Response
{
  endpoints: Array<{
    name: string,
    method: string,
    path: string,
    description: string
  }>
}
```

**Action: Test Endpoint**

```typescript
// Request Body
{
  action: 'testEndpoint',
  endpoint: string,
  method: string,
  params?: Record<string, any>
}

// Response
{
  success: boolean,
  data: any,
  error?: string
}
```

---

### 3. send-screening-request

**Path:** `/supabase/functions/send-screening-request/index.ts`

**Purpose:** Automated screening request processing

**Authentication:** Required (JWT)

**Endpoints:**

#### POST /send-screening-request

```typescript
// Request Body
{
  applicationId: string,
  screeningType: 'background' | 'drug' | 'mvr' | 'employment',
  documents?: string[] // Storage paths
}

// Response
{
  success: boolean,
  requestId: string,
  message: string,
  error?: string
}
```

---

### 4. send-sms

**Path:** `/supabase/functions/send-sms/index.ts`

**Purpose:** SMS communication via Twilio

**Authentication:** Required (JWT)

**Endpoints:**

#### POST /send-sms

```typescript
// Request Body
{
  to: string, // Phone number
  message: string,
  applicationId?: string
}

// Response
{
  success: boolean,
  messageId: string,
  error?: string
}
```

**Requirements:**
- Twilio credentials configured as secrets
- Valid phone number format

---

## Database Schema

### Tables

#### tenstreet_credentials

```sql
CREATE TABLE tenstreet_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  client_id TEXT NOT NULL,
  api_key TEXT NOT NULL,
  account_code TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'production',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Indexes:**
- `idx_tenstreet_credentials_org` on `organization_id`

**RLS Policies:**
- Super admins: Full access
- Org admins: Read/write for their organization
- Job owners: No access

#### tenstreet_field_mappings

```sql
CREATE TABLE tenstreet_field_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  mapping_name TEXT NOT NULL,
  mappings JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**JSONB Structure:**
```json
{
  "firstName": "PersonName/First",
  "lastName": "PersonName/Last",
  "email": "ContactInfo/Email",
  "phone": "ContactInfo/Phone"
}
```

#### tenstreet_xchange_requests

```sql
CREATE TABLE tenstreet_xchange_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  request_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  request_date TIMESTAMPTZ DEFAULT now(),
  completion_date TIMESTAMPTZ,
  result_data JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Status Values:**
- `pending`: Request submitted
- `in_progress`: Processing started
- `completed`: Successfully completed
- `failed`: Error occurred
- `cancelled`: Request cancelled

#### tenstreet_bulk_operations

```sql
CREATE TABLE tenstreet_bulk_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  operation_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total_records INTEGER DEFAULT 0,
  processed_records INTEGER DEFAULT 0,
  successful_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  error_details JSONB,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id)
);
```

**Operation Types:**
- `import`: Import from Tenstreet
- `export`: Export to file
- `sync`: Sync with external source
- `status_update`: Batch status updates

#### application_documents

```sql
CREATE TABLE application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id)
);
```

---

## React Hooks API

### useTenstreetConfiguration

**Purpose:** Manage Tenstreet credentials and field mappings

**Location:** `/src/hooks/useTenstreetConfiguration.tsx`

**Usage:**
```typescript
import { useTenstreetConfiguration } from '@/hooks/useTenstreetConfiguration';

function MyComponent() {
  const {
    credentials,
    fieldMappings,
    isLoadingCredentials,
    isLoadingMappings,
    isSavingCredentials,
    isSavingMappings,
    saveCredentials,
    saveFieldMappings
  } = useTenstreetConfiguration(organizationId);

  // Use the hook...
}
```

**Return Values:**
- `credentials`: Current Tenstreet credentials
- `fieldMappings`: Current field mapping configuration
- `isLoadingCredentials`: Loading state for credentials
- `isLoadingMappings`: Loading state for mappings
- `isSavingCredentials`: Saving state for credentials
- `isSavingMappings`: Saving state for mappings
- `saveCredentials(config)`: Function to save credentials
- `saveFieldMappings(mappings)`: Function to save mappings

---

### useTenstreetNotifications

**Purpose:** Track notification counts for Tenstreet activities

**Location:** `/src/hooks/useTenstreetNotifications.tsx`

**Usage:**
```typescript
import { useTenstreetNotifications } from '@/hooks/useTenstreetNotifications';

function MyComponent() {
  const { counts, isLoading } = useTenstreetNotifications();

  return (
    <Badge>{counts.totalNotifications}</Badge>
  );
}
```

**Return Values:**
```typescript
interface TenstreetNotificationCounts {
  pendingScreenings: number;
  completedScreenings: number;
  failedScreenings: number;
  activeBulkOperations: number;
  totalNotifications: number;
}
```

**Polling Interval:** 30 seconds

---

### useXchangeStatusPolling

**Purpose:** Poll for Xchange request status updates

**Location:** `/src/hooks/useXchangeStatusPolling.tsx`

**Usage:**
```typescript
import { useXchangeStatusPolling } from '@/hooks/useXchangeStatusPolling';

function MyComponent({ applicationId }: { applicationId: string }) {
  const {
    requests,
    isLoading,
    pendingCount,
    completedCount,
    failedCount,
    hasActiveRequests
  } = useXchangeStatusPolling({
    applicationId,
    enabled: true,
    pollingInterval: 30000,
    onStatusChange: (request) => {
      console.log('Status changed:', request);
    }
  });
}
```

**Options:**
```typescript
interface UseXchangeStatusPollingOptions {
  applicationId: string;
  enabled?: boolean;
  pollingInterval?: number; // milliseconds
  onStatusChange?: (request: XchangeRequest) => void;
}
```

**Return Values:**
- `requests`: Array of Xchange requests
- `isLoading`: Loading state
- `error`: Error object if any
- `pendingCount`: Count of pending requests
- `completedCount`: Count of completed requests
- `failedCount`: Count of failed requests
- `hasActiveRequests`: Boolean indicating active requests

---

### useBulkOperations

**Purpose:** Manage bulk operations (import, export, sync)

**Location:** `/src/hooks/useBulkOperations.tsx`

**Usage:**
```typescript
import { useBulkOperations } from '@/hooks/useBulkOperations';

function MyComponent() {
  const {
    operations,
    isLoading,
    importData,
    exportData,
    updateStatus,
    syncData,
    isImporting,
    isExporting,
    isUpdating,
    isSyncing
  } = useBulkOperations(organizationId);

  const handleImport = async () => {
    await importData({
      source: 'tenstreet',
      dateRange: { start: '2025-01-01', end: '2025-01-31' }
    });
  };
}
```

**Functions:**

**importData:**
```typescript
importData(params: {
  source: string;
  dateRange?: { start: string; end: string };
  filters?: Record<string, any>;
}): Promise<void>
```

**exportData:**
```typescript
exportData(params: {
  format: 'csv' | 'excel' | 'pdf';
  fields: string[];
  filters?: Record<string, any>;
}): Promise<void>
```

**updateStatus:**
```typescript
updateStatus(params: {
  applicationIds: string[];
  newStatus: string;
}): Promise<void>
```

**syncData:**
```typescript
syncData(params: {
  source: 'facebook' | 'hubspot';
  syncType: 'full' | 'incremental';
}): Promise<void>
```

---

### useBulkOperationStatus

**Purpose:** Monitor bulk operation status with polling

**Location:** `/src/hooks/useBulkOperationStatus.tsx`

**Usage:**
```typescript
import { useBulkOperationStatus } from '@/hooks/useBulkOperationStatus';

function MyComponent() {
  const {
    operations,
    activeOperations,
    recentOperations,
    isLoading,
    hasActiveOperations
  } = useBulkOperationStatus({
    enabled: true,
    pollingInterval: 10000,
    onOperationComplete: (operation) => {
      console.log('Operation completed:', operation);
    }
  });
}
```

**Options:**
```typescript
interface UseBulkOperationStatusOptions {
  enabled?: boolean;
  pollingInterval?: number; // milliseconds
  onOperationComplete?: (operation: BulkOperation) => void;
}
```

---

## React Components API

### TenstreetCredentialsDialog

**Purpose:** Dialog for managing Tenstreet API credentials

**Location:** `/src/components/applications/TenstreetCredentialsDialog.tsx`

**Usage:**
```typescript
import { TenstreetCredentialsDialog } from '@/components/applications/TenstreetCredentialsDialog';

<TenstreetCredentialsDialog
  open={isOpen}
  onOpenChange={setIsOpen}
/>
```

**Props:**
```typescript
interface TenstreetCredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

---

### XchangeStatusWidget

**Purpose:** Display real-time screening status

**Location:** `/src/components/tenstreet/XchangeStatusWidget.tsx`

**Usage:**
```typescript
import { XchangeStatusWidget } from '@/components/tenstreet/XchangeStatusWidget';

<XchangeStatusWidget
  applicationId={applicationId}
  onViewDetails={() => navigate('/screenings')}
/>
```

**Props:**
```typescript
interface XchangeStatusWidgetProps {
  applicationId: string;
  onViewDetails?: () => void;
}
```

---

### BulkOperationProgress

**Purpose:** Display bulk operation progress

**Location:** `/src/components/tenstreet/BulkOperationProgress.tsx`

**Usage:**
```typescript
import { BulkOperationProgress } from '@/components/tenstreet/BulkOperationProgress';

<BulkOperationProgress />
```

**Props:** None (uses internal hooks)

---

### ExportDataDialog

**Purpose:** Configure and trigger data export

**Location:** `/src/components/tenstreet/ExportDataDialog.tsx`

**Usage:**
```typescript
import { ExportDataDialog } from '@/components/tenstreet/ExportDataDialog';

<ExportDataDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  data={applicationsData}
  defaultFilename="tenstreet_export"
/>
```

**Props:**
```typescript
interface ExportDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any[];
  defaultFilename?: string;
}
```

---

### TenstreetQuickActions

**Purpose:** Quick action buttons for common tasks

**Location:** `/src/components/tenstreet/TenstreetQuickActions.tsx`

**Usage:**
```typescript
import { TenstreetQuickActions } from '@/components/tenstreet/TenstreetQuickActions';

<TenstreetQuickActions />
```

**Props:** None

**Actions Provided:**
- Import Applications
- Export Data
- View Dashboard
- Test Connection

---

### RealTimeStatusMonitor

**Purpose:** Live monitoring of Xchange requests

**Location:** `/src/components/tenstreet/RealTimeStatusMonitor.tsx`

**Usage:**
```typescript
import { RealTimeStatusMonitor } from '@/components/tenstreet/RealTimeStatusMonitor';

<RealTimeStatusMonitor
  applicationId={applicationId}
/>
```

**Props:**
```typescript
interface RealTimeStatusMonitorProps {
  applicationId?: string; // Optional: filter by application
}
```

---

## Utility Functions

### Export Utilities

**Location:** `/src/utils/exportData.ts`

**Functions:**

#### exportToCSV

```typescript
function exportToCSV(
  data: any[],
  filename: string,
  selectedFields?: string[]
): void
```

**Example:**
```typescript
import { exportToCSV } from '@/utils/exportData';

exportToCSV(
  applicationsData,
  'applications_export',
  ['firstName', 'lastName', 'email', 'phone']
);
```

#### exportToPDF

```typescript
function exportToPDF(
  data: any[],
  filename: string,
  selectedFields?: string[]
): void
```

#### exportScreeningReportToPDF

```typescript
function exportScreeningReportToPDF(
  request: XchangeRequest
): void
```

#### flattenForExport

```typescript
function flattenForExport(obj: any, prefix = ''): Record<string, any>
```

---

## Error Handling

### Standard Error Response

```typescript
interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}
```

### Common Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `AUTH_ERROR` | Authentication failed | Verify credentials |
| `PERMISSION_DENIED` | Insufficient permissions | Check user role |
| `INVALID_REQUEST` | Invalid request parameters | Validate input |
| `API_ERROR` | Tenstreet API error | Check API status |
| `TIMEOUT` | Request timeout | Retry operation |
| `NOT_FOUND` | Resource not found | Verify IDs |

---

## Rate Limits

### Edge Functions
- **Rate Limit**: 100 requests per minute per user
- **Burst**: Up to 20 concurrent requests

### Polling Intervals
- **Xchange Status**: 30 seconds (configurable)
- **Bulk Operations**: 10 seconds (configurable)
- **Notifications**: 30 seconds (configurable)

### Best Practices
- Use polling only when necessary
- Stop polling when page is inactive
- Implement exponential backoff for errors
- Batch operations when possible

---

## Security Considerations

### Authentication
- All edge functions require JWT authentication
- Tokens expire after 1 hour
- Refresh tokens handled automatically by Supabase client

### Authorization
- Row Level Security enforced on all tables
- Role-based access control via policies
- Organization isolation guaranteed

### Data Protection
- Credentials encrypted at rest
- API keys never exposed to client
- Secure storage for documents
- HTTPS-only communication

---

## Testing

### Unit Testing Hooks

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useTenstreetNotifications } from '@/hooks/useTenstreetNotifications';

test('fetches notification counts', async () => {
  const { result } = renderHook(() => useTenstreetNotifications());
  
  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });
  
  expect(result.current.counts).toBeDefined();
  expect(result.current.counts.totalNotifications).toBeGreaterThanOrEqual(0);
});
```

### Testing Edge Functions

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);

test('posts application to Tenstreet', async () => {
  const { data, error } = await supabase.functions.invoke(
    'tenstreet-integration',
    {
      body: {
        action: 'postApplication',
        applicationId: 'test-id'
      }
    }
  );
  
  expect(error).toBeNull();
  expect(data.success).toBe(true);
});
```

---

## Changelog

See `CHANGELOG.md` for version history and updates.

---

**Document Version:** 1.0  
**Last Updated:** February 2025  
**API Version:** 1.0
