

# Create R.E. Garrison Job Listings

## Context
- **Client**: R.E. Garrison Trucking (`be8b645e-d480-4c22-8e75-b09a7fc1db7a`)
- **Organization**: Hayes Recruiting Solutions (`84214b48-7b51-45bc-ad7f-723bcf50466c`)
- **Category**: Driver Recruitment (`61bd5f79-b3c1-4804-a6a0-d568773c3d84`)
- **User ID**: `5761e7e0-1bdf-43b1-ba5f-19a24f9d025e`
- **Current listings**: 0

## Job Listings to Create

Based on the provided info, there are 4 distinct positions:

### Job 1: Solo Owner Operator - OTR (Lease Purchase)
- **Title**: Solo Owner Operator - OTR Lease Purchase
- **Summary**: Drive 2021+ trucks on OTR routes. Earn $2,000-$3,000 weekly take-home ($4,000-$5,000 gross). We pay 70% of line haul + 100% of billed fuel surcharge. No trailer rental fees. Nationwide fuel & maintenance discounts. $50/hr detention pay after first hour (max $500/day). Weekly pay via Comdata. Insurance available after 60 days. Reefer freight. 1 year experience required in last 10 years with activity in last 2 years. Truck must pass DOT inspection and support Samsara ELD.
- **Salary**: $104,000-$156,000/year (based on $2k-$3k weekly take-home)
- **Salary type**: yearly
- **Job type**: OTR
- **Experience**: mid

### Job 2: Solo Owner Operator - Regional (Lease Purchase)
- **Title**: Solo Owner Operator - Regional Lease Purchase
- **Summary**: Drive 2019-2021 tractors with lower payments and higher miles on regional routes. Earn $2,000-$3,000 weekly take-home ($4,000-$5,000 gross). 70% of line haul + 100% of fuel surcharge. No trailer rental. Nationwide fuel & maintenance discounts. Weekly pay. Insurance after 60 days. $40/hr detention pay after first 3 hours (max $400/day). 1 year experience required in last 10 years. Truck must pass DOT inspection and support ELD.
- **Salary**: $104,000-$156,000/year
- **Salary type**: yearly
- **Job type**: Regional
- **Experience**: mid

### Job 3: Team Owner Operators - OTR
- **Title**: Team Owner Operators - OTR
- **Summary**: Team drivers earn $2,500-$4,500 weekly take-home per driver. 70% of line haul + 100% of billed fuel surcharge. No trailer rental fees. Nationwide fuel & maintenance discounts. Weekly pay via Comdata. $50/hr detention pay after first hour (max $500/day). Reefer freight. With or without your own authority. Insurance after 60 days. 1 year experience required in last 10 years with activity in last 2 years.
- **Salary**: $130,000-$234,000/year (based on $2.5k-$4.5k weekly)
- **Salary type**: yearly
- **Job type**: OTR
- **Experience**: mid

### Job 4: Owner Operator - Bring Your Own Truck
- **Title**: Owner Operator - Bring Your Own Truck (Reefer)
- **Summary**: Run your own truck under R.E. Garrison. Earn $4,000-$5,000 gross weekly. 70% of line haul + 100% of billed fuel surcharge. No trailer rental. With or without your own authority. Preplanned loads. Nationwide fuel & maintenance discounts. Weekly deductions: Bobtail $6.69/wk, Workers Comp $50/wk. Truck must pass DOT inspection within 30 days and support Samsara ELD. 1 year experience required in last 10 years.
- **Salary**: $208,000-$260,000/year gross
- **Salary type**: yearly
- **Job type**: OTR
- **Experience**: mid

## Execution
Insert all 4 job listings into `job_listings` via `supabase--analytics_query` with:
- `status: 'active'`
- `experience_level: 'mid'` (1 year required)
- `category_id`: Driver Recruitment
- `client_id`: R.E. Garrison Trucking
- Detailed `job_description` field with full compensation breakdown, deductions, requirements, and lease purchase payment schedules where applicable

