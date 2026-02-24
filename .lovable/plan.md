

## Add Zapier Webhook + Screening Questions for Career Now Brands

### Overview
Configure a Zapier webhook for Career Now Brands organization and add CDL screening questions to their application flow. When applicants apply to Career Now Brands jobs, they'll answer the screening questions (CDL license status, experience level), and those answers will be forwarded to the Zapier webhook along with the standard application data.

### What Gets Built

**1. Database Changes**

- **Insert webhook record** into `client_webhooks` for Career Now Brands:
  - `organization_id`: `650cf2cc-22e7-4a52-8899-b56d315bed2a`
  - `webhook_url`: `https://hooks.zapier.com/hooks/catch/23823129/u28navp/`
  - `user_id`: `313592ee-ac3b-4c7c-b5b4-fe95c46e62d9` (craig@careernowbrands.com)
  - `client_id`: NULL (org-wide, all clients)
  - `enabled`: true

- **Add `screening_questions` JSONB column** to `organizations` table to store per-org screening question configs. Career Now Brands gets the provided CDL + experience questions schema.

**2. Apply Form Enhancement**

- Modify the application form (`ApplicationForm.tsx` and/or the detailed form) to:
  - Fetch the organization's `screening_questions` config when loading the job
  - Render the screening questions as a new step/section (select dropdowns based on the schema)
  - Save answers into the `custom_questions` JSONB column on the `applications` table

**3. Webhook Payload Enhancement**

- Update `client-webhook` edge function to include `custom_questions` (screening answers) in the webhook payload sent to Zapier, so the data flows through as:

```text
{
  "application": {
    ...existing fields...,
    "screening_answers": {
      "valid_cdl": "yes",
      "experience": "12"
    }
  }
}
```

### Implementation Sequence

1. **Migration**: Add `screening_questions` column to `organizations`, insert webhook record, populate Career Now Brands screening config
2. **Apply form**: Add screening questions section that reads from org config and saves to `custom_questions`
3. **Edge function**: Update `client-webhook/index.ts` to include `custom_questions` in payload
4. **Verify**: Test end-to-end with a Career Now Brands job application

### Technical Details

| Item | Detail |
|------|--------|
| Org ID | `650cf2cc-22e7-4a52-8899-b56d315bed2a` |
| Webhook URL | `https://hooks.zapier.com/hooks/catch/23823129/u28navp/` |
| User ID (owner) | `313592ee-ac3b-4c7c-b5b4-fe95c46e62d9` |
| Storage column | `organizations.screening_questions` (JSONB) |
| Answer storage | `applications.custom_questions` (already exists) |

### Files to Modify
| File | Change |
|------|--------|
| `supabase/functions/client-webhook/index.ts` | Add `custom_questions` to webhook payload |
| `src/components/apply/ApplicationForm.tsx` | Add screening questions section |

### Files to Create
- None (all changes are modifications + DB inserts/migrations)

