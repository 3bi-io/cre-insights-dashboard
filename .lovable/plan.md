

# Create CDL Job Now Carriers as Clients

## Summary
Insert 23 new client records for organization `fd4d6327-32df-467f-aba7-ccfeecccd934` (dev-5761e7e0), one for each carrier found on cdljobnow.com/jobs that doesn't already exist.

## Already Existing (skip)
- Hub Group
- TMC Transportation
- Werner Enterprises

## New Carriers to Create (23)
1. APL Cargo, Inc.
2. C.R. England
3. Chicago Intermodal Transportation
4. Crete Carrier Corporation
5. Dart
6. Go2 Logistics
7. Heartland Express
8. Hogan Transports
9. Hub Group Final Mile
10. IMC Logistics
11. J&M Tank Lines
12. J&R Schugel
13. J.B. Hunt
14. J.L. Rothrock Inc.
15. Kottke Trucking, Inc
16. Marten Transport
17. Melton Truck Lines
18. Messer
19. Ryder
20. Soar Transportation Group
21. System Transport
22. U.S. Xpress
23. Western Express, Inc.

## Implementation
Single SQL INSERT using the Supabase insert tool (data operation, not schema change):

```sql
INSERT INTO clients (name, status, organization_id) VALUES
  ('APL Cargo, Inc.', 'active', 'fd4d6327-32df-467f-aba7-ccfeecccd934'),
  ('C.R. England', 'active', 'fd4d6327-32df-467f-aba7-ccfeecccd934'),
  ('Chicago Intermodal Transportation', 'active', 'fd4d6327-32df-467f-aba7-ccfeecccd934'),
  -- ... all 23 carriers
  ('Western Express, Inc.', 'active', 'fd4d6327-32df-467f-aba7-ccfeecccd934');
```

No code changes or migrations needed -- this is a data insert only.

