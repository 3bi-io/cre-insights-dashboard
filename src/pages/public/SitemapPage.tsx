import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Globe, 
  Shield, 
  UserPlus, 
  LayoutDashboard, 
  Briefcase, 
  BarChart3, 
  Plug, 
  Settings, 
  Wrench,
  FileText,
  Home,
  Phone,
  DollarSign,
  Sparkles,
  Users,
  Building2,
  Radio,
  Route,
  Megaphone,
  TrendingUp,
  Brain,
  Mic,
  Server,
  Lock,
  Boxes,
  Rss,
  Webhook,
  Database,
  HelpCircle,
  Eye,
  Import,
  PlayCircle,
  WifiOff,
  Download
} from 'lucide-react';

interface RouteItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

interface RouteCategory {
  title: string;
  description: string;
  icon: React.ReactNode;
  routes: RouteItem[];
}

const SitemapPage = () => {
  const categories: RouteCategory[] = [
    {
      title: 'Public Pages',
      description: 'Publicly accessible pages and information',
      icon: <Globe className="w-5 h-5" />,
      routes: [
        { path: '/', label: 'Home', icon: <Home className="w-4 h-4" />, description: 'Homepage and landing page' },
        { path: '/jobs', label: 'Jobs', icon: <Briefcase className="w-4 h-4" />, description: 'Browse available positions' },
        { path: '/features', label: 'Features', icon: <Sparkles className="w-4 h-4" />, description: 'Platform features and capabilities' },
        { path: '/pricing', label: 'Pricing', icon: <DollarSign className="w-4 h-4" />, description: 'Pricing plans and packages' },
        { path: '/demo', label: 'Demo', icon: <PlayCircle className="w-4 h-4" />, description: 'Product demonstration' },
        { path: '/resources', label: 'Resources', icon: <FileText className="w-4 h-4" />, description: 'Guides and documentation' },
        { path: '/contact', label: 'Contact', icon: <Phone className="w-4 h-4" />, description: 'Get in touch with us' },
      ],
    },
    {
      title: 'Legal & Privacy',
      description: 'Legal documents and privacy information',
      icon: <Shield className="w-5 h-5" />,
      routes: [
        { path: '/privacy-policy', label: 'Privacy Policy', icon: <Lock className="w-4 h-4" />, description: 'Data protection and privacy' },
        { path: '/terms-of-service', label: 'Terms of Service', icon: <FileText className="w-4 h-4" />, description: 'Terms and conditions' },
        { path: '/cookie-policy', label: 'Cookie Policy', icon: <FileText className="w-4 h-4" />, description: 'Cookie usage information' },
      ],
    },
    {
      title: 'Authentication',
      description: 'Sign in, sign up, and application pages',
      icon: <UserPlus className="w-5 h-5" />,
      routes: [
        { path: '/auth', label: 'Sign In / Sign Up', icon: <UserPlus className="w-4 h-4" />, description: 'User authentication' },
        { path: '/apply', label: 'Quick Apply', icon: <FileText className="w-4 h-4" />, description: 'Quick job application' },
        { path: '/apply/detailed', label: 'Detailed Application', icon: <FileText className="w-4 h-4" />, description: 'Comprehensive application form' },
        { path: '/onboarding', label: 'Onboarding', icon: <UserPlus className="w-4 h-4" />, description: 'New user onboarding' },
      ],
    },
    {
      title: 'Dashboard',
      description: 'Main dashboard and overview',
      icon: <LayoutDashboard className="w-5 h-5" />,
      routes: [
        { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, description: 'Main dashboard overview' },
        { path: '/admin', label: 'Admin Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, description: 'Administrative dashboard' },
      ],
    },
    {
      title: 'Core Management',
      description: 'Manage jobs, applications, clients, and campaigns',
      icon: <Briefcase className="w-5 h-5" />,
      routes: [
        { path: '/admin/jobs', label: 'Jobs', icon: <Briefcase className="w-4 h-4" />, description: 'Manage job listings' },
        { path: '/admin/job-groups', label: 'Job Groups', icon: <Boxes className="w-4 h-4" />, description: 'Organize jobs into groups' },
        { path: '/admin/applications', label: 'Applications', icon: <FileText className="w-4 h-4" />, description: 'View and manage applications' },
        { path: '/admin/applications/import', label: 'Import Applications', icon: <Import className="w-4 h-4" />, description: 'Bulk import applications' },
        { path: '/admin/campaigns', label: 'Campaigns', icon: <Megaphone className="w-4 h-4" />, description: 'Marketing campaign management' },
        { path: '/admin/clients', label: 'Clients', icon: <Users className="w-4 h-4" />, description: 'Client management' },
        { path: '/admin/organizations', label: 'Organizations', icon: <Building2 className="w-4 h-4" />, description: 'Organization settings' },
        { path: '/admin/routes', label: 'Routes', icon: <Route className="w-4 h-4" />, description: 'Transportation routes' },
      ],
    },
    {
      title: 'Analytics & Reporting',
      description: 'Performance metrics and analytics dashboards',
      icon: <BarChart3 className="w-5 h-5" />,
      routes: [
        { path: '/admin/ai-analytics', label: 'AI Analytics', icon: <Brain className="w-4 h-4" />, description: 'AI-powered analytics' },
        { path: '/admin/ai-impact', label: 'AI Impact Dashboard', icon: <TrendingUp className="w-4 h-4" />, description: 'AI impact metrics' },
        { path: '/admin/visitor-analytics', label: 'Visitor Analytics', icon: <Eye className="w-4 h-4" />, description: 'Website visitor tracking' },
        { path: '/admin/meta-adset-report', label: 'Meta Ad Set Report', icon: <BarChart3 className="w-4 h-4" />, description: 'Facebook ad performance' },
        { path: '/admin/meta-spend-analytics', label: 'Meta Spend Analytics', icon: <DollarSign className="w-4 h-4" />, description: 'Ad spend analysis' },
      ],
    },
    {
      title: 'AI & Integrations',
      description: 'AI tools and third-party integrations',
      icon: <Plug className="w-5 h-5" />,
      routes: [
        { path: '/admin/ai-tools', label: 'AI Tools', icon: <Brain className="w-4 h-4" />, description: 'AI-powered tools and features' },
        { path: '/admin/ai-settings', label: 'AI Platform Settings', icon: <Settings className="w-4 h-4" />, description: 'Configure AI platforms' },
        { path: '/admin/voice-agent', label: 'Voice Agent', icon: <Mic className="w-4 h-4" />, description: 'Voice AI configuration' },
        { path: '/admin/elevenlabs-admin', label: 'ElevenLabs Admin', icon: <Radio className="w-4 h-4" />, description: 'ElevenLabs integration' },
        { path: '/admin/tenstreet', label: 'Tenstreet Integration', icon: <Plug className="w-4 h-4" />, description: 'Tenstreet ATS integration' },
        { path: '/admin/tenstreet-explorer', label: 'Tenstreet Explorer', icon: <Plug className="w-4 h-4" />, description: 'Browse Tenstreet data' },
      ],
    },
    {
      title: 'Platform Tools',
      description: 'Publishing platforms, feeds, and webhooks',
      icon: <Wrench className="w-5 h-5" />,
      routes: [
        { path: '/admin/platforms', label: 'Platforms', icon: <Server className="w-4 h-4" />, description: 'Job board platforms' },
        { path: '/admin/publishers', label: 'Publishers', icon: <Server className="w-4 h-4" />, description: 'Publisher management' },
        { path: '/admin/feeds', label: 'Feeds Management', icon: <Rss className="w-4 h-4" />, description: 'RSS and XML feeds' },
        { path: '/admin/universal-feeds', label: 'Universal Feeds', icon: <Rss className="w-4 h-4" />, description: 'Universal job feeds' },
        { path: '/admin/super-admin-feeds', label: 'Super Admin Feeds', icon: <Rss className="w-4 h-4" />, description: 'Admin feed management' },
        { path: '/admin/webhook-management', label: 'Webhook Management', icon: <Webhook className="w-4 h-4" />, description: 'Configure webhooks' },
        { path: '/admin/hayes-data', label: 'Hayes Data Population', icon: <Database className="w-4 h-4" />, description: 'Hayes data import' },
      ],
    },
    {
      title: 'Settings & Configuration',
      description: 'System settings and user management',
      icon: <Settings className="w-5 h-5" />,
      routes: [
        { path: '/admin/settings', label: 'Settings', icon: <Settings className="w-4 h-4" />, description: 'System configuration' },
        { path: '/admin/user-management', label: 'User Management', icon: <Users className="w-4 h-4" />, description: 'Manage users and permissions' },
        { path: '/admin/media', label: 'Media', icon: <FileText className="w-4 h-4" />, description: 'Media library' },
        { path: '/admin/privacy-controls', label: 'Privacy Controls', icon: <Lock className="w-4 h-4" />, description: 'Privacy settings' },
        { path: '/admin/support', label: 'Support', icon: <HelpCircle className="w-4 h-4" />, description: 'Help and support' },
      ],
    },
    {
      title: 'System Pages',
      description: 'System utilities and error pages',
      icon: <Wrench className="w-5 h-5" />,
      routes: [
        { path: '/install', label: 'Install PWA', icon: <Download className="w-4 h-4" />, description: 'Install as app' },
        { path: '/offline', label: 'Offline', icon: <WifiOff className="w-4 h-4" />, description: 'Offline mode page' },
        { path: '/access-denied', label: 'Access Denied', icon: <Shield className="w-4 h-4" />, description: 'Access denied page' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container-wide py-12">
          <h1 className="heading-1 mb-4">Sitemap</h1>
          <p className="text-muted-foreground text-lg max-w-3xl">
            Comprehensive directory of all pages and features available on the platform. 
            Find what you need quickly and easily.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-wide py-8 space-y-8">
        {categories.map((category, idx) => (
          <Card key={idx} className="card-elevated">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {category.icon}
                </div>
                <div>
                  <CardTitle className="text-2xl">{category.title}</CardTitle>
                  <CardDescription className="text-base mt-1">
                    {category.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.routes.map((route, routeIdx) => (
                  <Link
                    key={routeIdx}
                    to={route.path}
                    className="group p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/5 transition-all duration-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 text-muted-foreground group-hover:text-primary transition-colors">
                        {route.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {route.label}
                        </div>
                        {route.description && (
                          <div className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                            {route.description}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground/70 mt-1 font-mono">
                          {route.path}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="container-wide py-8 text-center text-muted-foreground">
          <p className="text-sm">
            Need help navigating? <Link to="/admin/support" className="text-primary hover:underline">Contact support</Link>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SitemapPage;
