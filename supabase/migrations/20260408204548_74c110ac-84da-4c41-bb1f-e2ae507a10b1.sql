-- Disable only the google indexing triggers
ALTER TABLE job_listings DISABLE TRIGGER trg_google_indexing_notify;
ALTER TABLE job_listings DISABLE TRIGGER trigger_google_indexing_on_job_change;
ALTER TABLE job_listings DISABLE TRIGGER trigger_auto_create_client;

INSERT INTO job_listings (
  title, job_title, client, client_id, organization_id, user_id, category_id,
  city, state, location, salary_min, salary_max, salary_type,
  job_type, experience_level, min_experience_months, status,
  job_summary, job_description
) VALUES (
  'Company Driver, CDL-A OTR',
  'Company Driver, CDL-A OTR',
  'Church Transportation',
  'dffb0ef4-07a0-494f-9790-ef9868e143c7',
  '84214b48-7b51-45bc-ad7f-723bcf50466c',
  'd63913d3-c528-402d-a3a3-1d9d10ec40ea',
  '61bd5f79-b3c1-4804-a6a0-d568773c3d84',
  'Frisco City', 'AL', 'Frisco City, AL',
  36000, 60000, 'yearly',
  'full-time', 'mid', 36, 'active',
  'Experienced Class A CDL Driver needed for OTR routes. Church Transportation offers competitive pay ($36K-$60K/year), 401(k), health insurance, fuel card, and safety bonuses. 3 years experience required.',
  '<h2>Company Driver, CDL-A OTR</h2>
<p>Are you an Experienced Class A Driver looking for a career with a company that values your experience, respects and rewards you for it? At Church Transportation Logistics, Inc., we want that experience and we want you to be a part of our "Church Team."</p>
<p>All of our fleet is company owned and is operated by courteous, professional drivers who take pride in getting a shipment from point A to point B in a safe and timely manner. We offer Truckload Services, Time Sensitive Services, Warehousing and Customized Transportation Solutions.</p>
<p>We are a small company with values and integrity geared toward offering the best possible services to our customers as well as a great work environment for our drivers. If you are ready to be treated as the Professional Driver you are and enjoy an environment where you are more than just a number, we want you now!</p>
<p>18 months verifiable experience driving a commercial vehicle required.</p>
<h3>Benefits</h3>
<ul>
<li>401(k)</li>
<li>Fuel card</li>
<li>Health insurance</li>
<li>Passenger ride along program</li>
<li>Referral program</li>
</ul>
<h3>Supplemental Pay</h3>
<ul>
<li>Breakdown pay</li>
<li>Detention pay</li>
<li>Extra stop pay</li>
<li>Layover pay</li>
<li>Safety bonus</li>
</ul>
<h3>Details</h3>
<ul>
<li><strong>Truck Driver Type:</strong> Company driver</li>
<li><strong>Trucking Route:</strong> OTR</li>
<li><strong>Work Location:</strong> On the road</li>
<li><strong>Experience:</strong> 3 years required</li>
</ul>'
);

-- Re-enable triggers
ALTER TABLE job_listings ENABLE TRIGGER trg_google_indexing_notify;
ALTER TABLE job_listings ENABLE TRIGGER trigger_google_indexing_on_job_change;
ALTER TABLE job_listings ENABLE TRIGGER trigger_auto_create_client;