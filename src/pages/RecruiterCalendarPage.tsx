/**
 * Recruiter Self-Service Calendar Page
 * Allows recruiters to connect calendars, set availability preferences,
 * and view their upcoming scheduled callbacks.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Settings2, CalendarCheck, Loader2, Save, Link2, Unlink, ExternalLink, RefreshCw, CheckCircle2, XCircle, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// Types
interface CalendarConnection {
  id: string;
  email: string;
  provider_type: string;
  status: string;
  connected_at: string;
  calendar_id: string | null;
  client_id: string | null;
}

interface AvailabilityPreferences {
  working_hours_start: string;
  working_hours_end: string;
  timezone: string;
  working_days: number[];
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  default_call_duration_minutes: number;
  max_daily_callbacks: number;
  min_booking_notice_hours: number;
  auto_accept_bookings: boolean;
  allow_same_day_booking: boolean;
}

interface ScheduledCallback {
  id: string;
  driver_name: string;
  driver_phone: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  booking_source: string;
  notes: string;
}

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern (ET)' },
  { value: 'America/Chicago', label: 'Central (CT)' },
  { value: 'America/Denver', label: 'Mountain (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
  { value: 'America/Phoenix', label: 'Arizona (MST)' },
];

const DAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 7, label: 'Sun' },
];

const DEFAULT_PREFS: AvailabilityPreferences = {
  working_hours_start: '09:00',
  working_hours_end: '17:00',
  timezone: 'America/Chicago',
  working_days: [1, 2, 3, 4, 5],
  buffer_before_minutes: 5,
  buffer_after_minutes: 5,
  default_call_duration_minutes: 15,
  max_daily_callbacks: 20,
  min_booking_notice_hours: 1,
  auto_accept_bookings: true,
  allow_same_day_booking: true,
};

export default function RecruiterCalendarPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Calendar connections state
  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  // Client selector state
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  // Preferences state
  const [prefs, setPrefs] = useState<AvailabilityPreferences>(DEFAULT_PREFS);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsExist, setPrefsExist] = useState(false);

  // Callbacks state
  const [callbacks, setCallbacks] = useState<ScheduledCallback[]>([]);
  const [callbacksLoading, setCallbacksLoading] = useState(true);

  // Fetch all data on mount
  useEffect(() => {
    if (user?.id) {
      fetchConnections();
      fetchPreferences();
      fetchCallbacks();
      fetchClients();
    }
  }, [user?.id]);

  const fetchClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('id, name')
      .order('name');
    setClients(data || []);
  };

  // ---------- Calendar Connections ----------

  const fetchConnections = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('calendar-integration', {
        body: { action: 'list_connections' },
      });
      if (error) throw error;
      setConnections(data?.connections || []);
    } catch (err: any) {
      console.error('Failed to fetch connections:', err);
    } finally {
      setConnectionsLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const body: Record<string, any> = { action: 'oauth_url' };
      if (selectedClientId) {
        body.client_id = selectedClientId;
      }
      const { data, error } = await supabase.functions.invoke('calendar-integration', {
        body,
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank', 'width=600,height=700');
        toast({
          title: 'Calendar Connection',
          description: 'Complete authorization in the popup, then click Refresh.',
        });
      }
    } catch (err: any) {
      toast({ title: 'Connection Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    setDisconnectingId(connectionId);
    try {
      const { error } = await supabase.functions.invoke('calendar-integration', {
        body: { action: 'disconnect', connectionId },
      });
      if (error) throw error;
      setConnections(prev => prev.filter(c => c.id !== connectionId));
      toast({ title: 'Disconnected', description: 'Calendar removed.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setDisconnectingId(null);
    }
  };

  // ---------- Availability Preferences ----------

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('recruiter_availability_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setPrefs({
          working_hours_start: (data as any).working_hours_start?.slice(0, 5) || '09:00',
          working_hours_end: (data as any).working_hours_end?.slice(0, 5) || '17:00',
          timezone: (data as any).timezone || 'America/Chicago',
          working_days: (data as any).working_days || [1, 2, 3, 4, 5],
          buffer_before_minutes: (data as any).buffer_before_minutes || 5,
          buffer_after_minutes: (data as any).buffer_after_minutes || 5,
          default_call_duration_minutes: (data as any).default_call_duration_minutes || 15,
          max_daily_callbacks: (data as any).max_daily_callbacks || 20,
          min_booking_notice_hours: (data as any).min_booking_notice_hours || 1,
          auto_accept_bookings: (data as any).auto_accept_bookings ?? true,
          allow_same_day_booking: (data as any).allow_same_day_booking ?? true,
        });
        setPrefsExist(true);
      }
    } catch (err: any) {
      console.error('Failed to fetch preferences:', err);
    } finally {
      setPrefsLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user?.id) return;
    setPrefsSaving(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      const payload = {
        user_id: user.id,
        organization_id: profile?.organization_id || null,
        working_hours_start: prefs.working_hours_start + ':00',
        working_hours_end: prefs.working_hours_end + ':00',
        timezone: prefs.timezone,
        working_days: prefs.working_days,
        buffer_before_minutes: prefs.buffer_before_minutes,
        buffer_after_minutes: prefs.buffer_after_minutes,
        default_call_duration_minutes: prefs.default_call_duration_minutes,
        max_daily_callbacks: prefs.max_daily_callbacks,
        min_booking_notice_hours: prefs.min_booking_notice_hours,
        auto_accept_bookings: prefs.auto_accept_bookings,
        allow_same_day_booking: prefs.allow_same_day_booking,
      };

      const { error } = await supabase
        .from('recruiter_availability_preferences')
        .upsert(payload, { onConflict: 'user_id' });

      if (error) throw error;
      setPrefsExist(true);
      toast({ title: 'Saved', description: 'Availability preferences updated.' });
    } catch (err: any) {
      toast({ title: 'Save Failed', description: err.message, variant: 'destructive' });
    } finally {
      setPrefsSaving(false);
    }
  };

  const toggleDay = (day: number) => {
    setPrefs(prev => ({
      ...prev,
      working_days: prev.working_days.includes(day)
        ? prev.working_days.filter(d => d !== day)
        : [...prev.working_days, day].sort(),
    }));
  };

  // ---------- Scheduled Callbacks ----------

  const fetchCallbacks = async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('scheduled_callbacks')
        .select('id, driver_name, driver_phone, scheduled_start, scheduled_end, status, booking_source, notes')
        .eq('recruiter_user_id', user!.id)
        .gte('scheduled_start', now)
        .order('scheduled_start', { ascending: true })
        .limit(50);

      if (error) throw error;
      setCallbacks(data || []);
    } catch (err: any) {
      console.error('Failed to fetch callbacks:', err);
    } finally {
      setCallbacksLoading(false);
    }
  };

  const activeConnections = connections.filter(c => c.status === 'active');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Calendar & Availability</h1>
        <p className="text-muted-foreground">
          Connect your calendar, set your availability, and manage AI-scheduled callbacks.
        </p>
      </div>

      <Tabs defaultValue="connection" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connection" className="gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="availability" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Availability
          </TabsTrigger>
          <TabsTrigger value="callbacks" className="gap-2">
            <CalendarCheck className="h-4 w-4" />
            Upcoming
            {callbacks.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{callbacks.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ===== Calendar Connection Tab ===== */}
        <TabsContent value="connection">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Calendar Connection
              </CardTitle>
              <CardDescription>
                Connect your Google or Outlook calendar so the AI voice agent can check your availability and schedule driver callbacks directly on your calendar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Client selector for connecting */}
              {clients.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Connect for Client (optional)
                  </Label>
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Organization-level (all clients)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Organization-level (all clients)</SelectItem>
                      {clients.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select a client to connect a calendar specifically for them, or leave blank for org-wide availability.
                  </p>
                </div>
              )}

              {connectionsLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </div>
              ) : activeConnections.length > 0 ? (
                <div className="space-y-3">
                  {activeConnections.map(conn => (
                    <div key={conn.id} className="flex items-center justify-between rounded-lg border p-4 bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                          <Link2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">{conn.email}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {conn.provider_type || 'Calendar'} · Connected {new Date(conn.connected_at).toLocaleDateString()}
                            {conn.client_id && <Badge variant="outline" className="ml-2 text-xs py-0">
                              {clients.find(c => c.id === conn.client_id)?.name || 'Client-specific'}
                            </Badge>}
                            {!conn.client_id && <Badge variant="secondary" className="ml-2 text-xs py-0">Org-Level</Badge>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="bg-green-600">Connected</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDisconnect(conn.id)}
                          disabled={disconnectingId === conn.id}
                        >
                          {disconnectingId === conn.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Unlink className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={handleConnect} disabled={isConnecting}>
                    {isConnecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
                    Reconnect / Change Calendar
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">No calendar connected</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Connect your calendar to let the AI agent schedule callbacks during your available time.
                    </p>
                  </div>
                  <Button onClick={handleConnect} disabled={isConnecting} size="lg">
                    {isConnecting ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" />Connecting...</>
                    ) : (
                      <><ExternalLink className="h-4 w-4 mr-2" />Connect Calendar</>
                    )}
                  </Button>
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={fetchConnections} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== Availability Preferences Tab ===== */}
        <TabsContent value="availability">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" />
                Availability Preferences
              </CardTitle>
              <CardDescription>
                Set your working hours and booking rules. The AI agent uses these to only schedule callbacks when you're available.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {prefsLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading preferences...
                </div>
              ) : (
                <>
                  {/* Working Hours */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Working Hours</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={prefs.working_hours_start}
                          onChange={e => setPrefs(p => ({ ...p, working_hours_start: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={prefs.working_hours_end}
                          onChange={e => setPrefs(p => ({ ...p, working_hours_end: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Timezone</Label>
                        <Select value={prefs.timezone} onValueChange={v => setPrefs(p => ({ ...p, timezone: v }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIMEZONES.map(tz => (
                              <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Working Days */}
                  <div className="space-y-3">
                    <Label>Working Days</Label>
                    <div className="flex gap-2 flex-wrap">
                      {DAYS.map(day => (
                        <Button
                          key={day.value}
                          variant={prefs.working_days.includes(day.value) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleDay(day.value)}
                          className="w-12"
                        >
                          {day.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Booking Rules */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Booking Rules</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Default Call Duration (min)</Label>
                        <Input
                          type="number"
                          min={5}
                          max={120}
                          value={prefs.default_call_duration_minutes}
                          onChange={e => setPrefs(p => ({ ...p, default_call_duration_minutes: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Buffer Before (min)</Label>
                        <Input
                          type="number"
                          min={0}
                          max={60}
                          value={prefs.buffer_before_minutes}
                          onChange={e => setPrefs(p => ({ ...p, buffer_before_minutes: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Buffer After (min)</Label>
                        <Input
                          type="number"
                          min={0}
                          max={60}
                          value={prefs.buffer_after_minutes}
                          onChange={e => setPrefs(p => ({ ...p, buffer_after_minutes: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Daily Callbacks</Label>
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={prefs.max_daily_callbacks}
                          onChange={e => setPrefs(p => ({ ...p, max_daily_callbacks: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Min Booking Notice (hrs)</Label>
                        <Input
                          type="number"
                          min={0}
                          max={48}
                          value={prefs.min_booking_notice_hours}
                          onChange={e => setPrefs(p => ({ ...p, min_booking_notice_hours: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground">Preferences</h3>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium text-sm">Auto-accept AI bookings</p>
                        <p className="text-xs text-muted-foreground">Automatically confirm callbacks scheduled by the AI agent</p>
                      </div>
                      <Switch
                        checked={prefs.auto_accept_bookings}
                        onCheckedChange={v => setPrefs(p => ({ ...p, auto_accept_bookings: v }))}
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium text-sm">Allow same-day booking</p>
                        <p className="text-xs text-muted-foreground">Let the AI schedule callbacks for later today</p>
                      </div>
                      <Switch
                        checked={prefs.allow_same_day_booking}
                        onCheckedChange={v => setPrefs(p => ({ ...p, allow_same_day_booking: v }))}
                      />
                    </div>
                  </div>

                  <Button onClick={savePreferences} disabled={prefsSaving} className="w-full sm:w-auto">
                    {prefsSaving ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</>
                    ) : (
                      <><Save className="h-4 w-4 mr-2" />Save Preferences</>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== Upcoming Callbacks Tab ===== */}
        <TabsContent value="callbacks">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5 text-primary" />
                    Upcoming Callbacks
                  </CardTitle>
                  <CardDescription>Your scheduled driver callbacks from AI bookings.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={fetchCallbacks}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {callbacksLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </div>
              ) : callbacks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No upcoming callbacks scheduled.</p>
                  <p className="text-sm mt-1">AI-scheduled callbacks will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {callbacks.map(cb => (
                    <div key={cb.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-1">
                        <p className="font-medium">{cb.driver_name || 'Unknown Driver'}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {format(new Date(cb.scheduled_start), 'MMM d, h:mm a')}
                          </span>
                          {cb.driver_phone && <span>{cb.driver_phone}</span>}
                        </div>
                        {cb.notes && cb.notes !== 'Scheduled by AI Voice Agent' && (
                          <p className="text-xs text-muted-foreground">{cb.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {cb.status === 'confirmed' ? (
                          <Badge variant="default" className="bg-green-600 gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Confirmed
                          </Badge>
                        ) : cb.status === 'cancelled' ? (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Cancelled
                          </Badge>
                        ) : (
                          <Badge variant="secondary">{cb.status}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
