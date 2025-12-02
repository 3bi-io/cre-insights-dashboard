import React, { useEffect, useState } from 'react';
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
import { User, Bot, Clock, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useElevenLabsConversations } from '@/hooks/useElevenLabsConversations';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

  useEffect(() => {
    if (open && conversation) {
      loadConversationData();
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

      // If no transcript in DB, fetch from API and then re-query
      if (!transcriptData || transcriptData.length === 0) {
        try {
          const apiResult = await fetchTranscriptFromApiAsync(conversation.conversation_id);
          
          // Check if API returned an error
          if (apiResult?.error === 'transcript_not_found') {
            setTranscriptError(apiResult.message || 'Transcript not available from ElevenLabs');
            setTranscript([]);
          } else {
            // Re-fetch from DB after API stored the data
            const newTranscriptData = await fetchTranscript(conversation.id);
            setTranscript(newTranscriptData || []);
          }
        } catch (apiError) {
          console.error('Could not load transcript from ElevenLabs:', apiError);
          setTranscriptError('Could not load transcript from ElevenLabs');
          setTranscript([]);
        }
      } else {
        setTranscript(transcriptData);
      }

      setAudio(audioData);
    } catch (error) {
      console.error('Error loading conversation data:', error);
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
      console.error('Retry failed:', error);
      setTranscriptError('Failed to load transcript');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Conversation Details</DialogTitle>
          <DialogDescription>
            {conversation.voice_agents?.agent_name} • {format(new Date(conversation.started_at), 'PPpp')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Started</span>
            </div>
            <p className="text-sm font-medium">
              {format(new Date(conversation.started_at), 'HH:mm:ss')}
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Duration</span>
            </div>
            <p className="text-sm font-medium">
              {formatDuration(conversation.duration_seconds)}
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Bot className="h-4 w-4" />
              <span className="text-sm">Messages</span>
            </div>
            <p className="text-sm font-medium">{transcript.length}</p>
          </Card>
        </div>

        {audio && (
          <Card className="p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Audio Recording</span>
              <Badge variant="secondary">{audio.format.toUpperCase()}</Badge>
            </div>
            <audio controls className="w-full">
              <source src={audio.audio_url} type={`audio/${audio.format}`} />
              Your browser does not support the audio element.
            </audio>
          </Card>
        )}

        <div>
          <h3 className="font-medium mb-3">Transcript</h3>
          <ScrollArea className="h-[400px] rounded-md border p-4">
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
            ) : (
              <div className="space-y-4">
                {transcript.map((message, index) => (
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
  );
};
