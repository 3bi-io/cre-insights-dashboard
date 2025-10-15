import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseOutboundWebhookProps {
  webhookUrl?: string;
  enabled?: boolean;
}

export const useOutboundWebhook = ({ webhookUrl, enabled = false }: UseOutboundWebhookProps = {}) => {
  const { toast } = useToast();

  const triggerWebhook = async (
    applicationId: string, 
    eventType: 'created' | 'updated' | 'deleted'
  ) => {
    if (!enabled || !webhookUrl) {
      console.log('Outbound webhook not enabled or URL not provided');
      return;
    }

    try {
      console.log('Triggering outbound webhook for application:', applicationId);
      
      const { data, error } = await supabase.functions.invoke('outbound-webhook', {
        body: {
          application_id: applicationId,
          webhook_url: webhookUrl,
          event_type: eventType
        }
      });

      if (error) {
        console.error('Outbound webhook error:', error);
        toast({
          title: "Webhook Failed",
          description: `Failed to send ${eventType} notification`,
          variant: "destructive",
        });
        return false;
      }

      console.log('Outbound webhook sent successfully:', data);
      return true;
    } catch (error) {
      console.error('Error triggering outbound webhook:', error);
      toast({
        title: "Webhook Error",
        description: "An error occurred while sending webhook notification",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    triggerWebhook
  };
};