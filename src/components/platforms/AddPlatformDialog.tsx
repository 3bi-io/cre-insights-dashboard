
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

interface AddPlatformDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddPlatformDialog: React.FC<AddPlatformDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { organization } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Publisher name is required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('platforms')
        .insert({
          name: name.trim(),
          logo_url: logoUrl.trim() || null,
          api_endpoint: apiEndpoint.trim() || null,
          organization_id: organization?.id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Publisher added successfully",
      });

      // Reset form
      setName('');
      setLogoUrl('');
      setApiEndpoint('');
      onSuccess();
    } catch (error) {
      logger.error('Error adding publisher:', error);
      toast({
        title: "Error",
        description: "Failed to add publisher. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4">
        <DialogHeader>
          <DialogTitle>Add New Publisher</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="publisher-name">Publisher Name</Label>
            <Input
              id="publisher-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Meta, X, Google Ads, Talroo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo-url">Logo URL (Optional)</Label>
            <Input
              id="logo-url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              type="url"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-endpoint">API Endpoint (Optional)</Label>
            <Input
              id="api-endpoint"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              placeholder="https://api.publisher.com/v1"
              type="url"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? 'Adding...' : 'Add Publisher'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPlatformDialog;
