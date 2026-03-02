import { CalendarProvider } from '../adapters/calendar/CalendarProvider';
import { AppConfig } from '../config';
import { TokenStore } from '../store/TokenStore';
import { DateTime } from 'luxon';

export interface BookRequest {
  serviceKey: string;
  start: string; // ISO
  patient: { name: string; email?: string };
  calendarId?: string;
  tenantId?: string;
}

export class SchedulingService {
  constructor(private calendar: CalendarProvider, private cfg: AppConfig, private tokens: TokenStore) {}

  private weekdayLabel(dt: DateTime): keyof AppConfig['domain']['opening_hours'] {
    return dt.toFormat('ccc') as any; // Mon, Tue, ... locale English
  }

  async listAvailableSlots(dateISO: string, opts?: { tenantId?: string; calendarId?: string }) {
    const tz = this.cfg.domain.timezone ?? 'UTC';
    const day = DateTime.fromISO(dateISO, { zone: tz }).startOf('day');
    const weekday = this.weekdayLabel(day);
    const ranges = this.cfg.domain.opening_hours[weekday] ?? [];
    const slotMinutes = this.cfg.domain.slot_duration_minutes;

    // Existing events for the day
    const startOfDay = day.toISO();
    const endOfDay = day.endOf('day').toISO();
    const tenantTokens = opts?.tenantId ? this.tokens.get(opts.tenantId) : undefined;
    const effectiveCalendar = opts?.calendarId ?? tenantTokens?.calendarId ?? undefined;
    const events = await this.calendar.listEvents({ start: startOfDay!, end: endOfDay! }, {
      calendarId: effectiveCalendar,
      accessToken: tenantTokens?.access_token,
      refreshToken: tenantTokens?.refresh_token,
    });

    const busy = events.map((e) => ({
      start: DateTime.fromISO(e.start, { zone: tz }),
      end: DateTime.fromISO(e.end, { zone: tz }),
    }));

    const slots: { start: string; end: string }[] = [];
    for (const r of ranges) {
      let cursor = day.set({
        hour: Number(r.start.split(':')[0]),
        minute: Number(r.start.split(':')[1]),
        second: 0,
        millisecond: 0,
      });
      const endRange = day.set({
        hour: Number(r.end.split(':')[0]),
        minute: Number(r.end.split(':')[1]),
        second: 0,
        millisecond: 0,
      });

      while (cursor.plus({ minutes: slotMinutes }) <= endRange) {
        const slotStart = cursor;
        const slotEnd = cursor.plus({ minutes: slotMinutes });
        const overlaps = busy.some((b) => b.start < slotEnd && b.end > slotStart);
        if (!overlaps) {
          slots.push({ start: slotStart.toISO()!, end: slotEnd.toISO()! });
        }
        cursor = cursor.plus({ minutes: slotMinutes });
      }
    }

    return slots;
  }

  async book(req: BookRequest) {
    const service = this.cfg.domain.services.find((s) => s.key === req.serviceKey);
    const duration = service?.duration_minutes ?? this.cfg.domain.slot_duration_minutes;
    const tz = this.cfg.domain.timezone ?? 'UTC';
    const start = DateTime.fromISO(req.start, { zone: tz });
    const end = start.plus({ minutes: duration });

    const tenantTokens = req.tenantId ? this.tokens.get(req.tenantId) : undefined;
    const effectiveCalendar = req.calendarId ?? tenantTokens?.calendarId ?? undefined;

    const event = await this.calendar.createEvent(
      {
        summary: `${service?.name ?? 'Consulta'} - ${req.patient.name}`,
        start: start.toISO()!,
        end: end.toISO()!,
        attendees: req.patient.email ? [{ email: req.patient.email, displayName: req.patient.name }] : undefined,
        calendarId: effectiveCalendar,
      },
      { calendarId: effectiveCalendar, accessToken: tenantTokens?.access_token, refreshToken: tenantTokens?.refresh_token }
    );
    return event;
  }
}
