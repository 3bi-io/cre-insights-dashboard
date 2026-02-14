import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Check, 
  X, 
  Send, 
  AlertTriangle, 
  MessageSquare,
  Clock,
  Bot,
  User,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { 
  useSocialInteractions, 
  useSocialResponses,
  SocialInteraction,
  InteractionStatus,
} from '../hooks/useSocialInteractions';
import { SocialPlatform } from '../hooks/useSocialConnections';
import { cn } from '@/lib/utils';

interface InteractionQueueProps {
  organizationId?: string;
}

const PLATFORM_COLORS: Record<SocialPlatform, string> = {
  facebook: 'bg-blue-500',
  instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
  x: 'bg-black',
  whatsapp: 'bg-green-500',
  linkedin: 'bg-blue-700',
  tiktok: 'bg-black',
  reddit: 'bg-orange-500',
};

const INTENT_LABELS: Record<string, { label: string; color: string }> = {
  job_inquiry: { label: 'Job Inquiry', color: 'bg-emerald-500' },
  salary_question: { label: 'Salary', color: 'bg-amber-500' },
  benefits_question: { label: 'Benefits', color: 'bg-cyan-500' },
  application_status: { label: 'App Status', color: 'bg-indigo-500' },
  support: { label: 'Support', color: 'bg-orange-500' },
  complaint: { label: 'Complaint', color: 'bg-red-500' },
  spam: { label: 'Spam', color: 'bg-gray-500' },
  general: { label: 'General', color: 'bg-slate-500' },
};

export function InteractionQueue({ organizationId }: InteractionQueueProps) {
  const [selectedInteraction, setSelectedInteraction] = useState<SocialInteraction | null>(null);
  const [responseText, setResponseText] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  
  const { interactions, isLoading, updateStatus, markAsIgnored, escalate } = useSocialInteractions({
    organizationId,
    platform: filterPlatform !== 'all' ? filterPlatform as SocialPlatform : undefined,
    status: filterStatus !== 'all' ? filterStatus as InteractionStatus : undefined,
    limit: 100,
  });

  const { responses } = useSocialResponses(selectedInteraction?.id);

  const handleApprove = async (interactionId: string) => {
    await updateStatus.mutateAsync({ interactionId, newStatus: 'responded' });
    setSelectedInteraction(null);
  };

  const handleIgnore = async (interactionId: string) => {
    await markAsIgnored.mutateAsync(interactionId);
    setSelectedInteraction(null);
  };

  const handleEscalate = async (interactionId: string) => {
    await escalate.mutateAsync({ interactionId, reason: 'Manually escalated for review' });
    setSelectedInteraction(null);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Filters & List */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Interaction Queue</CardTitle>
              <div className="flex gap-2">
                <Select value={filterPlatform} onValueChange={setFilterPlatform}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="twitter">X (Twitter)</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="responded">Responded</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                    <SelectItem value="ignored">Ignored</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : interactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No interactions found</p>
                  <p className="text-sm">Messages will appear here when they come in</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {interactions.map(interaction => (
                    <div
                      key={interaction.id}
                      onClick={() => setSelectedInteraction(interaction)}
                      className={cn(
                        "p-4 rounded-lg border cursor-pointer transition-colors",
                        selectedInteraction?.id === interaction.id
                          ? "border-primary bg-accent"
                          : "hover:bg-accent/50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-2 shrink-0",
                          PLATFORM_COLORS[interaction.platform]
                        )} />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium truncate">
                              {interaction.sender_name || interaction.sender_handle || 'Unknown User'}
                            </span>
                            {interaction.sender_handle && interaction.sender_name && (
                              <span className="text-muted-foreground text-sm">
                                @{interaction.sender_handle}
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {interaction.content}
                          </p>
                          
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {interaction.platform}
                            </Badge>
                            
                            {interaction.intent_classification && (
                              <Badge 
                                className={cn(
                                  "text-xs text-white",
                                  INTENT_LABELS[interaction.intent_classification]?.color || 'bg-gray-500'
                                )}
                              >
                                {INTENT_LABELS[interaction.intent_classification]?.label || interaction.intent_classification}
                              </Badge>
                            )}
                            
                            {interaction.sentiment_label === 'negative' && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Negative
                              </Badge>
                            )}
                            
                            {interaction.auto_responded && (
                              <Badge variant="secondary" className="text-xs">
                                <Bot className="h-3 w-3 mr-1" />
                                Auto
                              </Badge>
                            )}
                            
                            <span className="text-xs text-muted-foreground flex items-center ml-auto">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDistanceToNow(new Date(interaction.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Detail Panel */}
      <div className="space-y-4">
        {selectedInteraction ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Message Details</CardTitle>
                <CardDescription>
                  {selectedInteraction.interaction_type} on {selectedInteraction.platform}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">From</label>
                  <p className="text-sm">
                    {selectedInteraction.sender_name || 'Unknown'}
                    {selectedInteraction.sender_handle && ` (@${selectedInteraction.sender_handle})`}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Message</label>
                  <p className="text-sm bg-muted p-3 rounded-lg mt-1">
                    {selectedInteraction.content}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Intent</label>
                    <p className="text-sm capitalize">
                      {selectedInteraction.intent_classification?.replace('_', ' ') || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Confidence</label>
                    <p className="text-sm">
                      {selectedInteraction.intent_confidence 
                        ? `${Math.round(selectedInteraction.intent_confidence * 100)}%`
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                
                {selectedInteraction.review_reason && (
                  <div>
                    <label className="text-sm font-medium text-amber-600">Review Reason</label>
                    <p className="text-sm">{selectedInteraction.review_reason}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Response */}
            {responses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    AI Suggested Response
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm bg-muted p-3 rounded-lg">
                    {responses[0].content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Generated by {responses[0].ai_provider || 'AI'}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Manual Response */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Your Response
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Type your response..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={4}
                />
                
                <div className="flex gap-2">
                  <Button 
                    className="flex-1"
                    onClick={() => handleApprove(selectedInteraction.id)}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve & Send
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleIgnore(selectedInteraction.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleEscalate(selectedInteraction.id)}
                  >
                    <AlertTriangle className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Select an interaction to view details</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
