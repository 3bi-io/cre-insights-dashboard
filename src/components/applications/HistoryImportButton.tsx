import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Download, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVoiceAgents } from '@/features/elevenlabs/hooks';
import { logger } from '@/lib/logger';

const HistoryImportButton = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const { toast } = useToast();
  const { voiceAgents, isLoading } = useVoiceAgents();

  const handleImport = async () => {
    if (!selectedAgentId) {
      toast({
        title: "No agent selected",
        description: "Please select a voice agent first",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    
    try {
      const agent = voiceAgents?.find(a => a.id === selectedAgentId);
      if (!agent) {
        throw new Error('Agent not found');
      }

      const { data, error } = await supabase.functions.invoke('elevenlabs-conversations', {
        body: { 
          action: 'list_conversations', 
          agentId: agent.elevenlabs_agent_id 
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        toast({
          title: "Import Successful",
          description: data.message || "Successfully synced historic conversations",
        });
      } else {
        throw new Error(data.error || 'Import failed');
      }
    } catch (error) {
      logger.error('Import error:', error);
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
    <div className="flex items-center gap-2">
      <Select
        value={selectedAgentId}
        onValueChange={setSelectedAgentId}
        disabled={isLoading || isImporting}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select agent..." />
        </SelectTrigger>
        <SelectContent>
          {voiceAgents?.map((agent) => (
            <SelectItem key={agent.id} value={agent.id}>
              {agent.agent_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button
        onClick={handleImport}
        disabled={isImporting || !selectedAgentId}
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
    </div>
  );
};

export default HistoryImportButton;