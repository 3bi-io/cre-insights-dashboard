import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Download, Loader2 } from 'lucide-react';

const HistoryImportButton = () => {
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleImport = async () => {
    setIsImporting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('import-elevenlabs-history', {
        body: { agentId: 'agent_01jwedntnjf7tt0qma00a2276r' }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        toast({
          title: "Import Successful",
          description: data.message,
        });
      } else {
        throw new Error(data.error || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : 'Failed to import historic data',
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Button
      onClick={handleImport}
      disabled={isImporting}
      variant="outline"
      className="flex items-center gap-2"
    >
      {isImporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      {isImporting ? 'Importing...' : 'Import Historic Calls'}
    </Button>
  );
};

export default HistoryImportButton;