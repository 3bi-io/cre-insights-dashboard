import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Twitter, Facebook, Instagram, Video, MessageCircle, Linkedin,
  Heart, MessageSquare, Share2, Send, Repeat2, Bookmark,
  Image as ImageIcon,
} from 'lucide-react';
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
  whatsapp: MessageCircle,
  tiktok: Video,
  reddit: MessageSquare,
  linkedin: Linkedin,
};

const PLATFORM_NAMES: Record<SocialBeaconPlatform, string> = {
  x: 'X (Twitter)',
  facebook: 'Facebook',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  tiktok: 'TikTok',
  reddit: 'Reddit',
  linkedin: 'LinkedIn',
};

const PLATFORM_STYLES: Record<SocialBeaconPlatform, { bg: string; border: string; accent: string; dark?: boolean }> = {
  x: { 
    bg: 'bg-[hsl(0,0%,7%)]', 
    border: 'border-[hsl(0,0%,20%)]', 
    accent: 'text-[hsl(0,0%,100%)]',
    dark: true,
  },
  facebook: { 
    bg: 'bg-[hsl(221,44%,97%)]', 
    border: 'border-[hsl(221,44%,41%,0.2)]',
    accent: 'text-[hsl(221,44%,41%)]',
  },
  instagram: { 
    bg: 'bg-gradient-to-br from-[hsl(280,80%,97%)] to-[hsl(340,80%,97%)]', 
    border: 'border-[hsl(340,70%,70%,0.3)]',
    accent: 'text-[hsl(340,70%,50%)]',
  },
  whatsapp: { 
    bg: 'bg-[hsl(142,70%,97%)]', 
    border: 'border-[hsl(142,70%,40%,0.2)]',
    accent: 'text-[hsl(142,70%,35%)]',
  },
  tiktok: { 
    bg: 'bg-[hsl(0,0%,5%)]', 
    border: 'border-[hsl(0,0%,20%)]',
    accent: 'text-[hsl(0,0%,100%)]',
    dark: true,
  },
  reddit: { 
    bg: 'bg-[hsl(16,100%,97%)]', 
    border: 'border-[hsl(16,100%,50%,0.2)]',
    accent: 'text-[hsl(16,100%,50%)]',
  },
  linkedin: { 
    bg: 'bg-[hsl(201,100%,97%)]', 
    border: 'border-[hsl(201,100%,35%,0.2)]',
    accent: 'text-[hsl(201,100%,35%)]',
  },
};

// Platform-specific footer actions with proper icons
const PLATFORM_ACTIONS: Record<SocialBeaconPlatform, Array<{ icon: React.ElementType; label: string }>> = {
  x: [
    { icon: MessageSquare, label: 'Reply' },
    { icon: Repeat2, label: 'Repost' },
    { icon: Heart, label: 'Like' },
    { icon: Bookmark, label: 'Bookmark' },
  ],
  facebook: [
    { icon: Heart, label: 'Like' },
    { icon: MessageSquare, label: 'Comment' },
    { icon: Share2, label: 'Share' },
  ],
  instagram: [
    { icon: Heart, label: 'Like' },
    { icon: MessageSquare, label: 'Comment' },
    { icon: Send, label: 'Share' },
    { icon: Bookmark, label: 'Save' },
  ],
  whatsapp: [
    { icon: Share2, label: 'Forward' },
  ],
  tiktok: [
    { icon: Heart, label: 'Like' },
    { icon: MessageSquare, label: 'Comment' },
    { icon: Bookmark, label: 'Save' },
    { icon: Share2, label: 'Share' },
  ],
  reddit: [
    { icon: Heart, label: 'Upvote' },
    { icon: MessageSquare, label: 'Comment' },
    { icon: Share2, label: 'Share' },
  ],
  linkedin: [
    { icon: Heart, label: 'Like' },
    { icon: MessageSquare, label: 'Comment' },
    { icon: Repeat2, label: 'Repost' },
    { icon: Send, label: 'Send' },
  ],
};

