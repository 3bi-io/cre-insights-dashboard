# PII Audit Logging Guide

## Overview

This application implements **comprehensive audit logging** for all access to Personally Identifiable Information (PII) to ensure compliance with:

- **FCRA** (Fair Credit Reporting Act) - Background check data access
- **GDPR** (General Data Protection Regulation) - EU data protection
- **CCPA** (California Consumer Privacy Act) - Consumer data rights

**CRITICAL**: Every access to sensitive PII data is automatically logged with a business justification.

## Sensitive PII Fields

The following fields require audit logging:

- `ssn` - Social Security Number
- `date_of_birth` - Date of Birth
- `government_id` - Government ID Number
- `government_id_type` - ID Type (passport, license, etc.)
- `convicted_felony` - Felony conviction status
- `felony_details` - Criminal history details
- `medical_card_expiration` - Medical certification data
- `employment_history` - Employment background
- `accident_history` - Accident records
- `violation_history` - Traffic violations

## How Audit Logging Works

### 1. Database Level (Automatic)

All PII access goes through PostgreSQL RPC functions that automatically log to the `audit_logs` table:

```sql
-- Every PII access creates an audit log entry
INSERT INTO audit_logs (
  user_id,              -- Who accessed the data
  organization_id,      -- Which organization
  table_name,           -- 'applications'
  record_id,            -- Specific application ID
  action,               -- 'PII_ACCESS: [reason]'
  sensitive_fields,     -- ['ssn', 'date_of_birth', ...]
  created_at            -- Timestamp
);
```

### 2. Application Level (Required)

Frontend code **MUST** use the audited access hooks:

```typescript
import { useAuditedApplicationAccess, AUDIT_REASONS } from '@/hooks/useAuditedApplicationAccess';

// ✅ CORRECT - Audited access
const { getApplication } = useAuditedApplicationAccess();

const app = await getApplication(id, {
  includePII: true,
  accessReason: AUDIT_REASONS.BACKGROUND_CHECK
});

// ❌ WRONG - Direct database access (bypasses audit logging)
const { data } = await supabase.from('applications').select('*').eq('id', id);
```

## Standard Access Reasons

Use predefined access reasons for consistency:

```typescript
import { AUDIT_REASONS } from '@/hooks/useAuditedApplicationAccess';

// Hiring Process
AUDIT_REASONS.BACKGROUND_CHECK       // Background check review
AUDIT_REASONS.REFERENCE_CHECK        // Reference verification
AUDIT_REASONS.ELIGIBILITY_VERIFY     // Eligibility verification
AUDIT_REASONS.OFFER_PREPARATION      // Offer letter preparation

// Compliance
AUDIT_REASONS.COMPLIANCE_REVIEW      // Audit review
AUDIT_REASONS.LEGAL_REQUEST          // Legal department
AUDIT_REASONS.REGULATORY_REPORT      // Regulatory reporting
AUDIT_REASONS.DATA_CORRECTION        // Data correction

// Operations
AUDIT_REASONS.STATUS_UPDATE          // Status update
AUDIT_REASONS.RECRUITER_ASSIGNMENT   // Assignment
AUDIT_REASONS.INTERVIEW_SCHEDULING   // Scheduling
AUDIT_REASONS.APPLICATION_REVIEW     // General review
```

## Usage Examples

### Viewing Application with PII

```typescript
const { getApplication } = useAuditedApplicationAccess();

// View with PII (admins only)
const fullData = await getApplication(applicationId, {
  includePII: true,
  accessReason: 'Background check review for final hiring decision'
});

// View without PII (available to all authorized users)
const basicData = await getApplication(applicationId, {
  includePII: false,
  accessReason: 'Application status check'
});
```

### Updating Application

```typescript
const { updateApplication } = useAuditedApplicationAccess();

// Update basic fields
await updateApplication({
  applicationId: id,
  updates: { status: 'interviewed', notes: 'Passed phone screen' },
  updateReason: 'Status update after interview'
});

// Update PII fields (admins only - automatically logs which fields changed)
await updateApplication({
  applicationId: id,
  updates: { 
    date_of_birth: '1990-01-15',
    government_id: 'CA-DL-123456' 
  },
  updateReason: 'Correcting applicant information per request'
});
```

### Listing Applications

```typescript
const { getApplicationList } = useAuditedApplicationAccess();

const { applications, totalCount } = await getApplicationList({
  jobId: '123',
  status: 'pending',
  page: 1,
  pageSize: 50,
  accessReason: 'Weekly pending applications review'
});
```

## Audit Log Review

### Viewing Audit Logs (Admins Only)

```typescript
// Query recent PII access
const { data: recentAccess } = await supabase
  .from('audit_logs')
  .select('*')
  .eq('table_name', 'applications')
  .ilike('action', '%PII_ACCESS%')
  .order('created_at', { ascending: false })
  .limit(100);

// Query specific user's PII access
const { data: userAccess } = await supabase
  .from('audit_logs')
  .select('*')
  .eq('user_id', userId)
  .ilike('action', '%PII%')
  .gte('created_at', thirtyDaysAgo);

// Query access to specific application
const { data: appAccess } = await supabase
  .from('audit_logs')
  .select('*')
  .eq('record_id', applicationId)
  .order('created_at', { ascending: false });
```

