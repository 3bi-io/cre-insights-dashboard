import { LucideIcon, Briefcase, Building2, Sparkles, DollarSign, Play, BookOpen, Mail } from 'lucide-react';

export interface PublicNavItem {
  name: string;
  href: string;
  icon?: LucideIcon;
  isNew?: boolean;
  description?: string;
}

export const publicNavigation: PublicNavItem[] = [
  { 
    name: 'Jobs', 
    href: '/jobs', 
    icon: Briefcase,
    description: 'Browse open positions'
  },
  { 
    name: 'Companies', 
    href: '/clients', 
    icon: Building2,
    isNew: true,
    description: 'Explore hiring companies'
  },
  { 
    name: 'Features', 
    href: '/features', 
    icon: Sparkles,
    description: 'Platform capabilities'
  },
  { 
    name: 'Pricing', 
    href: '/pricing', 
    icon: DollarSign,
    description: 'Plans and pricing'
  },
  { 
    name: 'Demo', 
    href: '/demo', 
    icon: Play,
    description: 'See it in action'
  },
  { 
    name: 'Resources', 
    href: '/resources', 
    icon: BookOpen,
    description: 'Guides and articles'
  },
  { 
    name: 'Contact', 
    href: '/contact', 
    icon: Mail,
    description: 'Get in touch'
  }
];

export const getPublicNavItem = (href: string): PublicNavItem | undefined => {
  return publicNavigation.find(item => item.href === href);
};

export const publicNavTitles: Record<string, string> = publicNavigation.reduce((acc, item) => {
  acc[item.href] = item.name;
  return acc;
}, {} as Record<string, string>);
