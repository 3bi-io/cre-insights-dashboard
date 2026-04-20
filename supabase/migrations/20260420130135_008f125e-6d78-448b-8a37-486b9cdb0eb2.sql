INSERT INTO public.user_client_assignments (user_id, client_id)
VALUES
  ('c259635f-fc7c-4a4e-8a45-29bcbcbd66bc', '53d7dd20-d743-4d34-93e9-eb7175c39da1'),
  ('e7cd872d-30c2-4171-b247-2062c1f8c93e', '53d7dd20-d743-4d34-93e9-eb7175c39da1'),
  ('f0e9f8ad-ee1f-42d7-a640-7ca5489ebf60', '53d7dd20-d743-4d34-93e9-eb7175c39da1')
ON CONFLICT DO NOTHING;