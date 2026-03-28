-- Replace all ATS.me / ats.me references in live database content

-- 1. Blog posts: content, title, description
UPDATE blog_posts
SET content = REPLACE(REPLACE(content, 'ATS.me', 'Apply AI'), 'ats.me', 'applyai.jobs'),
    title = REPLACE(title, 'ATS.me', 'Apply AI'),
    description = REPLACE(description, 'ATS.me', 'Apply AI'),
    updated_at = now();

-- 2. Author profiles
UPDATE profiles
SET author_bio = REPLACE(author_bio, 'ATS.me', 'Apply AI'),
    author_title = REPLACE(author_title, 'ATS.me', 'Apply AI')
WHERE author_bio LIKE '%ATS.me%' OR author_title LIKE '%ATS.me%';

-- 3. Job listing apply URLs
UPDATE job_listings
SET apply_url = REPLACE(apply_url, 'ats.me', 'applyai.jobs')
WHERE apply_url LIKE '%ats.me%';