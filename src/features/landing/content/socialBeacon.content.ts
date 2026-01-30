/**
 * Social Beacon Feature Content
 * Flagship social recruitment feature for landing pages
 */

import { 
  Twitter, 
  Facebook, 
  Instagram, 
  MessageCircle, 
  Video, 
  MessageSquare, 
  Linkedin, 
  Sparkles, 
  Clock, 
  Globe, 
  TrendingUp,
  LucideIcon
} from 'lucide-react';

export interface SocialPlatform {
  name: string;
  icon: LucideIcon;
  color: string;
}

export interface SocialBeaconStat {
  value: string;
  label: string;
}

export interface SocialBeaconCapability {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface SocialBeaconContent {
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  platforms: SocialPlatform[];
  stats: SocialBeaconStat[];
  capabilities: SocialBeaconCapability[];
  cta: {
    primary: string;
    secondary: string;
    path: string;
  };
}

export const socialBeaconContent: SocialBeaconContent = {
  badge: "Featured Technology",
  title: "Social Beacon",
  subtitle: "AI-Powered Social Recruitment",
  description: "Transform your social media presence into a 24/7 recruitment engine. Connect once, reach everywhere.",
  
  platforms: [
    { name: 'X (Twitter)', icon: Twitter, color: 'hsl(var(--foreground))' },
    { name: 'Facebook', icon: Facebook, color: '#1877F2' },
    { name: 'Instagram', icon: Instagram, color: '#E4405F' },
    { name: 'LinkedIn', icon: Linkedin, color: '#0A66C2' },
    { name: 'WhatsApp', icon: MessageCircle, color: '#25D366' },
    { name: 'TikTok', icon: Video, color: 'hsl(var(--foreground))' },
    { name: 'Reddit', icon: MessageSquare, color: '#FF4500' },
  ],
  
  stats: [
    { value: '7', label: 'Platforms Supported' },
    { value: '24/7', label: 'AI Engagement' },
    { value: '< 30s', label: 'Response Time' },
    { value: '95%', label: 'Automation Rate' },
  ],
  
  capabilities: [
    {
      icon: Sparkles,
      title: 'AI Ad Creative Studio',
      description: 'Generate compelling job ads with AI-powered headlines, copy, and hashtags tailored to each platform.'
    },
    {
      icon: Clock,
      title: 'Instant Auto-Responses',
      description: 'AI classifies incoming messages and delivers context-aware responses in under 30 seconds.'
    },
    {
      icon: Globe,
      title: 'Multi-Platform Distribution',
      description: 'Post once, distribute everywhere. One-click publishing across all connected channels.'
    },
    {
      icon: TrendingUp,
      title: 'Engagement Analytics',
      description: 'Track reach, engagement, and conversion rates across all platforms in real-time.'
    },
  ],
  
  cta: {
    primary: 'Connect Your Channels',
    secondary: 'See Demo',
    path: '/auth'
  }
};
