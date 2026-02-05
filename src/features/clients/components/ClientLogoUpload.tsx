import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogoAvatar, LogoAvatarImage, LogoAvatarFallback } from '@/components/ui/logo-avatar';
import { Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface ClientLogoUploadProps {
  clientId: string;
  clientName: string;
  currentLogoUrl?: string | null;
  onLogoChange: (logoUrl: string | null) => void;
}

export const ClientLogoUpload: React.FC<ClientLogoUploadProps> = ({
  clientId,
  clientName,
  currentLogoUrl,
  onLogoChange,
}) => {
  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(currentLogoUrl);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image under 2MB',
        variant: 'destructive',
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (PNG, JPG, SVG, WebP)',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // Delete old logo if exists
      if (logoUrl) {
        const oldPath = logoUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('client-logos').remove([oldPath]);
        }
      }

      // Upload new logo
      const fileExt = file.name.split('.').pop();
      const fileName = `${clientId}-${Date.now()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from('client-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('client-logos')
        .getPublicUrl(fileName);

      // Update client record
      const { error: updateError } = await supabase
        .from('clients')
        .update({ logo_url: publicUrl })
        .eq('id', clientId);

      if (updateError) {
        // Clean up uploaded file if DB update fails
        await supabase.storage.from('client-logos').remove([fileName]);
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      // Verify the update was actually applied (RLS may silently block)
      const { data: verifyData } = await supabase
        .from('clients')
        .select('logo_url')
        .eq('id', clientId)
        .single();

      if (verifyData?.logo_url !== publicUrl) {
        await supabase.storage.from('client-logos').remove([fileName]);
        throw new Error('Logo update was blocked. Check your permissions.');
      }

      setLogoUrl(publicUrl);
      onLogoChange(publicUrl);

      toast({
        title: 'Logo uploaded',
        description: 'Client logo has been updated successfully',
      });
    } catch (error) {
      logger.error('Error uploading client logo', error, { context: 'ClientLogoUpload', clientId });
      toast({
        title: 'Upload failed',
        description: 'Failed to upload logo. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!logoUrl) return;

    setUploading(true);

    try {
      const fileName = logoUrl.split('/').pop();
      if (fileName) {
        await supabase.storage.from('client-logos').remove([fileName]);
      }

      const { error: updateError } = await supabase
        .from('clients')
        .update({ logo_url: null })
        .eq('id', clientId);

      if (updateError) throw updateError;

      setLogoUrl(null);
      onLogoChange(null);

      toast({
        title: 'Logo deleted',
        description: 'Client logo has been removed',
      });
    } catch (error) {
      logger.error('Error deleting client logo', error, { context: 'ClientLogoUpload', clientId });
      toast({
        title: 'Delete failed',
        description: 'Failed to delete logo. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <LogoAvatar size="xl" className="h-20 w-20">
          {logoUrl ? (
            <LogoAvatarImage 
              src={logoUrl} 
              alt={`${clientName} logo`}
            />
          ) : (
            <LogoAvatarFallback iconSize="lg" />
          )}
        </LogoAvatar>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              id={`logo-upload-${clientId}`}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => document.getElementById(`logo-upload-${clientId}`)?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              {logoUrl ? 'Change Logo' : 'Upload Logo'}
            </Button>

            {logoUrl && (
              <Button
                variant="ghost"
                size="sm"
                disabled={uploading}
                onClick={handleDeleteLogo}
              >
                <X className="w-4 h-4 mr-2" />
                Remove
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Recommended: 200x200px, PNG or SVG, under 2MB
          </p>
        </div>
      </div>
    </div>
  );
};
