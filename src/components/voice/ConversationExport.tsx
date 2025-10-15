import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileJson, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Conversation {
  id: string;
  conversation_id: string;
  agent_id: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  voice_agents?: {
    agent_name: string;
    organizations?: {
      name: string;
    };
  };
}

interface ConversationExportProps {
  conversations: Conversation[];
  disabled?: boolean;
}

export const ConversationExport: React.FC<ConversationExportProps> = ({ 
  conversations,
  disabled = false 
}) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      const headers = ['Date', 'Time', 'Agent', 'Organization', 'Duration (s)', 'Status'];
      const rows = conversations.map(conv => [
        format(new Date(conv.started_at), 'yyyy-MM-dd'),
        format(new Date(conv.started_at), 'HH:mm:ss'),
        conv.voice_agents?.agent_name || 'Unknown',
        conv.voice_agents?.organizations?.name || 'N/A',
        conv.duration_seconds?.toString() || '0',
        conv.status
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `conversations-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`;
      link.click();

      toast({
        title: "Export successful",
        description: `Exported ${conversations.length} conversations to CSV`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export conversations",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToJSON = () => {
    setIsExporting(true);
    try {
      const exportData = conversations.map(conv => ({
        id: conv.id,
        conversation_id: conv.conversation_id,
        agent_name: conv.voice_agents?.agent_name,
        organization: conv.voice_agents?.organizations?.name,
        status: conv.status,
        started_at: conv.started_at,
        ended_at: conv.ended_at,
        duration_seconds: conv.duration_seconds,
      }));

      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `conversations-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
      link.click();

      toast({
        title: "Export successful",
        description: `Exported ${conversations.length} conversations to JSON`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export conversations",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || isExporting || conversations.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          <FileText className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJSON}>
          <FileJson className="h-4 w-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
