import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PageLayout } from '@/features/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Globe, CheckCircle2, XCircle, Clock, Search, Rss, 
  ExternalLink, Copy, Check, RefreshCw, BarChart3, 
  Truck, Building2, TrendingUp, FileText, Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Feed-capable platforms with their universal-xml-feed format keys
const SYNDICATION_PLATFORMS = [
  { key: 'indeed', name: 'Indeed', format: 'indeed', icon: '🔵', category: 'General' },
  { key: 'google-jobs', name: 'Google Jobs', format: 'google', icon: '🔴', category: 'General' },
  { key: 'jooble', name: 'Jooble', format: 'jooble', icon: '🟣', category: 'General' },
  { key: 'talent', name: 'Talent.com', format: 'talent', icon: '🟢', category: 'General' },
  { key: 'careerjet', name: 'CareerJet', format: 'careerjet', icon: '🔶', category: 'General' },
  { key: 'jobrapido', name: 'Jobrapido', format: 'jobrapido', icon: '🟠', category: 'General' },
  { key: 'simplyhired', name: 'SimplyHired', format: 'simplyhired', icon: '🟢', category: 'General' },
  { key: 'adzuna', name: 'Adzuna', format: 'adzuna', icon: '🟡', category: 'General' },
  { key: 'linkedin', name: 'LinkedIn', format: 'linkedin', icon: '🔷', category: 'Social' },
  { key: 'glassdoor', name: 'Glassdoor', format: 'generic', icon: '🟩', category: 'Reviews' },
  { key: 'craigslist', name: 'Craigslist', format: 'generic', icon: '🟨', category: 'Classifieds' },
  { key: 'truck-driver-jobs-411', name: 'TDJ411', format: 'generic', icon: '🚛', category: 'Trucking' },
  { key: 'newjobs4you', name: 'NewJobs4You', format: 'generic', icon: '📋', category: 'Transport' },
  { key: 'roadwarriors', name: 'RoadWarriors', format: 'generic', icon: '🛣️', category: 'Trucking' },
] as const;

const PROJECT_URL = 'https://auwhcdpppldjlcaxzsme.supabase.co';

type FeedStatus = 'active' | 'inactive' | 'pending' | 'error';

interface PlatformFeedHealth {
  platform: string;
  lastAccess: string | null;
  accessCount: number;
  avgJobCount: number;
  avgResponseTime: number;
  status: FeedStatus;
}

