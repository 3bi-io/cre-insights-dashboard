import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Send, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

export const AdminMagicLinkSection = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const isSuperAdmin = user?.email === 'c@3bi.io';

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter an administrator email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-magic-link', {
        body: { email }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast({
          title: "Magic Link Sent",
          description: `A magic link has been sent to ${email}`,
        });
        setEmail('');
      } else {
        throw new Error(data?.error || 'Failed to send magic link');
      }
    } catch (error: any) {
      logger.error('Error sending magic link', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send magic link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendBulkMagicLinks = async () => {
    if (!isSuperAdmin) {
      toast({
        title: "Access Denied",
        description: "Only c@3bi.io can send bulk magic links.",
        variant: "destructive",
      });
      return;
    }

    setIsBulkLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-magic-link', {
        body: { bulkSend: true }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast({
          title: "Bulk Magic Links Sent",
          description: `Magic links have been sent to ${data.sentCount || 0} users`,
        });
      } else {
        throw new Error(data?.error || 'Failed to send bulk magic links');
      }
    } catch (error: any) {
      logger.error('Error sending bulk magic links', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send bulk magic links. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBulkLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Administrator Magic Link
        </CardTitle>
        <CardDescription>
          Send a magic link to an administrator for secure login access.
          {isSuperAdmin && " As super admin, you can also send magic links to all users."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSendMagicLink} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email">Administrator Email</Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <Button 
            type="submit" 
            disabled={isLoading || !email}
            className="w-full"
          >
            {isLoading ? (
              "Sending..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Magic Link
              </>
            )}
          </Button>
          
          {isSuperAdmin && (
            <Button 
              type="button"
              variant="outline"
              onClick={handleSendBulkMagicLinks}
              disabled={isBulkLoading}
              className="w-full"
            >
              {isBulkLoading ? (
                "Sending to all users..."
              ) : (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  Send Magic Links to All Users
                </>
              )}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
};