

# Create Werner & TMC Clients + Import 3 Job Listings for Career Now Brands

## Current State
- **Career Now Brands** org ID: `650cf2cc-22e7-4a52-8899-b56d315bed2a`
- **Hub Group** client already exists: `8ca3faca-b91c-4ab8-a9af-b145ab265228`
- **Werner Enterprises** — does not exist, needs to be created
- **TMC Transportation** — does not exist, needs to be created
- 1 existing job listing (Hub Group Non-CDL Delivery Driver)

## Step 1: Create Two New Clients

Insert into `clients` table under Career Now Brands org:

| Client | Company | Status |
|--------|---------|--------|
| Werner Enterprises | Werner Enterprises | active |
| TMC Transportation | TMC Transportation | active |

## Step 2: Insert 3 Job Listings

All listings under Career Now Brands org, category "Driver Recruitment" (`61bd5f79-b3c1-4804-a6a0-d568773c3d84`).

### Job 1: Werner Enterprises — Dedicated CDL-A Truck Driver
- **Title**: Dedicated CDL-A Truck Drivers - Multiple Options Available
- **Summary**: Average $75,000-$85,000/Year. Multiple home time options (daily, weekly, bi-weekly). Comprehensive benefits including 401(k), health/dental/vision, $15,000 tuition reimbursement. Solo and team positions. Top performers earn $90,000-$100,000.
- **Salary**: $75,000 - $85,000 / year
- **Job type**: Dedicated
- **Experience**: entry (recent grads accepted)
- **URL**: `https://cdljobnow.com/jobs/4802/werner-enterprises-dedicated-cdl-a-truck-driver-multiple-options-available?cc=48648m681`

### Job 2: TMC Transportation — CDL-A Flatbed Driver
- **Title**: CDL-A Flatbed Drivers
- **Summary**: Earn up to $100,000 annually. Home weekends. Up to $5,000 sign-on bonus. Regional routes within 1,200-mile radius. Employee-owned (ESOP). No experience required. Peterbilt equipment.
- **Salary**: $70,200 - $100,000 / year (avg $1,350-$1,600/week)
- **Job type**: Regional
- **Experience**: entry (no experience required)
- **URL**: `https://cdljobnow.com/jobs/7891/tmc-transportation-cdl-a-flatbed-driver?cc=48649barT`

### Job 3: Hub Group — Intermodal CDL-A Driver East
- **Title**: Intermodal CDL-A Drivers - East
- **Summary**: Earn $67,364-$98,500/year. Local and regional routes. No-touch freight. Multiple home time options including home daily. Health/dental/vision, 401(k) match, paid orientation. At least 1 year experience required.
- **Salary**: $67,364 - $98,500 / year
- **Job type**: Local, Regional
- **Experience**: mid (1 year required)
- **URL**: `https://cdljobnow.com/jobs/6023/hub-group-intermodal-cdl-a-driver-east?cc=48650041b`

## Technical Details
- Use `supabase--analytics_query` (insert tool) to create clients and job listings
- All records reference `user_id` from existing profile (`02093ad0-afb0-4699-b164-ea7aca9ee4df`)
- Apply URLs will point to our platform's apply page with client attribution
- Source URLs preserved in the `url` field for tracking

