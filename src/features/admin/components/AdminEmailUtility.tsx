import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Send, Loader2, Plus, X, KeyRound, ShieldAlert } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface EmailRecipient {
  email: string;
  userName: string;
}

type EmailType = 'welcome' | 'password_reset';

interface AdminEmailUtilityProps {
  trigger?: React.ReactNode;
}

export function AdminEmailUtility({ trigger }: AdminEmailUtilityProps) {
  const { isSuperAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [emailType, setEmailType] = useState<EmailType>('welcome');
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

  const resetForm = () => {
    setRecipients([{ email: '', userName: '' }]);
  };

  const handleSendWelcome = async () => {
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
      resetForm();
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

  const handleSendPasswordReset = async () => {
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
        const { error } = await supabase.auth.resetPasswordForEmail(recipient.email, {
          redirectTo: `${window.location.origin}/auth?reset=true`,
        });

        if (error) {
          console.error(`Failed to send reset to ${recipient.email}:`, error);
          failCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        console.error(`Error sending reset to ${recipient.email}:`, err);
        failCount++;
      }
    }

    setIsSending(false);

    if (successCount > 0 && failCount === 0) {
      toast({
        title: 'Reset Emails Sent',
        description: `Successfully sent ${successCount} password reset email(s).`,
      });
      setOpen(false);
      resetForm();
    } else if (successCount > 0 && failCount > 0) {
      toast({
        title: 'Partial Success',
        description: `Sent ${successCount} reset email(s), ${failCount} failed.`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Failed to Send',
        description: 'Could not send password reset emails. Check console for details.',
        variant: 'destructive',
      });
    }
  };

  const handleSend = () => {
    // Security check: only super admins can send system emails
    if (!isSuperAdmin) {
      toast({
        title: 'Access Denied',
        description: 'Only Super Administrators can send system emails.',
        variant: 'destructive',
      });
      return;
    }

    if (emailType === 'welcome') {
      handleSendWelcome();
    } else {
      handleSendPasswordReset();
    }
  };

  // If not a super admin, render a disabled button with tooltip
  if (!isSuperAdmin) {
    return (
      <Button variant="outline" size="sm" disabled title="Only Super Administrators can send system emails">
        <ShieldAlert className="mr-2 h-4 w-4" />
        Send System Email
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Mail className="mr-2 h-4 w-4" />
            Send System Email
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send System Emails</DialogTitle>
          <DialogDescription>
            Send welcome emails or password reset instructions to users.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={emailType} onValueChange={(v) => setEmailType(v as EmailType)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="welcome" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Welcome Email
            </TabsTrigger>
            <TabsTrigger value="password_reset" className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              Password Reset
            </TabsTrigger>
          </TabsList>

          <TabsContent value="welcome" className="space-y-4 mt-4">
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
          </TabsContent>

          <TabsContent value="password_reset" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Send password reset instructions to users. They will receive a secure link to set a new password (expires in 24 hours).
            </p>

            <div className="space-y-3">
              <Label>Recipients</Label>
              {recipients.map((recipient, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    value={recipient.email}
                    onChange={(e) => updateRecipient(index, 'email', e.target.value)}
                    placeholder="email@example.com"
                    type="email"
                    className="flex-1"
                  />
                  {recipients.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRecipient(index)}
                      className="shrink-0"
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
          </TabsContent>
        </Tabs>

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
                {emailType === 'welcome' ? 'Send Welcome Email(s)' : 'Send Reset Email(s)'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
