-- Drop unused analytics tables (no integrations exist for these platforms)
DROP TABLE IF EXISTS public.glassdoor_analytics;
DROP TABLE IF EXISTS public.simplyhired_analytics;

-- Drop unused blog tables (no blog feature implemented)
-- Drop junction table first due to foreign key references
DROP TABLE IF EXISTS public.blog_post_categories;
DROP TABLE IF EXISTS public.blog_posts;
DROP TABLE IF EXISTS public.blog_categories;