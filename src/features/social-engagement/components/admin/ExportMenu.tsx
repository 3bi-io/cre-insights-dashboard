import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Download, Image, FileText, Code, Link2, Loader2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { copyToClipboard, downloadAsset } from '@/utils/assetDownload';
import type { GeneratedAd } from '../../types/adCreative.types';

interface ExportMenuProps {
  preview: GeneratedAd;
  disabled?: boolean;
}

export function ExportMenu({ preview, disabled }: ExportMenuProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [exportedType, setExportedType] = useState<string | null>(null);

  const handleCopyText = async () => {
    const text = `${preview.content.headline}\n\n${preview.content.body}\n\n${preview.content.hashtags.map(t => `#${t}`).join(' ')}`;
    const success = await copyToClipboard(text);
    if (success) {
      setExportedType('text');
      toast({ title: 'Copied!', description: 'Ad copy copied to clipboard' });
      setTimeout(() => setExportedType(null), 2000);
    } else {
      toast({ title: 'Failed', description: 'Could not copy to clipboard', variant: 'destructive' });
    }
  };

  const handleDownloadImage = async () => {
    if (!preview.mediaUrl) {
      toast({ title: 'No image', description: 'Generate an image first', variant: 'destructive' });
      return;
    }

    setIsExporting(true);
    try {
      // For base64 images, create blob and download
      if (preview.mediaUrl.startsWith('data:')) {
        const response = await fetch(preview.mediaUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ad-creative-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        await downloadAsset(preview.mediaUrl, `ad-creative-${Date.now()}.png`);
      }
      setExportedType('image');
      toast({ title: 'Downloaded!', description: 'Image saved successfully' });
      setTimeout(() => setExportedType(null), 2000);
    } catch (error) {
      toast({ title: 'Download failed', description: 'Could not download image', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = async () => {
    const exportData = {
      headline: preview.content.headline,
      body: preview.content.body,
      hashtags: preview.content.hashtags,
      callToAction: preview.content.callToAction,
      mediaUrl: preview.mediaUrl,
      config: {
        jobType: preview.config.jobType,
        benefits: preview.config.benefits,
        mediaType: preview.config.mediaType,
        aspectRatio: preview.config.aspectRatio,
      },
      generatedAt: preview.generatedAt,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ad-creative-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportedType('json');
    toast({ title: 'Exported!', description: 'JSON file saved successfully' });
    setTimeout(() => setExportedType(null), 2000);
  };

  const handleCopyShareLink = async () => {
    // In a real implementation, this would generate a shareable preview link
    const shareData = btoa(JSON.stringify({
      h: preview.content.headline,
      b: preview.content.body.substring(0, 100),
    }));
    const shareUrl = `${window.location.origin}/preview/ad/${shareData}`;
    
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setExportedType('link');
      toast({ title: 'Link copied!', description: 'Share link copied to clipboard' });
      setTimeout(() => setExportedType(null), 2000);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleCopyText}>
          <FileText className="mr-2 h-4 w-4" />
          Copy Text
          {exportedType === 'text' && <Check className="ml-auto h-4 w-4 text-success" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadImage} disabled={!preview.mediaUrl}>
          <Image className="mr-2 h-4 w-4" />
          Download Image
          {exportedType === 'image' && <Check className="ml-auto h-4 w-4 text-success" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportJSON}>
          <Code className="mr-2 h-4 w-4" />
          Export as JSON
          {exportedType === 'json' && <Check className="ml-auto h-4 w-4 text-success" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyShareLink}>
          <Link2 className="mr-2 h-4 w-4" />
          Copy Share Link
          {exportedType === 'link' && <Check className="ml-auto h-4 w-4 text-success" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
