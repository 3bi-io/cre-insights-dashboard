UPDATE ats_systems 
SET credential_schema = (credential_schema::jsonb - 'trackingLinkId') || '{"tracking_link_ids": {"label": "Tracking Link IDs", "type": "tags", "required": true, "description": "Add one or more tracking link IDs. Each link pulls jobs into Double Nickel for a specific campaign or region."}}'::jsonb,
updated_at = now()
WHERE slug = 'doublenickel';