-- Update all job listings to use X platform
UPDATE job_listings 
SET platform_id = '384e675c-2dd2-476c-b0f2-b41d238014bf' -- X platform ID
WHERE platform_id = '62886281-5745-4cc9-9f97-3eded4add741'; -- Meta platform ID