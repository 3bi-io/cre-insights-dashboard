import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, BarChart3, MessageSquare, Image, Users } from 'lucide-react';
import { getAllSocialBeacons } from '../../config/socialBeacons.config';
import { useAnalyticsDashboard, type DateRange } from '../../hooks/useAnalyticsDashboard';

interface SocialAnalyticsPanelProps {
  organizationId?: string | null;
}

export function SocialAnalyticsPanel({ organizationId = null }: SocialAnalyticsPanelProps) {
  const [dateRange, setDateRange] = useState<DateRange>('7d');
  const platforms = getAllSocialBeacons();
  const { analytics, isLoading } = useAnalyticsDashboard(organizationId, dateRange);

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Social Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Track engagement and performance across all social platforms
          </p>
        </div>
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
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
                <p className="text-2xl font-bold">{analytics.totalEngagements.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Engagements</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-info/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.totalImpressions.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Est. Impressions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.engagementRate}%</p>
                <p className="text-xs text-muted-foreground">Engagement Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center">
                <Image className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.adCreatives}</p>
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
                const stats = analytics.byPlatform[platform.platform as keyof typeof analytics.byPlatform];
                
                if (!stats) return null;

                const engagementRate = stats.impressions > 0 
                  ? ((stats.engagements / stats.impressions) * 100).toFixed(2)
                  : '0.00';

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
                              ? 'border-success/30 text-success' 
                              : stats.trend === 'down'
                              ? 'border-destructive/30 text-destructive'
                              : ''
                          }
                        >
                          {stats.trend === 'up' ? `+${stats.trendPercentage}%` : stats.trend === 'down' ? `${stats.trendPercentage}%` : '0%'}
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
              <span className="font-semibold">{analytics.autoResponses}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Response Rate</span>
              <span className="font-semibold">{analytics.responseRate}%</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Avg. Response Time</span>
              <span className="font-semibold">&lt;30s</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Ad Creatives Generated</span>
              <span className="font-semibold">{analytics.adCreatives}</span>
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
            {analytics.topCreatives.length > 0 ? (
              analytics.topCreatives.map((creative, idx) => (
                <div key={creative.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center text-lg">
                    {creative.emoji}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm line-clamp-1">{creative.headline}</p>
                    <p className="text-xs text-muted-foreground">
                      {creative.engagements} engagements • {creative.ctr}% CTR
                    </p>
                  </div>
                  {idx === 0 && (
                    <Badge className="bg-success/10 text-success border-success/20">Top</Badge>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Image className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No creatives yet</p>
                <p className="text-xs">Generate your first ad creative to see performance</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
