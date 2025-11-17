import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('client-webhook', {
        body: {
          application_id: applicationId,
          event_type: eventType,
          test_mode: false,
        }
      });

      if (error) {
        console.error('[CLIENT-WEBHOOK] Error:', error);
        // Don't show toast for webhook errors - they're logged in the system
        return false;
      }

      return data?.success || false;
    } catch (error) {
      console.error('[CLIENT-WEBHOOK] Exception:', error);
      return false;
    }
  };

  const testWebhook = async (webhookId: string, applicationId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('client-webhook', {
        body: {
          application_id: applicationId,
          event_type: 'created',
          test_mode: true,
        }
      });

      if (error) {
        console.error('[CLIENT-WEBHOOK] Test error:', error);
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
      console.error('[CLIENT-WEBHOOK] Test exception:', error);
      toast({
        title: "Webhook Error",
        description: "An error occurred while testing webhook",
        variant: "destructive",
      });
      return false;
    }
  };

  const bulkExport = async (webhookId: string) => {
    if (!enabled) {
      return { success: false, count: 0 };
    }

    try {
      const { data, error } = await supabase.functions.invoke('client-webhook-bulk-export', {
        body: {
          webhook_id: webhookId,
        }
      });

      if (error) {
        console.error('[CLIENT-WEBHOOK-BULK] Error:', error);
        toast({
          title: "Bulk Export Failed",
          description: error.message,
          variant: "destructive",
        });
        return { success: false, count: 0 };
      }

      if (data?.success) {
        toast({
          title: "Bulk Export Successful",
          description: `Sent ${data.applications_sent} applications to webhook`,
        });
        return { success: true, count: data.applications_sent };
      } else {
        toast({
          title: "Bulk Export Failed",
          description: data?.error || "Unknown error",
          variant: "destructive",
        });
        return { success: false, count: 0 };
      }
    } catch (error) {
      console.error('[CLIENT-WEBHOOK-BULK] Exception:', error);
      toast({
        title: "Bulk Export Error",
        description: "An error occurred while exporting applications",
        variant: "destructive",
      });
      return { success: false, count: 0 };
    }
  };

  return {
    triggerWebhook,
    testWebhook,
    bulkExport,
  };
};