### Audit Log Schema

```typescript
interface AuditLog {
  id: string;
  user_id: string;              // Who accessed
  organization_id: string;      // Which org
  table_name: string;           // 'applications'
  record_id: string;            // Application ID
  action: string;               // 'PII_ACCESS: reason'
  sensitive_fields: string[];   // ['ssn', 'dob', ...]
  ip_address: string;           // Client IP
  user_agent: string;           // Browser info
  created_at: timestamp;        // When
}
```

## Compliance Reports

### Monthly PII Access Report

```sql
-- Count of PII accesses per user (last 30 days)
SELECT 
  p.email,
  COUNT(*) as access_count,
  array_agg(DISTINCT al.action) as reasons
FROM audit_logs al
JOIN profiles p ON al.user_id = p.id
WHERE al.action LIKE '%PII_ACCESS%'
  AND al.created_at > NOW() - INTERVAL '30 days'
GROUP BY p.email
ORDER BY access_count DESC;
```

### Suspicious Activity Detection

```sql
-- Users with >100 PII accesses in a day (potential data scraping)
SELECT 
  p.email,
  DATE(al.created_at) as date,
  COUNT(*) as access_count
FROM audit_logs al
JOIN profiles p ON al.user_id = p.id
WHERE al.action LIKE '%PII_ACCESS%'
  AND al.created_at > NOW() - INTERVAL '7 days'
GROUP BY p.email, DATE(al.created_at)
HAVING COUNT(*) > 100
ORDER BY access_count DESC;
```

### After-Hours Access

```sql
-- PII access outside business hours (9am-5pm EST)
SELECT 
  p.email,
  al.created_at,
  al.action,
  al.record_id
FROM audit_logs al
JOIN profiles p ON al.user_id = p.id
WHERE al.action LIKE '%PII_ACCESS%'
  AND (
    EXTRACT(HOUR FROM al.created_at AT TIME ZONE 'America/New_York') < 9 OR
    EXTRACT(HOUR FROM al.created_at AT TIME ZONE 'America/New_York') > 17
  )
  AND al.created_at > NOW() - INTERVAL '7 days'
ORDER BY al.created_at DESC;
```

## Security Features

### 1. Immutable Audit Logs

Audit logs **CANNOT** be modified or deleted (except by super admins for retention):

```sql
-- Trigger prevents updates/deletes
CREATE TRIGGER prevent_audit_log_changes
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_changes();
```

### 2. Server-Side Enforcement

All RLS policies enforce `SECURITY DEFINER` functions that verify:
- User authentication
- Role-based permissions
- Organization membership
- Audit log creation

### 3. Client-Side Authorization

Frontend checks prevent unauthorized requests:

```typescript
if (userRole !== 'admin' && userRole !== 'super_admin') {
  throw new Error('Only administrators can access PII');
}
```

### 4. Performance Optimized

Indexes ensure fast audit log queries:

```sql
CREATE INDEX idx_audit_logs_record_lookup 
  ON audit_logs(table_name, record_id, created_at DESC);

CREATE INDEX idx_audit_logs_user_activity 
  ON audit_logs(user_id, created_at DESC);

CREATE INDEX idx_audit_logs_sensitive_access 
  ON audit_logs(created_at DESC) 
  WHERE action LIKE '%PII%';
```

## Migration Guide

### Old Code (Direct Access - ❌)

```typescript
// ❌ BAD - Bypasses audit logging
const { data } = await supabase
  .from('applications')
  .select('*')
  .eq('id', id)
  .single();

// ❌ BAD - No access reason
const { data } = await applicationsService.getApplicationById(id);
```

### New Code (Audited Access - ✅)

```typescript
// ✅ GOOD - Audited access
const { getApplication } = useAuditedApplicationAccess();

const application = await getApplication(id, {
  includePII: true,
  accessReason: AUDIT_REASONS.BACKGROUND_CHECK
});
```

## Best Practices

1. **Always use predefined AUDIT_REASONS** for consistent logging
2. **Be specific in custom reasons** - "Background check for John Smith - Driver position" vs "Check"
3. **Request PII only when needed** - Set `includePII: false` when possible
4. **Review audit logs regularly** - Set up monthly compliance reviews
5. **Monitor suspicious patterns** - Bulk access, after-hours, unusual volumes
6. **Document special access** - When deviating from standard reasons, be specific
7. **Train team members** - Ensure everyone understands audit requirements
8. **Export for legal requests** - Keep 90-day audit trails for GDPR/CCPA requests

## Troubleshooting

### Error: "Insufficient privileges to access PII"

**Cause**: User doesn't have admin role
**Solution**: Check `userRole` state or verify user_roles table

### Error: "Access denied: No business justification provided"

**Cause**: Empty or missing `accessReason` parameter
**Solution**: Always provide a descriptive access reason

### Audit logs not appearing

**Cause**: Using direct database queries instead of RPC functions
**Solution**: Use `useAuditedApplicationAccess` hook instead of direct Supabase queries

## Support

For questions about audit logging compliance:
- Security team: security@company.com
- Compliance team: compliance@company.com
- Technical support: support@company.com
