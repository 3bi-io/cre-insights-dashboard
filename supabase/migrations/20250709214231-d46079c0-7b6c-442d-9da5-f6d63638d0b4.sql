-- Add sample applications data
INSERT INTO applications (job_listing_id, applicant_name, applicant_email, applied_at, status, source, first_name, email)
SELECT 
    id as job_listing_id,
    'John Smith' as applicant_name,
    'john.smith@email.com' as applicant_email,
    NOW() - INTERVAL '1 day' as applied_at,
    'pending' as status,
    'Meta' as source,
    'John' as first_name,
    'john.smith@email.com' as email
FROM job_listings 
WHERE user_id = 'da691401-8d95-48cc-b98f-c1a2d3724eea'
LIMIT 10;

-- Add more applications for variety
INSERT INTO applications (job_listing_id, applicant_name, applicant_email, applied_at, status, source, first_name, email)
SELECT 
    id as job_listing_id,
    'Sarah Johnson' as applicant_name,
    'sarah.j@email.com' as applicant_email,
    NOW() - INTERVAL '2 days' as applied_at,
    'reviewed' as status,
    'Meta' as source,
    'Sarah' as first_name,
    'sarah.j@email.com' as email
FROM job_listings 
WHERE user_id = 'da691401-8d95-48cc-b98f-c1a2d3724eea'
LIMIT 5;

-- Add applications for the other user as well
INSERT INTO applications (job_listing_id, applicant_name, applicant_email, applied_at, status, source, first_name, email)
SELECT 
    id as job_listing_id,
    'Mike Davis' as applicant_name,
    'mike.davis@email.com' as applicant_email,
    NOW() - INTERVAL '3 days' as applied_at,
    'pending' as status,
    'Meta' as source,
    'Mike' as first_name,
    'mike.davis@email.com' as email
FROM job_listings 
WHERE user_id = '86b642cb-af7b-47df-9bd6-179db1ae7c95'
LIMIT 8;