const SyndicationDashboard = () => {
  const { user, organization } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const organizationId = organization?.id;

  // Fetch active job listings
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['syndication-jobs', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('job_listings')
        .select('id, title, location, status, client_id, job_type, created_at')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Fetch client names for display
  const { data: clients = [] } = useQuery({
    queryKey: ['syndication-clients', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .eq('organization_id', organizationId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Fetch platform access settings
  const { data: platformAccess = [] } = useQuery({
    queryKey: ['syndication-platform-access', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase.rpc('get_organization_platform_access', {
        _org_id: organizationId,
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Fetch feed access logs for health status (last 7 days)
  const { data: feedLogs = [], isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['syndication-feed-logs', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('feed_access_logs')
        .select('platform, format, job_count, response_time_ms, created_at')
        .eq('organization_id', organizationId)
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
    staleTime: 60_000,
  });

  // Build platform access lookup
  const platformAccessMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    platformAccess.forEach((p: any) => {
      map[p.platform_name] = p.enabled;
    });
    return map;
  }, [platformAccess]);

  // Build feed health per platform
  const feedHealth = useMemo((): Record<string, PlatformFeedHealth> => {
    const health: Record<string, PlatformFeedHealth> = {};

    SYNDICATION_PLATFORMS.forEach(platform => {
      const logs = feedLogs.filter(
        (l: any) => l.platform === platform.key || l.format === platform.format
      );

      const isEnabled = platformAccessMap[platform.key] !== false; // default true if no record
      const lastLog = logs[0];
      const avgJobCount = logs.length > 0
        ? Math.round(logs.reduce((s: number, l: any) => s + (l.job_count || 0), 0) / logs.length)
        : 0;
      const avgResponseTime = logs.length > 0
        ? Math.round(logs.reduce((s: number, l: any) => s + (l.response_time_ms || 0), 0) / logs.length)
        : 0;

      let status: FeedStatus = 'inactive';
      if (!isEnabled) {
        status = 'inactive';
      } else if (logs.length === 0) {
        status = 'pending';
      } else if (avgJobCount === 0) {
        status = 'error';
      } else {
        status = 'active';
      }

      health[platform.key] = {
        platform: platform.key,
        lastAccess: lastLog?.created_at || null,
        accessCount: logs.length,
        avgJobCount,
        avgResponseTime,
        status,
      };
    });

    return health;
  }, [feedLogs, platformAccessMap]);

  // Client name lookup
  const clientMap = useMemo(() => {
    const map: Record<string, string> = {};
    clients.forEach((c: any) => { map[c.id] = c.name; });
    return map;
  }, [clients]);

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job: any) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !job.title?.toLowerCase().includes(q) &&
          !job.location?.toLowerCase().includes(q) &&
          !(clientMap[job.client_id] || '').toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [jobs, searchQuery, clientMap]);

  // Filtered platforms
  const filteredPlatforms = useMemo(() => {
    if (statusFilter === 'all') return SYNDICATION_PLATFORMS;
    return SYNDICATION_PLATFORMS.filter(p => feedHealth[p.key]?.status === statusFilter);
  }, [statusFilter, feedHealth]);

  // Summary stats
  const stats = useMemo(() => {
    const activePlatforms = SYNDICATION_PLATFORMS.filter(p => feedHealth[p.key]?.status === 'active').length;
    const pendingPlatforms = SYNDICATION_PLATFORMS.filter(p => feedHealth[p.key]?.status === 'pending').length;
    const totalDistributions = jobs.length * activePlatforms;
    return { activePlatforms, pendingPlatforms, totalJobs: jobs.length, totalDistributions };
  }, [feedHealth, jobs]);

  const getStatusIcon = (status: FeedStatus) => {
    switch (status) {
      case 'active': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-destructive" />;
      default: return <XCircle className="w-4 h-4 text-muted-foreground/40" />;
    }
  };

  const getStatusBadge = (status: FeedStatus) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/15 text-green-700 border-green-200 text-xs">Active</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/15 text-amber-700 border-amber-200 text-xs">Awaiting Crawl</Badge>;
      case 'error':
        return <Badge variant="destructive" className="text-xs">No Jobs</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Disabled</Badge>;
    }
  };

  const getFeedUrl = (format: string) =>
    `${PROJECT_URL}/functions/v1/universal-xml-feed?organization_id=${organizationId}&format=${format}`;

  const copyUrl = async (format: string, name: string) => {
    const url = getFeedUrl(format);
    await navigator.clipboard.writeText(url);
    setCopiedUrl(format);
    toast({ title: 'Copied!', description: `${name} feed URL copied` });
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Rss className="w-8 h-8 text-primary" />
              Syndication Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor job distribution across {SYNDICATION_PLATFORMS.length} platforms
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetchLogs()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">{stats.totalJobs}</div>
                <div className="text-sm text-muted-foreground mt-1">Active Jobs</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.activePlatforms}</div>
                <div className="text-sm text-muted-foreground mt-1">Active Feeds</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-600">{stats.pendingPlatforms}</div>
                <div className="text-sm text-muted-foreground mt-1">Awaiting Crawl</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{stats.totalDistributions.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground mt-1">Total Distributions</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="matrix" className="w-full">
          <TabsList>
            <TabsTrigger value="matrix">Distribution Matrix</TabsTrigger>
            <TabsTrigger value="platforms">Platform Health</TabsTrigger>
            <TabsTrigger value="feeds">Feed URLs</TabsTrigger>
          </TabsList>

          {/* Distribution Matrix Tab */}
          <TabsContent value="matrix" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="w-3 h-3 text-green-500" /> Active
                <Clock className="w-3 h-3 text-amber-500" /> Pending
                <XCircle className="w-3 h-3 text-muted-foreground/40" /> Disabled
              </div>
            </div>

            <Card>
              <ScrollArea className="w-full">
                <div className="min-w-[900px]">
                  {/* Header row */}
                  <div className="flex border-b bg-muted/30 sticky top-0 z-10">
                    <div className="w-[280px] shrink-0 px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Job Listing
                    </div>
                    {SYNDICATION_PLATFORMS.map(platform => (
                      <TooltipProvider key={platform.key}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="w-[60px] shrink-0 px-1 py-3 text-center">
                              <span className="text-lg">{platform.icon}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-semibold">{platform.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {feedHealth[platform.key]?.status === 'active' 
                                ? `${feedHealth[platform.key]?.avgJobCount} jobs avg` 
                                : feedHealth[platform.key]?.status}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>

                  {/* Job rows */}
                  {jobsLoading ? (
                    <div className="p-8 text-center text-muted-foreground">Loading jobs...</div>
                  ) : filteredJobs.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">No active jobs found</div>
                  ) : (
                    filteredJobs.slice(0, 50).map((job: any) => (
                      <div key={job.id} className="flex border-b hover:bg-muted/20 transition-colors">
                        <div className="w-[280px] shrink-0 px-4 py-3">
                          <div className="text-sm font-medium text-foreground truncate">{job.title}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {clientMap[job.client_id] && (
                              <span className="mr-2">{clientMap[job.client_id]}</span>
                            )}
                            {job.location && <span>· {job.location}</span>}
                          </div>
                        </div>
                        {SYNDICATION_PLATFORMS.map(platform => {
                          const health = feedHealth[platform.key];
                          const isEnabled = platformAccessMap[platform.key] !== false;
                          return (
                            <div
                              key={platform.key}
                              className="w-[60px] shrink-0 flex items-center justify-center"
                            >
                              {isEnabled ? (
                                health?.status === 'active' ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                ) : health?.status === 'pending' ? (
                                  <Clock className="w-4 h-4 text-amber-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-destructive/50" />
                                )
                              ) : (
                                <div className="w-4 h-4 rounded-full bg-muted-foreground/10" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))
                  )}

                  {filteredJobs.length > 50 && (
                    <div className="p-3 text-center text-xs text-muted-foreground bg-muted/20">
                      Showing 50 of {filteredJobs.length} jobs
                    </div>
                  )}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>

          {/* Platform Health Tab */}
          <TabsContent value="platforms" className="space-y-4">
            <div className="flex items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Disabled</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlatforms.map(platform => {
                const health = feedHealth[platform.key];
                return (
                  <Card key={platform.key} className={cn(
                    "transition-all hover:shadow-md",
                    health?.status === 'active' && "border-green-200",
                    health?.status === 'error' && "border-destructive/30",
                  )}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <span className="text-xl">{platform.icon}</span>
                          {platform.name}
                        </CardTitle>
                        {getStatusBadge(health?.status || 'inactive')}
                      </div>
                      <CardDescription className="text-xs">
                        {platform.category} · Format: <code className="bg-muted px-1 rounded">{platform.format}</code>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <div className="text-lg font-bold text-foreground">{health?.accessCount || 0}</div>
                          <div className="text-xs text-muted-foreground">Crawls (7d)</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-foreground">{health?.avgJobCount || 0}</div>
                          <div className="text-xs text-muted-foreground">Avg Jobs</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-foreground">
                            {health?.avgResponseTime ? `${health.avgResponseTime}ms` : '—'}
                          </div>
                          <div className="text-xs text-muted-foreground">Avg Speed</div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Last crawl: {formatTimeAgo(health?.lastAccess || null)}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => copyUrl(platform.format, platform.name)}
                          >
                            {copiedUrl === platform.format ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => window.open(getFeedUrl(platform.format), '_blank')}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Feed URLs Tab */}
          <TabsContent value="feeds" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Feed URL Reference</CardTitle>
                <CardDescription>
                  Copy these URLs to submit to each platform for organic job syndication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {SYNDICATION_PLATFORMS.map(platform => {
                  const url = getFeedUrl(platform.format);
                  const health = feedHealth[platform.key];
                  return (
                    <div
                      key={platform.key}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <span className="text-xl shrink-0">{platform.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{platform.name}</span>
                          {getStatusBadge(health?.status || 'inactive')}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">
                          {url}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyUrl(platform.format, platform.name)}
                        >
                          {copiedUrl === platform.format ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(url, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default SyndicationDashboard;
