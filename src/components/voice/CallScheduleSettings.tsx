import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { LoadingButton } from '@/components/shared/LoadingButton';
import { useCallScheduleSettings, type CallScheduleSettings as Settings } from '@/features/elevenlabs/hooks/useCallScheduleSettings';
import { useHolidayCalendar } from '@/features/elevenlabs/hooks/useHolidayCalendar';
import { useClientsService } from '@/features/clients/hooks/useClientsService';
import { Clock, CalendarDays, RotateCcw, Building2, PhoneOff, PhoneMissed, AlertTriangle, Timer, TrendingUp, Shield, MessageSquare, CalendarOff, Plus, Trash2, Zap, Shuffle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern (ET)' },
  { value: 'America/Chicago', label: 'Central (CT)' },
  { value: 'America/Denver', label: 'Mountain (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
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

const ORG_DEFAULT_VALUE = '__org_default__';

export function CallScheduleSettings() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const { settings, isLoading, updateSettings, isUpdating, clientOverrides } = useCallScheduleSettings(selectedClientId);
  const { clients } = useClientsService();
  const { holidays, isLoading: holidaysLoading, addHoliday, isAdding, deleteHoliday } = useHolidayCalendar();

  const [showPastHolidays, setShowPastHolidays] = useState(false);
  const [newHolidayDate, setNewHolidayDate] = useState<Date | undefined>();
  const [newHolidayName, setNewHolidayName] = useState('');
  const [addHolidayOpen, setAddHolidayOpen] = useState(false);

  const [form, setForm] = useState({
    business_hours_start: '09:00',
    business_hours_end: '16:30',
    business_hours_timezone: 'America/Chicago',
    business_days: [1, 2, 3, 4, 5] as number[],
    auto_follow_up_enabled: false,
    max_attempts: 3,
    follow_up_delay_hours: 24,
    follow_up_on_no_answer: true,
    follow_up_on_failed: true,
    follow_up_on_busy: true,
    follow_up_delay_minutes: 15,
    follow_up_escalation_multiplier: 2.0,
    cooldown_hours: 24,
    callback_reference_enabled: true,
    smart_scheduling_enabled: true,
    time_rotation_enabled: true,
  });

  const settingsKey = `${settings?.id ?? 'default'}-${settings?.client_id ?? 'org'}-${selectedClientId}`;

  useEffect(() => {
    if (settings) {
      setForm({
        business_hours_start: settings.business_hours_start?.substring(0, 5) || '09:00',
        business_hours_end: settings.business_hours_end?.substring(0, 5) || '16:30',
        business_hours_timezone: settings.business_hours_timezone || 'America/Chicago',
        business_days: settings.business_days || [1, 2, 3, 4, 5],
        auto_follow_up_enabled: settings.auto_follow_up_enabled ?? false,
        max_attempts: settings.max_attempts ?? 3,
        follow_up_delay_hours: settings.follow_up_delay_hours ?? 24,
        follow_up_on_no_answer: settings.follow_up_on_no_answer ?? true,
        follow_up_on_failed: settings.follow_up_on_failed ?? true,
        follow_up_on_busy: settings.follow_up_on_busy ?? true,
        follow_up_delay_minutes: settings.follow_up_delay_minutes ?? 15,
        follow_up_escalation_multiplier: settings.follow_up_escalation_multiplier ?? 2.0,
        cooldown_hours: settings.cooldown_hours ?? 24,
        callback_reference_enabled: settings.callback_reference_enabled ?? true,
        smart_scheduling_enabled: settings.smart_scheduling_enabled ?? true,
        time_rotation_enabled: settings.time_rotation_enabled ?? true,
      });
    }
  }, [settingsKey]);

  const isWithinBusinessHours = useMemo(() => {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: form.business_hours_timezone,
        hour: '2-digit', minute: '2-digit', hour12: false,
        weekday: 'short',
      });
      const parts = formatter.formatToParts(now);
      const hour = parts.find(p => p.type === 'hour')?.value || '0';
      const minute = parts.find(p => p.type === 'minute')?.value || '0';
      const currentTime = `${hour}:${minute}`;

      const dayMap: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
      const weekday = parts.find(p => p.type === 'weekday')?.value || '';
      const dow = dayMap[weekday] ?? 0;

      return form.business_days.includes(dow) &&
        currentTime >= form.business_hours_start &&
        currentTime < form.business_hours_end;
    } catch {
      return false;
    }
  }, [form.business_hours_start, form.business_hours_end, form.business_hours_timezone, form.business_days]);

  // Compute follow-up timeline preview
  const timelinePreview = useMemo(() => {
    if (!form.auto_follow_up_enabled) return [];
    const attempts: { attempt: number; delayMinutes: number; cumulativeMinutes: number }[] = [];
    let cumulative = 0;
    for (let i = 0; i < form.max_attempts - 1; i++) {
      const delay = Math.round(form.follow_up_delay_minutes * Math.pow(form.follow_up_escalation_multiplier, i));
      cumulative += delay;
      attempts.push({ attempt: i + 2, delayMinutes: delay, cumulativeMinutes: cumulative });
    }
    return attempts;
  }, [form.auto_follow_up_enabled, form.max_attempts, form.follow_up_delay_minutes, form.follow_up_escalation_multiplier]);

  const toggleDay = (day: number) => {
    setForm(prev => ({
      ...prev,
      business_days: prev.business_days.includes(day)
        ? prev.business_days.filter(d => d !== day)
        : [...prev.business_days, day].sort(),
    }));
  };

  const handleSave = () => {
    updateSettings({
      business_hours_start: form.business_hours_start + ':00',
      business_hours_end: form.business_hours_end + ':00',
      business_hours_timezone: form.business_hours_timezone,
      business_days: form.business_days,
      auto_follow_up_enabled: form.auto_follow_up_enabled,
      max_attempts: form.max_attempts,
      follow_up_delay_hours: form.follow_up_delay_hours,
      follow_up_on_no_answer: form.follow_up_on_no_answer,
      follow_up_on_failed: form.follow_up_on_failed,
      follow_up_on_busy: form.follow_up_on_busy,
      follow_up_delay_minutes: form.follow_up_delay_minutes,
      follow_up_escalation_multiplier: form.follow_up_escalation_multiplier,
      cooldown_hours: form.cooldown_hours,
      callback_reference_enabled: form.callback_reference_enabled,
      smart_scheduling_enabled: form.smart_scheduling_enabled,
      time_rotation_enabled: form.time_rotation_enabled,
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading schedule settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Client Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Schedule Scope</CardTitle>
              <CardDescription>
                Configure schedule at the organization level or override for a specific client
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label>Apply settings to</Label>
            <Select
              value={selectedClientId || ORG_DEFAULT_VALUE}
              onValueChange={v => setSelectedClientId(v === ORG_DEFAULT_VALUE ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ORG_DEFAULT_VALUE}>
                  Organization Default
                </SelectItem>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                    {clientOverrides.includes(client.id) ? ' ✦' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedClientId && !clientOverrides.includes(selectedClientId) && (
              <p className="text-xs text-muted-foreground">
                This client currently inherits the organization default. Saving will create a custom override.
              </p>
            )}
            {clientOverrides.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-xs text-muted-foreground">Custom schedules:</span>
                {clientOverrides.map(cid => {
                  const client = clients.find(c => c.id === cid);
                  return client ? (
                    <Badge
                      key={cid}
                      variant="outline"
                      className="text-xs cursor-pointer"
                      onClick={() => setSelectedClientId(cid)}
                    >
                      {client.name}
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Business Hours */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Business Hours</CardTitle>
                <CardDescription>Configure when outbound calls can be placed</CardDescription>
              </div>
            </div>
            <Badge variant={isWithinBusinessHours ? 'default' : 'secondary'}>
              {isWithinBusinessHours ? 'Open Now' : 'Closed'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={form.business_hours_start}
                onChange={e => setForm(prev => ({ ...prev, business_hours_start: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={form.business_hours_end}
                onChange={e => setForm(prev => ({ ...prev, business_hours_end: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select
                value={form.business_hours_timezone}
                onValueChange={v => setForm(prev => ({ ...prev, business_hours_timezone: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map(tz => (
                    <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Business Days
            </Label>
            <div className="flex flex-wrap gap-3">
              {DAYS.map(day => (
                <label key={day.value} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={form.business_days.includes(day.value)}
                    onCheckedChange={() => toggleDay(day.value)}
                  />
                  <span className="text-sm">{day.label}</span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Holiday Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarOff className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Holiday Calendar</CardTitle>
                <CardDescription>Outbound calls are automatically skipped on holidays</CardDescription>
              </div>
            </div>
            <Badge variant="outline">
              {holidays.filter(h => h.holiday_date >= new Date().toISOString().split('T')[0]).length} upcoming
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Holiday */}
          <div className="flex items-center gap-2">
            <Popover open={addHolidayOpen} onOpenChange={setAddHolidayOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Add Holiday
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4 space-y-3" align="start">
                <div className="space-y-2">
                  <Label>Holiday Name</Label>
                  <Input
                    placeholder="e.g. Company Anniversary"
                    value={newHolidayName}
                    onChange={e => setNewHolidayName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Calendar
                    mode="single"
                    selected={newHolidayDate}
                    onSelect={setNewHolidayDate}
                    className="rounded-md border"
                  />
                </div>
                <Button
                  size="sm"
                  disabled={!newHolidayDate || !newHolidayName.trim() || isAdding}
                  onClick={() => {
                    if (newHolidayDate && newHolidayName.trim()) {
                      addHoliday({
                        date: format(newHolidayDate, 'yyyy-MM-dd'),
                        name: newHolidayName.trim(),
                      });
                      setNewHolidayName('');
                      setNewHolidayDate(undefined);
                      setAddHolidayOpen(false);
                    }
                  }}
                  className="w-full"
                >
                  {isAdding ? 'Adding...' : 'Add Holiday'}
                </Button>
              </PopoverContent>
            </Popover>

            <label className="flex items-center gap-2 text-sm text-muted-foreground ml-auto cursor-pointer">
              <Checkbox
                checked={showPastHolidays}
                onCheckedChange={(v) => setShowPastHolidays(!!v)}
              />
              Show past
            </label>
          </div>

          {/* Holiday List */}
          {holidaysLoading ? (
            <p className="text-sm text-muted-foreground">Loading holidays...</p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {holidays
                .filter(h => showPastHolidays || h.holiday_date >= new Date().toISOString().split('T')[0])
                .map(holiday => {
                  const isGlobal = !holiday.organization_id;
                  const isPast = holiday.holiday_date < new Date().toISOString().split('T')[0];
                  return (
                    <div
                      key={holiday.id}
                      className={`flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm ${isPast ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{holiday.name}</span>
                        <span className="text-muted-foreground">{format(new Date(holiday.holiday_date + 'T00:00:00'), 'MMM d, yyyy')}</span>
                        <Badge variant={isGlobal ? 'secondary' : 'outline'} className="text-xs">
                          {isGlobal ? 'Default' : 'Custom'}
                        </Badge>
                      </div>
                      {!isGlobal && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteHoliday(holiday.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              {holidays.filter(h => showPastHolidays || h.holiday_date >= new Date().toISOString().split('T')[0]).length === 0 && (
                <p className="text-sm text-muted-foreground py-2">No holidays configured</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Follow-Up Rules */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Follow-Up Rules</CardTitle>
              <CardDescription>Configure automatic follow-up call behavior for unanswered, failed, and busy calls</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Master toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto Follow-Up</Label>
              <p className="text-sm text-muted-foreground">Automatically retry calls based on outcome</p>
            </div>
            <Switch
              checked={form.auto_follow_up_enabled}
              onCheckedChange={v => setForm(prev => ({ ...prev, auto_follow_up_enabled: v }))}
            />
          </div>

          {form.auto_follow_up_enabled && (
            <>
              {/* Per-status toggles */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Retry on Status</Label>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <PhoneMissed className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">No Answer</p>
                      <p className="text-xs text-muted-foreground">Recipient didn't pick up</p>
                    </div>
                    <Switch
                      checked={form.follow_up_on_no_answer}
                      onCheckedChange={v => setForm(prev => ({ ...prev, follow_up_on_no_answer: v }))}
                    />
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Failed</p>
                      <p className="text-xs text-muted-foreground">API or transient error</p>
                    </div>
                    <Switch
                      checked={form.follow_up_on_failed}
                      onCheckedChange={v => setForm(prev => ({ ...prev, follow_up_on_failed: v }))}
                    />
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <PhoneOff className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Busy</p>
                      <p className="text-xs text-muted-foreground">Line was busy</p>
                    </div>
                    <Switch
                      checked={form.follow_up_on_busy}
                      onCheckedChange={v => setForm(prev => ({ ...prev, follow_up_on_busy: v }))}
                    />
                  </div>
                </div>
              </div>

              {/* Timing controls */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="max-attempts">Max Attempts</Label>
                  <Input
                    id="max-attempts"
                    type="number"
                    min={1}
                    max={10}
                    value={form.max_attempts}
                    onChange={e => setForm(prev => ({ ...prev, max_attempts: Math.min(10, Math.max(1, Number(e.target.value))) }))}
                  />
                  <p className="text-xs text-muted-foreground">Total attempts including initial call (1–10)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delay-minutes" className="flex items-center gap-2">
                    <Timer className="h-3.5 w-3.5" />
                    First Retry Delay (minutes)
                  </Label>
                  <Input
                    id="delay-minutes"
                    type="number"
                    min={5}
                    max={1440}
                    value={form.follow_up_delay_minutes}
                    onChange={e => setForm(prev => ({ ...prev, follow_up_delay_minutes: Math.min(1440, Math.max(5, Number(e.target.value))) }))}
                  />
                  <p className="text-xs text-muted-foreground">Wait time before first retry (5–1440 min)</p>
                </div>
              </div>

              {/* Escalation multiplier */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Escalation Multiplier: {form.follow_up_escalation_multiplier}x
                </Label>
                <Slider
                  value={[form.follow_up_escalation_multiplier]}
                  onValueChange={([v]) => setForm(prev => ({ ...prev, follow_up_escalation_multiplier: v }))}
                  min={1}
                  max={4}
                  step={0.5}
                />
                <p className="text-xs text-muted-foreground">
                  Each subsequent retry waits {form.follow_up_escalation_multiplier}× longer than the previous
                </p>
              </div>

              {/* Cooldown */}
              <div className="space-y-2">
                <Label htmlFor="cooldown-hours" className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5" />
                  Cooldown Window (hours)
                </Label>
                <Input
                  id="cooldown-hours"
                  type="number"
                  min={1}
                  max={168}
                  value={form.cooldown_hours}
                  onChange={e => setForm(prev => ({ ...prev, cooldown_hours: Math.min(168, Math.max(1, Number(e.target.value))) }))}
                />
                <p className="text-xs text-muted-foreground">Stop all retries after this many hours from the first call (1–168h)</p>
              </div>

              {/* Callback context */}
              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Callback Context</p>
                  <p className="text-xs text-muted-foreground">
                    When retrying, inject previous call context so the agent can say "We tried reaching you earlier about..."
                  </p>
                </div>
                <Switch
                  checked={form.callback_reference_enabled}
                  onCheckedChange={v => setForm(prev => ({ ...prev, callback_reference_enabled: v }))}
                />
              </div>

              {/* Timeline preview */}
              {timelinePreview.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Follow-Up Timeline Preview</Label>
                  <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                    <div className="flex items-center gap-3 text-sm">
                      <Badge variant="default" className="shrink-0 text-xs w-20 justify-center">Attempt 1</Badge>
                      <span className="text-muted-foreground">Initial call — now</span>
                    </div>
                    {timelinePreview.map((item) => (
                      <div key={item.attempt} className="flex items-center gap-3 text-sm">
                        <Badge variant="outline" className="shrink-0 text-xs w-20 justify-center">
                          Attempt {item.attempt}
                        </Badge>
                        <span className="text-muted-foreground">
                          +{formatDuration(item.delayMinutes)} delay → {formatDuration(item.cumulativeMinutes)} total
                        </span>
                        {item.cumulativeMinutes > form.cooldown_hours * 60 && (
                          <Badge variant="destructive" className="text-xs">Outside cooldown</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <LoadingButton onClick={handleSave} isLoading={isUpdating} loadingText="Saving...">
          Save Schedule Settings
        </LoadingButton>
      </div>
    </div>
  );
}
