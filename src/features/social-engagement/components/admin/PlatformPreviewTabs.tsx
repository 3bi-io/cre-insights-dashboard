import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Twitter, Facebook, Instagram, Linkedin, Video, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SocialBeaconPlatform } from '../../config/socialBeacons.config';

interface PlatformPreviewTabsProps {
  selectedPlatform: SocialBeaconPlatform;
  onPlatformChange: (platform: SocialBeaconPlatform) => void;
  className?: string;
}

const PREVIEW_PLATFORMS: { id: SocialBeaconPlatform; label: string; icon: React.ElementType }[] = [
  { id: 'x', label: 'X', icon: Twitter },
  { id: 'facebook', label: 'Facebook', icon: Facebook },
  { id: 'instagram', label: 'Instagram', icon: Instagram },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { id: 'tiktok', label: 'TikTok', icon: Video },
];

export function PlatformPreviewTabs({
  selectedPlatform,
  onPlatformChange,
  className,
}: PlatformPreviewTabsProps) {
  return (
    <Tabs 
      value={selectedPlatform} 
      onValueChange={(v) => onPlatformChange(v as SocialBeaconPlatform)}
      className={cn('w-full', className)}
    >
      <TabsList className="grid w-full grid-cols-5">
        {PREVIEW_PLATFORMS.map(({ id, label, icon: Icon }) => (
          <TabsTrigger 
            key={id} 
            value={id}
            className="text-xs gap-1"
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
