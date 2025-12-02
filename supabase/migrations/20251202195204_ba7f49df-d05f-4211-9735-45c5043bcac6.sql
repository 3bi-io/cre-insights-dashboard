-- Clean up existing duplicate transcript entries (keep the earliest created one)
DELETE FROM elevenlabs_transcripts a
USING elevenlabs_transcripts b
WHERE a.id > b.id 
  AND a.conversation_id = b.conversation_id 
  AND a.sequence_number = b.sequence_number;

-- Add unique constraint on conversation_id + sequence_number to prevent future duplicates
ALTER TABLE elevenlabs_transcripts 
ADD CONSTRAINT elevenlabs_transcripts_conversation_sequence_unique 
UNIQUE (conversation_id, sequence_number);