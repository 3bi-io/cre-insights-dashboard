-- Insert new free job listing platforms (without conflict handling since we don't know the constraints)
INSERT INTO public.platforms (name, logo_url, api_endpoint) VALUES
('Craigslist', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Craigslist.svg/128px-Craigslist.svg.png', 'https://craigslist.org/about/bulk_posting_interface'),
('SimplyHired', 'https://www.simplyhired.com/favicon.ico', 'https://www.simplyhired.com/partners'),
('Glassdoor', 'https://www.glassdoor.com/static/img/api/glassdoor_logo_80.png', 'https://developers.glassdoor.com/api/'),
('AngelList', 'https://angel.co/images/shared/angel_co_fallback.png', 'https://api.angel.co/'),
('Dice', 'https://www.dice.com/favicon.ico', 'https://www.dice.com/common/seeker/xml/'),
('Stack Overflow Jobs', 'https://stackoverflow.com/favicon.ico', 'https://stackoverflow.com/jobs/feed'),
('Jooble', 'https://jooble.org/favicon.ico', 'https://jooble.org/api/about'),
('JobisJob', 'https://www.jobisjob.com/favicon.ico', 'https://www.jobisjob.com/api/'),
('Neuvoo', 'https://neuvoo.com/favicon.ico', 'https://neuvoo.com/api/'),
('FlexJobs', 'https://www.flexjobs.com/favicon.ico', 'https://www.flexjobs.com/api/'),
('USAJobs', 'https://www.usajobs.gov/favicon.ico', 'https://developer.usajobs.gov/'),
('Workable', 'https://workable.com/favicon.ico', 'https://workable.com/api/');