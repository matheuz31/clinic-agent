import { google } from 'googleapis';
import { CalendarProvider, CalendarEvent, CalendarEventInput, TimeRange } from '../CalendarProvider';

export class GoogleCalendarProvider implements CalendarProvider {
  constructor(private defaultCalendarId?: string, private oauthClientFactory?: () => any) {}

  private getClient(accessToken?: string, refreshToken?: string) {
    // If a factory was provided, use it (allows DI with configured OAuth2 client)
    if (this.oauthClientFactory) {
      return this.oauthClientFactory();
    }
    const oauth2Client = new google.auth.OAuth2();
    if (accessToken || refreshToken) {
      oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
    }
    return oauth2Client;
  }

  async listEvents(range: TimeRange, opts?: { calendarId?: string; accessToken?: string; refreshToken?: string }): Promise<CalendarEvent[]> {
    const calendarId = opts?.calendarId ?? this.defaultCalendarId ?? 'primary';
    const auth = this.getClient(opts?.accessToken, opts?.refreshToken);
    const calendar = google.calendar({ version: 'v3', auth });
    const res = await calendar.events.list({
      calendarId,
      timeMin: range.start,
      timeMax: range.end,
      singleEvents: true,
      orderBy: 'startTime',
    });
    const items = res.data.items ?? [];
    return items
      .filter((e) => e.start?.dateTime && e.end?.dateTime && e.id)
      .map((e) => ({
        id: e.id!,
        htmlLink: e.htmlLink ?? undefined,
        start: e.start!.dateTime!,
        end: e.end!.dateTime!,
      }));
  }

  async createEvent(evt: CalendarEventInput, opts?: { calendarId?: string; accessToken?: string; refreshToken?: string }): Promise<CalendarEvent> {
    const calendarId = opts?.calendarId ?? this.defaultCalendarId ?? 'primary';
    const auth = this.getClient(opts?.accessToken, opts?.refreshToken);
    const calendar = google.calendar({ version: 'v3', auth });
    const res = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: evt.summary,
        description: evt.description,
        attendees: evt.attendees,
        start: { dateTime: evt.start },
        end: { dateTime: evt.end },
      },
    });
    const data = res.data;
    return {
      id: data.id!,
      htmlLink: data.htmlLink ?? undefined,
      start: data.start?.dateTime ?? evt.start,
      end: data.end?.dateTime ?? evt.end,
    };
  }
}

