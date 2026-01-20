# Inbound Applications Webhook Integration Guide

## Overview

The inbound applications webhook allows external recruiting platforms, job boards, and third-party systems to send applicant data directly to your ATS system.

**Webhook URL:** `https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/inbound-applications`

**Method:** POST  
**Content-Type:** application/json  
**Authentication:** None required (optional signature verification available)

---

## Quick Start

### Minimal Example

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "phone": "555-123-4567",
  "organization_id": "84214b48-7b51-45bc-ad7f-723bcf50466c"
}
```

### cURL Test

```bash
curl -X POST https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/inbound-applications \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone": "555-123-4567",
    "organization_id": "84214b48-7b51-45bc-ad7f-723bcf50466c"
  }'
```

---

## Field Reference

### Required Fields

| Field | Type | Description | Alternative Names |
|-------|------|-------------|-------------------|
| `email` | string | Applicant email address | `applicant_email`, `emailAddress` |
| `first_name` | string | First name | `firstName`, `fname`, `full_name`, `name` |

**Note:** If `first_name` is not provided, `full_name` can be used instead.

### Contact Information

| Field | Type | Description |
|-------|------|-------------|
| `last_name` | string | Last name |
| `phone` | string | Phone number (automatically normalized to E.164 format) |
| `full_name` | string | Full name (alternative to first/last) |

### Location

| Field | Type | Description |
|-------|------|-------------|
| `city` | string | City |
| `state` | string | State/Province |
| `zip` | string | Postal/ZIP code |
| `address_1` | string | Street address line 1 |
| `address_2` | string | Street address line 2 |
| `country` | string | Country code (default: US) |

### Job Details

| Field | Type | Description |
|-------|------|-------------|
| `job_listing_id` | uuid | Internal job listing ID |
| `job_id` | string | External job reference number |
| `job_title` | string | Position title |

### CDL & Experience

| Field | Type | Description |
|-------|------|-------------|
| `cdl` | string | Has CDL license (Yes/No) |
| `cdl_class` | string | CDL class (A, B, C) |
| `cdl_state` | string | State where CDL was issued |
| `cdl_endorsements` | array | Array of endorsements (e.g., ["Hazmat", "Tanker"]) |
| `exp` | string | Years of experience |

### Demographics

| Field | Type | Description |
|-------|------|-------------|
| `age` | string | Age or age verification |
| `veteran` | string | Veteran status |
| `education_level` | string | Education level |
| `work_authorization` | string | Work authorization status |

### Screening Questions

| Field | Type | Description |
|-------|------|-------------|
| `consent` | string | Consent to contact |
| `drug` | string | Can pass drug test |
| `privacy` | string | Agreed to privacy policy |
| `convicted_felony` | string | Felony conviction status |

### Source Tracking

| Field | Type | Description |
|-------|------|-------------|
| `source` | string | Application source (see Source Values below) |
| `campaign_id` | string | Marketing campaign ID |
| `ad_id` | string | Advertisement ID |
| `adset_id` | string | Ad set ID |

### Source Values

| Source | Use Case | Required Fields |
|--------|----------|-----------------|
| `Direct Application` | **RESERVED** - Only for native /apply form | `cdl`, `drug`, `consent` required |
| `CDL Job Cast` | CDL Job Cast leads | Standard fields only |
| `Indeed` | Indeed applications | Standard fields only |
| `Zapier Integration` | Zapier webhook integration | Standard fields only |
| `Make Integration` | Make/Integromat integration | Standard fields only |
| `External Webhook` | Generic external integration | Standard fields only |
| `Your Company Name` | Custom branded source (recommended) | Standard fields only |

⚠️ **Important:** 
- Using `source: 'Direct Application'` from external integrations requires complete screening data (`cdl`, `drug`, `consent`). 
- Applications without these fields will be **rejected with a 400 error**.
- **Recommended:** Use your company/integration name as the source value for easy tracking.

### Organization Routing

| Field | Type | Description |
|-------|------|-------------|
| `organization_id` | uuid | Target organization UUID (required) |
| `organization_slug` | string | Organization slug (alternative to ID) |

**Organization Required:** Applications require an `organization_id` or `organization_slug` to be specified. There is no default organization.

### Additional Fields

| Field | Type | Description |
|-------|------|-------------|
| `notes` | string | Additional notes or comments |
| `status` | string | Application status (default: "pending") |

---

## Complete Example

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "phone": "555-123-4567",
  
  "city": "Phoenix",
  "state": "AZ",
  "zip": "85001",
  "address_1": "123 Main St",
  "country": "US",
  
  "job_id": "14204J281",
  "job_title": "CDL-A Solo Truck Driver",
  
  "cdl": "Yes",
  "cdl_class": "A",
  "cdl_state": "AZ",
  "cdl_endorsements": ["Hazmat", "Tanker"],
  "exp": "5 years",
  
  "age": "Yes",
  "veteran": "Yes",
  "education_level": "High School",
  "work_authorization": "US Citizen",
  
  "consent": "Yes",
  "drug": "Yes",
  "privacy": "Yes",
  "convicted_felony": "No",
  
  "source": "CDL Job Cast",
  "campaign_id": "campaign_123",
  "ad_id": "ad_456",
  
  "organization_id": "84214b48-7b51-45bc-ad7f-723bcf50466c",
  
  "notes": "Experienced driver looking for long-haul opportunities",
  "status": "pending"
}
```

