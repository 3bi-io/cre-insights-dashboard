-- Update client logo URLs from old domain to new domain
UPDATE clients SET logo_url = REPLACE(logo_url, 'https://ats-me.lovable.app', 'https://applyai.jobs') WHERE logo_url LIKE '%ats-me.lovable.app%';

-- Update blog post content: replace brand name and domain references
UPDATE blog_posts 
SET title = REPLACE(title, 'ATS.me', 'Apply AI'),
    description = REPLACE(description, 'ATS.me', 'Apply AI'),
    content = REPLACE(REPLACE(content, 'ATS.me', 'Apply AI'), 'ats.me', 'applyai.jobs')
WHERE slug = 'why-ats-me-will-thrive-2026';