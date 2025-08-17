import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SmsConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: any;
  currentRecruiterId?: string;
}

const SmsConversationDialog: React.FC<SmsConversationDialogProps> = ({
  open,
  onOpenChange,
  application,
  currentRecruiterId
}) => {
  const [message, setMessage] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get existing conversation
  const { data: conversation } = useQuery({
    queryKey: ['sms-conversation', application?.id],
    queryFn: async () => {
      if (!application?.id) return null;
      
      const { data, error } = await supabase
        .from('sms_conversations')
        .select('*')
        .eq('application_id', application.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!application?.id && open,
  });

  // Get messages for the conversation
  const { data: messages } = useQuery({
    queryKey: ['sms-messages', conversation?.id],
    queryFn: async () => {
      if (!conversation?.id) return [];
      
      const { data, error } = await supabase
        .from('sms_messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!conversation?.id,
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async () => {
      if (!application?.phone || !currentRecruiterId) {
        throw new Error('Phone number and recruiter required');
      }

      const { data, error } = await supabase
        .from('sms_conversations')
        .insert({
          application_id: application.id,
          recruiter_id: currentRecruiterId,
          phone_number: application.phone
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-conversation', application?.id] });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, messageText }: { conversationId: string; messageText: string }) => {
      // First, store the message in the database
      const { data: messageData, error: messageError } = await supabase
        .from('sms_messages')
        .insert({
          conversation_id: conversationId,
          message: messageText,
          direction: 'outbound',
          sender_type: 'recruiter'
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Send SMS via edge function
      const { data: smsResult, error: smsError } = await supabase.functions.invoke('send-sms', {
        body: {
          to: application.phone,
          message: messageText,
          conversationId: conversationId,
          messageId: messageData.id
        }
      });

      if (smsError) throw smsError;
      return { messageData, smsResult };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-messages'] });
      setMessage('');
      toast({
        title: 'Message sent',
        description: 'SMS message sent successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send SMS message.',
        variant: 'destructive',
      });
    },
  });

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    let conversationId = conversation?.id;
    
    // Create conversation if it doesn't exist
    if (!conversationId) {
      const newConversation = await createConversationMutation.mutateAsync();
      conversationId = newConversation.id;
    }

    sendMessageMutation.mutate({
      conversationId,
      messageText: message.trim()
    });
  };

  const applicantName = (application?.first_name && application?.last_name) 
    ? `${application.first_name} ${application.last_name}`
    : application?.first_name || application?.last_name || 'Anonymous Applicant';

  const canSendMessage = application?.phone && currentRecruiterId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col" aria-describedby="sms-conversation-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            SMS Conversation with {applicantName}
          </DialogTitle>
          <div id="sms-conversation-description" className="sr-only">
            Send and receive SMS messages with the job applicant. View conversation history and compose new messages.
          </div>
          {application?.phone && (
            <p className="text-sm text-muted-foreground">
              Phone: {application.phone}
            </p>
          )}
        </DialogHeader>

        {!canSendMessage ? (
          <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
            <div>
              {!application?.phone && <p>No phone number available for this applicant.</p>}
              {!currentRecruiterId && <p>Please assign a recruiter to start messaging.</p>}
            </div>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 min-h-[300px] max-h-[400px] border rounded-lg p-4">
              <div className="space-y-3">
                {messages?.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages?.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          msg.direction === 'outbound'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs opacity-70">
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </span>
                          {msg.direction === 'outbound' && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                msg.status === 'sent' ? 'bg-green-100 text-green-800' :
                                msg.status === 'failed' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {msg.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="min-h-[80px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleSendMessage();
                  }
                }}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || sendMessageMutation.isPending}
                size="icon"
                className="h-[80px]"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Press Ctrl+Enter to send
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SmsConversationDialog;