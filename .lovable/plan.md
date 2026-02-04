
# Complete Logo Implementation: Pemberton & Premium Styling

## Overview

This plan addresses two tasks:
1. **Upload Pemberton logo** and update the database
2. **Complete the premium app-icon styling** across remaining components

---

## Current Status

### Already Implemented ✅
The following components already use the premium `LogoAvatar` component with `rounded-2xl` styling:
- `/jobs` page (`PublicJobCard.tsx`)
- `/jobs/:id` page (`JobDetailsPage.tsx`)
- `/apply` pages (`ApplicationHeader.tsx`)
- Admin client logo upload preview
- Organization management table

### Missing: Pemberton Logo ⚠️
The Pemberton client record exists but has no logo uploaded:
- **Client ID**: `67cadf11-8cce-41c6-8e19-7d2bb0be3b03`
- **Current logo_url**: `null`

---

## Part 1: Upload Pemberton Logo

### Option A: Admin UI Upload (Recommended)
1. Navigate to **Admin → Clients → Pemberton Truck Lines Inc**
2. Use the **Client Logo Upload** tool to upload a PNG/WebP version of the logo
3. The system will automatically store it in Supabase and update the database

### Option B: Direct Database Update
If you have the logo already hosted or in Supabase storage:
```sql
UPDATE clients 
SET logo_url = 'https://[your-storage-url]/pemberton-logo.png'
WHERE id = '67cadf11-8cce-41c6-8e19-7d2bb0be3b03';
```

### Image Format Note
The uploaded TIFF file needs conversion to a web-friendly format (PNG, WebP, or JPG) before use. The admin upload tool handles this automatically.

---

## Part 2: Complete Premium Logo Styling

Four additional components need updating to use the `LogoAvatar` component for consistency:

### File 1: `src/pages/public/ClientsPage.tsx`

**Current**: Custom div container with `rounded-lg`  
**Change**: Use `LogoAvatar` component for consistency

The `/companies` page client cards should match the premium styling seen on job cards.

### File 2: `src/features/clients/components/ClientsOverviewDashboard.tsx`

**Current**: `rounded` (4px radius) - inconsistent  
**Change**: Use `LogoAvatar` with `rounded-2xl` (16px radius)

Update the admin clients table to show logos with premium styling.

### File 3: `src/features/candidate/pages/JobDetailPage.tsx`

**Current**: Uses `rounded-lg object-cover` on organization logos  
**Change**: Use `LogoAvatar` with `object-contain` and proper padding

This ensures candidate-facing job details match the public job details styling.

### File 4: `src/pages/public/SharedVoicePage.tsx`

**Current**: Uses `rounded-full` (circular) - old pattern  
**Change**: Use `LogoAvatar` with `rounded-2xl` for organization branding

The shared voice conversation page should display organization logos in the premium square format.

---

## Implementation Details

### ClientsPage.tsx Changes
Replace the logo container div (lines 172-184) with:
```tsx
<LogoAvatar size="lg" className="w-full aspect-square">
  {client.logo_url ? (
    <LogoAvatarImage 
      src={client.logo_url}
      alt={`${client.name} logo`}
      loading="lazy"
      className="group-hover:scale-105 transition-transform duration-200"
    />
  ) : (
    <LogoAvatarFallback iconSize="lg" />
  )}
</LogoAvatar>
```

### ClientsOverviewDashboard.tsx Changes
Replace the table logo cells (lines 236-247) with:
```tsx
<LogoAvatar size="sm" className="w-8 h-8">
  {client.logo_url ? (
    <LogoAvatarImage src={client.logo_url} alt={client.name} />
  ) : (
    <LogoAvatarFallback iconSize="sm" />
  )}
</LogoAvatar>
```

### JobDetailPage.tsx (Candidate) Changes
Replace the organization logo (lines 137-142 and 231-235) with:
```tsx
<LogoAvatar size="lg" className="h-16 w-16">
  {job.organizations?.logo_url ? (
    <LogoAvatarImage src={job.organizations.logo_url} alt={job.organizations.name} />
  ) : (
    <LogoAvatarFallback iconSize="lg" />
  )}
</LogoAvatar>
```

### SharedVoicePage.tsx Changes
Replace the circular logo (lines 189-199) with:
```tsx
<LogoAvatar size="sm" className="h-10 w-10">
  {conversation.organization.logo_url ? (
    <LogoAvatarImage 
      src={conversation.organization.logo_url} 
      alt={conversation.organization.name || 'Organization'} 
    />
  ) : (
    <LogoAvatarFallback>
      <Headphones className="h-5 w-5 text-primary" />
    </LogoAvatarFallback>
  )}
</LogoAvatar>
```

---

## Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/public/ClientsPage.tsx` | MODIFY | Update company cards to use LogoAvatar |
| `src/features/clients/components/ClientsOverviewDashboard.tsx` | MODIFY | Update admin table logos |
| `src/features/candidate/pages/JobDetailPage.tsx` | MODIFY | Update candidate job detail logos |
| `src/pages/public/SharedVoicePage.tsx` | MODIFY | Update shared voice page header |
| **Database** | UPDATE | Add Pemberton logo URL after upload |

---

## Expected Results

### After Implementation:
1. **Pemberton jobs on `/jobs`** will display the company logo in premium square format
2. **Pemberton apply pages** (`/apply?job_id=...`) will show the logo next to the client name
3. **All company/client logos** across the platform will use consistent `rounded-2xl` app-icon styling
4. **User avatars** (with initials) remain circular to distinguish people from brands

### Visual Consistency Across:
- Public job listings (`/jobs`)
- Job details pages (`/jobs/:id`)
- Application forms (`/apply`)
- Companies directory (`/companies`)
- Admin client management
- Candidate job views
- Shared voice conversation pages
