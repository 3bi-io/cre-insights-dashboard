/**
 * ScheduledCallbacksDashboard
 * Shows upcoming and past AI-scheduled callbacks for recruiters
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phone, Clock, User, CalendarCheck, Loader2, XCircle, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
  application_id: string | null;
  client_name?: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  no_show: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

export function ScheduledCallbacksDashboard() {
  const [callbacks, setCallbacks] = useState<ScheduledCallback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchCallbacks = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('scheduled_callbacks')
        .select('*, applications!scheduled_callbacks_application_id_fkey(job_listing_id, job_listings!applications_job_listing_id_fkey(client_id, clients!job_listings_client_id_fkey(name)))')
        .order('scheduled_start', { ascending: true })
        .limit(100);

      if (error) {
        // Fallback without join if the FK path doesn't exist
        console.warn('Join query failed, falling back:', error.message);
        const { data: fallbackData, error: fbErr } = await supabase
          .from('scheduled_callbacks')
          .select('*')
          .order('scheduled_start', { ascending: true })
          .limit(100);
        if (fbErr) throw fbErr;
        setCallbacks((fallbackData as ScheduledCallback[]) || []);
        return;
      }

      // Extract client name from nested join
      const enriched = (data || []).map((cb: any) => {
        const clientName = cb.applications?.job_listings?.clients?.name || null;
        const { applications, ...rest } = cb;
        return { ...rest, client_name: clientName } as ScheduledCallback;
      });
      setCallbacks(enriched);
    } catch (err: any) {
      console.error('Failed to fetch callbacks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCallbacks();
  }, []);

  const handleCancel = async (callbackId: string) => {
    try {
      const { error } = await supabase.functions.invoke('calendar-integration', {
        body: { action: 'cancel_booking', callbackId },
      });
      if (error) throw error;
      setCallbacks(prev => prev.map(cb => 
        cb.id === callbackId ? { ...cb, status: 'cancelled' } : cb
      ));
      toast({ title: 'Callback cancelled' });
    } catch (err: any) {
      toast({ title: 'Cancel failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleStatusUpdate = async (callbackId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_callbacks')
        .update({ status: newStatus })
        .eq('id', callbackId);
      if (error) throw error;
      setCallbacks(prev => prev.map(cb => 
        cb.id === callbackId ? { ...cb, status: newStatus } : cb
      ));
      toast({ title: `Marked as ${newStatus}` });
    } catch (err: any) {
      toast({ title: 'Update failed', description: err.message, variant: 'destructive' });
    }
  };

  const upcoming = callbacks.filter(cb => 
    !isPast(new Date(cb.scheduled_start)) && !['cancelled', 'completed', 'no_show'].includes(cb.status)
  );
  const past = callbacks.filter(cb => 
    isPast(new Date(cb.scheduled_start)) || ['cancelled', 'completed', 'no_show'].includes(cb.status)
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return `Today at ${format(date, 'h:mm a')}`;
    if (isTomorrow(date)) return `Tomorrow at ${format(date, 'h:mm a')}`;
    return format(date, 'MMM d, h:mm a');
  };

  const CallbackCard = ({ cb }: { cb: ScheduledCallback }) => (
    <div className="flex items-center justify-between rounded-lg border p-4 bg-card">
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center justify-center rounded-md bg-muted px-3 py-2 min-w-[80px]">
          <span className="text-xs text-muted-foreground">
            {isToday(new Date(cb.scheduled_start)) ? 'Today' : format(new Date(cb.scheduled_start), 'MMM d')}
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
            {cb.client_name && (
              <Badge variant="outline" className="text-xs py-0 gap-1">
                <Building2 className="h-3 w-3" />
                {cb.client_name}
              </Badge>
            )}
            {cb.sms_confirmation_sent && (
              <Badge variant="outline" className="text-xs">SMS Sent</Badge>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge className={STATUS_COLORS[cb.status] || 'bg-muted'}>
          {cb.status}
        </Badge>
        {['pending', 'confirmed'].includes(cb.status) && !isPast(new Date(cb.scheduled_start)) && (
          <Button variant="ghost" size="sm" onClick={() => handleCancel(cb.id)}>
            <XCircle className="h-4 w-4" />
          </Button>
        )}
        {isPast(new Date(cb.scheduled_start)) && ['pending', 'confirmed'].includes(cb.status) && (
          <div className="flex gap-1">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleStatusUpdate(cb.id, 'completed')}
            >
              ✓ Done
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleStatusUpdate(cb.id, 'no_show')}
            >
              No Show
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Scheduled Callbacks</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchCallbacks}>
            Refresh
          </Button>
        </div>
        <CardDescription>
          AI-scheduled driver callbacks · {upcoming.length} upcoming
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="upcoming">
          <TabsList className="mb-4">
            <TabsTrigger value="upcoming">
              Upcoming ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({past.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-3">
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No upcoming callbacks scheduled by AI agents yet.
              </p>
            ) : (
              upcoming.map(cb => <CallbackCard key={cb.id} cb={cb} />)
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-3">
            {past.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No past callbacks.
              </p>
            ) : (
              past.slice(0, 25).map(cb => <CallbackCard key={cb.id} cb={cb} />)
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
