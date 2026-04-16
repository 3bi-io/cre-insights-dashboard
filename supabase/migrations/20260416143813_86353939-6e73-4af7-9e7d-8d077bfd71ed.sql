ALTER TABLE job_listings DISABLE TRIGGER trg_google_indexing_notify;
ALTER TABLE job_listings DISABLE TRIGGER trigger_google_indexing_on_job_change;
ALTER TABLE job_listings DISABLE TRIGGER trigger_auto_create_client;

INSERT INTO job_listings (organization_id, client_id, user_id, category_id, title, job_description, location, job_type, salary_min, salary_max, salary_type, status, jobreferrer, apply_url, job_id, created_at, updated_at)
SELECT '84214b48-7b51-45bc-ad7f-723bcf50466c'::uuid, 'cc4a05e9-2c87-4e71-b7f5-49d8bd709540'::uuid, '86b642cb-af7b-47df-9bd6-179db1ae7c95'::uuid, '61bd5f79-b3c1-4804-a6a0-d568773c3d84'::uuid,
'CDL A Truck Driver - Earn $85,000+/YR - MORE MILES, MORE PAY!',
'<p><strong>TFY has immediate openings for high earning CDL A Drivers with a minimum of 12 months driving experience!</strong></p><p><strong>OTR ROUTES - CDL A COMPANY DRIVER - EARN $85,000+/YR - MORE MILES, MORE PAY!</strong></p><p><strong>30% of Our Drivers Have Over 1 Million Miles with Trucks For You!</strong></p><ul><li>Weekly Direct Deposit</li><li>Detention, Extra Stop and Layover Pay</li><li>Paid Orientation</li></ul><p><strong>TFY Offers a Full Benefit Package Including:</strong></p><ul><li>Health, Dental, Vision, Life, Paid Vacation and industry best matching 401K.</li><li>Insurance effective 1st month after 60 days employment</li><li>401k with TFY match after one year</li><li>Passenger and Pet Policy available</li><li>2023-2026 trucks equipped with EPU, fridge and inverter for your convenience.</li><li>All trucks are equipped with cameras (we do have inward facing cameras on Company Drivers)</li></ul><p><strong>Benefits:</strong></p><ul><li>Health, Dental, Vision, Group Life, Voluntary Life, effective 1st of the month after 60 days employment</li><li>Paid Vacation after one year</li><li>401k available after one year.</li><li>Additional monthly bonus available</li><li>Paid Orientation</li></ul><p><strong>Requirements:</strong></p><ul><li>No DUIs</li><li>No Felonies in the last 10 years</li><li>Must have at least 12 months verifiable OTR driving experience in the last 3 years</li><li>Minimum age of 22</li></ul><p><strong>Call us (877) 812-1194</strong></p>',
v.location, 'Full-time', 85000, 85000, 'yearly', 'active', 'OTR Company Driver', v.apply_url, v.ext_id, now(), now()
FROM (VALUES
  ('Oklahoma City, OK', '14575J21087', 'https://cdljobcast.com/service/redirecttounbounce?job_id=QBeX5lkayK&jobboard=AIRecruiter&redirecttounbouncelocation=Oklahoma+city%2COK'),
  ('Tulsa, OK', '14575J21222', 'https://cdljobcast.com/service/redirecttounbounce?job_id=QBeX5lkayK&jobboard=AIRecruiter&redirecttounbouncelocation=Tulsa%2COK'),
  ('Norman, OK', '14575J21075', 'https://cdljobcast.com/service/redirecttounbounce?job_id=QBeX5lkayK&jobboard=AIRecruiter&redirecttounbouncelocation=Norman%2COK'),
  ('Broken Arrow, OK', '14575J20758', 'https://cdljobcast.com/service/redirecttounbounce?job_id=QBeX5lkayK&jobboard=AIRecruiter&redirecttounbouncelocation=Broken+arrow%2COK'),
  ('Moore, OK', '14575J21060', 'https://cdljobcast.com/service/redirecttounbounce?job_id=QBeX5lkayK&jobboard=AIRecruiter&redirecttounbouncelocation=Moore%2COK'),
  ('Edmond, OK', '14575J20869', 'https://cdljobcast.com/service/redirecttounbounce?job_id=QBeX5lkayK&jobboard=AIRecruiter&redirecttounbouncelocation=Edmond%2COK'),
  ('Lawton, OK', '14575J21015', 'https://cdljobcast.com/service/redirecttounbounce?job_id=QBeX5lkayK&jobboard=AIRecruiter&redirecttounbouncelocation=Lawton%2COK'),
  ('Enid, OK', '14575J20882', 'https://cdljobcast.com/service/redirecttounbounce?job_id=QBeX5lkayK&jobboard=AIRecruiter&redirecttounbouncelocation=Enid%2COK'),
  ('Stillwater, OK', '14575J21195', 'https://cdljobcast.com/service/redirecttounbounce?job_id=QBeX5lkayK&jobboard=AIRecruiter&redirecttounbouncelocation=Stillwater%2COK'),
  ('Dallas, TX', '14575J20823', 'https://cdljobcast.com/service/redirecttounbounce?job_id=QBeX5lkayK&jobboard=AIRecruiter&redirecttounbouncelocation=Dallas%2CTX'),
  ('Fort Worth, TX', '14575J20916', 'https://cdljobcast.com/service/redirecttounbounce?job_id=QBeX5lkayK&jobboard=AIRecruiter&redirecttounbouncelocation=Fort+worth%2CTX'),
  ('Houston, TX', '14575J20946', 'https://cdljobcast.com/service/redirecttounbounce?job_id=QBeX5lkayK&jobboard=AIRecruiter&redirecttounbouncelocation=Houston%2CTX'),
  ('San Antonio, TX', '14575J21152', 'https://cdljobcast.com/service/redirecttounbounce?job_id=QBeX5lkayK&jobboard=AIRecruiter&redirecttounbouncelocation=San+antonio%2CTX'),
  ('Austin, TX', '14575J20736', 'https://cdljobcast.com/service/redirecttounbounce?job_id=QBeX5lkayK&jobboard=AIRecruiter&redirecttounbouncelocation=Austin%2CTX'),
  ('El Paso, TX', '14575J20876', 'https://cdljobcast.com/service/redirecttounbounce?job_id=QBeX5lkayK&jobboard=AIRecruiter&redirecttounbouncelocation=El+paso%2CTX'),
  ('Little Rock, AR', '14575J21023', 'https://cdljobcast.com/service/redirecttounbounce?job_id=QBeX5lkayK&jobboard=AIRecruiter&redirecttounbouncelocation=Little+rock%2CAR'),
  ('Memphis, TN', '14575J21042', 'https://cdljobcast.com/service/redirecttounbounce?job_id=QBeX5lkayK&jobboard=AIRecruiter&redirecttounbouncelocation=Memphis%2CTN'),
  ('Nashville, TN', '14575J21065', 'https://cdljobcast.com/service/redirecttounbounce?job_id=QBeX5lkayK&jobboard=AIRecruiter&redirecttounbouncelocation=Nashville%2CTN'),
  ('Atlanta, GA', '14575J20728', 'https://cdljobcast.com/service/redirecttounbounce?job_id=QBeX5lkayK&jobboard=AIRecruiter&redirecttounbouncelocation=Atlanta%2CGA'),
  ('Columbus, OH', '14575J20794', 'https://cdljobcast.com/service/redirecttounbounce?job_id=QBeX5lkayK&jobboard=AIRecruiter&redirecttounbouncelocation=Columbus%2COH'),
  ('Cleveland, OH', '14575J20789', 'https://cdljobcast.com/service/redirecttounbounce?job_id=QBeX5lkayK&jobboard=AIRecruiter&redirecttounbouncelocation=Cleveland%2COH'),
  ('Cincinnati, OH', '14575J20784', 'https://cdljobcast.com/service/redirecttounbounce?job_id=QBeX5lkayK&jobboard=AIRecruiter&redirecttounbouncelocation=Cincinnati%2COH'),
  ('Chicago, IL', '14575J20777', 'https://cdljobcast.com/service/redirecttounbounce?job_id=QBeX5lkayK&jobboard=AIRecruiter&redirecttounbouncelocation=Chicago%2CIL'),
  ('Albuquerque, NM', '14575J20719', 'https://cdljobcast.com/service/redirecttounbounce?job_id=QBeX5lkayK&jobboard=AIRecruiter&redirecttounbouncelocation=Albuquerque%2CNM'),
  ('Muskogee, OK', '14575J21063', 'https://cdljobcast.com/service/redirecttounbounce?job_id=QBeX5lkayK&jobboard=AIRecruiter&redirecttounbouncelocation=Muskogee%2COK')
) AS v(location, ext_id, apply_url)
WHERE NOT EXISTS (
  SELECT 1 FROM job_listings WHERE job_id = v.ext_id AND organization_id = '84214b48-7b51-45bc-ad7f-723bcf50466c'
);

ALTER TABLE job_listings ENABLE TRIGGER trg_google_indexing_notify;
ALTER TABLE job_listings ENABLE TRIGGER trigger_google_indexing_on_job_change;
ALTER TABLE job_listings ENABLE TRIGGER trigger_auto_create_client;