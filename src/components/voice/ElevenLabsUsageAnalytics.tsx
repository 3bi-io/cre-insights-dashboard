import { useElevenLabsConnection, useElevenLabsSubscription, useConnectionTest } from '@/features/elevenlabs/hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, XCircle, RefreshCw, Zap, Users, Clock, CreditCard } from 'lucide-react';
import { format, fromUnixTime } from 'date-fns';

export function ElevenLabsUsageAnalytics() {
  const { data: user, isLoading: userLoading, error: userError, refetch: refetchUser } = useElevenLabsConnection();
  const { data: subscription, isLoading: subLoading, refetch: refetchSub } = useElevenLabsSubscription();
  const connectionTest = useConnectionTest();

  const isConnected = !!user && !userError;
  const isLoading = userLoading || subLoading;

  const handleTestConnection = async () => {
    await connectionTest.mutateAsync();
    refetchUser();
    refetchSub();
  };

  const characterUsagePercent = subscription 
    ? (subscription.character_count / subscription.character_limit) * 100 
    : 0;

  const resetDate = subscription?.next_character_count_reset_unix 
    ? fromUnixTime(subscription.next_character_count_reset_unix)
    : null;

  return (
    <div className="space-y-6">
      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Connection Status
                {isConnected ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Disconnected
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                ElevenLabs API connection and account status
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleTestConnection}
              disabled={connectionTest.isPending}
            >
              {connectionTest.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Test Connection</span>
            </Button>
          </div>
        </CardHeader>
        {user && (
          <CardContent>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Account: <strong>{user.first_name || 'N/A'}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span>Tier: <strong className="capitalize">{user.subscription?.tier || 'Unknown'}</strong></span>
              </div>
            </div>
          </CardContent>
        )}
        {userError && (
          <CardContent>
            <p className="text-sm text-destructive">
              {userError.message}
            </p>
          </CardContent>
        )}
      </Card>

      {/* Usage Statistics */}
      {subscription && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Character Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {subscription.character_count.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  of {subscription.character_limit.toLocaleString()} characters
                </p>
                <Progress value={characterUsagePercent} className="mt-2 h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {(100 - characterUsagePercent).toFixed(1)}% remaining
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Voice Limits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {subscription.voice_limit}
                </div>
                <p className="text-xs text-muted-foreground">
                  custom voices allowed
                </p>
                <div className="mt-2 text-xs space-y-1">
                  <p className={subscription.can_use_instant_voice_cloning ? 'text-green-500' : 'text-muted-foreground'}>
                    • Instant Cloning: {subscription.can_use_instant_voice_cloning ? 'Yes' : 'No'}
                  </p>
                  <p className={subscription.can_use_professional_voice_cloning ? 'text-green-500' : 'text-muted-foreground'}>
                    • Pro Cloning: {subscription.can_use_professional_voice_cloning ? 'Yes' : 'No'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Reset Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {resetDate ? format(resetDate, 'MMM d') : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {resetDate ? format(resetDate, 'yyyy') : 'Character count resets'}
                </p>
                <div className="mt-2">
                  <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                    {subscription.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subscription Details */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
              <CardDescription>
                Your current ElevenLabs plan and capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Plan</p>
                  <p className="font-semibold capitalize">{subscription.tier}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-semibold capitalize">{subscription.status}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Currency</p>
                  <p className="font-semibold uppercase">{subscription.currency || 'USD'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pro Voice Limit</p>
                  <p className="font-semibold">{subscription.professional_voice_limit}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium mb-2">Capabilities</h4>
                <div className="flex flex-wrap gap-2">
                  {subscription.can_extend_character_limit && (
                    <Badge variant="outline">Can Extend Characters</Badge>
                  )}
                  {subscription.can_extend_voice_limit && (
                    <Badge variant="outline">Can Extend Voices</Badge>
                  )}
                  {subscription.can_use_instant_voice_cloning && (
                    <Badge variant="outline">Instant Voice Cloning</Badge>
                  )}
                  {subscription.can_use_professional_voice_cloning && (
                    <Badge variant="outline">Professional Voice Cloning</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
