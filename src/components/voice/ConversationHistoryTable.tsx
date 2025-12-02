import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ConversationDetailsDialog } from './ConversationDetailsDialog';

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

interface ConversationHistoryTableProps {
  conversations: Conversation[];
  onViewDetails?: (conversation: Conversation) => void;
  onDownloadAudio: (conversationId: string) => void;
  isDownloadingAudio: boolean;
}

export const ConversationHistoryTable: React.FC<ConversationHistoryTableProps> = ({
  conversations,
  onDownloadAudio,
  isDownloadingAudio,
}) => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conversations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No conversations found
                </TableCell>
              </TableRow>
            ) : (
              conversations.map((conversation) => (
                <TableRow key={conversation.id}>
                  <TableCell>
                    {format(new Date(conversation.started_at), 'MMM d, yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="font-medium">
                    {conversation.voice_agents?.agent_name || 'Unknown Agent'}
                  </TableCell>
                  <TableCell>
                    {conversation.voice_agents?.organizations?.name || 'N/A'}
                  </TableCell>
                  <TableCell>{formatDuration(conversation.duration_seconds)}</TableCell>
                  <TableCell>
                    <Badge variant={conversation.status === 'completed' ? 'default' : 'secondary'}>
                      {conversation.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedConversation(conversation)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownloadAudio(conversation.conversation_id)}
                        disabled={isDownloadingAudio}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Audio
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedConversation && (
        <ConversationDetailsDialog
          conversation={selectedConversation}
          open={!!selectedConversation}
          onOpenChange={(open) => !open && setSelectedConversation(null)}
        />
      )}
    </>
  );
};
