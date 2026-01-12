-- Register Pemberton Inbound Agent for ElevenLabs conversation routing
INSERT INTO public.voice_agents (agent_name, agent_id, elevenlabs_agent_id, organization_id, client_id, is_active, is_outbound_enabled, llm_model, description)
VALUES (
  'Pemberton Inbound Agent', 
  'agent_6501k96k96rdfaxsxdm4r2626yb9', 
  'agent_6501k96k96rdfaxsxdm4r2626yb9', 
  '84214b48-7b51-45bc-ad7f-723bcf50466c',
  '67cadf11-8cce-41c6-8e19-7d2bb0be3b03',
  true, 
  false, 
  'gpt-4o-mini',
  'Inbound voice agent for Pemberton Truck Lines applicants'
);