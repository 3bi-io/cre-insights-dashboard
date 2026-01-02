import { useState } from 'react';
import { Download, Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { downloadAsset, copyToClipboard, getAssetUrl } from '@/utils/assetDownload';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface AssetCardProps {
  name: string;
  filename: string;
  path: string;
  dimensions?: string;
  format: 'png' | 'svg' | 'ico' | 'jpg';
  description?: string;
  darkBackground?: boolean;
}

export const AssetCard = ({
  name,
  filename,
  path,
  dimensions,
  format,
  description,
  darkBackground = false,
}: AssetCardProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadAsset(path, filename);
      toast.success(`Downloaded ${filename}`);
    } catch (error) {
      toast.error('Failed to download file');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyUrl = async () => {
    const url = getAssetUrl(path);
    const success = await copyToClipboard(url);
    if (success) {
      setIsCopied(true);
      toast.success('URL copied to clipboard');
      setTimeout(() => setIsCopied(false), 2000);
    } else {
      toast.error('Failed to copy URL');
    }
  };

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      <CardContent className="p-0">
        {/* Preview Area */}
        <div
          className={cn(
            "relative aspect-video flex items-center justify-center p-6 transition-colors",
            darkBackground 
              ? "bg-slate-900" 
              : "bg-[repeating-conic-gradient(hsl(var(--muted))_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]"
          )}
        >
          <img
            src={path}
            alt={name}
            className="max-h-full max-w-full object-contain"
            loading="lazy"
          />
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              <Download className="h-4 w-4 mr-1" />
              {isDownloading ? 'Downloading...' : 'Download'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyUrl}
              className="bg-transparent border-white text-white hover:bg-white/20"
            >
              {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Info Area */}
        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-foreground">{name}</h3>
            <div className="flex gap-1 flex-shrink-0">
              {dimensions && (
                <Badge variant="secondary" className="text-xs">
                  {dimensions}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs uppercase">
                {format}
              </Badge>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">{filename}</p>
          
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}

          {/* Mobile Download Button */}
          <div className="flex gap-2 pt-2 md:hidden">
            <Button
              size="sm"
              className="flex-1"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyUrl}
            >
              {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
