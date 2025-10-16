-- Create demo clients for ACME organization and ensure proper RLS

DO $$
DECLARE
  acme_org_id UUID;
BEGIN
  -- Get ACME organization ID
  SELECT id INTO acme_org_id 
  FROM public.organizations 
  WHERE slug = 'acme' 
  LIMIT 1;

  -- Create demo clients for ACME organization
  INSERT INTO public.clients (organization_id, name, company, email, phone, city, state, zip_code, status, notes)
  VALUES
    (acme_org_id, 'Demo Logistics Inc', 'Demo Logistics', 'contact@demologistics.demo', '555-0100', 'Los Angeles', 'CA', '90001', 'active', 'Demo client for testing purposes'),
    (acme_org_id, 'Sample Transport Co', 'Sample Transport', 'info@sampletransport.demo', '555-0101', 'Phoenix', 'AZ', '85001', 'active', 'Demo client for freight services'),
    (acme_org_id, 'Test Distribution LLC', 'Test Distribution', 'sales@testdist.demo', '555-0102', 'Las Vegas', 'NV', '89101', 'active', 'Demo client for regional distribution'),
    (acme_org_id, 'Example Shipping Corp', 'Example Shipping', 'contact@exampleship.demo', '555-0103', 'Salt Lake City', 'UT', '84101', 'pending', 'Demo client - pending approval'),
    (acme_org_id, 'Demo Freight Services', 'Demo Freight', 'info@demofreight.demo', '555-0104', 'San Diego', 'CA', '92101', 'active', 'Demo client for LTL services');

END $$;