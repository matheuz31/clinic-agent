import { CalendarProvider } from '../adapters/calendar/CalendarProvider';
import { AppConfig } from '../config';

export interface BookRequest {
  serviceKey: string;
  start: string; // ISO
  patient: { name: string; email?: string };
  calendarId?: string;
  auth?: { accessToken?: string; refreshToken?: string };
}

export class SchedulingService {
  constructor(private calendar: CalendarProvider, private cfg: AppConfig) {}

  async listAvailableSlots(dateISO: string) {
    // TODO: compute slots by removing existing events from opening_hours
    // Minimal stub for now
    return [] as { start: string; end: string }[];
  }

  async book(req: BookRequest) {
    const service = this.cfg.domain.services.find((s) => s.key === req.serviceKey);
    const duration = service?.duration_minutes ?? this.cfg.domain.slot_duration_minutes;
    const start = new Date(req.start);
    const end = new Date(start.getTime() + duration * 60 * 1000);

    const event = await this.calendar.createEvent(
      {
        summary: `${service?.name ?? 'Consulta'} - ${req.patient.name}`,
        start: start.toISOString(),
        end: end.toISOString(),
        attendees: req.patient.email ? [{ email: req.patient.email, displayName: req.patient.name }] : undefined,
        calendarId: req.calendarId,
      },
      { calendarId: req.calendarId, accessToken: req.auth?.accessToken, refreshToken: req.auth?.refreshToken }
    );
    return event;
  }
}

