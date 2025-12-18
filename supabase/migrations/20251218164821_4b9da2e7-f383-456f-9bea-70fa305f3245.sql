-- Create trigger to queue outbound calls when applications are inserted
CREATE TRIGGER on_application_insert_queue_outbound_call
AFTER INSERT ON applications
FOR EACH ROW
EXECUTE FUNCTION trigger_application_insert_outbound_call();