import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Settings, MessageSquare, TrendingUp } from 'lucide-react';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useSocialConnections } from '../hooks/useSocialConnections';
import { useSocialInteractions } from '../hooks/useSocialInteractions';
import { PlatformConnectionCard } from '../components/PlatformConnectionCard';
import { InteractionQueue } from '../components/InteractionQueue';
import { EngagementMetrics } from '../components/EngagementMetrics';

export function SocialEngagementDashboard() {
  const { organizations } = useOrganizations();
  const organization = organizations?.[0];
  const [activeTab, setActiveTab] = useState('overview');
  
  const { connections, isLoading: connectionsLoading } = useSocialConnections(organization?.id);
  const { interactions, isLoading: interactionsLoading, refetch } = useSocialInteractions({
    organizationId: organization?.id,
    requiresReview: true,
    limit: 20,
  });

  const pendingReviewCount = interactions.filter(i => i.requires_human_review && i.status === 'pending').length;
  const activeConnections = connections.filter(c => c.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Social Engagement</h1>
          <p className="text-muted-foreground">
            AI-powered responses across all your social platforms
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Platforms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeConnections}</div>
            <p className="text-xs text-muted-foreground">of 5 available</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            {pendingReviewCount > 0 && (
              <Badge variant="destructive">{pendingReviewCount}</Badge>
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReviewCount}</div>
            <p className="text-xs text-muted-foreground">messages need attention</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Interactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {interactions.filter(i => 
                new Date(i.created_at).toDateString() === new Date().toDateString()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">across all platforms</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Response Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {interactions.length > 0 
                ? Math.round((interactions.filter(i => i.auto_responded).length / interactions.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">handled by AI</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="queue" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Queue
            {pendingReviewCount > 0 && (
              <Badge variant="secondary" className="ml-1">{pendingReviewCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Platform Status */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Status</CardTitle>
                <CardDescription>Connected accounts and auto-respond settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {connectionsLoading ? (
                  <div className="text-sm text-muted-foreground">Loading...</div>
                ) : connections.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No platforms connected yet. Add your first connection to get started.
                  </div>
                ) : (
                  connections.map(connection => (
                    <PlatformConnectionCard 
                      key={connection.id} 
                      connection={connection}
                      organizationId={organization?.id}
                      compact
                    />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest interactions across platforms</CardDescription>
              </CardHeader>
              <CardContent>
                {interactionsLoading ? (
                  <div className="text-sm text-muted-foreground">Loading...</div>
                ) : interactions.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No recent interactions. Messages will appear here when they come in.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {interactions.slice(0, 5).map(interaction => (
                      <div key={interaction.id} className="flex items-start gap-3 text-sm">
                        <Badge variant="outline" className="shrink-0">
                          {interaction.platform}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {interaction.sender_name || interaction.sender_handle || 'Unknown'}
                          </p>
                          <p className="text-muted-foreground truncate">{interaction.content}</p>
                        </div>
                        <Badge 
                          variant={interaction.status === 'responded' ? 'default' : 'secondary'}
                          className="shrink-0"
                        >
                          {interaction.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="queue">
          <InteractionQueue organizationId={organization?.id} />
        </TabsContent>

        <TabsContent value="connections" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(['facebook', 'instagram', 'twitter', 'whatsapp', 'linkedin'] as const).map(platform => {
              const connection = connections.find(c => c.platform === platform);
              return (
                <PlatformConnectionCard
                  key={platform}
                  connection={connection}
                  platform={platform}
                  organizationId={organization?.id}
                />
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <EngagementMetrics organizationId={organization?.id} />
        </TabsContent>
    </Tabs>
    </div>
  );
}

export default SocialEngagementDashboard;
