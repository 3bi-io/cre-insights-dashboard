

# Update R.E. Garrison Job Listings with Coverage Locations

## What the Documents Show

### Owner Ops States Map (OTR coverage)
Yellow-highlighted states representing OTR operating territory. Covers most of the eastern US plus central/mountain states:

**States**: TX, OK, AR, LA, MS, AL, TN, KY, GA, FL, SC, NC, VA, WV, OH, IN, IL, MO, KS, NE, IA, SD, MN, WI, MI, CO, UT, AZ, NM, PA, NY, CT, NJ, DE, MD

### Regional Maps (Regional coverage)
Two distinct regional zones:

- **Southeast Regional** (red): TX, AR, LA, MS, AL, TN, KY, GA, SC, NC, VA, FL
- **Central Regional** (gold): TX, LA, AR, OK, KS, NE, IA, MN, WI, IL, MO

## Job-to-Coverage Mapping

| Job Listing | Coverage Area | Map Source |
|-------------|--------------|------------|
| 1. Solo Owner Operator - OTR Lease Purchase | All 35 OTR states | Owner Ops States map |
| 2. Solo Owner Operator - Regional Lease Purchase | Southeast + Central Regional (two zones) | Regional Maps |
| 3. Team Owner Operators - OTR | All 35 OTR states | Owner Ops States map |
| 4. Owner Operator - Bring Your Own Truck (Reefer) | All 35 OTR states | Owner Ops States map |

## Plan

### Step 1: Update all 4 job listings with location data
Run a SQL migration to set `location` and `job_type` fields:

- **OTR jobs** (listings 1, 3, 4): Set `location` to summary of OTR states, `job_type` to `OTR`
- **Regional job** (listing 2): Set `location` to describe both SE and Central regions, `job_type` to `Regional`

### Step 2: Update job descriptions with coverage details
Append coverage area details into each listing's `job_summary` field so drivers can see which states are covered directly in the listing. Include the specific state lists for each position.

## Technical Details

**Job IDs**:
- OTR LP: `99d461b1-96c1-4cf2-823e-f29781d2009f`
- Regional LP: `0614cde1-ccf3-4ef8-84aa-fa3e2694f29d`
- Team OTR: `d77332d7-7ea7-4320-af34-bc360fa2958d`
- BYOT Reefer: `4eb6e012-9fc5-441c-bc24-46225d23d83b`

**OTR States** (35): AZ, UT, CO, NM, TX, OK, AR, LA, MS, AL, TN, KY, GA, FL, SC, NC, VA, WV, OH, IN, IL, MO, KS, NE, IA, SD, MN, WI, MI, PA, NY, CT, NJ, DE, MD

**Southeast Regional** (12): TX, AR, LA, MS, AL, TN, KY, GA, SC, NC, VA, FL

**Central Regional** (11): TX, LA, AR, OK, KS, NE, IA, MN, WI, IL, MO

