
-- Update job listings with descriptions for job IDs 328 and 911
UPDATE public.job_listings 
SET description = CASE 
  WHEN job_id = '328' THEN 'Weekly Home Time • Great Mileage • Stay Active on the Job!

Position Overview
We are now hiring experienced CDL-A drivers for a dedicated fleet based out of St. George, UT. This is an active driver role, ideal for professionals who enjoy hands-on work and regular home time.

Job Details
Average Miles/Week: 1,400

Loads/Week: 1–2

Stops/Load: 2–3

Unloading: Required – use of rollers and climbing in/out of trailers as needed

Delivery Regions
Customer deliveries throughout:

AZ, CA, CO, ID, MT, NE, NV, NM, OR, UT, WA, WY

Schedule
Start Time: 6:00 AM

Work Duration: Up to 14 hours per day

Home Time: Weekly 34-hour reset

Days Off: Vary based on freight; typically weekdays

Special Note for Las Vegas Residents:

2 weeks on, followed by 3 days home

Compensation
Mileage Pay

Pay per Load

Safe & On-Time Mileage Bonus: Up to 3% of Mileage Pay

Equipment
Tandem-Axle Sleeper Trucks

53' Dry Van Trailers

Automatic Transmissions

All trucks provided by company

Benefits
Weekly Pay

Weekly Home Time

Health Benefits & 401(k)

Paid Time Off (PTO)

Bonus Incentives

Unlimited Cash Referral Program

Full Benefits Package Includes:

Medical, HSA, Dental

Life Insurance & AD&D

PTO & 401(k)

Additional voluntary benefits

For full eligibility details, see the Company's Benefit Summary and Driver Employee Policy Manual.'
  
  WHEN job_id = '911' THEN '$1,500/Week Guaranteed Through August! • Local & Regional Routes • No-Touch Freight

Position Overview
Are you an experienced CDL-A driver seeking stability, competitive pay, and flexible home time? Join C.R. England's brand-new dedicated fleet in the Denver metro area. This is your chance to get in on the ground floor of a growing account—with guaranteed pay and top-tier equipment.

Why Join This Fleet?
✅ Guaranteed Minimum: $1,500/week through August
✅ All No-Touch Freight: Live unload and drop & hook
✅ Average Weekly Miles: 1,700
✅ Loads/Week: 6
✅ Stops/Week: 13
✅ Excellent Pay + Growth Potential

Delivery Areas
Primarily within Colorado

Also runs to Southern Wyoming and Eastern Utah

Schedule & Home Time
Home Time: Multiple times per week

Local Drivers (Within 50 Miles of Denver):

Home Daily

Occasional overnight runs during surge periods

Compensation
Pay Per Mile

Safe & On-Time Mileage Bonus

Mountain Driving Bonus

Equipment
Brand New 2025 Trucks

Automatic transmissions

Auto-chains for mountain conditions

Benefits
Weekly Pay & Frequent Home Time

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
WHERE job_id IN ('328', '911') AND (description IS NULL OR description = '' OR description LIKE 'Job Position:%');
