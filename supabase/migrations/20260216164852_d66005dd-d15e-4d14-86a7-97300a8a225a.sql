UPDATE public.ats_connections
SET status = 'active',
    is_auto_post_enabled = true,
    updated_at = now()
WHERE id = '6b164de1-15d0-4164-9f3e-f66f56c7cc19';