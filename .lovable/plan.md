# Insert Church Transportation CDL-A OTR Job Listing

## Summary

Insert a single job listing for Church Transportation & Logistics, Inc. based on the provided job details.

## Data Mapping


| Field                     | Value                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------- |
| **title**                 | Company Driver, CDL-A OTR                                                          |
| **job_title**             | Company Driver, CDL-A OTR                                                          |
| **client**                | Church Transportation                                                              |
| **client_id**             | `dffb0ef4-07a0-494f-9790-ef9868e143c7`                                             |
| **organization_id**       | `84214b48-7b51-45bc-ad7f-723bcf50466c`                                             |
| **user_id**               | `d63913d3-c528-402d-a3a3-1d9d10ec40ea`                                             |
| **category_id**           | `61bd5f79-b3c1-4804-a6a0-d568773c3d84` (Driver Recruitment)                        |
| **city**                  | Frisco City                                                                        |
| **state**                 | AL                                                                                 |
| **location**              | Frisco City, AL                                                                    |
| **salary_min**            | &nbsp;                                                                             |
| **salary_max**            | &nbsp;                                                                             |
| **salary_type**           | yearly                                                                             |
| **job_type**              | full-time                                                                          |
| **experience_level**      | mid                                                                                |
| **min_experience_months** | 36 (3 years required)                                                              |
| **status**                | active                                                                             |
| **job_summary**           | Truncated plain-text summary for list views                                        |
| **job_description**       | Full HTML/text description with benefits, qualifications, supplemental pay details |


## Steps

1. **Insert the job** via the Supabase insert tool with all mapped fields above
2. **Verify** the record appears in the database

## Technical Details

- Uses the existing `user_id` and `organization_id` from current data
- Category set to "Driver Recruitment" which matches the CDL-A driver role
- Salary mapped as yearly based on "36K–60K a year"
- Experience set to 36 months (3 years required per listing)