
INSERT INTO public.scheduled_callbacks (
  application_id, booking_source, driver_name, driver_phone, duration_minutes,
  organization_id, recruiter_user_id, scheduled_start, scheduled_end,
  status, notes, sms_confirmation_sent, digest_email_sent
) VALUES
-- Completed callbacks (past)
('004c5e7b-cb69-4ab3-86eb-bde64c358026', 'ai_agent', 'John Martinez', '+15551234001', 30, 'fd4d6327-32df-467f-aba7-ccfeecccd934', 'f0e9f8ad-ee1f-42d7-a640-7ca5489ebf60', '2026-02-15 09:00:00+00', '2026-02-15 09:30:00+00', 'completed', 'Great call, driver accepted offer', true, true),
('012b7ede-1201-4bcd-acf0-04d315274b32', 'ai_agent', 'Sarah Williams', '+15551234002', 30, 'fd4d6327-32df-467f-aba7-ccfeecccd934', 'f0e9f8ad-ee1f-42d7-a640-7ca5489ebf60', '2026-02-16 10:00:00+00', '2026-02-16 10:30:00+00', 'completed', 'Follow-up needed on benefits', true, true),
('01b8f475-6e03-4017-9168-c3845408f7ed', 'ai_agent', 'Mike Johnson', '+15551234003', 30, 'fd4d6327-32df-467f-aba7-ccfeecccd934', '02093ad0-afb0-4699-b164-ea7aca9ee4df', '2026-02-17 14:00:00+00', '2026-02-17 14:30:00+00', 'completed', NULL, true, true),
('0353f81a-82aa-40e3-b789-2e71fa6c17e9', 'manual', 'David Brown', '+15551234004', 30, 'fd4d6327-32df-467f-aba7-ccfeecccd934', '02093ad0-afb0-4699-b164-ea7aca9ee4df', '2026-02-20 11:00:00+00', '2026-02-20 11:30:00+00', 'completed', 'Driver starting next Monday', false, true),
('03975772-8220-444d-a0c1-1a10b9ac4e41', 'ai_agent', 'Lisa Chen', '+15551234005', 30, 'fd4d6327-32df-467f-aba7-ccfeecccd934', 'f0e9f8ad-ee1f-42d7-a640-7ca5489ebf60', '2026-02-22 09:30:00+00', '2026-02-22 10:00:00+00', 'completed', NULL, true, true),
('03fffd3f-72e9-4964-bbd1-4daa4efaa1ea', 'ai_agent', 'Robert Taylor', '+15551234006', 30, 'fd4d6327-32df-467f-aba7-ccfeecccd934', 'f0e9f8ad-ee1f-42d7-a640-7ca5489ebf60', '2026-02-25 13:00:00+00', '2026-02-25 13:30:00+00', 'completed', 'Needs CDL verification', true, true),
('0494a8b4-771b-480a-9d41-7cba600d1e28', 'ai_agent', 'Emma Davis', '+15551234007', 30, 'fd4d6327-32df-467f-aba7-ccfeecccd934', '02093ad0-afb0-4699-b164-ea7aca9ee4df', '2026-02-27 15:00:00+00', '2026-02-27 15:30:00+00', 'completed', NULL, true, true),
('05d46e35-4e7d-45fa-8c13-915d90fc287b', 'manual', 'James Wilson', '+15551234008', 30, 'fd4d6327-32df-467f-aba7-ccfeecccd934', 'f0e9f8ad-ee1f-42d7-a640-7ca5489ebf60', '2026-03-01 10:00:00+00', '2026-03-01 10:30:00+00', 'completed', 'Orientation scheduled', true, true),
('064cca54-fb4c-4966-b503-18b14de6089c', 'ai_agent', 'Maria Garcia', '+15551234009', 30, 'fd4d6327-32df-467f-aba7-ccfeecccd934', '02093ad0-afb0-4699-b164-ea7aca9ee4df', '2026-03-03 09:00:00+00', '2026-03-03 09:30:00+00', 'completed', NULL, true, true),
('088b22b2-91e0-4b4c-9572-ecbf82e21659', 'ai_agent', 'Chris Anderson', '+15551234010', 30, 'fd4d6327-32df-467f-aba7-ccfeecccd934', 'f0e9f8ad-ee1f-42d7-a640-7ca5489ebf60', '2026-03-05 14:00:00+00', '2026-03-05 14:30:00+00', 'completed', 'Hired - Class A OTR', true, true),

-- No-shows
('004c5e7b-cb69-4ab3-86eb-bde64c358026', 'ai_agent', 'Tom Harris', '+15551234011', 30, 'fd4d6327-32df-467f-aba7-ccfeecccd934', 'f0e9f8ad-ee1f-42d7-a640-7ca5489ebf60', '2026-02-18 10:00:00+00', '2026-02-18 10:30:00+00', 'no_show', 'Did not answer', true, true),
('012b7ede-1201-4bcd-acf0-04d315274b32', 'ai_agent', 'Kevin White', '+15551234012', 30, 'fd4d6327-32df-467f-aba7-ccfeecccd934', '02093ad0-afb0-4699-b164-ea7aca9ee4df', '2026-02-24 11:00:00+00', '2026-02-24 11:30:00+00', 'no_show', NULL, true, true),
('01b8f475-6e03-4017-9168-c3845408f7ed', 'ai_agent', 'Nancy Lee', '+15551234013', 30, 'fd4d6327-32df-467f-aba7-ccfeecccd934', 'f0e9f8ad-ee1f-42d7-a640-7ca5489ebf60', '2026-03-04 09:00:00+00', '2026-03-04 09:30:00+00', 'no_show', 'Rescheduling requested', true, true),

