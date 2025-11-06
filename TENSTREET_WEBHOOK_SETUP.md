# Tenstreet Webhook Setup Guide

## Overview

The `extractcomplete` webhook is **CRITICAL** for receiving background check and screening results from Tenstreet. Without this webhook properly configured, screening requests will complete on Tenstreet's side, but you will never receive the results.

## Webhook URL

Provide this URL to Tenstreet support to register your webhook endpoint:

```
https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/tenstreet-extractcomplete
```

## Setup Steps

### 1. Contact Tenstreet Support

Email: `api-support@tenstreet.com`

Subject: **Webhook Registration for extractcomplete**

Body:
```
Hello,

We would like to register our SOAP 1.1 endpoint to receive extractcomplete webhook callbacks.

Webhook URL: https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/tenstreet-extractcomplete
Client ID: [Your Tenstreet Client ID]
Organization: [Your Organization Name]

Please configure this endpoint to receive notifications when:
- Background checks complete
- MVR reports are ready
- Drug test results are available
- Employment verifications complete
- Any Xchange service packet completes

Thank you!
```

### 2. Provide IP Allowlisting (if requested)

If Tenstreet requires your server IPs for allowlisting, provide:
- Supabase Edge Functions use dynamic IPs
- Request webhook delivery via HTTPS (port 443)
- Endpoint accepts connections from any IP (will validate ClientId in payload)

### 3. Test Webhook Reception

After registration, Tenstreet support can send a test webhook:

1. Ask them to send a test `extractcomplete` callback
2. Monitor logs: `supabase functions logs tenstreet-extractcomplete`
3. Check `tenstreet_webhook_logs` table for the test delivery
4. Verify `processed = true` in the log entry

## Webhook Payload Format

Tenstreet sends SOAP 1.1 POST requests with this structure:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ExtractComplete>
      <ClientId>YOUR_CLIENT_ID</ClientId>
      <PacketId>PKT-123456</PacketId>
      <DriverId>DRV-789012</DriverId>
      <Status>Complete</Status>
      <ExtractURL>https://secure.tenstreet.com/extract/download/PKT-123456</ExtractURL>
    </ExtractComplete>
  </soap:Body>
</soap:Envelope>
```

### Fields:
- **ClientId**: Your Tenstreet client identifier
- **PacketId**: Unique screening request ID (correlates to `tenstreet_request_id` in DB)
- **DriverId**: Driver/applicant identifier
- **Status**: `Complete` or `Error`
- **ExtractURL**: Download link for the results file (PDF or XML)
- **ErrorMessage**: Present if Status is `Error`

## Security Features

### 1. ClientId Validation
- Webhook validates ClientId against active Tenstreet credentials in database
- Rejects webhooks with invalid or inactive ClientIds

### 2. Idempotency
- Duplicate webhooks (same PacketId) are detected and logged
- Already-processed webhooks return success without re-processing
- Prevents duplicate updates to `tenstreet_xchange_requests`

### 3. HTTPS Enforcement
- Endpoint only accepts HTTPS connections
- SOAP payload must be valid XML

### 4. Audit Logging
- All webhook deliveries logged to `tenstreet_webhook_logs` table
- Includes full SOAP payload for troubleshooting
- Tracks processed/duplicate status

## Monitoring

### Check Webhook Logs

```sql
-- Recent webhook deliveries
SELECT 
  packet_id,
  driver_id,
  received_at,
  processed,
  duplicate,
  error
FROM tenstreet_webhook_logs
ORDER BY received_at DESC
LIMIT 20;
```

### Check Processing Status

```sql
-- Webhook processing success rate
SELECT 
  processed,
  duplicate,
  COUNT(*) as count
FROM tenstreet_webhook_logs
GROUP BY processed, duplicate;
```

### Find Failed Webhooks

```sql
-- Webhooks that failed to process
SELECT 
  packet_id,
  received_at,
  error,
  parsed_data
FROM tenstreet_webhook_logs
WHERE processed = false
AND duplicate = false
ORDER BY received_at DESC;
```

## Troubleshooting

### Webhook Not Received

**Symptoms**: Xchange request status stays "pending" forever

**Solutions**:
1. Verify webhook URL is registered with Tenstreet
2. Check Tenstreet dashboard for webhook configuration
3. Ask Tenstreet support to resend test webhook
4. Enable polling fallback (coming soon)

### Webhook Received But Not Processed

**Symptoms**: Record in `tenstreet_webhook_logs` with `processed = false`

**Solutions**:
1. Check `error` column in webhook log
2. Verify `tenstreet_xchange_requests` table has matching `tenstreet_request_id`
3. Verify ClientId in webhook matches active credentials
4. Check edge function logs for detailed error

### Invalid ClientId Error

**Symptoms**: Webhook rejected with 401 status

**Solutions**:
1. Verify ClientId in `tenstreet_credentials` table matches Tenstreet account
2. Ensure credentials status is "active"
3. Contact Tenstreet support to confirm ClientId

### ExtractURL Download Fails

**Symptoms**: Webhook processed but no results in `response_data`

**Solutions**:
1. Check extract URL validity (may expire after 24 hours)
2. Verify network connectivity to Tenstreet servers
3. Check edge function logs for download errors
4. Extract file will still be available in Tenstreet dashboard

## Response Format

The webhook endpoint returns SOAP acknowledgment:

### Success Response
```xml
<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ExtractCompleteResponse>
      <Acknowledged>true</Acknowledged>
    </ExtractCompleteResponse>
  </soap:Body>
</soap:Envelope>
```

### Error Response (SOAP Fault)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <soap:Fault>
      <faultcode>Client</faultcode>
      <faultstring>Invalid ClientId</faultstring>
    </soap:Fault>
  </soap:Body>
</soap:Envelope>
```

## Testing Locally

You can test the webhook with a sample SOAP payload:

```bash
curl -X POST https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/tenstreet-extractcomplete \
  -H "Content-Type: text/xml" \
  -d '<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ExtractComplete>
      <ClientId>YOUR_CLIENT_ID</ClientId>
      <PacketId>TEST-12345</PacketId>
      <DriverId>TEST-DRIVER</DriverId>
      <Status>Complete</Status>
      <ExtractURL>https://example.com/test-extract.xml</ExtractURL>
    </ExtractComplete>
  </soap:Body>
</soap:Envelope>'
```

## Database Schema

### tenstreet_webhook_logs
```sql
id                UUID PRIMARY KEY
packet_id         TEXT NOT NULL
driver_id         TEXT
soap_payload      TEXT NOT NULL
parsed_data       JSONB
organization_id   UUID REFERENCES organizations
received_at       TIMESTAMPTZ DEFAULT NOW()
processed         BOOLEAN DEFAULT FALSE
duplicate         BOOLEAN DEFAULT FALSE
error             TEXT
created_at        TIMESTAMPTZ DEFAULT NOW()
```

### tenstreet_xchange_requests (updated columns)
```sql
tenstreet_request_id  TEXT (correlates to webhook packet_id)
extract_url           TEXT (download URL from webhook)
response_data         JSONB (parsed extract file contents)
api_type              TEXT DEFAULT 'soap'
```

## Support

For webhook issues:
1. Check edge function logs
2. Check `tenstreet_webhook_logs` table
3. Contact Tenstreet support: `api-support@tenstreet.com`
4. Provide PacketId and timestamp for investigation
