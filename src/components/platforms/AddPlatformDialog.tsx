
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Platform name is required",
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
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Platform added successfully",
      });

      // Reset form
      setName('');
      setLogoUrl('');
      setApiEndpoint('');
      onSuccess();
    } catch (error) {
      console.error('Error adding platform:', error);
      toast({
        title: "Error",
        description: "Failed to add platform. Please try again.",
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
          <DialogTitle>Add New Platform</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="platform-name">Platform Name</Label>
            <Input
              id="platform-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Meta, X, Google Ads"
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
              placeholder="https://api.platform.com/v1"
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
              {isLoading ? 'Adding...' : 'Add Platform'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPlatformDialog;
