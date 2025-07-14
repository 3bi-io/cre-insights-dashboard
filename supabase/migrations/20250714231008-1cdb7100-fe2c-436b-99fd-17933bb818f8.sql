
-- Update additional job listings with their full job descriptions
UPDATE public.job_listings 
SET description = CASE 
  WHEN job_id = '361' THEN 'High Pay • Weekly Home Time • Stay Active On the Road

Position Overview
We are now hiring CDL-A drivers for a high-paying, home-weekly position on our Dedicated Dollar Tree Account. This is a hands-on driving role that's perfect for those who enjoy staying physically active while earning competitive pay.

Job Highlights
Miles/Week: Approx. 1,750

Loads/Week: 2

Freight Type: Dry freight (no refrigeration)

Unloading: Required – trailers are hand-unloaded using rollers at delivery sites

Delivery Regions
Deliveries to customer locations throughout:

Kansas, Minnesota, Nebraska, Iowa

Arkansas, Oklahoma, Colorado, Wyoming

New Mexico, Tennessee, North & South Dakota

Missouri area

Schedule
Home Time: Weekly 34-hour reset

Delivery Windows:

Store deliveries typically start at 5:00 AM

Some deliveries begin as late as 11:00 PM (overnight runs)

Compensation
CPM (Cents Per Mile)

Load Pay

Safe & On-Time Bonus: Up to 3% of Mileage Pay

Equipment
Company Equipment Only – 53' Dry Van Trailers

Truck Parking: Trucks cannot be taken home

Drivers must coordinate with account manager for secure parking arrangements

Benefits
Weekly Pay & Weekly Home Time

Health Benefits & 401(k) Participation

Paid Time Off (PTO)

Bonus Incentives

Unlimited Cash Referral Program

Full Benefits Package Includes:

Medical, HSA, Dental

Life Insurance & AD&D

PTO & 401(k)

Additional voluntary benefits

For full eligibility and details, refer to the Company's Benefit Summary and Driver Employee Policy Manual.'
  
  WHEN job_id = '882' THEN 'Weekly Home Time • Competitive Pay • Active Delivery Role

Position Overview
We are hiring full-time CDL-A drivers for our dedicated Dollar Tree account based out of West Memphis, AR. This role is ideal for drivers who want to stay active while enjoying a predictable weekly schedule and consistent pay.

Job Highlights
Miles/Week: Approx. 1,500

Loads/Week: 3

Stops/Load: 3

Freight Type: Dry freight

Unloading Method: Hand unload using roto-carts and lift gates

Delivery Regions
Freight deliveries to customer locations in:

Texas (TX)

Oklahoma (OK)

Tennessee (TN)

Arkansas (AR)

Louisiana (LA)

Mississippi (MS)

Missouri (MO)

Kentucky (KY)

Illinois (IL)

Alabama (AL)

Schedule
Home Time: Weekly – 34-hour reset

Consistent & predictable schedule

Compensation
Mileage Pay

Stop Pay

Reliable weekly earnings

Equipment
Sleeper Trucks with automatic transmissions

53' Dry Van Trailers

Truck Parking: Must be at home or at a secure, authorized location

Benefits
Weekly Pay & Weekly Home Time

Health Benefits & 401(k) Participation

Paid Time Off (PTO)

Bonus Incentives

Unlimited Cash Referral Program

Full Benefits Package Includes:

Medical, HSA, Dental

Life Insurance & AD&D

PTO & 401(k)

Additional voluntary benefits

For eligibility details, consult the Company's Benefit Summary and Driver Employee Policy Manual.'
  
  WHEN job_id = '341' THEN 'High Miles • Weekly Home Time • Active Driver Role

Job Overview
We are hiring CDL-A drivers for our Dedicated Family Dollar account. This is an excellent opportunity for drivers who want a mix of over-the-road experience and physical activity. Perfect for those who like to stay active while earning great pay!

Position Highlights
Loads/Week: 2–3

Stops/Load: 2–6

Miles/Week: Approx. 1,600

Freight Handling: Unloading required – freight is unloaded using rollers

Delivery Regions
75% of freight delivers in Texas (TX)

Remaining 25% in surrounding states, including:

Kansas (KS)

Arkansas (AR)

Louisiana (LA)

Mississippi (MS)

Schedule
Home Time: Weekly – 34-hour reset

Consistent, Reliable Route Structure

Compensation
Mileage Pay

Load Pay

Consistent Weekly Earnings

Equipment
Sleeper Trucks with automatic transmissions

Pulling 53' Dry Van Trailers

Benefits
Weekly Pay & Weekly Home Time

Health Benefits & 401(k) Participation

Paid Time Off (PTO)

Bonus Incentives

Unlimited Cash Referral Program

Full Benefits Package Includes:

Medical, HSA, Dental

Life Insurance & AD&D

PTO & 401(k)

Additional voluntary benefits

For full details and eligibility, refer to the Company's Benefit Summary and Driver Employee Policy Manual.'
  
  ELSE description
END
WHERE job_id IN ('361', '882', '341') AND (description IS NULL OR description = '' OR description LIKE 'Job Position:%');
