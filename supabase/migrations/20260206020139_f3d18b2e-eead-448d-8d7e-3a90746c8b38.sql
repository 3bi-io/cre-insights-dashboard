
-- Create blog_posts table for E-E-A-T content infrastructure
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  featured_image TEXT,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_published ON public.blog_posts(published) WHERE published = true;
CREATE INDEX idx_blog_posts_published_at ON public.blog_posts(published_at DESC) WHERE published = true;
CREATE INDEX idx_blog_posts_category ON public.blog_posts(category) WHERE published = true;
CREATE INDEX idx_blog_posts_author ON public.blog_posts(author_id);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Public can read published posts
CREATE POLICY "Published blog posts are viewable by everyone"
ON public.blog_posts
FOR SELECT
USING (published = true);

-- Admins and super admins can view all posts (including drafts)
CREATE POLICY "Admins can view all blog posts"
ON public.blog_posts
FOR SELECT
USING (
  public.is_super_admin(auth.uid()) OR
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- Only admins and super admins can create posts
CREATE POLICY "Admins can create blog posts"
ON public.blog_posts
FOR INSERT
WITH CHECK (
  public.is_super_admin(auth.uid()) OR
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- Only admins and super admins can update posts
CREATE POLICY "Admins can update blog posts"
ON public.blog_posts
FOR UPDATE
USING (
  public.is_super_admin(auth.uid()) OR
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- Only super admins can delete posts
CREATE POLICY "Super admins can delete blog posts"
ON public.blog_posts
FOR DELETE
USING (public.is_super_admin(auth.uid()));

-- Add updated_at trigger
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add author_bio column to profiles for E-E-A-T
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS author_bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS author_title TEXT;
