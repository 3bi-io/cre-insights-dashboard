-- Update platform logos with placeholder images
UPDATE public.platforms 
SET logo_url = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=128&h=128&fit=crop&crop=center'
WHERE name = 'Indeed';

UPDATE public.platforms 
SET logo_url = 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=128&h=128&fit=crop&crop=center'
WHERE name = 'Meta';

UPDATE public.platforms 
SET logo_url = 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=128&h=128&fit=crop&crop=center'
WHERE name = 'X';

UPDATE public.platforms 
SET logo_url = 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=128&h=128&fit=crop&crop=center'
WHERE name = 'ZipRecruiter';