import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WebhookOption {
  id: string;
  label: string;
  count: number;
  type: 'direct' | 'webhook';
}

export const useWebhookOptions = (organizationId?: string) => {
  return useQuery({
    queryKey: ['webhook-options', organizationId],
    queryFn: async () => {
      // Get count of direct applications (no webhook logs)
      let directQuery = supabase
        .from('applications')
        .select('id, job_listing_id', { count: 'exact', head: false })
        .eq('source', 'Direct Application');

      const { data: directApps, count: directCount, error: directError } = await directQuery;
      
      if (directError) throw directError;

      // Filter by organization if needed
      let filteredDirectCount = directCount || 0;
      if (organizationId && organizationId !== 'all' && directApps) {
        const jobListingsQuery = await supabase
          .from('job_listings')
          .select('id')
          .eq('organization_id', organizationId);
        
        const jobIds = new Set(jobListingsQuery.data?.map(j => j.id) || []);
        filteredDirectCount = directApps.filter(app => jobIds.has(app.job_listing_id)).length;
      }

      // Get webhooks with application counts
      const { data: webhookLogs, error: webhookError } = await supabase
        .from('client_webhook_logs')
        .select(`
          application_id,
          webhook_id,
          webhook:client_webhooks(
            id,
            webhook_url,
            organization_id,
            client:clients(name, company),
            organization:organizations(name)
          )
        `)
        .not('application_id', 'is', null);

      if (webhookError) throw webhookError;

      // Group by webhook and count
      const webhookCounts = new Map<string, { webhook: any; count: number }>();
      
      webhookLogs?.forEach((log: any) => {
        const webhook = log.webhook;
        if (!webhook) return;
        
        // Filter by organization if needed
        if (organizationId && organizationId !== 'all' && webhook.organization_id !== organizationId) {
          return;
        }

        const webhookId = webhook.id;
        const existing = webhookCounts.get(webhookId);
        if (existing) {
          existing.count++;
        } else {
          webhookCounts.set(webhookId, {
            webhook: webhook,
            count: 1
          });
        }
      });

      // Build options array
      const options: WebhookOption[] = [
        {
          id: 'direct',
          label: 'Direct Applications (/apply)',
          count: filteredDirectCount,
          type: 'direct'
        }
      ];

      // Add webhook options
      Array.from(webhookCounts.entries()).forEach(([id, { webhook, count }]) => {
        const clientName = webhook.client?.company || webhook.client?.name;
        const orgName = webhook.organization?.name;
        const label = clientName || orgName || 'Unknown Source';
        
        options.push({
          id: id,
          label: `${label} (Webhook)`,
          count: count,
          type: 'webhook'
        });
      });

      // Sort by count descending
      return options.sort((a, b) => b.count - a.count);
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};
