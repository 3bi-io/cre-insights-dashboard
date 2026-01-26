import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Send, Loader2, Plus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface EmailRecipient {
  email: string;
  userName: string;
}

export function AdminEmailUtility() {
  const [open, setOpen] = useState(false);
  const [organizationName, setOrganizationName] = useState('CR England');
  const [recipients, setRecipients] = useState<EmailRecipient[]>([
    { email: '', userName: '' }
  ]);
  const [isSending, setIsSending] = useState(false);

  const addRecipient = () => {
    setRecipients([...recipients, { email: '', userName: '' }]);
  };

  const removeRecipient = (index: number) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter((_, i) => i !== index));
    }
  };

  const updateRecipient = (index: number, field: keyof EmailRecipient, value: string) => {
    const updated = [...recipients];
    updated[index][field] = value;
    setRecipients(updated);
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSend = async () => {
    const validRecipients = recipients.filter(r => r.email && validateEmail(r.email));
    
    if (validRecipients.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter at least one valid email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    let successCount = 0;
    let failCount = 0;

    for (const recipient of validRecipients) {
      try {
        const { error } = await supabase.functions.invoke('send-welcome-email', {
          body: {
            to: recipient.email,
            userName: recipient.userName || recipient.email.split('@')[0],
            organizationName: organizationName || 'ATS.me',
          },
        });

        if (error) {
          console.error(`Failed to send to ${recipient.email}:`, error);
          failCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        console.error(`Error sending to ${recipient.email}:`, err);
        failCount++;
      }
    }

    setIsSending(false);

    if (successCount > 0 && failCount === 0) {
      toast({
        title: 'Emails Sent',
        description: `Successfully sent ${successCount} welcome email(s).`,
      });
      setOpen(false);
      setRecipients([{ email: '', userName: '' }]);
    } else if (successCount > 0 && failCount > 0) {
      toast({
        title: 'Partial Success',
        description: `Sent ${successCount} email(s), ${failCount} failed.`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Failed to Send',
        description: 'Could not send welcome emails. Check console for details.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Mail className="mr-2 h-4 w-4" />
          Send Welcome Email
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Welcome Emails</DialogTitle>
          <DialogDescription>
            Send formal welcome emails to new users. Emails are automatically BCC'd to c@3bi.io.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="organization">Organization Name</Label>
            <Input
              id="organization"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="e.g., CR England"
            />
          </div>

          <div className="space-y-3">
            <Label>Recipients</Label>
            {recipients.map((recipient, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                  <Input
                    value={recipient.email}
                    onChange={(e) => updateRecipient(index, 'email', e.target.value)}
                    placeholder="email@example.com"
                    type="email"
                  />
                  <Input
                    value={recipient.userName}
                    onChange={(e) => updateRecipient(index, 'userName', e.target.value)}
                    placeholder="User Name (optional)"
                  />
                </div>
                {recipients.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRecipient(index)}
                    className="shrink-0 mt-1"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addRecipient} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Recipient
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Emails
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
