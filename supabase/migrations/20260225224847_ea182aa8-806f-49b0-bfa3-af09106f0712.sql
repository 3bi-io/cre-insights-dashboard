
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS faqs jsonb DEFAULT NULL;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS howto_steps jsonb DEFAULT NULL;
