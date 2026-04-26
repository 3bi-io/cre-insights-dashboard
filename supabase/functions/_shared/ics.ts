/**
 * Minimal RFC 5545 .ics generator for calendar invites.
 * Used in confirmation/reminder emails so drivers and recruiters can add
 * the AI-booked callback to any calendar app.
 */

export interface IcsEvent {
  uid: string;
  start: Date;
  end: Date;
  summary: string;
  description?: string;
  location?: string;
  organizerEmail?: string;
  organizerName?: string;
  attendeeEmail?: string;
  attendeeName?: string;
  conferenceUrl?: string;
  method?: 'REQUEST' | 'CANCEL' | 'PUBLISH';
}

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function fmt(d: Date) {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function escape(text: string) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

export function buildIcs(event: IcsEvent): string {
  const method = event.method || 'REQUEST';
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ApplyAI//Scheduling//EN',
    `METHOD:${method}`,
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(event.start)}`,
    `DTEND:${fmt(event.end)}`,
    `SUMMARY:${escape(event.summary)}`,
  ];

  if (event.description) {
    const desc = event.conferenceUrl
      ? `${event.description}\n\nJoin: ${event.conferenceUrl}`
      : event.description;
    lines.push(`DESCRIPTION:${escape(desc)}`);
  }
  if (event.location || event.conferenceUrl) {
    lines.push(`LOCATION:${escape(event.location || event.conferenceUrl || '')}`);
  }
  if (event.conferenceUrl) {
    lines.push(`URL:${event.conferenceUrl}`);
  }
  if (event.organizerEmail) {
    const name = event.organizerName ? `;CN=${escape(event.organizerName)}` : '';
    lines.push(`ORGANIZER${name}:mailto:${event.organizerEmail}`);
  }
  if (event.attendeeEmail) {
    const name = event.attendeeName ? `;CN=${escape(event.attendeeName)}` : '';
    lines.push(
      `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE${name}:mailto:${event.attendeeEmail}`
    );
  }

  lines.push('STATUS:CONFIRMED', 'END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n');
}

/** Base64-encode a UTF-8 string for email attachments. */
export function icsToBase64(ics: string): string {
  const bytes = new TextEncoder().encode(ics);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
