# Security Decisions Documentation

This document explains intentional security design decisions, particularly around Row Level Security (RLS) policies that use permissive conditions.

## Intentional Permissive RLS Policies

The following tables use `USING(true)` or `WITH CHECK(true)` RLS policies **by design** for public access:

### Public Read Access (Intentional)

| Table | Policy | Reason |
|-------|--------|--------|
| `job_listings` | SELECT with `true` | Public job board - visitors must browse jobs without authentication |
| `blog_posts` | SELECT with `true` | Public blog content for SEO and visitor engagement |
| `blog_categories` | SELECT with `true` | Required for blog navigation and filtering |
| `organizations` | SELECT with `true` (limited fields via view) | Company profiles visible on job listings |
| `ats_systems` | SELECT with `true` | ATS integration options visible during setup |
| `background_check_providers` | SELECT with `true` | Provider options visible during configuration |

### Public Write Access (Intentional)

| Table | Policy | Reason |
|-------|--------|--------|
| `applications` | INSERT with validation | Public job applications - anonymous visitors can apply |
| `visitor_analytics` | INSERT with `true` | Anonymous page view tracking for analytics |
| `page_views` | INSERT with `true` | Anonymous visitor analytics collection |

### Data Protection Measures

Despite permissive read policies on some tables, sensitive data is protected through:

1. **View-based access control**: `public_organization_info` view exposes only safe fields (id, name, slug, logo_url)
2. **Organizations table secured**: Public SELECT policy removed; anonymous users must use the secure view
3. **Security definer functions**: `get_public_organization_info()` and `get_public_organization_by_slug()` provide controlled access
4. **Column-level security**: Sensitive columns (SSN, background check results) have separate access controls
5. **Application-level filtering**: API endpoints filter sensitive data before response
6. **Audit logging**: All data access is logged to `audit_logs` table

## Authentication-Required Tables

All admin/recruiter functionality requires authentication with proper role checks:

- `user_roles` - Role-based access control
- `recruiter_assignments` - Organization membership
- `screening_requests` - Background check data
- `sms_messages` - Communication logs
- `outbound_calls` - Call recordings and transcripts

## Webhook Security

External webhooks are secured via signature verification:

| Integration | Header | Secret Variable |
|-------------|--------|-----------------|
| ElevenLabs | `elevenlabs-signature` | `ELEVENLABS_WEBHOOK_SECRET` |
| Generic webhooks | `x-webhook-signature` | `WEBHOOK_SECRET` |
| Meta/Facebook | `x-hub-signature-256` | `META_APP_SECRET` |
| Tenstreet | API key in URL | `TENSTREET_API_KEY` |

## Recommended Dashboard Actions

The following Supabase Dashboard settings should be configured:

- [ ] Enable "Leaked Password Protection" in Authentication settings
- [ ] Reduce OTP expiry times (Email: 15min, SMS: 5min)
- [ ] Schedule PostgreSQL version upgrade during maintenance window

---

*Last reviewed: 2026-01-09*
*Reviewed by: System audit*
