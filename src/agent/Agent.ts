import { SchedulingService } from '../services/SchedulingService';
import { WebhookInput } from '../schemas/webhook';

export class Agent {
  constructor(private scheduling: SchedulingService) {}

  async handle(msg: WebhookInput) {
    if (msg.type === 'availability') {
      const slots = await this.scheduling.listAvailableSlots(msg.payload.date, {
        tenantId: msg.payload.tenantId,
        calendarId: msg.payload.calendarId,
      });
      return { slots };
    }
    if (msg.type === 'book') {
      const event = await this.scheduling.book({ ...msg.payload });
      return { event };
    }
    return { message: 'Desculpe, não entendi. Você deseja agendar?' };
  }
}
