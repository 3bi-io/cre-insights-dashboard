

# Add LinkedIn Job Wrapping XML Feed

## Context
The `universal-xml-feed` edge function already supports 16 platform formats. LinkedIn's Job Wrapping program accepts an XML feed to surface jobs organically on LinkedIn for free. We need to add `linkedin` as a new format.

## LinkedIn Job Wrapping XML Spec
LinkedIn requires a specific XML schema with these key elements per job:
- `<company>` with `<name>` (must match the LinkedIn Company Page name exactly)
- `<job>` containing: `<partnerJobId>`, `<company>`, `<title>`, `<description>`, `<applyUrl>`, `<location>` (with `<city>`, `<state>`, `<country>`), `<industryCode>`, `<jobType>`, `<listedAt>` (epoch ms), `<expiresAt>` (epoch ms)

Root element: `<source>` wrapping `<lastBuildDate>`, `<publisherUrl>`, and multiple `<job>` elements.

## Changes

### 1. `supabase/functions/universal-xml-feed/index.ts`
- Add `'linkedin'` to the `VALID_FORMATS` array (line ~40)
- Add `case 'linkedin':` in the switch block (around line 250) calling a new `generateLinkedInXML()` function
- Add `generateLinkedInXML(jobs, feedSource)` function that produces LinkedIn's required XML structure:
  - Root `<source>` element
  - Each job wrapped in `<job>` with: `<partnerJobId>`, `<company><name>`, `<title>`, `<description>` (CDATA), `<applyUrl>`, `<location>` (city/state/country/postalCode), `<listedAt>` (epoch ms from created_at), `<expiresAt>` (90 days from created_at), `<jobtype>` mapped to LinkedIn values (full-time, part-time, contract, temporary, internship)

### 2. `supabase/config.toml`
No changes needed — `universal-xml-feed` already configured with `verify_jwt = false`.

### Result
Feed URL: `https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/universal-xml-feed?organization_id=<ORG_ID>&format=linkedin`

This URL can be submitted to LinkedIn's Job Wrapping partner program for free organic syndication.

