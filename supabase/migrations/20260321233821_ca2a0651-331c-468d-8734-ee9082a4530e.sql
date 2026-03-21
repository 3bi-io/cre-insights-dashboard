-- Update OTR LP
UPDATE job_listings SET 
  location = 'OTR - 35 States: AZ, UT, CO, NM, TX, OK, AR, LA, MS, AL, TN, KY, GA, FL, SC, NC, VA, WV, OH, IN, IL, MO, KS, NE, IA, SD, MN, WI, MI, PA, NY, CT, NJ, DE, MD',
  job_type = 'OTR',
  job_summary = job_summary || E'\n\n### Coverage Area - OTR (35 States)\nAZ, UT, CO, NM, TX, OK, AR, LA, MS, AL, TN, KY, GA, FL, SC, NC, VA, WV, OH, IN, IL, MO, KS, NE, IA, SD, MN, WI, MI, PA, NY, CT, NJ, DE, MD'
WHERE id = '99d461b1-96c1-4cf2-823e-f29781d2009f';

-- Update Regional LP
UPDATE job_listings SET 
  location = 'Regional - Southeast & Central US',
  job_type = 'Regional',
  job_summary = job_summary || E'\n\n### Coverage Areas\n**Southeast Regional:** TX, AR, LA, MS, AL, TN, KY, GA, SC, NC, VA, FL\n**Central Regional:** TX, LA, AR, OK, KS, NE, IA, MN, WI, IL, MO'
WHERE id = '0614cde1-ccf3-4ef8-84aa-fa3e2694f29d';

-- Update Team OTR
UPDATE job_listings SET 
  location = 'OTR - 35 States: AZ, UT, CO, NM, TX, OK, AR, LA, MS, AL, TN, KY, GA, FL, SC, NC, VA, WV, OH, IN, IL, MO, KS, NE, IA, SD, MN, WI, MI, PA, NY, CT, NJ, DE, MD',
  job_type = 'OTR',
  job_summary = job_summary || E'\n\n### Coverage Area - OTR (35 States)\nAZ, UT, CO, NM, TX, OK, AR, LA, MS, AL, TN, KY, GA, FL, SC, NC, VA, WV, OH, IN, IL, MO, KS, NE, IA, SD, MN, WI, MI, PA, NY, CT, NJ, DE, MD'
WHERE id = 'd77332d7-7ea7-4320-af34-bc360fa2958d';

-- Update BYOT Reefer
UPDATE job_listings SET 
  location = 'OTR - 35 States: AZ, UT, CO, NM, TX, OK, AR, LA, MS, AL, TN, KY, GA, FL, SC, NC, VA, WV, OH, IN, IL, MO, KS, NE, IA, SD, MN, WI, MI, PA, NY, CT, NJ, DE, MD',
  job_type = 'OTR',
  job_summary = job_summary || E'\n\n### Coverage Area - OTR (35 States)\nAZ, UT, CO, NM, TX, OK, AR, LA, MS, AL, TN, KY, GA, FL, SC, NC, VA, WV, OH, IN, IL, MO, KS, NE, IA, SD, MN, WI, MI, PA, NY, CT, NJ, DE, MD'
WHERE id = '4eb6e012-9fc5-441c-bc24-46225d23d83b';