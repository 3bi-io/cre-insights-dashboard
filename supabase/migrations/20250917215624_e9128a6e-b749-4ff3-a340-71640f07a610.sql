-- Make cody@3bi.io an admin for ACME organization
SELECT public.ensure_admin_for_email('cody@3bi.io', 'acme');