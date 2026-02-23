import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingButton } from '@/components/shared/LoadingButton';
import { useCallScheduleSettings, type CallScheduleSettings as Settings } from '@/features/elevenlabs/hooks/useCallScheduleSettings';
import { Clock, CalendarDays, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

export function CallScheduleSettings() {
  const { settings, isLoading, updateSettings, isUpdating } = useCallScheduleSettings();

  const [form, setForm] = useState({
    business_hours_start: '09:00',
    business_hours_end: '16:30',
    business_hours_timezone: 'America/Chicago',
    business_days: [1, 2, 3, 4, 5] as number[],
    auto_follow_up_enabled: false,
    max_attempts: 3,
    follow_up_delay_hours: 24,
  });

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
      });
    }
  }, [settings]);

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
    });
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading schedule settings...</div>;
  }

  return (
    <div className="space-y-6">
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

      {/* Follow-Up Rules */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Follow-Up Rules</CardTitle>
              <CardDescription>Configure automatic follow-up call behavior</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto Follow-Up</Label>
              <p className="text-sm text-muted-foreground">Automatically retry calls that weren't answered</p>
            </div>
            <Switch
              checked={form.auto_follow_up_enabled}
              onCheckedChange={v => setForm(prev => ({ ...prev, auto_follow_up_enabled: v }))}
            />
          </div>

          {form.auto_follow_up_enabled && (
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
                <p className="text-xs text-muted-foreground">1–10 attempts total</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="delay-hours">Delay Between Attempts (hours)</Label>
                <Input
                  id="delay-hours"
                  type="number"
                  min={1}
                  max={72}
                  value={form.follow_up_delay_hours}
                  onChange={e => setForm(prev => ({ ...prev, follow_up_delay_hours: Math.min(72, Math.max(1, Number(e.target.value))) }))}
                />
                <p className="text-xs text-muted-foreground">1–72 hours between retries</p>
              </div>
            </div>
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