---

## Response Format

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Application received and processed",
  "application_id": "uuid-of-created-application",
  "organization_id": "84214b48-7b51-45bc-ad7f-723bcf50466c",
  "job_listing_id": "uuid-of-job-listing",
  "timestamp": "2025-10-15T14:30:00.000Z"
}
```

### Error Responses

**400 Bad Request - Validation Failed**
```json
{
  "error": "Validation failed",
  "errors": [
    "Email is required",
    "Invalid email format"
  ],
  "received_data": ["field1", "field2"]
}
```

**401 Unauthorized - Invalid Signature**
```json
{
  "error": "Invalid webhook signature"
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal server error",
  "message": "Error description"
}
```

---

## Security Features

### Optional Webhook Signature Verification

For enhanced security, configure a webhook secret in your environment:

1. Set the `WEBHOOK_SECRET` environment variable
2. Calculate HMAC-SHA256 signature of the raw request body
3. Include signature in `X-Webhook-Signature` header

**Example (Node.js):**
```javascript
const crypto = require('crypto');

const payload = JSON.stringify(applicationData);
const signature = crypto
  .createHmac('sha256', process.env.WEBHOOK_SECRET)
  .update(payload)
  .digest('hex');

fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Signature': signature
  },
  body: payload
});
```

---

## Integration Examples

### CDL Job Cast Integration

Contact CDL Job Cast support with:
- **Webhook URL:** `https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/inbound-applications`
- **Method:** POST
- **Format:** JSON
- **Organization ID:** Your organization UUID

### Zapier Integration

1. Create a new Zap
2. Set trigger (e.g., "New Form Submission")
3. Add "Webhooks by Zapier" action
4. Choose "POST" method
5. URL: `https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/inbound-applications`
6. Data: Map form fields to webhook fields
7. Add `organization_id` in the payload

### Make (Integromat) Integration

1. Create new scenario
2. Add trigger module
3. Add HTTP "Make a Request" module
4. URL: `https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/inbound-applications`
5. Method: POST
6. Body type: JSON
7. Map data fields

---

## Phone Number Normalization

Phone numbers are automatically normalized to E.164 format:

- Input: `555-123-4567` → Output: `+15551234567`
- Input: `(555) 123-4567` → Output: `+15551234567`
- Input: `15551234567` → Output: `+15551234567`

Minimum 10 digits required.

---

## Job Listing Auto-Creation

If a `job_listing_id` is not provided but `job_title` and `job_id` are included, the system will:

1. Search for existing job listing by `job_id`
2. If not found, create a placeholder job listing
3. Associate the application with the new job listing

---

## Testing

### Using the Web Interface

1. Navigate to `/admin/webhook-management`
2. Go to the "Test Webhook" tab
3. Enter custom JSON or use default
4. Click "Send Test Webhook"
5. Verify application in Applications page

### Using Postman

1. Create new POST request
2. URL: `https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/inbound-applications`
3. Headers: `Content-Type: application/json`
4. Body: JSON payload
5. Send request

---

## Rate Limiting

Currently, there are no rate limits on the webhook endpoint. However, best practices recommend:

- Maximum 100 requests per minute per organization
- Implement retry logic with exponential backoff
- Cache successful responses

---

## Support

For integration support or questions:

1. Check the webhook management UI at `/admin/webhook-management`
2. Review the field reference and examples
3. Test with the built-in testing tool
4. Contact system administrator for organization-specific configuration

---

## Changelog

### Version 1.0 (October 2025)
- Initial release
- Support for all standard application fields
- Automatic phone normalization
- Job listing auto-creation
- Organization routing
- Optional signature verification
- Comprehensive field mapping with aliases
