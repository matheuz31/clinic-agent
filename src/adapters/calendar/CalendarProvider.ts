export interface TimeRange {
  start: string; // ISO
  end: string;   // ISO
}

export interface CalendarEventInput {
  summary: string;
  description?: string;
  start: string; // ISO
  end: string;   // ISO
  attendees?: { email: string; displayName?: string }[];
  calendarId?: string; // overrides default
}

export interface CalendarEvent {
  id: string;
  htmlLink?: string;
  start: string;
  end: string;
}

export interface CalendarProvider {
  listEvents(range: TimeRange, opts?: { calendarId?: string; accessToken?: string; refreshToken?: string }): Promise<CalendarEvent[]>;
  createEvent(evt: CalendarEventInput, opts?: { calendarId?: string; accessToken?: string; refreshToken?: string }): Promise<CalendarEvent>;
}

