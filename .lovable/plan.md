

# Re-enable Jimmy Hayes' Profile

## What
Set `enabled = true` for user `f0e9f8ad-ee1f-42d7-a640-7ca5489ebf60` (truckinjimmyhayes@gmail.com) in the `profiles` table.

## How
Use the Supabase insert/update tool to run:
```sql
UPDATE profiles SET enabled = true, updated_at = now() WHERE id = 'f0e9f8ad-ee1f-42d7-a640-7ca5489ebf60';
```

Single data update — no schema changes or code modifications needed.

