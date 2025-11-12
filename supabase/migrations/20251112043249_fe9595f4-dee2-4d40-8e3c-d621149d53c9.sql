-- Create blog_posts table for SEO content
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id),
  published BOOLEAN NOT NULL DEFAULT false,
  featured_image TEXT,
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT[],
  reading_time INTEGER,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blog_categories table
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blog_post_categories junction table
CREATE TABLE IF NOT EXISTS public.blog_post_categories (
  blog_post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  blog_category_id UUID NOT NULL REFERENCES public.blog_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (blog_post_id, blog_category_id)
);

-- Enable Row Level Security
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog_posts
CREATE POLICY "Published blog posts are viewable by everyone"
ON public.blog_posts
FOR SELECT
USING (published = true OR auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create blog posts"
ON public.blog_posts
FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own blog posts"
ON public.blog_posts
FOR UPDATE
USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own blog posts"
ON public.blog_posts
FOR DELETE
USING (auth.uid() = author_id);

-- RLS Policies for blog_categories
CREATE POLICY "Blog categories are viewable by everyone"
ON public.blog_categories
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage blog categories"
ON public.blog_categories
FOR ALL
USING (auth.uid() IS NOT NULL);

-- RLS Policies for blog_post_categories
CREATE POLICY "Blog post categories are viewable by everyone"
ON public.blog_post_categories
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage blog post categories"
ON public.blog_post_categories
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Create indexes for performance
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_published ON public.blog_posts(published, published_at DESC);
CREATE INDEX idx_blog_posts_author ON public.blog_posts(author_id);
CREATE INDEX idx_blog_categories_slug ON public.blog_categories(slug);

-- Create updated_at trigger
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();