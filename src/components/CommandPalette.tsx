import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  Users,
  Briefcase,
  Building2,
  LayoutDashboard,
  Settings,
  Bot,
  Phone,
  BarChart3,
  FileText,
  Route,
  Megaphone,
  Globe,
  Shield,
  Mic,
  Zap,
  Search,
} from 'lucide-react';

interface CommandRoute {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string[];
  group: string;
}

const NAVIGATION_ROUTES: CommandRoute[] = [
  // Dashboard
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, keywords: ['home', 'overview'], group: 'Navigation' },
  { label: 'Applications', path: '/admin/applications', icon: FileText, keywords: ['candidates', 'applicants', 'pipeline'], group: 'Navigation' },
  { label: 'Jobs', path: '/admin/jobs', icon: Briefcase, keywords: ['listings', 'positions', 'openings'], group: 'Navigation' },
  { label: 'Clients', path: '/admin/clients', icon: Building2, keywords: ['companies', 'employers'], group: 'Navigation' },
  { label: 'Routes', path: '/admin/routes', icon: Route, keywords: ['lanes', 'locations'], group: 'Navigation' },

  // AI & Voice
  { label: 'Voice Agent', path: '/admin/voice-agent', icon: Mic, keywords: ['calls', 'elevenlabs', 'phone'], group: 'AI & Voice' },
  { label: 'AI Tools', path: '/admin/ai-tools', icon: Bot, keywords: ['artificial intelligence', 'assistant'], group: 'AI & Voice' },
  { label: 'AI Configuration', path: '/admin/ai-configuration', icon: Settings, keywords: ['ai settings', 'privacy'], group: 'AI & Voice' },
  { label: 'ElevenLabs Admin', path: '/admin/elevenlabs-admin', icon: Phone, keywords: ['voice', 'agents'], group: 'AI & Voice' },

  // Connections
  { label: 'ATS Command Center', path: '/admin/ats-command', icon: Zap, keywords: ['tenstreet', 'driverreach', 'integrations', 'sync'], group: 'Connections' },
  { label: 'Ad Networks', path: '/admin/ad-networks', icon: Megaphone, keywords: ['meta', 'facebook', 'indeed', 'publishers'], group: 'Connections' },
  { label: 'Meta Analytics', path: '/admin/meta-analytics', icon: BarChart3, keywords: ['facebook', 'ads', 'campaigns'], group: 'Connections' },

  // Campaigns
  { label: 'Campaigns', path: '/admin/campaigns', icon: Globe, keywords: ['marketing', 'outreach'], group: 'Campaigns' },

  // Settings
  { label: 'Settings', path: '/admin/settings', icon: Settings, keywords: ['preferences', 'account', 'profile'], group: 'Settings' },

  // Tools
  { label: 'Web Scraper', path: '/admin/web-scraper', icon: Globe, keywords: ['firecrawl', 'scrape', 'extract', 'branding'], group: 'Tools' },

  // Public pages
  { label: 'Job Board', path: '/jobs', icon: Search, keywords: ['search', 'find jobs', 'careers'], group: 'Public Pages' },
  { label: 'Apply', path: '/apply', icon: FileText, keywords: ['application', 'submit'], group: 'Public Pages' },
];

export const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = useCallback(
    (path: string) => {
      setOpen(false);
      navigate(path);
    },
    [navigate]
  );

  const groups = NAVIGATION_ROUTES.reduce<Record<string, CommandRoute[]>>((acc, route) => {
    if (!acc[route.group]) acc[route.group] = [];
    acc[route.group].push(route);
    return acc;
  }, {});

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages, features, settings..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {Object.entries(groups).map(([group, routes], idx) => (
          <React.Fragment key={group}>
            {idx > 0 && <CommandSeparator />}
            <CommandGroup heading={group}>
              {routes.map((route) => {
                const Icon = route.icon;
                return (
                  <CommandItem
                    key={route.path}
                    value={`${route.label} ${route.keywords?.join(' ') ?? ''}`}
                    onSelect={() => handleSelect(route.path)}
                  >
                    <Icon className="mr-2 h-4 w-4 shrink-0" />
                    <span>{route.label}</span>
                    {route.path === '/admin' && (
                      <CommandShortcut>⌘D</CommandShortcut>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </React.Fragment>
        ))}
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;
