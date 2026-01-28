import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Twitter, Facebook, Instagram, Video, MessageSquare, Linkedin } from 'lucide-react';
import type { GeneratedAd } from '../../types/adCreative.types';
import type { SocialBeaconPlatform } from '../../config/socialBeacons.config';

interface AdPreviewCardProps {
  preview: GeneratedAd | null;
  platform?: SocialBeaconPlatform;
  isLoading?: boolean;
  className?: string;
}

const PLATFORM_ICONS: Record<SocialBeaconPlatform, React.ElementType> = {
  x: Twitter,
  facebook: Facebook,
  instagram: Instagram,
  whatsapp: () => null, // WhatsApp doesn't support ad creatives
  tiktok: Video,
  reddit: MessageSquare,
  linkedin: Linkedin,
};

const PLATFORM_STYLES: Record<SocialBeaconPlatform, { bg: string; border: string }> = {
  x: { bg: 'bg-background', border: 'border-border' },
  facebook: { bg: 'bg-[hsl(221,44%,97%)]', border: 'border-[hsl(221,44%,41%,0.2)]' },
  instagram: { bg: 'bg-gradient-to-br from-purple-50 to-pink-50', border: 'border-pink-200' },
  whatsapp: { bg: 'bg-green-50', border: 'border-green-200' },
  tiktok: { bg: 'bg-background', border: 'border-border' },
  reddit: { bg: 'bg-orange-50', border: 'border-orange-200' },
  linkedin: { bg: 'bg-[hsl(201,100%,97%)]', border: 'border-[hsl(201,100%,35%,0.2)]' },
};

export function AdPreviewCard({
  preview,
  platform = 'x',
  isLoading = false,
  className,
}: AdPreviewCardProps) {
  const PlatformIcon = PLATFORM_ICONS[platform];
  const styles = PLATFORM_STYLES[platform];

  if (isLoading) {
    return (
      <Card className={cn('p-4 space-y-4', className)}>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </Card>
    );
  }

  if (!preview) {
    return (
      <Card className={cn(
        'p-8 flex flex-col items-center justify-center text-center min-h-[300px]',
        'border-dashed',
        className
      )}>
        <PlatformIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground text-sm">
          Configure your ad and click "Generate Concept" to see a preview
        </p>
      </Card>
    );
  }

  return (
    <Card className={cn(
      'overflow-hidden',
      styles.bg,
      styles.border,
      className
    )}>
      {/* Post Header */}
      <div className="p-4 flex items-center gap-3 border-b border-border/50">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <PlatformIcon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-sm">Your Company</p>
          <p className="text-xs text-muted-foreground">Sponsored</p>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4 space-y-3">
        {/* Headline */}
        <h4 className="font-bold text-base leading-tight">
          {preview.content.headline}
        </h4>

        {/* Body */}
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {preview.content.body}
        </p>

        {/* Media placeholder */}
        {preview.mediaUrl ? (
          <div className="rounded-lg overflow-hidden">
            <img 
              src={preview.mediaUrl} 
              alt="Ad creative" 
              className="w-full h-auto object-cover"
            />
          </div>
        ) : (
          <div className="rounded-lg bg-muted/50 h-48 flex items-center justify-center border border-dashed border-border">
            <p className="text-xs text-muted-foreground">
              {preview.config.mediaType === 'ai_image' 
                ? 'AI image will be generated' 
                : preview.config.mediaType === 'ai_video'
                ? 'AI video will be generated'
                : 'Upload your media'}
            </p>
          </div>
        )}

        {/* Hashtags */}
        {preview.content.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {preview.content.hashtags.map((tag, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-xs font-normal bg-primary/10 text-primary hover:bg-primary/20"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Call to Action */}
        {preview.content.callToAction && (
          <div className="pt-2">
            <button className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              {preview.content.callToAction}
            </button>
          </div>
        )}
      </div>

      {/* Post Footer - Platform specific engagement */}
      <div className="px-4 py-3 border-t border-border/50 flex items-center justify-between text-muted-foreground text-xs">
        <span>❤️ Like</span>
        <span>💬 Comment</span>
        <span>🔄 Share</span>
      </div>
    </Card>
  );
}
