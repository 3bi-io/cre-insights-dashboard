import React from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { useOrganizationWebhook } from '@/hooks/useOrganizationWebhook';
import { useToast } from '@/hooks/use-toast';

interface ExportToN8nButtonProps {
  filters: {
    search?: string;
    status?: string;
    source?: string;
    category?: string;
    organization_id?: string;
  };
  disabled?: boolean;
}

export const ExportToN8nButton: React.FC<ExportToN8nButtonProps> = ({ filters, disabled }) => {
  const { webhook, exportApplications, isExporting } = useOrganizationWebhook();
  const { toast } = useToast();

  const handleExport = () => {
    if (!webhook?.enabled) {
      toast({
        title: 'Webhook Not Configured',
        description: 'Please configure your n8n webhook in the Webhook Management page first.',
        variant: 'destructive',
      });
      return;
    }

    // Remove 'all' values and organization_id from filters
    const cleanedFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value && value !== 'all' && key !== 'organization_id') {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string>);

    exportApplications({ filters: cleanedFilters });
  };

  if (!webhook) {
    return null; // Don't show button if no webhook configured
  }

  return (
    <Button
      onClick={handleExport}
      disabled={disabled || isExporting || !webhook.enabled}
      variant="outline"
      size="sm"
    >
      {isExporting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Send className="mr-2 h-4 w-4" />
          Export to n8n
        </>
      )}
    </Button>
  );
};
