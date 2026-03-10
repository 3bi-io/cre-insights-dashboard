
-- Benefits catalog: single source of truth for all benefit types
CREATE TABLE public.benefits_catalog (
  id text PRIMARY KEY,
  label text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  icon text NOT NULL DEFAULT 'Shield',
  keywords text[] NOT NULL DEFAULT '{}',
  social_copy jsonb NOT NULL DEFAULT '{}',
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Junction table linking benefits to job listings
CREATE TABLE public.job_listing_benefits (
  job_id uuid NOT NULL REFERENCES public.job_listings(id) ON DELETE CASCADE,
  benefit_id text NOT NULL REFERENCES public.benefits_catalog(id) ON DELETE CASCADE,
  custom_value text,
  PRIMARY KEY (job_id, benefit_id)
);

-- RLS: benefits_catalog is public-read
ALTER TABLE public.benefits_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active benefits"
  ON public.benefits_catalog FOR SELECT
  USING (is_active = true);

CREATE POLICY "Super admins can manage benefits catalog"
  ON public.benefits_catalog FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- RLS: job_listing_benefits follows job_listings access
ALTER TABLE public.job_listing_benefits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read job listing benefits"
  ON public.job_listing_benefits FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage job listing benefits"
  ON public.job_listing_benefits FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Seed data: merge BENEFIT_OPTIONS + responder benefits
INSERT INTO public.benefits_catalog (id, label, category, icon, keywords, social_copy, sort_order) VALUES
  ('sign_on_bonus', '$5k Sign-on Bonus', 'compensation', 'DollarSign',
   ARRAY['sign on', 'signing bonus', 'sign-on', 'sign on bonus'],
   '{"facebook": "💰 Sign-on bonus available!", "instagram": "💰 Sign-on bonus!", "twitter": "💰 Sign-on bonus!", "whatsapp": "We offer a sign-on bonus for qualified drivers.", "linkedin": "We offer competitive sign-on bonuses for qualified candidates."}'::jsonb, 1),
  
  ('home_weekly', 'Home Weekly', 'lifestyle', 'Home',
   ARRAY['home weekly', 'home time', 'home every week', 'weekly home time'],
   '{"facebook": "🏠 Home weekly schedules available!", "instagram": "🏠 Home weekly!", "twitter": "🏠 Home weekly!", "whatsapp": "We offer home weekly schedules.", "linkedin": "Our routes include weekly home time options."}'::jsonb, 2),
  
  ('new_equipment', 'New Equipment', 'operations', 'Truck',
   ARRAY['new equipment', 'new trucks', 'late model', 'new fleet'],
   '{"facebook": "🚛 Drive new equipment!", "instagram": "🚛 New trucks!", "twitter": "🚛 New equipment!", "whatsapp": "Our fleet features new, well-maintained equipment.", "linkedin": "We invest in late-model equipment for driver comfort and safety."}'::jsonb, 3),
  
  ('health_insurance', 'Health Insurance', 'insurance', 'HeartPulse',
   ARRAY['health insurance', 'medical', 'health coverage', 'medical insurance', 'health plan'],
   '{"facebook": "🏥 Comprehensive health insurance!", "instagram": "🏥 Full health coverage!", "twitter": "🏥 Health insurance!", "whatsapp": "We provide comprehensive health insurance coverage.", "linkedin": "Our benefits include comprehensive medical insurance plans."}'::jsonb, 4),
  
  ('dental_insurance', 'Dental Insurance', 'insurance', 'Smile',
   ARRAY['dental', 'dental insurance', 'dental coverage', 'dental plan'],
   '{"facebook": "🦷 Dental insurance included!", "instagram": "🦷 Dental coverage!", "twitter": "🦷 Dental insurance!", "whatsapp": "Dental insurance is included in our benefits package.", "linkedin": "Dental insurance is part of our comprehensive benefits offering."}'::jsonb, 5),
  
  ('vision_insurance', 'Vision Insurance', 'insurance', 'Eye',
   ARRAY['vision', 'vision insurance', 'vision coverage', 'eye care'],
   '{"facebook": "👁️ Vision insurance included!", "instagram": "👁️ Vision coverage!", "twitter": "👁️ Vision insurance!", "whatsapp": "Vision insurance is part of our benefits package.", "linkedin": "Vision coverage is included in our benefits package."}'::jsonb, 6),
  
  ('retirement_401k', '401(k) Retirement', 'retirement', 'PiggyBank',
   ARRAY['401k', '401(k)', 'retirement', 'retirement plan', 'company match'],
   '{"facebook": "💎 401(k) with company match!", "instagram": "💎 401k retirement plan!", "twitter": "💎 401k with match!", "whatsapp": "We offer a 401(k) retirement plan with company match.", "linkedin": "Our 401(k) plan includes a company match to support your retirement planning."}'::jsonb, 7),
  
  ('paid_time_off', 'Paid Time Off', 'lifestyle', 'Calendar',
   ARRAY['pto', 'paid time off', 'vacation', 'paid vacation', 'time off'],
   '{"facebook": "🌴 Paid time off available!", "instagram": "🌴 PTO included!", "twitter": "🌴 PTO!", "whatsapp": "We offer paid time off and vacation days.", "linkedin": "Generous paid time off is part of our benefits package."}'::jsonb, 8),
  
  ('full_benefits', 'Full Benefits Package', 'insurance', 'Heart',
   ARRAY['full benefits', 'benefits package', 'comprehensive benefits'],
   '{"facebook": "❤️ Full benefits package including medical, dental, vision, 401(k), and PTO!", "instagram": "❤️ Full benefits!", "twitter": "❤️ Full benefits!", "whatsapp": "We offer a comprehensive benefits package including health insurance, 401(k), and paid time off.", "linkedin": "We provide a comprehensive benefits package including medical, dental, vision, 401(k), and PTO."}'::jsonb, 9),
  
  ('pet_friendly', 'Pet Friendly', 'lifestyle', 'PawPrint',
   ARRAY['pet friendly', 'pet policy', 'pets allowed', 'bring your pet'],
   '{"facebook": "🐾 Pet-friendly trucks!", "instagram": "🐾 Pet friendly!", "twitter": "🐾 Pet friendly!", "whatsapp": "We have a pet-friendly policy for our drivers.", "linkedin": "Our pet-friendly policy allows drivers to bring their companions on the road."}'::jsonb, 10),
  
  ('no_touch_freight', 'No Touch Freight', 'operations', 'Package',
   ARRAY['no touch', 'no touch freight', 'drop and hook', 'no unloading'],
   '{"facebook": "📦 No touch freight!", "instagram": "📦 No touch freight!", "twitter": "📦 No touch!", "whatsapp": "Our loads are no-touch freight.", "linkedin": "Many of our routes feature no-touch freight operations."}'::jsonb, 11),
  
  ('paid_orientation', 'Paid Orientation', 'compensation', 'GraduationCap',
   ARRAY['paid orientation', 'orientation pay', 'paid training'],
   '{"facebook": "🎓 Paid orientation!", "instagram": "🎓 Paid orientation!", "twitter": "🎓 Paid orientation!", "whatsapp": "Orientation is fully paid.", "linkedin": "We offer paid orientation and training for new hires."}'::jsonb, 12),
  
  ('safety_bonuses', 'Safety Bonuses', 'compensation', 'Shield',
   ARRAY['safety bonus', 'safety bonuses', 'safe driving bonus'],
   '{"facebook": "🛡️ Safety bonuses!", "instagram": "🛡️ Safety bonuses!", "twitter": "🛡️ Safety bonuses!", "whatsapp": "We reward safe driving with bonus pay.", "linkedin": "Our safety incentive program rewards drivers for maintaining excellent safety records."}'::jsonb, 13),
  
  ('rider_policy', 'Rider Policy', 'lifestyle', 'Users',
   ARRAY['rider policy', 'rider program', 'passenger policy'],
   '{"facebook": "👥 Rider policy available!", "instagram": "👥 Rider policy!", "twitter": "👥 Rider policy!", "whatsapp": "We have a rider policy for drivers.", "linkedin": "Our rider policy allows approved passengers to accompany drivers."}'::jsonb, 14),
  
  ('direct_deposit', 'Direct Deposit', 'compensation', 'Wallet',
   ARRAY['direct deposit', 'weekly pay', 'pay deposit'],
   '{"facebook": "💳 Direct deposit weekly pay!", "instagram": "💳 Direct deposit!", "twitter": "💳 Direct deposit!", "whatsapp": "Pay is deposited directly to your account weekly.", "linkedin": "We offer weekly direct deposit for all drivers."}'::jsonb, 15),
  
  ('referral_bonus', 'Referral Bonus', 'compensation', 'Gift',
   ARRAY['referral bonus', 'refer a driver', 'referral program'],
   '{"facebook": "🎁 Referral bonus program!", "instagram": "🎁 Referral bonus!", "twitter": "🎁 Referral bonus!", "whatsapp": "Earn bonuses by referring qualified drivers.", "linkedin": "Our referral bonus program rewards you for connecting us with qualified candidates."}'::jsonb, 16);
