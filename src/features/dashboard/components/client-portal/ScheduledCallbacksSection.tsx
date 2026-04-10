import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phone, Clock, User, CalendarCheck, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, isToday, isTomorrow, isPast } from 'date-fns';

interface ScheduledCallback {
  id: string;
  driver_name: string | null;
  driver_phone: string | null;
  scheduled_start: string;
  scheduled_end: string;
  duration_minutes: number;
  status: string;
  booking_source: string;
  notes: string | null;
  sms_confirmation_sent: boolean;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  no_show: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

interface ScheduledCallbacksSectionProps {
  clientId: string;
}

export const ScheduledCallbacksSection: React.FC<ScheduledCallbacksSectionProps> = ({ clientId }) => {
  const [callbacks, setCallbacks] = useState<ScheduledCallback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCallbacks = useCallback(async () => {
    setIsLoading(true);
    try {
      // Step 1: Get application IDs for this client
      const { data: apps, error: appsError } = await supabase
        .from('applications')
        .select('id, job_listing_id')
        .in('job_listing_id',
          (await supabase
            .from('job_listings')
            .select('id')
            .eq('client_id', clientId)
          ).data?.map(j => j.id) || []
        );

      if (appsError || !apps?.length) {
        setCallbacks([]);
        return;
      }

      const appIds = apps.map(a => a.id);

      // Step 2: Fetch callbacks for those applications
      const { data, error } = await supabase
        .from('scheduled_callbacks')
        .select('id, driver_name, driver_phone, scheduled_start, scheduled_end, duration_minutes, status, booking_source, notes, sms_confirmation_sent, created_at')
        .in('application_id', appIds)
        .order('scheduled_start', { ascending: true })
        .limit(100);

      if (error) throw error;
      setCallbacks((data as ScheduledCallback[]) || []);
    } catch (err) {
      console.error('Failed to fetch client callbacks:', err);
      setCallbacks([]);
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchCallbacks();
  }, [fetchCallbacks]);

  const upcoming = callbacks.filter(cb =>
    !isPast(new Date(cb.scheduled_start)) && !['cancelled', 'completed', 'no_show'].includes(cb.status)
  );
  const past = callbacks.filter(cb =>
    isPast(new Date(cb.scheduled_start)) || ['cancelled', 'completed', 'no_show'].includes(cb.status)
  );

  const CallbackCard = ({ cb }: { cb: ScheduledCallback }) => (
    <div className="flex items-center justify-between rounded-lg border border-border/50 p-4 bg-card">
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center justify-center rounded-md bg-muted px-3 py-2 min-w-[80px]">
          <span className="text-xs text-muted-foreground">
            {isToday(new Date(cb.scheduled_start)) ? 'Today' : isTomorrow(new Date(cb.scheduled_start)) ? 'Tomorrow' : format(new Date(cb.scheduled_start), 'MMM d')}
          </span>
          <span className="text-lg font-bold text-foreground">
            {format(new Date(cb.scheduled_start), 'h:mm')}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(cb.scheduled_start), 'a')}
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-foreground">{cb.driver_name || 'Unknown Driver'}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{cb.driver_phone || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{cb.duration_minutes} min · {cb.booking_source}</span>
            {cb.sms_confirmation_sent && (
              <Badge variant="outline" className="text-xs">SMS Sent</Badge>
            )}
          </div>
        </div>
      </div>
      <Badge className={STATUS_COLORS[cb.status] || 'bg-muted'}>
        {cb.status}
      </Badge>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Scheduled Callbacks</h2>
          {upcoming.length > 0 && (
            <Badge variant="secondary">{upcoming.length} upcoming</Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={fetchCallbacks} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {isLoading ? (
        <Card className="border-border/50">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : callbacks.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-8 text-center">
            <CalendarCheck className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No scheduled callbacks yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Callbacks will appear here when the AI agent schedules them during business hours.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <Tabs defaultValue="upcoming">
              <TabsList className="mb-4">
                <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
                <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="upcoming" className="space-y-3">
                {upcoming.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No upcoming callbacks.</p>
                ) : (
                  upcoming.map(cb => <CallbackCard key={cb.id} cb={cb} />)
                )}
              </TabsContent>
              <TabsContent value="past" className="space-y-3">
                {past.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No past callbacks.</p>
                ) : (
                  past.slice(0, 25).map(cb => <CallbackCard key={cb.id} cb={cb} />)
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
