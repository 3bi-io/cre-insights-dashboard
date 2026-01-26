import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Minus, BarChart3, MessageSquare, Image, Users } from 'lucide-react';
import { getAllSocialBeacons } from '../../config/socialBeacons.config';

interface SocialAnalyticsPanelProps {
  organizationId?: string | null;
}

export function SocialAnalyticsPanel({ organizationId = null }: SocialAnalyticsPanelProps) {
  const platforms = getAllSocialBeacons();

  // Mock analytics data - in production, this would come from the database
  const mockAnalytics = {
    totalEngagements: 1247,
    totalImpressions: 45230,
    autoResponses: 89,
    adCreatives: 12,
    engagementRate: 2.76,
    responseRate: 94.5,
    byPlatform: {
      x: { engagements: 456, impressions: 18500, trend: 'up' },
      facebook: { engagements: 389, impressions: 15200, trend: 'up' },
      instagram: { engagements: 312, impressions: 8900, trend: 'down' },
      tiktok: { engagements: 90, impressions: 2630, trend: 'up' },
    },
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Social Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Track engagement and performance across all social platforms
          </p>
        </div>
        <Select defaultValue="7d">
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockAnalytics.totalEngagements.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Engagements</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockAnalytics.totalImpressions.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Impressions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockAnalytics.engagementRate}%</p>
                <p className="text-xs text-muted-foreground">Engagement Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Image className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockAnalytics.adCreatives}</p>
                <p className="text-xs text-muted-foreground">Ad Creatives</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Platform Performance</CardTitle>
          <CardDescription>
            Engagement metrics by social media platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {platforms
              .filter(p => p.adCreativeSupported || p.autoEngageSupported)
              .map((platform) => {
                const PlatformIcon = platform.icon;
                const stats = mockAnalytics.byPlatform[platform.platform as keyof typeof mockAnalytics.byPlatform];
                
                if (!stats) return null;

                const engagementRate = ((stats.engagements / stats.impressions) * 100).toFixed(2);

                return (
                  <div 
                    key={platform.platform}
                    className="flex items-center justify-between p-4 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="h-10 w-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: platform.bgColor }}
                      >
                        <PlatformIcon 
                          className="h-5 w-5" 
                          style={{ color: platform.color }}
                        />
                      </div>
                      <div>
                        <p className="font-medium">{platform.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {stats.impressions.toLocaleString()} impressions
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-semibold">{stats.engagements.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">engagements</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{engagementRate}%</p>
                        <p className="text-xs text-muted-foreground">rate</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(stats.trend)}
                        <Badge 
                          variant="outline"
                          className={
                            stats.trend === 'up' 
                              ? 'border-green-500/30 text-green-600' 
                              : stats.trend === 'down'
                              ? 'border-red-500/30 text-red-600'
                              : ''
                          }
                        >
                          {stats.trend === 'up' ? '+12%' : stats.trend === 'down' ? '-5%' : '0%'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Auto-Response Stats */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Auto-Response Performance</CardTitle>
            <CardDescription>
              Automated engagement statistics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Total Auto-Responses</span>
              <span className="font-semibold">{mockAnalytics.autoResponses}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Response Rate</span>
              <span className="font-semibold">{mockAnalytics.responseRate}%</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Avg. Response Time</span>
              <span className="font-semibold">32s</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Queued for Review</span>
              <span className="font-semibold">3</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Performing Content</CardTitle>
            <CardDescription>
              Best performing ad creatives this period
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center text-lg">
                🚚
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Regional CDL-A Driver</p>
                <p className="text-xs text-muted-foreground">456 engagements • 2.8% CTR</p>
              </div>
              <Badge className="bg-green-500/10 text-green-600">Top</Badge>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center text-lg">
                💰
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">$5k Sign-On Bonus</p>
                <p className="text-xs text-muted-foreground">312 engagements • 2.1% CTR</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center text-lg">
                🏠
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Home Weekly Routes</p>
                <p className="text-xs text-muted-foreground">289 engagements • 1.9% CTR</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
