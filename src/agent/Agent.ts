import { SchedulingService } from '../services/SchedulingService';

export interface AgentMessage {
  type: 'book' | 'availability' | 'unknown';
  payload: any;
}

export class Agent {
  constructor(private scheduling: SchedulingService) {}

  async handle(msg: AgentMessage) {
    switch (msg.type) {
      case 'availability':
        return { slots: await this.scheduling.listAvailableSlots(msg.payload.date) };
      case 'book':
        return { event: await this.scheduling.book(msg.payload) };
      default:
        return { message: 'Desculpe, não entendi. Você deseja agendar?' };
    }
  }
}