-- Cancelled
('0353f81a-82aa-40e3-b789-2e71fa6c17e9', 'manual', 'Steve Clark', '+15551234014', 30, 'fd4d6327-32df-467f-aba7-ccfeecccd934', '02093ad0-afb0-4699-b164-ea7aca9ee4df', '2026-02-19 15:00:00+00', '2026-02-19 15:30:00+00', 'cancelled', 'Driver found another job', false, false),
('03975772-8220-444d-a0c1-1a10b9ac4e41', 'ai_agent', 'Amy Robinson', '+15551234015', 30, 'fd4d6327-32df-467f-aba7-ccfeecccd934', 'f0e9f8ad-ee1f-42d7-a640-7ca5489ebf60', '2026-03-02 13:00:00+00', '2026-03-02 13:30:00+00', 'cancelled', NULL, true, false),

-- Pending/upcoming
('03fffd3f-72e9-4964-bbd1-4daa4efaa1ea', 'ai_agent', 'Paul Martinez', '+15551234016', 30, 'fd4d6327-32df-467f-aba7-ccfeecccd934', 'f0e9f8ad-ee1f-42d7-a640-7ca5489ebf60', '2026-03-12 14:00:00+00', '2026-03-12 14:30:00+00', 'pending', 'Interested in local routes', true, false),
('0494a8b4-771b-480a-9d41-7cba600d1e28', 'ai_agent', 'Jennifer Adams', '+15551234017', 30, 'fd4d6327-32df-467f-aba7-ccfeecccd934', '02093ad0-afb0-4699-b164-ea7aca9ee4df', '2026-03-12 15:00:00+00', '2026-03-12 15:30:00+00', 'pending', NULL, true, false),
('05d46e35-4e7d-45fa-8c13-915d90fc287b', 'ai_agent', 'Brian King', '+15551234018', 30, 'fd4d6327-32df-467f-aba7-ccfeecccd934', 'f0e9f8ad-ee1f-42d7-a640-7ca5489ebf60', '2026-03-13 09:00:00+00', '2026-03-13 09:30:00+00', 'pending', 'CDL Class A, 5 years exp', true, false),
('064cca54-fb4c-4966-b503-18b14de6089c', 'ai_agent', 'Laura Scott', '+15551234019', 30, 'fd4d6327-32df-467f-aba7-ccfeecccd934', '02093ad0-afb0-4699-b164-ea7aca9ee4df', '2026-03-13 10:00:00+00', '2026-03-13 10:30:00+00', 'pending', NULL, false, false),
('088b22b2-91e0-4b4c-9572-ecbf82e21659', 'ai_agent', 'Daniel Evans', '+15551234020', 30, 'fd4d6327-32df-467f-aba7-ccfeecccd934', 'f0e9f8ad-ee1f-42d7-a640-7ca5489ebf60', '2026-03-14 11:00:00+00', '2026-03-14 11:30:00+00', 'pending', 'Hazmat endorsed', true, false),
('004c5e7b-cb69-4ab3-86eb-bde64c358026', 'ai_agent', 'Michelle Turner', '+15551234021', 30, 'fd4d6327-32df-467f-aba7-ccfeecccd934', '02093ad0-afb0-4699-b164-ea7aca9ee4df', '2026-03-14 14:00:00+00', '2026-03-14 14:30:00+00', 'pending', NULL, false, false),
('012b7ede-1201-4bcd-acf0-04d315274b32', 'ai_agent', 'Gary Phillips', '+15551234022', 30, 'fd4d6327-32df-467f-aba7-ccfeecccd934', 'f0e9f8ad-ee1f-42d7-a640-7ca5489ebf60', '2026-03-15 10:00:00+00', '2026-03-15 10:30:00+00', 'pending', 'Regional driver', true, false),

-- Confirmed
('01b8f475-6e03-4017-9168-c3845408f7ed', 'ai_agent', 'Sandra Hill', '+15551234023', 30, 'fd4d6327-32df-467f-aba7-ccfeecccd934', 'f0e9f8ad-ee1f-42d7-a640-7ca5489ebf60', '2026-03-12 10:00:00+00', '2026-03-12 10:30:00+00', 'confirmed', 'Ready for onboarding call', true, true),
('0353f81a-82aa-40e3-b789-2e71fa6c17e9', 'manual', 'Rick Campbell', '+15551234024', 30, 'fd4d6327-32df-467f-aba7-ccfeecccd934', '02093ad0-afb0-4699-b164-ea7aca9ee4df', '2026-03-12 11:00:00+00', '2026-03-12 11:30:00+00', 'confirmed', 'Tanker experience', true, true),
('03975772-8220-444d-a0c1-1a10b9ac4e41', 'ai_agent', 'Dorothy Baker', '+15551234025', 30, 'fd4d6327-32df-467f-aba7-ccfeecccd934', 'f0e9f8ad-ee1f-42d7-a640-7ca5489ebf60', '2026-03-13 14:00:00+00', '2026-03-13 14:30:00+00', 'confirmed', NULL, true, false)