export function AdPreviewCard({
  preview,
  platform = 'x',
  isLoading = false,
  className,
}: AdPreviewCardProps) {
  const PlatformIcon = PLATFORM_ICONS[platform];
  const styles = PLATFORM_STYLES[platform];
  const isDark = styles.dark;
  const actions = PLATFORM_ACTIONS[platform];
  const [imgError, setImgError] = useState(false);

  if (isLoading) {
    return (
      <Card className={cn('p-3 sm:p-4 space-y-4', className)}>
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
        'p-6 sm:p-8 flex flex-col items-center justify-center text-center min-h-[300px]',
        'border-dashed',
        className
      )}>
        <PlatformIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground text-sm">
          Configure your ad and click "Generate Creative" to see a preview
        </p>
        <p className="text-muted-foreground/70 text-xs mt-2">
          AI will generate copy and an image for your ad
        </p>
      </Card>
    );
  }

  return (
    <Card className={cn(
      'overflow-hidden transition-all',
      styles.bg,
      styles.border,
      className
    )}>
      {/* Platform indicator */}
      <div className={cn(
        'px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider border-b flex items-center justify-between',
        isDark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-black/5 border-black/5 text-muted-foreground'
      )}>
        <span>{PLATFORM_NAMES[platform]} Preview</span>
        <Badge variant="outline" className={cn(
          'text-[9px] px-1.5 py-0',
          isDark ? 'border-white/20 text-white/60' : ''
        )}>
          Sponsored
        </Badge>
      </div>

      {/* Post Header */}
      <div className={cn(
        'p-3 sm:p-4 flex items-center gap-3 border-b',
        isDark ? 'border-white/10' : 'border-black/5'
      )}>
        <div className={cn(
          'h-10 w-10 rounded-full flex items-center justify-center',
          isDark ? 'bg-white/10' : 'bg-primary/10'
        )}>
          <PlatformIcon className={cn('h-5 w-5', styles.accent)} />
        </div>
        <div>
          <p className={cn('font-semibold text-sm', isDark ? 'text-white' : 'text-foreground')}>
            {preview.config.companyName || 'Your Company'}
          </p>
          <p className={cn('text-xs', isDark ? 'text-white/50' : 'text-muted-foreground')}>
            Sponsored • {preview.config.location || 'United States'}
          </p>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-3 sm:p-4 space-y-3">
        {/* Headline */}
        <h4 className={cn(
          'font-bold text-base leading-tight',
          isDark ? 'text-white' : 'text-foreground'
        )}>
          {preview.content.headline}
        </h4>

        {/* Body */}
        <p className={cn(
          'text-sm leading-relaxed whitespace-pre-wrap',
          isDark ? 'text-white/80' : 'text-muted-foreground'
        )}>
          {preview.content.body}
        </p>

        {/* Media */}
        {preview.mediaUrl && !imgError ? (
          <div className="rounded-lg overflow-hidden border border-border/20">
            <img 
              src={preview.mediaUrl} 
              alt="Ad creative" 
              className="w-full h-auto object-cover"
              onError={() => setImgError(true)}
            />
          </div>
        ) : (
          <div className={cn(
            'rounded-lg h-48 flex items-center justify-center border border-dashed',
            isDark ? 'bg-white/5 border-white/20' : 'bg-muted/50 border-border'
          )}>
            <div className="text-center space-y-1">
              <ImageIcon className={cn('h-8 w-8 mx-auto', isDark ? 'text-white/30' : 'text-muted-foreground/30')} />
              <p className={cn('text-xs', isDark ? 'text-white/50' : 'text-muted-foreground')}>
                {imgError 
                  ? 'Image failed to load'
                  : preview.config.mediaType === 'ai_image' 
                    ? 'AI image will appear here' 
                    : preview.config.mediaType === 'ai_video'
                      ? 'AI video will be generated'
                      : 'Upload your media'}
              </p>
            </div>
          </div>
        )}

        {/* Hashtags */}
        {preview.content.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {preview.content.hashtags.map((tag, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className={cn(
                  'text-xs font-normal',
                  isDark 
                    ? 'bg-white/10 text-white/80 hover:bg-white/20 border-none' 
                    : 'bg-primary/10 text-primary hover:bg-primary/20'
                )}
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Call to Action */}
        {preview.content.callToAction && (
          <div className="pt-2">
            <button className={cn(
              'w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors',
              isDark 
                ? 'bg-white text-black hover:bg-white/90' 
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}>
              {preview.content.callToAction}
            </button>
          </div>
        )}
      </div>

      {/* Post Footer - Platform-accurate icons */}
      <div className={cn(
        'px-3 sm:px-4 py-3 border-t flex items-center justify-between text-xs',
        isDark ? 'border-white/10 text-white/50' : 'border-black/5 text-muted-foreground'
      )}>
        {actions.map(({ icon: Icon, label }) => (
          <span key={label} className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </span>
        ))}
      </div>
    </Card>
  );
}