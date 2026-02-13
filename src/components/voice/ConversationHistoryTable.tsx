import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Share2, ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ConversationDetailsDialog } from './ConversationDetailsDialog';
import { ShareConversationDialog } from './ShareConversationDialog';
import { ConversationAudioPlayer } from './ConversationAudioPlayer';

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
  const [shareConversation, setShareConversation] = useState<Conversation | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleExpand = (id: string) => {
    setExpandedRow(prev => prev === id ? null : id);
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
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
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No conversations found
                </TableCell>
              </TableRow>
            ) : (
              conversations.map((conversation) => (
                <React.Fragment key={conversation.id}>
                  <TableRow className="cursor-pointer" onClick={() => toggleExpand(conversation.id)}>
                    <TableCell className="w-[40px]">
                      {expandedRow === conversation.id ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
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
                    <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
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
                          onClick={() => setShareConversation(conversation)}
                        >
                          <Share2 className="h-4 w-4 mr-1" />
                          Share
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedRow === conversation.id && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-muted/50 p-4">
                        <div className="max-w-xl">
                          <p className="text-xs text-muted-foreground mb-2">Audio Recording</p>
                          <ConversationAudioPlayer
                            conversationId={conversation.conversation_id}
                            compact
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
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

      {shareConversation && (
        <ShareConversationDialog
          conversationId={shareConversation.conversation_id}
          conversationDbId={shareConversation.id}
          agentName={shareConversation.voice_agents?.agent_name}
          open={!!shareConversation}
          onOpenChange={(open) => !open && setShareConversation(null)}
        />
      )}
    </>
  );
};
