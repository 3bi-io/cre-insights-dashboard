import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface UseClientWebhookProps {
  enabled?: boolean;
}

export const useClientWebhook = ({ enabled = true }: UseClientWebhookProps = {}) => {
  const { toast } = useToast();

  const triggerWebhook = async (
    applicationId: string, 
    eventType: 'created' | 'updated' | 'deleted'
  ) => {
    if (!enabled) {
      logger.debug('Webhook triggers disabled', { context: 'client-webhook' });
      return false;
    }

    try {
      logger.info('Triggering webhook', { applicationId, eventType, context: 'client-webhook' });
      
      const { data, error } = await supabase.functions.invoke('client-webhook', {
        body: {
          application_id: applicationId,
          event_type: eventType,
          test_mode: false,
        }
      });

      if (error) {
        logger.error('Webhook trigger failed', error, { applicationId, context: 'client-webhook' });
        return false;
      }

      logger.debug('Webhook response received', { success: data?.success, context: 'client-webhook' });
      return data?.success || false;
    } catch (error) {
      logger.error('Webhook trigger exception', error, { applicationId, context: 'client-webhook' });
      return false;
    }
  };

  const testWebhook = async (webhookId: string, applicationId: string) => {
    try {
      logger.info('Testing webhook', { webhookId, applicationId, context: 'client-webhook' });
      
      const { data, error } = await supabase.functions.invoke('client-webhook', {
        body: {
          application_id: applicationId,
          event_type: 'created',
          test_mode: true,
        }
      });

      if (error) {
        logger.error('Webhook test failed', error, { webhookId, context: 'client-webhook' });
        toast({
          title: "Webhook Test Failed",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      if (data?.success) {
        toast({
          title: "Webhook Test Successful",
          description: "Test payload sent successfully",
        });
        return true;
      } else {
        toast({
          title: "Webhook Test Failed",
          description: data?.error || "Unknown error",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      logger.error('Webhook test exception', error, { webhookId, context: 'client-webhook' });
      toast({
        title: "Webhook Error",
        description: "An error occurred while testing webhook",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    triggerWebhook,
    testWebhook,
  };
};
