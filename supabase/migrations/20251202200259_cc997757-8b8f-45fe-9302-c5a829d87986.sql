-- Remove the overly permissive RLS policy that allows cross-organization client visibility
DROP POLICY IF EXISTS "Public can view clients with job listings" ON clients;