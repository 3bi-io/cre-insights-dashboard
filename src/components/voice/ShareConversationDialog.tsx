import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Copy, Check, Share2, Loader2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface ShareConversationDialogProps {
  conversationId: string;
  conversationDbId: string;
  agentName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ExpirationOption = 'never' | '1day' | '7days' | '30days';

export const ShareConversationDialog: React.FC<ShareConversationDialogProps> = ({
  conversationId,
  conversationDbId,
  agentName,
  open,
  onOpenChange,
}) => {
  const { user, organization } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Form state
  const [customTitle, setCustomTitle] = useState('');
  const [hideCallerInfo, setHideCallerInfo] = useState(false);
  const [expiration, setExpiration] = useState<ExpirationOption>('never');

  const getExpirationDate = (option: ExpirationOption): string | null => {
    if (option === 'never') return null;
    
    const now = new Date();
    switch (option) {
      case '1day':
        now.setDate(now.getDate() + 1);
        break;
      case '7days':
        now.setDate(now.getDate() + 7);
        break;
      case '30days':
        now.setDate(now.getDate() + 30);
        break;
    }
    return now.toISOString();
  };

  const generateShareCode = (): string => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateShareLink = async () => {
    if (!organization?.id || !user?.id) {
      toast.error('Organization not found');
      return;
    }

    setIsCreating(true);
    try {
      const shareCode = generateShareCode();
      const expiresAt = getExpirationDate(expiration);

      const { error } = await supabase
        .from('shared_voice_conversations')
        .insert({
          conversation_id: conversationDbId,
          share_code: shareCode,
          organization_id: organization.id,
          created_by: user.id,
          expires_at: expiresAt,
          hide_caller_info: hideCallerInfo,
          custom_title: customTitle || null,
        });

      if (error) {
        // Check if it's a duplicate error and retry with new code
        if (error.code === '23505') {
          // Retry with new code
          const newShareCode = generateShareCode();
          const { error: retryError } = await supabase
            .from('shared_voice_conversations')
            .insert({
              conversation_id: conversationDbId,
              share_code: newShareCode,
              organization_id: organization.id,
              created_by: user.id,
              expires_at: expiresAt,
              hide_caller_info: hideCallerInfo,
              custom_title: customTitle || null,
            });
          
          if (retryError) throw retryError;
          
          const url = `${window.location.origin}/voice/${newShareCode}`;
          setShareUrl(url);
        } else {
          throw error;
        }
      } else {
        const url = `${window.location.origin}/voice/${shareCode}`;
        setShareUrl(url);
      }

      toast.success('Share link created successfully');
    } catch (error: any) {
      console.error('Error creating share link:', error);
      toast.error('Failed to create share link');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleOpenLink = () => {
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  };

  const handleClose = () => {
    // Reset state when closing
    setShareUrl(null);
    setCopied(false);
    setCustomTitle('');
    setHideCallerInfo(false);
    setExpiration('never');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Conversation
          </DialogTitle>
          <DialogDescription>
            Create a public link to share this voice conversation.
            {agentName && ` (${agentName})`}
          </DialogDescription>
        </DialogHeader>

        {!shareUrl ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="custom-title">Custom Title (optional)</Label>
              <Input
                id="custom-title"
                placeholder="e.g., CDL Qualification Call"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiration">Link Expiration</Label>
              <Select value={expiration} onValueChange={(v) => setExpiration(v as ExpirationOption)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select expiration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never expires</SelectItem>
                  <SelectItem value="1day">1 day</SelectItem>
                  <SelectItem value="7days">7 days</SelectItem>
                  <SelectItem value="30days">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="hide-caller">Hide Caller Info</Label>
                <p className="text-xs text-muted-foreground">
                  Replace "User" with "Caller" in transcript
                </p>
              </div>
              <Switch
                id="hide-caller"
                checked={hideCallerInfo}
                onCheckedChange={setHideCallerInfo}
              />
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Share Link</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={shareUrl}
                  className="font-mono text-sm"
                />
                <Button size="icon" variant="outline" onClick={handleCopyLink}>
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex justify-center">
              <Button variant="outline" onClick={handleOpenLink}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in New Tab
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          {!shareUrl ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleCreateShareLink} disabled={isCreating}>
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Share Link
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
