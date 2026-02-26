-- Data fix: Reassign Cody Forbes to correct Hayes embed job listing
UPDATE applications 
SET job_listing_id = '4c3cfad9-4641-4830-ad97-11589e8f8cd4',
    source = 'Embed Form',
    updated_at = now()
WHERE id = 'e947d090-36a4-4777-9d22-db8aeb5eb2d6';

-- Queue outbound call for Cody Forbes via the embed agent
INSERT INTO outbound_calls (
  application_id,
  voice_agent_id,
  organization_id,
  phone_number,
  status,
  scheduled_at,
  metadata
) VALUES (
  'e947d090-36a4-4777-9d22-db8aeb5eb2d6',
  '5af69ab6-7ee2-40fb-b797-935b7c2e7e89',
  NULL,
  '+18177572828',
  'queued',
  NULL,
  jsonb_build_object(
    'applicant_name', 'Cody Forbes',
    'triggered_by', 'manual_data_fix',
    'source', 'Embed Form',
    'business_hours_gated', false,
    'note', 'Reassigned from CR England General Application to Hayes embed job'
  )
);