-- Drop the old 2-parameter version of ensure_admin_for_email to resolve function overloading conflict
DROP FUNCTION IF EXISTS public.ensure_admin_for_email(text, text);