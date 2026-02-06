

# Update Tenstreet Blog Post: Data Delivery Focus

## Objective

Revise the Tenstreet integration blog post to exclusively highlight ATS.me's ability to **enhance and deliver data to Tenstreet**, removing all references to pulling information back from the Tenstreet platform.

---

## What Changes

### Sections to Remove
- **Step 3: "Bi-Directional Status Updates"** -- describes status updates flowing back from Tenstreet to ATS.me
- **Step 4: "Compliance-Ready Hire"** -- describes ATS.me automatically receiving compliance-verified status from Tenstreet

### Sections to Replace With
- **Step 3: "Enhanced Data Enrichment"** -- focuses on how ATS.me enriches and validates candidate data before delivery, ensuring Tenstreet receives the most complete and accurate information possible
- **Step 4: "Voice Apply Transcript Delivery"** -- highlights the unique value of delivering full Voice Apply conversation transcripts to Tenstreet, giving compliance teams deeper candidate context than any traditional application form

### Section to Reframe
- **Main H2 heading** changes from "How ATS.me + Tenstreet Integration Works" to "How ATS.me Enhances Data Delivery to Tenstreet" -- reframes the narrative around outbound data quality
- **Introductory paragraph under the H2** reworded to describe a one-way pipeline focused on enriching what gets delivered to Tenstreet

### No Changes Needed (Already Delivery-Focused)
- Step 1 (Candidate Applies via ATS.me) -- about capturing data
- Step 2 (Automatic Tenstreet Sync) -- about pushing data to Tenstreet
- Key Benefits section -- mostly about data delivery, minor wording tweak to benefit #2
- Configuration and Setup section -- unchanged
- Who Is This For section -- unchanged
- FAQ section -- already describes one-way delivery; minor update to the retry queue answer to remove any implication of receiving data back

---

## Technical Implementation

A single SQL migration will `UPDATE` the `content` column of the `blog_posts` row where `slug = 'tenstreet-integration-driver-recruitment'`. The full updated HTML content will be provided in the migration, preserving all internal links, formatting, and SEO structure.

### Migration File
- `supabase/migrations/[timestamp]_update_tenstreet_blog_delivery_focus.sql`
- Single `UPDATE` statement targeting the existing row by slug
- Updates `content` and `updated_at` fields only
- No schema changes required

### Content Diff Summary

| Original | Updated |
|----------|---------|
| "seamless pipeline from candidate discovery to compliance-ready hire" | "a powerful data enrichment pipeline that delivers superior candidate information to Tenstreet" |
| Step 3: Bi-Directional Status Updates | Step 3: AI-Powered Data Enrichment |
| Step 4: Compliance-Ready Hire (status flows back) | Step 4: Voice Apply Transcript Delivery |
| Benefit #2: mentions compliance workflows updating ATS.me | Benefit #2: focuses on accelerating Tenstreet's processing with pre-validated data |

### Files Modified
1. **New migration SQL** -- updates blog_posts content for tenstreet slug

No frontend code changes are needed since the BlogPostPage renders content dynamically from the database.

