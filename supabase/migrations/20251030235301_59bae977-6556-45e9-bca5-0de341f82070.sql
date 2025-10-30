-- Phase 1: Critical Security Fixes Migration
-- This migration addresses critical security vulnerabilities identified by Supabase linter

-- =====================================================
-- 1. Fix SECURITY DEFINER Functions - Add search_path
-- =====================================================
-- Without search_path, these functions are vulnerable to search_path attacks
-- where malicious users could create similarly named functions in other schemas

-- Fix has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public  -- SECURITY FIX: Prevent search_path attacks
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = _role
      AND ur.organization_id = (SELECT organization_id FROM public.profiles WHERE id = _user_id)
  )
$$;

-- Fix is_super_admin function
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public  -- SECURITY FIX: Prevent search_path attacks
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = _user_id 
    AND email = 'c@3bi.io'
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id 
    AND role = 'super_admin'::app_role
  )
$$;

-- Fix get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public  -- SECURITY FIX: Prevent search_path attacks
AS $$
  SELECT COALESCE(
    (SELECT 'super_admin'::app_role WHERE EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin')),
    (SELECT 'admin'::app_role WHERE EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')),
    (SELECT 'moderator'::app_role WHERE EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'moderator')),
    'user'::app_role
  )
$$;

-- Fix get_user_organization_id function
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public  -- SECURITY FIX: Prevent search_path attacks
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1
$$;

-- Fix organization_has_platform_access function
CREATE OR REPLACE FUNCTION public.organization_has_platform_access(_org_id uuid, _platform_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public  -- SECURITY FIX: Prevent search_path attacks
AS $$
  SELECT COALESCE(
    (SELECT enabled FROM public.organization_platform_access 
     WHERE organization_id = _org_id AND platform_name = _platform_name),
    true
  )
$$;

-- Fix get_user_platform_access function
CREATE OR REPLACE FUNCTION public.get_user_platform_access(_platform_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public  -- SECURITY FIX: Prevent search_path attacks
AS $$
  SELECT public.organization_has_platform_access(
    public.get_user_organization_id(),
    _platform_name
  )
$$;

-- Fix has_active_subscription function
CREATE OR REPLACE FUNCTION public.has_active_subscription(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public  -- SECURITY FIX: Prevent search_path attacks
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organizations
    WHERE id = org_id
      AND subscription_status IN ('active', 'trialing')
  )
$$;

-- Fix get_org_id_by_slug function
CREATE OR REPLACE FUNCTION public.get_org_id_by_slug(_slug text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public  -- SECURITY FIX: Prevent search_path attacks
AS $$
  SELECT id FROM public.organizations WHERE slug = _slug LIMIT 1
$$;

-- =====================================================
-- 2. Lock Down Audit Logs Table
-- =====================================================
-- Prevent tampering with audit logs (critical security requirement)

-- Drop existing policies to recreate with proper security
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Only admins and super admins can view audit logs (READ-ONLY)
CREATE POLICY "Admins can view audit logs" 
ON public.audit_logs 
FOR SELECT 
TO authenticated
USING (
  is_super_admin(auth.uid()) OR
  (has_role(auth.uid(), 'admin'::app_role) AND organization_id = get_user_organization_id())
);

-- System and authenticated users can insert audit logs (for tracking)
CREATE POLICY "Authenticated users can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

-- CRITICAL: Prevent ALL updates to audit logs (immutable by design)
CREATE POLICY "No one can update audit logs" 
ON public.audit_logs 
FOR UPDATE 
TO authenticated
USING (false);

-- CRITICAL: Only super admins can delete audit logs (for retention policies only)
CREATE POLICY "Only super admins can delete audit logs" 
ON public.audit_logs 
FOR DELETE 
TO authenticated
USING (is_super_admin(auth.uid()));

-- =====================================================
-- 3. Add Index for Audit Log Performance
-- =====================================================
-- Improve query performance for audit log lookups
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_org 
ON public.audit_logs(user_id, organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_record 
ON public.audit_logs(table_name, record_id, created_at DESC);