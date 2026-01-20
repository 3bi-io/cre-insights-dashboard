-- Add Mechanics category to job_categories table
INSERT INTO job_categories (name, description)
VALUES ('Mechanics', 'Diesel mechanics, fleet maintenance, and repair technicians')
ON CONFLICT (name) DO NOTHING;