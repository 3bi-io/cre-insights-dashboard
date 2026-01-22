import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  Loader2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface OrganizationLogoUploadProps {
  organizationId: string;
  organizationSlug: string;
  currentLogoUrl?: string | null;
  onLogoUpdate: (logoUrl: string | null) => void;
  disabled?: boolean;
}

export const OrganizationLogoUpload = ({ 
  organizationId, 
  organizationSlug, 
  currentLogoUrl, 
  onLogoUpdate,
  disabled = false 
}: OrganizationLogoUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Please upload a valid image file (JPEG, PNG, WebP, or SVG)';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 2MB';
    }
    return null;
  };

  const uploadLogo = async (file: File) => {
    const validation = validateFile(file);
    if (validation) {
      toast({
        title: "Invalid File",
        description: validation,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Delete existing logo if present
      if (currentLogoUrl) {
        await deleteLogo(false); // Don't show success toast for intermediate step
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${organizationSlug}/logo-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('organization-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('organization-logos')
        .getPublicUrl(fileName);

      const logoUrl = publicUrlData.publicUrl;

      // Update organization in database
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ logo_url: logoUrl })
        .eq('id', organizationId);

      if (updateError) throw updateError;

      onLogoUpdate(logoUrl);
      
      toast({
        title: "Success",
        description: "Organization logo uploaded successfully",
      });
    } catch (error: any) {
      logger.error('Logo upload error', error, { context: 'org-logo-upload' });
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const deleteLogo = async (showToast = true) => {
    if (!currentLogoUrl) return;

    setIsDeleting(true);
    try {
      // Extract file path from URL
      const url = new URL(currentLogoUrl);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const filePath = `${organizationSlug}/${fileName}`;

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('organization-logos')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      // Update organization in database
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ logo_url: null })
        .eq('id', organizationId);

      if (updateError) throw updateError;

      onLogoUpdate(null);
      
      if (showToast) {
        toast({
          title: "Logo Removed",
          description: "Organization logo has been removed successfully",
        });
      }
    } catch (error: any) {
      logger.error('Logo deletion error', error, { context: 'org-logo-upload' });
      if (showToast) {
        toast({
          title: "Deletion Failed",
          description: error.message || "Failed to remove logo. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || isUploading) return;

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      uploadLogo(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      uploadLogo(files[0]);
    }
    // Reset input
    e.target.value = '';
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Organization Logo
        </CardTitle>
        <CardDescription>
          Upload your organization's logo. Supported formats: JPEG, PNG, WebP, SVG (max 2MB)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Logo Display */}
        {currentLogoUrl && (
          <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex-shrink-0">
              <img 
                src={currentLogoUrl} 
                alt="Current organization logo" 
                className="w-16 h-16 object-contain rounded-lg border"
                onError={(e) => {
                  logger.error('Logo load error', e, { context: 'org-logo-upload' });
                  e.currentTarget.src = '/logo.png';
                }}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">Current Logo</span>
                <Badge variant="secondary">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Logo is displayed in sidebar and throughout the application
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => deleteLogo()}
              disabled={disabled || isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
            </Button>
          </div>
        )}

        {/* Upload Area */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={disabled ? undefined : openFileDialog}
        >
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              ) : (
                <Upload className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            
            <div>
              <p className="text-sm font-medium mb-1">
                {isUploading ? 'Uploading logo...' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-muted-foreground">
                JPEG, PNG, WebP, SVG up to 2MB
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={disabled || isUploading}
              onClick={(e) => {
                e.stopPropagation();
                openFileDialog();
              }}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </>
              )}
            </Button>
          </div>
        </div>

        {/* File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isUploading}
        />

        {/* Guidelines */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Logo Guidelines:</strong> For best results, use a square or rectangular logo with transparent background. 
            The logo will be automatically resized to fit different areas of the application.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};