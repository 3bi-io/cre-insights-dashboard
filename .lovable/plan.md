

## Add Hub Group Job Listing from CDL Job Now

### What We're Doing
Insert a single job listing scraped from the provided URL into the `job_listings` table, linked to the existing Hub Group client.

### Job Details Extracted
| Field | Value |
|-------|-------|
| **Title** | Non-CDL Delivery Driver - Cedar Rapids, IA |
| **Company/Client** | Hub Group (client_id: `8ca3faca-b91c-4ab8-a9af-b145ab265228`) |
| **Location** | Cedar Rapids, IA |
| **Pay** | $70,441/year ($24.63/hr + OT) |
| **Job Type** | Local, Home Daily |
| **Category** | Driver Recruitment |

### Job Summary
Drive 26' straight box truck and work as a two-man team to deliver and install household appliances. Local routes, home daily. Benefits include medical, dental, and 401(k).

### Requirements
- Non-CDL licensed driver
- DOT physical card
- 6 months previous driving experience
- Ability to lift 150+ lbs repeatedly
- Must pass pre-employment drug screen including hair follicle

### Technical Implementation
Insert one row into `job_listings` with:
- `client_id` = Hub Group UUID
- `category_id` = Driver Recruitment UUID
- `user_id` = super admin UUID
- `salary_min` = 70441, `salary_type` = yearly
- `city` = Cedar Rapids, `state` = IA
- `url` = the source URL
- `status` = active
- `experience_level` = entry
- `job_summary` = full description with pay, benefits, requirements, and responsibilities

### Files Modified
- None -- this is a direct database insert via Supabase

