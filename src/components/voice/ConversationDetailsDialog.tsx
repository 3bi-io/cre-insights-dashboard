import React, { useEffect, useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { User, Bot, Clock, Calendar, AlertCircle, Share2, Copy, Search, FileText, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { useElevenLabsConversations } from '@/hooks/useElevenLabsConversations';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { logger } from '@/lib/logger';
import { ShareConversationDialog } from './ShareConversationDialog';
import { ConversationAudioPlayer } from './ConversationAudioPlayer';
import { toast } from 'sonner';

interface Conversation {
  id: string;
  conversation_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  voice_agents?: {
    agent_name: string;
  };
}

interface ConversationDetailsDialogProps {
  conversation: Conversation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ConversationDetailsDialog: React.FC<ConversationDetailsDialogProps> = ({
  conversation,
  open,
  onOpenChange,
}) => {
  const { fetchTranscript, fetchAudio, fetchTranscriptFromApiAsync, isFetchingTranscript } = useElevenLabsConversations();
  const [transcript, setTranscript] = useState<any[]>([]);
  const [audio, setAudio] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (open && conversation) {
      loadConversationData();
      setSearchQuery('');
    }
  }, [open, conversation]);

  const loadConversationData = async () => {
    setLoading(true);
    setTranscriptError(null);
    try {
      const [transcriptData, audioData] = await Promise.all([
        fetchTranscript(conversation.id),
        fetchAudio(conversation.id),
      ]);

      if (!transcriptData || transcriptData.length === 0) {
        try {
          const apiResult = await fetchTranscriptFromApiAsync(conversation.conversation_id);
          if (apiResult?.error === 'transcript_not_found') {
            setTranscriptError(apiResult.message || 'Transcript not available from ElevenLabs');
            setTranscript([]);
          } else {
            const newTranscriptData = await fetchTranscript(conversation.id);
            setTranscript(newTranscriptData || []);
          }
        } catch (apiError) {
          logger.error('Could not load transcript from ElevenLabs', apiError, { context: 'conversation-details' });
          setTranscriptError('Could not load transcript from ElevenLabs');
          setTranscript([]);
        }
      } else {
        setTranscript(transcriptData);
      }

      setAudio(audioData);
    } catch (error) {
      logger.error('Error loading conversation data', error, { context: 'conversation-details' });
    } finally {
      setLoading(false);
    }
  };

  const handleRetryLoadTranscript = async () => {
    setLoading(true);
    setTranscriptError(null);
    try {
      const apiResult = await fetchTranscriptFromApiAsync(conversation.conversation_id);
      if (apiResult?.error === 'transcript_not_found') {
        setTranscriptError(apiResult.message || 'Transcript not available');
      } else {
        const newTranscriptData = await fetchTranscript(conversation.id);
        setTranscript(newTranscriptData || []);
      }
    } catch (error) {
      logger.error('Retry failed', error, { context: 'conversation-details' });
      setTranscriptError('Failed to load transcript');
    } finally {
      setLoading(false);
    }
  };

  const filteredTranscript = useMemo(() => {
    if (!searchQuery.trim()) return transcript;
    const q = searchQuery.toLowerCase();
    return transcript.filter(msg => msg.message?.toLowerCase().includes(q));
  }, [transcript, searchQuery]);

  const wordCount = useMemo(() => {
    return transcript.reduce((count, msg) => count + (msg.message?.split(/\s+/).length || 0), 0);
  }, [transcript]);

  const handleCopyTranscript = () => {
    const text = transcript
      .map(msg => `[${msg.speaker === 'agent' ? 'Agent' : 'User'}] ${msg.message}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    toast.success('Transcript copied to clipboard');
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Conversation Details</DialogTitle>
              <DialogDescription>
                {conversation.voice_agents?.agent_name} • {format(new Date(conversation.started_at), 'PPpp')}
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShareDialog(true)}
              className="ml-4"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </DialogHeader>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <Card className="p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-xs">Started</span>
            </div>
            <p className="text-sm font-medium">
              {format(new Date(conversation.started_at), 'HH:mm:ss')}
            </p>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-xs">Duration</span>
            </div>
            <p className="text-sm font-medium">
              {formatDuration(conversation.duration_seconds)}
            </p>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="text-xs">Messages</span>
            </div>
            <p className="text-sm font-medium">{transcript.length}</p>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <FileText className="h-3.5 w-3.5" />
              <span className="text-xs">Words</span>
            </div>
            <p className="text-sm font-medium">{wordCount.toLocaleString()}</p>
          </Card>
        </div>

        {/* Audio Player */}
        <Card className="p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Audio Recording</span>
            {audio && <Badge variant="secondary">{audio.format?.toUpperCase() || 'MP3'}</Badge>}
          </div>
          <ConversationAudioPlayer conversationId={conversation.conversation_id} />
        </Card>

        {/* Transcript section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Transcript</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search transcript..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 w-[200px] text-sm"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyTranscript}
                disabled={transcript.length === 0}
              >
                <Copy className="h-3.5 w-3.5 mr-1" />
                Copy
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[350px] rounded-md border p-4">
            {loading || isFetchingTranscript ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ))}
              </div>
            ) : transcript.length === 0 ? (
              <div className="text-center py-8 space-y-4">
                {transcriptError ? (
                  <Alert variant="destructive" className="text-left">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{transcriptError}</AlertDescription>
                  </Alert>
                ) : (
                  <p className="text-muted-foreground">No transcript available</p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetryLoadTranscript}
                  disabled={isFetchingTranscript}
                >
                  {isFetchingTranscript ? 'Loading...' : 'Retry Load Transcript'}
                </Button>
              </div>
            ) : filteredTranscript.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No messages match "{searchQuery}"</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTranscript.map((message, index) => (
                  <div
                    key={message.id || index}
                    className={`flex gap-3 ${
                      message.speaker === 'agent' ? 'flex-row' : 'flex-row-reverse'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.speaker === 'agent' ? 'bg-primary/10' : 'bg-secondary'
                    }`}>
                      {message.speaker === 'agent' ? (
                        <Bot className="h-4 w-4 text-primary" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    <div className={`flex-1 ${message.speaker !== 'agent' ? 'text-right' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">
                          {message.speaker === 'agent' ? 'Agent' : 'User'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(message.timestamp), 'HH:mm:ss')}
                        </span>
                      </div>
                      <Card className={`p-3 inline-block max-w-[80%] ${
                        message.speaker === 'agent' ? 'bg-muted' : 'bg-primary/10'
                      }`}>
                        <p className="text-sm">{message.message}</p>
                      </Card>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>

    <ShareConversationDialog
      conversationId={conversation.conversation_id}
      conversationDbId={conversation.id}
      agentName={conversation.voice_agents?.agent_name}
      open={showShareDialog}
      onOpenChange={setShowShareDialog}
    />
    </>
  );
};
