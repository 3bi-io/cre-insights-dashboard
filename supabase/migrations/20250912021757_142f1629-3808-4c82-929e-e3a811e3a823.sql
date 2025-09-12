-- Insert new free job listing platforms
INSERT INTO public.platforms (name, logo_url, api_endpoint, organization_id) VALUES
('Craigslist', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Craigslist.svg/128px-Craigslist.svg.png', 'https://craigslist.org/about/bulk_posting_interface', NULL),
('SimplyHired', 'https://www.simplyhired.com/favicon.ico', 'https://www.simplyhired.com/partners', NULL),
('Glassdoor', 'https://www.glassdoor.com/static/img/api/glassdoor_logo_80.png', 'https://developers.glassdoor.com/api/', NULL),
('AngelList', 'https://angel.co/images/shared/angel_co_fallback.png', 'https://api.angel.co/', NULL),
('Dice', 'https://www.dice.com/favicon.ico', 'https://www.dice.com/common/seeker/xml/', NULL),
('Stack Overflow Jobs', 'https://stackoverflow.com/favicon.ico', 'https://stackoverflow.com/jobs/feed', NULL),
('Jooble', 'https://jooble.org/favicon.ico', 'https://jooble.org/api/about', NULL),
('JobisJob', 'https://www.jobisjob.com/favicon.ico', 'https://www.jobisjob.com/api/', NULL),
('Neuvoo', 'https://neuvoo.com/favicon.ico', 'https://neuvoo.com/api/', NULL),
('FlexJobs', 'https://www.flexjobs.com/favicon.ico', 'https://www.flexjobs.com/api/', NULL),
('USAJobs', 'https://www.usajobs.gov/favicon.ico', 'https://developer.usajobs.gov/', NULL),
('Workable', 'https://workable.com/favicon.ico', 'https://workable.com/api/', NULL)
ON CONFLICT (name, organization_id) DO NOTHING;