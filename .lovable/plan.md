

# Reactivate Danny Herman Tenstreet Delivery

## What This Does

Re-enables the Tenstreet auto-post delivery for Danny Herman Trucking that was previously deactivated.

## Database Change

A single SQL update on the `ats_connections` table for connection ID `6b164de1-15d0-4164-9f3e-f66f56c7cc19`:

- Set `status` back to `active`
- Set `is_auto_post_enabled` back to `true`

This restores the auto-post engine to automatically forward new applications to Tenstreet for Danny Herman Trucking.

## No Code Changes Required

Only a data update is needed.

