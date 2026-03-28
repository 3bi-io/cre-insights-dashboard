
-- Assign phone number to Inbound Cybersecurity Recruiter and add description
UPDATE voice_agents 
SET agent_phone_number_id = 'phnum_5601kg7vfxvbfe6bt08gd4hkm5wn',
    description = 'Inbound voice screening agent for AspenView Technology Partners. Conducts technical cybersecurity screening interviews via web and phone, evaluating candidates on security clearances, certifications (CISSP, CEH, CompTIA Security+), and relevant experience before routing to Rippling ATS for formal application.'
WHERE id = '2c86588a-db3a-45d9-9ede-4bd3a30355ec';

-- Assign phone number to Outbound Screener
UPDATE voice_agents 
SET agent_phone_number_id = 'phnum_01jz3x3nm8ex6rx09hmf3fr1ht'
WHERE id = '219e2902-8c26-4adb-9200-1c3aca95b2e3';
