/**
 * TypeScript types for landing page content
 */

import { LucideIcon } from 'lucide-react';

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface DetailedFeature extends Feature {
  features: string[];
}

export interface Stat {
  number: string;
  label: string;
}

export interface TrustStat {
  icon: LucideIcon;
  value: string;
  label: string;
  description: string;
}

export interface IntegrationCategory {
  title: string;
  integrations: string[];
  icon?: LucideIcon;
}

export interface Benefit {
  text: string;
}

export interface OnboardingStep {
  icon: LucideIcon;
  title: string;
  time: string;
  tasks: string[];
}

export interface QuickWin {
  text: string;
}

export interface SupportFeature {
  icon: LucideIcon;
  text: string;
  detail: string;
}

export interface SupportTier {
  name: string;
  badge: string;
  popular?: boolean;
  features: SupportFeature[];
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface CTAStat {
  value: string;
  label: string;
}

export interface FeaturedProduct {
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  platforms?: {
    name: string;
    icon: LucideIcon;
    color: string;
  }[];
  stats?: {
    value: string;
    label: string;
  }[];
  capabilities?: {
    icon: LucideIcon;
    title: string;
    description: string;
  }[];
  cta: {
    primary: string;
    secondary?: string;
    path: string;
  };
}
