import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { downloadJobUrlsCsv } from '@/utils/exportJobUrls';
import { useToast } from '@/hooks/use-toast';

interface ExportJobUrlsButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export const ExportJobUrlsButton: React.FC<ExportJobUrlsButtonProps> = ({
  variant = 'outline',
  size = 'default',
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await downloadJobUrlsCsv();
      toast({
        title: 'Export Complete',
        description: 'Job URLs CSV has been downloaded successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to export job URLs',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={isExporting}
    >
      {isExporting ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          Export Job URLs (CSV)
        </>
      )}
    </Button>
  );
};
