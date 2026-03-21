
-- Split migration: first just add the enum value
-- The helper function and get_current_user_role update will be in a follow-up migration
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client';
