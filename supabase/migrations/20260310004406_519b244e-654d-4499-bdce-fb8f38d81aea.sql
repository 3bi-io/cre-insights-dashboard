CREATE OR REPLACE FUNCTION public.get_conversation_message_counts(conversation_ids uuid[])
RETURNS TABLE(conversation_id uuid, message_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.conversation_id, COUNT(*) as message_count
  FROM elevenlabs_transcripts t
  WHERE t.conversation_id = ANY(conversation_ids)
  GROUP BY t.conversation_id;
$$;