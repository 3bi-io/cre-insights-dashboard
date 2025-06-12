
-- Create tables for job advertising analytics

-- Job platforms/boards table
CREATE TABLE public.platforms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  api_endpoint TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Job categories table
CREATE TABLE public.job_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Job listings table
CREATE TABLE public.job_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  platform_id UUID REFERENCES public.platforms NOT NULL,
  category_id UUID REFERENCES public.job_categories NOT NULL,
  budget DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  location TEXT,
  experience_level TEXT CHECK (experience_level IN ('entry', 'mid', 'senior', 'executive')),
  remote_type TEXT CHECK (remote_type IN ('on-site', 'remote', 'hybrid')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Daily spend tracking
CREATE TABLE public.daily_spend (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_listing_id UUID REFERENCES public.job_listings NOT NULL,
  date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(job_listing_id, date)
);

-- Applications tracking
CREATE TABLE public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_listing_id UUID REFERENCES public.job_listings NOT NULL,
  applicant_name TEXT,
  applicant_email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'interviewed', 'hired', 'rejected')),
  source TEXT,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Budget allocations table
CREATE TABLE public.budget_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  category_id UUID REFERENCES public.job_categories NOT NULL,
  monthly_budget DECIMAL(10,2) NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_id, year, month)
);

-- Enable Row Level Security
ALTER TABLE public.platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_spend ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_allocations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for platforms (public read)
CREATE POLICY "Anyone can view platforms" ON public.platforms FOR SELECT USING (true);

-- RLS Policies for job categories (public read)
CREATE POLICY "Anyone can view job categories" ON public.job_categories FOR SELECT USING (true);

-- RLS Policies for job listings (user-specific)
CREATE POLICY "Users can view their own job listings" ON public.job_listings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own job listings" ON public.job_listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own job listings" ON public.job_listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own job listings" ON public.job_listings FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for daily spend (user-specific via job listing)
CREATE POLICY "Users can view spend for their job listings" ON public.daily_spend FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.job_listings WHERE id = job_listing_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create spend for their job listings" ON public.daily_spend FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.job_listings WHERE id = job_listing_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update spend for their job listings" ON public.daily_spend FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.job_listings WHERE id = job_listing_id AND user_id = auth.uid())
);

-- RLS Policies for applications (user-specific via job listing)
CREATE POLICY "Users can view applications for their job listings" ON public.applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.job_listings WHERE id = job_listing_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create applications for their job listings" ON public.applications FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.job_listings WHERE id = job_listing_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update applications for their job listings" ON public.applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.job_listings WHERE id = job_listing_id AND user_id = auth.uid())
);

-- RLS Policies for budget allocations (user-specific)
CREATE POLICY "Users can view their own budget allocations" ON public.budget_allocations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own budget allocations" ON public.budget_allocations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own budget allocations" ON public.budget_allocations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own budget allocations" ON public.budget_allocations FOR DELETE USING (auth.uid() = user_id);

-- Insert sample platforms
INSERT INTO public.platforms (name, logo_url) VALUES
('Indeed', '/platforms/indeed.png'),
('LinkedIn', '/platforms/linkedin.png'),
('ZipRecruiter', '/platforms/ziprecruiter.png'),
('Glassdoor', '/platforms/glassdoor.png'),
('Monster', '/platforms/monster.png'),
('CareerBuilder', '/platforms/careerbuilder.png');

-- Insert sample job categories
INSERT INTO public.job_categories (name, description) VALUES
('Driver Recruitment', 'CDL and truck driver positions'),
('Logistics Positions', 'Warehouse and logistics roles'),
('Management Roles', 'Leadership and supervisory positions'),
('Technical Positions', 'IT and technical specialist roles'),
('Administrative', 'Office and administrative support'),
('Customer Service', 'Customer-facing and support roles');
