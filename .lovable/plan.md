

# Add Church Transportation Logo

## Summary
Download the Church Transportation logo from their website and set it as the client's logo in the database.

## Logo Found
- **Source**: `https://www.churchtransportation.net/wp-content/uploads/2020/02/Church-Transportation-Logo-white2.png`
- This is the official Church Transportation & Logistics, Inc. logo from their WordPress media library
- It's a white-on-transparent version — works well on the app's card backgrounds and dark mode

## Steps

1. **Download the logo** from the Church Transportation website to a temp location
2. **Upload to Supabase Storage** in the `organization-logos` bucket under an appropriate path
3. **Update the client record** (`53d7dd20-d743-4d34-93e9-eb7175c39da1`) in the `clients` table, setting `logo_url` to the new public URL
4. **Verify** the logo appears correctly in the admin client detail view

## Technical Details
- Use `curl` to download the PNG, then upload via the Supabase Storage API or a quick script using the Supabase JS client
- The `organization-logos` bucket is already configured as public per project conventions
- Update uses a simple SQL `UPDATE clients SET logo_url = '...' WHERE id = '...'`

