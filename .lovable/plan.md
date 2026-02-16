

# Temporarily Deactivate Danny Herman Tenstreet Delivery

## What This Does

Disables the Tenstreet auto-post delivery for Danny Herman Trucking (Client ID: `1d54e463-4d7f-4a05-8189-3e33d0586dea`) under Hayes Recruiting Solutions. Applications will continue to be received and stored, but they will no longer be automatically forwarded to Tenstreet.

## Database Change

A single SQL update on the `ats_connections` table for connection ID `6b164de1-15d0-4164-9f3e-f66f56c7cc19`:

- Set `is_auto_post_enabled` to `false` (stops the auto-post engine from picking up new applications)
- Set `status` to `inactive` (prevents `get_active_ats_connections` from returning this connection)

This is fully reversible -- to reactivate, set both fields back (`status = 'active'`, `is_auto_post_enabled = true`).

## No Code Changes Required

The existing auto-post engine already checks both `status = 'active'` and `is_auto_post_enabled = true` before delivering. Flipping these two flags is all that's needed.

