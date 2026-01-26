import {
  LucideIcon,
  Home,
  Briefcase,
  Search,
  Bookmark,
  User,
  MessageSquare,
  LayoutDashboard, 
  BriefcaseIcon, 
  Users, 
  Settings, 
  Building, 
  Share2, 
  Zap, 
  Bot, 
  UserCog, 
  BarChart3, 
  MapPin, 
  UserCheck, 
  Rss, 
  HelpCircle, 
  Target, 
  TrendingUp, 
  Sparkles, 
  Webhook, 
  Globe, 
  FolderKanban, 
  Image,
  Shield
} from 'lucide-react';

// Re-export public navigation for convenience
export { publicNavigation, type PublicNavItem } from './publicNavigationConfig';

// Candidate Portal Navigation
export interface CandidateNavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  description?: string;
}

export const candidateNavigation: CandidateNavItem[] = [
  { 
    name: 'Dashboard', 
    href: '/my-jobs', 
    icon: Home,
    description: 'Your job search overview'
  },
  { 
    name: 'Applications', 
    href: '/my-jobs/applications', 
    icon: Briefcase,
    description: 'Track your applications'
  },
  { 
    name: 'Search Jobs', 
    href: '/my-jobs/search', 
    icon: Search,
    description: 'Find new opportunities'
  },
  { 
    name: 'Saved Jobs', 
    href: '/my-jobs/saved', 
    icon: Bookmark,
    description: 'Your bookmarked jobs'
  },
  { 
    name: 'Profile', 
    href: '/my-jobs/profile', 
    icon: User,
    description: 'Manage your profile'
  },
  { 
    name: 'Messages', 
    href: '/my-jobs/messages', 
    icon: MessageSquare,
    badge: 'Soon',
    description: 'Recruiter messages'
  }
];

// Admin Navigation

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  // Feature/role requirements
  requiresAdmin?: boolean;
  requiresSuperAdmin?: boolean;
  requiresVoiceAgent?: boolean;
  requiresTenstreet?: boolean;
  excludeOrganization?: string; // e.g., 'acme'
}

export interface NavGroup {
  group: string;
  icon: LucideIcon;
  items: NavItem[];
  requiresSuperAdmin?: boolean;
}

// Main standalone items
export const mainNavItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }
];

// All navigation groups - source of truth for both desktop and mobile
export const getNavigationGroups = (options: {
  userRole?: string | null;
  // Legacy boolean flags (kept for backward compatibility)
  isSuperAdmin?: boolean;
  isAdmin?: boolean;
  hasVoiceAgent: boolean;
  hasTenstreetAccess: boolean;
  organizationSlug?: string;
  tenstreetNotificationCount?: number;
}): NavGroup[] => {
  const { 
    userRole,
    hasVoiceAgent, 
    hasTenstreetAccess, 
    organizationSlug,
    tenstreetNotificationCount = 0
  } = options;

  // Support both new userRole and legacy boolean flags
  const isSuperAdmin = options.isSuperAdmin ?? userRole === 'super_admin';
  const isAdmin = options.isAdmin ?? (userRole === 'admin' || userRole === 'super_admin');
  const isModerator = userRole === 'moderator' || isAdmin;
  const isRecruiter = userRole === 'recruiter' || isModerator;

  return [
    {
      group: "Recruitment",
      icon: Users,
      items: [
        { path: '/admin/applications', label: 'Applications', icon: Users },
        { path: '/admin/jobs', label: 'Job Listings', icon: BriefcaseIcon },
        ...(organizationSlug !== 'acme' && isRecruiter ? [
          { path: '/admin/clients', label: 'Clients', icon: UserCheck }
        ] : []),
        { path: '/admin/routes', label: 'Routes', icon: MapPin },
        ...(isModerator ? [
          { path: '/admin/talent/pools', label: 'Talent Pools', icon: Bookmark }
        ] : []),
        ...(hasVoiceAgent && isAdmin ? [
          { path: '/admin/elevenlabs-admin', label: 'Voice Agents', icon: MessageSquare }
        ] : [])
      ]
    },
    {
      group: "Campaigns",
      icon: Target,
      items: [
        { path: '/admin/campaigns', label: 'Campaigns', icon: Target },
        ...(isAdmin ? [{ path: '/admin/job-groups', label: 'Job Groups', icon: FolderKanban }] : [])
      ]
    },
    {
      group: "Connections",
      icon: Share2,
      items: [
        ...(hasTenstreetAccess && isAdmin ? [{
          path: '/admin/ats-command',
          label: 'ATS Command Center',
          icon: Share2,
          badge: tenstreetNotificationCount > 0 ? tenstreetNotificationCount : undefined
        }] : []),
        ...(isAdmin ? [{
          path: '/admin/settings?tab=verifications',
          label: 'Verifications',
          icon: Shield
        }] : []),
        ...(isModerator ? [
          { path: '/admin/ad-networks', label: 'Ad Networks', icon: Globe },
          { path: '/admin/job-boards', label: 'Job Boards', icon: Rss }
        ] : []),
        ...(isAdmin ? [
          { path: '/admin/webhook-management', label: 'Webhooks', icon: Webhook }
        ] : []),
        ...(isSuperAdmin ? [
          { path: '/admin/universal-feeds', label: 'Universal Feeds', icon: Rss }
        ] : [])
      ]
    },
    {
      group: "AI & Voice",
      icon: Bot,
      items: [
        { path: '/admin/grok', label: 'AI Assistant', icon: Sparkles },
        ...(isModerator ? [
          { path: '/admin/ai-tools', label: 'AI Tools', icon: Bot },
          { path: '/admin/ai-analytics', label: 'AI Analytics', icon: BarChart3 }
        ] : []),
        ...(isAdmin ? [
          { path: '/admin/ai-impact', label: 'AI Impact', icon: Zap }
        ] : []),
        ...(isSuperAdmin ? [
          { path: '/admin/visitor-analytics', label: 'Visitor Analytics', icon: BarChart3 },
          { path: '/admin/meta-analytics', label: 'Meta Analytics', icon: TrendingUp }
        ] : [])
      ]
    },
    {
      group: "Settings",
      icon: Settings,
      items: [
        { path: '/admin/settings', label: 'General Settings', icon: Settings },
        ...(isAdmin ? [
          { path: '/admin/settings/organization', label: 'Organization', icon: Building },
          { path: '/admin/ai-configuration', label: 'AI Configuration', icon: Settings }
        ] : []),
        { path: '/admin/support', label: 'Support', icon: HelpCircle }
      ]
    },
    ...(isSuperAdmin ? [{
      group: "Administration",
      icon: Building,
      items: [
        { path: '/admin/organizations', label: 'Organizations', icon: Building },
        { path: '/admin/user-management', label: 'User Management', icon: UserCog },
        { path: '/admin/super-admin-feeds', label: 'Feed Management', icon: Rss },
        { path: '/admin/media', label: 'Media Assets', icon: Image }
      ]
    }] : [])
  ].filter(group => group.items.length > 0); // Filter out empty groups
};

