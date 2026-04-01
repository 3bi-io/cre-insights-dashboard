import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

import {
  buildDynamicVariables,
  createAfterHoursCallbackMetadata,
  deriveBusinessHoursContext,
} from "./index.ts";

Deno.test("after-hours callback metadata never requests recruiter transfer", () => {
  const metadata = createAfterHoursCallbackMetadata(
    {
      _has_calendar_connections: 'yes',
      client_id: 'client-123',
    },
    {
      originalCallId: 'call-1',
      originalConversationId: 'conv-1',
      hasCalendarConnections: true,
      schedulingMethod: 'calendar_availability',
    },
  );

  assertEquals(metadata.callback_purpose, 'business_hours_callback');
  assertEquals(metadata.is_after_hours_callback, true);
  assertEquals(metadata.no_calendar_fallback, false);
});

Deno.test("after-hours callback disables live transfer and schedules next business day", () => {
  const variables = buildDynamicVariables(
    { first_name: 'Jamie', city: 'Mobile', state: 'AL' },
    { title: 'CDL-A Driver' },
    { name: 'R.E. Garrison' },
    {
      _business_hours_timezone: 'America/Chicago',
      _business_hours_start: '09:00',
      _business_hours_end: '16:30',
      _business_days: '1,2,3,4,5',
      _has_calendar_connections: 'yes',
      _is_holiday: 'yes',
      is_after_hours_callback: true,
      callback_purpose: 'business_hours_callback',
    },
  );

  assertEquals(variables.is_after_hours, 'yes');
  assertEquals(variables.is_holiday, 'yes');
  assertEquals(variables.allow_live_transfer, 'no');
  assertEquals(variables.after_hours_action, 'schedule_next_business_day');
  assertEquals(variables.callback_purpose, 'business_hours_callback');
});

Deno.test("client business day overrides are respected in business-hours context", () => {
  const context = deriveBusinessHoursContext(
    {
      _business_hours_timezone: 'America/Chicago',
      _business_hours_start: '09:00',
      _business_hours_end: '17:00',
      _business_days: '2,3,4,5,6',
      _has_calendar_connections: 'no',
      _is_holiday: 'no',
    },
    new Date('2026-04-06T15:00:00.000Z'),
  );

  assertEquals(context.isBusinessDay, false);
  assertEquals(context.isAfterHours, true);
  assertEquals(context.allowLiveTransfer, 'no');
});