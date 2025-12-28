-- Tighten organizations table policies to authenticated users only.
-- This prevents any accidental exposure via PUBLIC role and aligns with least privilege.

ALTER POLICY "Users can view their organization" ON public.organizations TO authenticated;
ALTER POLICY "Users can view their own organization" ON public.organizations TO authenticated;
ALTER POLICY "Super admins can view all organizations" ON public.organizations TO authenticated;
ALTER POLICY "Admins can update their organization" ON public.organizations TO authenticated;
ALTER POLICY "Admins can manage their organization" ON public.organizations TO authenticated;
