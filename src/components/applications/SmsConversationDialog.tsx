import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, MessageCircle, Loader2 } from 'lucide-react';
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
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-gradient-to-b from-background to-background/95" aria-describedby="sms-conversation-description">
        <DialogHeader className="px-6 py-4 border-b bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold">
                {applicantName}
              </DialogTitle>
              {application?.phone && (
                <p className="text-sm text-muted-foreground">
                  {application.phone}
                </p>
              )}
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
              SMS
            </Badge>
          </div>
          <div id="sms-conversation-description" className="sr-only">
            Send and receive SMS messages with the job applicant. View conversation history and compose new messages.
          </div>
        </DialogHeader>

        {!canSendMessage ? (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div className="space-y-4 max-w-sm">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                <MessageCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                {!application?.phone && (
                  <p className="text-muted-foreground">No phone number available for this applicant.</p>
                )}
                {!currentRecruiterId && (
                  <p className="text-muted-foreground">Please assign a recruiter to start messaging.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-6 py-4 bg-muted/20">
              <div className="space-y-4">
                {messages?.length === 0 ? (
                  <div className="text-center py-16 space-y-4 animate-fade-in">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <MessageCircle className="w-10 h-10 text-primary/50" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">No messages yet</p>
                      <p className="text-sm text-muted-foreground">Start the conversation with {applicantName}</p>
                    </div>
                  </div>
                ) : (
                  messages?.map((msg, index) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div
                        className={`max-w-[75%] group hover:scale-[1.02] transition-all duration-200 ${
                          msg.direction === 'outbound' 
                            ? 'animate-slide-in-right' 
                            : 'animate-fade-in'
                        }`}
                      >
                        <div
                          className={`p-4 rounded-2xl shadow-sm ${
                            msg.direction === 'outbound'
                              ? 'bg-primary text-primary-foreground rounded-br-sm'
                              : 'bg-card border border-border rounded-bl-sm'
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                        </div>
                        <div className={`flex items-center gap-2 mt-1.5 px-2 ${
                          msg.direction === 'outbound' ? 'justify-end' : 'justify-start'
                        }`}>
                          <span className="text-xs text-muted-foreground">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {msg.direction === 'outbound' && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs px-1.5 py-0 ${
                                msg.status === 'delivered' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                                msg.status === 'failed' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                                'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
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

            <div className="px-6 py-4 bg-card/50 backdrop-blur-sm border-t">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="min-h-[100px] resize-none pr-12 border-2 focus:border-primary/50 transition-colors"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        handleSendMessage();
                      }
                    }}
                  />
                  <p className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                    Ctrl+Enter
                  </p>
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || sendMessageMutation.isPending}
                  size="lg"
                  className="h-[100px] px-6 hover-scale"
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SmsConversationDialog;