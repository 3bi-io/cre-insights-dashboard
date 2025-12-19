-- Cancel the 3 stuck queued calls (rate-limited duplicates)
UPDATE outbound_calls 
SET status = 'cancelled', 
    error_message = 'Cancelled - duplicate rate-limited calls',
    updated_at = now()
WHERE id IN (
  '11ab5b14-cc75-45cc-9744-b519cc4a0731',
  '9fa91606-90da-44c7-a4fc-f9c3cbe7b929',
  'a1ef7377-e47e-437d-ab27-2efd9c2c7d0b'
);