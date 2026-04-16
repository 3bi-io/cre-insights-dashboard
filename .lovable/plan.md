

## Plan: Update Trucks For You Inc Logo

### What was found
- **Website**: drivetfy.com has a navy blue/white "TFY - TRUCKS FOR YOU" logo
- **Client**: Trucks For You Inc (ID: `cc4a05e9-2c87-4e71-b7f5-49d8bd709540`) — currently has no logo
- **Logo URL**: Available from Wix static hosting

### Steps

**1. Download the logo and upload to Supabase Storage**

Download the TFY logo image from the Wix CDN, upload it to the `client-logos` storage bucket with the filename `cc4a05e9-2c87-4e71-b7f5-49d8bd709540-logo.jpg`.

**2. Update the client record**

Use the insert tool to set `logo_url` on the `clients` table for Trucks For You Inc to the new Supabase Storage public URL.

### Technical Details
- Storage bucket: `client-logos` (existing)
- Logo source: `https://static.wixstatic.com/media/ec2930_4a3897f848fd4c05a3aefe8fd391a2f6~mv2.jpg/v1/fill/w_297,h_149,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/ec2930_4a3897f848fd4c05a3aefe8fd391a2f6~mv2.jpg`
- No code changes needed — this is a data-only operation