// Route title mapping for headers
export const routeTitles: Record<string, string> = {
  '/': 'Home',
  '/admin': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/admin/jobs': 'Job Listings',
  '/admin/applications': 'Applications',
  '/admin/campaigns': 'Campaigns',
  '/admin/job-groups': 'Job Groups',
  '/admin/ai-impact': 'AI Impact',
  '/admin/voice-agent': 'Voice Agent',
  '/admin/ats-command': 'ATS Command Center',
  '/admin/meta-analytics': 'Meta Analytics',
  '/admin/ai-configuration': 'AI Configuration',
  '/admin/grok': 'AI Assistant',
  '/admin/elevenlabs-admin': 'Voice Agents',
  '/admin/ai-tools': 'AI Tools',
  '/admin/ai-analytics': 'AI Analytics',
  '/admin/visitor-analytics': 'Visitor Analytics',
  '/admin/publishers': 'Ad Networks',
  '/admin/ad-networks': 'Ad Networks',
  '/admin/job-boards': 'Job Boards',
  '/admin/organizations': 'Organizations',
  '/admin/settings': 'Settings',
  '/admin/user-management': 'User Management',
  '/admin/universal-feeds': 'Universal Feeds',
  '/admin/webhook-management': 'Webhooks',
  '/admin/support': 'Support',
  '/admin/clients': 'Clients',
  '/admin/routes': 'Routes',
  '/admin/media': 'Media Assets',
  '/admin/recruiters': 'Recruiters',
  '/admin/api-keys': 'API Keys',
  // '/admin/billing': 'Billing', // Removed - no subscription tiers
  '/admin/integrations': 'Integrations',
  '/admin/reports': 'Reports',
  '/admin/analytics': 'Analytics',
  '/admin/notifications': 'Notifications',
  '/admin/audit-logs': 'Audit Logs',
  '/admin/tenstreet': 'Tenstreet',
  '/admin/profile': 'Profile Settings',
  '/admin/super-admin-feeds': 'Feed Management',
  '/admin/platforms': 'Ad Networks',
  '/admin/settings/organization': 'Organization Settings',
  '/admin/brand-assets': 'Brand Assets',
  '/admin/active-job-ids': 'Active Job IDs',
  '/admin/data-population': 'Data Population',
  '/admin/tenstreet-sync': 'Tenstreet Sync Dashboard',
  '/admin/driverreach-integration': 'DriverReach Integration',
  '/admin/driverreach-sync': 'DriverReach Sync Dashboard',
  '/admin/talent': 'Candidate Search',
  '/admin/talent/pools': 'Talent Pools',
};

export const getRouteTitle = (pathname: string): string => {
  return routeTitles[pathname] || 'Dashboard';
};
