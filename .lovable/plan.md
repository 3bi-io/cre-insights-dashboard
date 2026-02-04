
# Update Client and Organization Logos

## Overview

Add logos for four companies across the entire application:
- **CR England** (Organization) - Uses `organization-logos` storage bucket
- **Day and Ross** (Client) - Uses `client-logos` storage bucket
- **Novco, Inc.** (Client) - Uses `client-logos` storage bucket
- **Danny Herman Trucking** (Client) - Uses `client-logos` storage bucket (DHT logo)

## Database Records

| Entity Type | Name | ID | Storage Bucket |
|-------------|------|-----|----------------|
| Organization | CR England | `682af95c-e95a-4e21-8753-ddef7f8c1749` | organization-logos |
| Client | Day and Ross | `30ab5f68-258c-4e81-8217-1123c4536259` | client-logos |
| Client | Novco, Inc. | `4a9ef1df-dcc9-499c-999a-446bb9a329fc` | client-logos |
| Client | Danny Herman Trucking | `1d54e463-4d7f-4a05-8189-3e33d0586dea` | client-logos |

## Implementation Steps

### Step 1: Copy Logo Files to Project

Copy the uploaded logos to `src/assets/logos/` for organization and bundling:

| Source File | Destination |
|-------------|-------------|
| `user-uploads://cre.jpeg` | `src/assets/logos/cr-england.jpeg` |
| `user-uploads://DayandRoss.jpeg` | `src/assets/logos/day-and-ross.jpeg` |
| `user-uploads://novco.png` | `src/assets/logos/novco.png` |
| `user-uploads://dht.png` | `src/assets/logos/danny-herman.png` |

### Step 2: Upload to Supabase Storage

Upload each logo to the appropriate Supabase storage bucket:

**Organization Logos Bucket (`organization-logos`):**
- CR England logo

**Client Logos Bucket (`client-logos`):**
- Day and Ross logo
- Novco logo
- Danny Herman (DHT) logo

### Step 3: Update Database Records

Update the `logo_url` column for each entity with the public URL from Supabase Storage.

**Organizations table:**
```sql
UPDATE organizations 
SET logo_url = '[public-url-for-cr-england-logo]'
WHERE id = '682af95c-e95a-4e21-8753-ddef7f8c1749';
```

**Clients table:**
```sql
UPDATE clients 
SET logo_url = '[public-url-for-day-and-ross-logo]'
WHERE id = '30ab5f68-258c-4e81-8217-1123c4536259';

UPDATE clients 
SET logo_url = '[public-url-for-novco-logo]'
WHERE id = '4a9ef1df-dcc9-499c-999a-446bb9a329fc';

UPDATE clients 
SET logo_url = '[public-url-for-danny-herman-logo]'
WHERE id = '1d54e463-4d7f-4a05-8189-3e33d0586dea';
```

## Where Logos Will Display

Once updated, the logos will automatically appear across the entire platform using the premium app-icon styling (`LogoAvatar` component with `rounded-2xl`):

### CR England (Organization):
- Admin sidebar header (via `AppSidebar.tsx`)
- Organization settings and branding pages
- Voice agent cards
- Candidate job detail pages (when viewing CR England jobs)

### Client Logos (Day and Ross, Novco, Danny Herman):
- `/jobs` page - Job cards (`PublicJobCard.tsx`)
- `/jobs/:id` - Job details page (`JobDetailsPage.tsx`)
- `/apply` pages - Application header (`ApplicationHeader.tsx`)
- `/companies` page - Company directory (`ClientsPage.tsx`)
- Admin clients dashboard (`ClientsOverviewDashboard.tsx`)
- Candidate application cards and job views

## Visual Result

All logos will display with the premium app-icon styling:

```
╭─────────────────╮
│                 │
│   [LOGO IMG]    │   Company/Client Name
│                 │
╰─────────────────╯

- rounded-2xl (16px radius)
- bg-muted/80 background
- object-contain with p-2 padding
- border border-border/50
```

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/assets/logos/` | CREATE directory |
| `src/assets/logos/cr-england.jpeg` | COPY from user-uploads |
| `src/assets/logos/day-and-ross.jpeg` | COPY from user-uploads |
| `src/assets/logos/novco.png` | COPY from user-uploads |
| `src/assets/logos/danny-herman.png` | COPY from user-uploads |

## Technical Notes

- Logo files are stored in `src/assets` for version control and as backup
- Primary display uses Supabase Storage URLs stored in database `logo_url` columns
- The `LogoAvatar` component with `object-contain` ensures logos of any aspect ratio display correctly without cropping
- All logos will be served from Supabase CDN for optimal performance
